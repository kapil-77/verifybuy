/**
 * RAG pipeline orchestrator.
 *
 * Retrieval and generation are strictly separated:
 *   1. ensure the source corpus is ingested
 *   2. validate the query
 *   3. semantic retrieval (top-k + relevance guards)
 *   4. short-circuit when nothing relevant is found — the LLM is never called
 *   5. build a bounded, cited context
 *   6. generate a source-grounded answer with citation post-validation
 *
 * All failure modes (missing corpus, empty retrieval, embedding errors,
 * generation errors) produce a structured `ResearchAnswer` instead of a
 * fabricated response.
 */
import { buildContext } from "./context.ts";
import { cleanText } from "./chunking.ts";
import { createGeminiEmbedder } from "./embeddings.ts";
import { generateGroundedAnswer } from "./generate.ts";
import { ingestDocuments } from "./ingest.ts";
import { DEFAULT_MIN_SCORE, retrieve } from "./retrieval.ts";
import { InMemoryVectorStore } from "./vector-store.ts";
import type {
  Embedder,
  RagFilter,
  ResearchAnswer,
  ResearchStatus,
  SourceDocument,
} from "./types.ts";

export interface PipelineOptions {
  embedder?: Embedder;
  store?: InMemoryVectorStore;
  generator?: typeof generateGroundedAnswer;
  sources?: SourceDocument[];
  topK?: number;
  minScore?: number;
  minSharedTokens?: number;
}

export interface ResearchQueryInput {
  query: string;
  filter?: RagFilter;
}

/** Per-isolate vector store + ingestion ledger (Cloudflare Worker singleton). */
const defaultStore = new InMemoryVectorStore();
const seenSourcesByStore = new WeakMap<InMemoryVectorStore, Set<string>>();
let defaultEmbedder: Embedder | undefined;

function getDefaultEmbedder(): Embedder {
  defaultEmbedder ??= createGeminiEmbedder();
  return defaultEmbedder;
}

/** Per-store ledger of ingested source ids (isolates test instances). */
function seenForStore(store: InMemoryVectorStore): Set<string> {
  let seen = seenSourcesByStore.get(store);
  if (!seen) {
    seen = new Set<string>();
    seenSourcesByStore.set(store, seen);
  }
  return seen;
}

async function ensureCorpus(
  store: InMemoryVectorStore,
  embedder: Embedder,
  sources: SourceDocument[],
): Promise<void> {
  const seen = seenForStore(store);
  if (store.size === 0 && seen.size === 0) {
    await ingestDocuments(sources, embedder, store, seen);
  }
}

export async function runResearchQuery(
  input: ResearchQueryInput,
  options: PipelineOptions = {},
): Promise<ResearchAnswer> {
  const query = cleanText(input.query);
  if (!query) return answer("invalid_query", "Query must be non-empty text.");

  const store = options.store ?? defaultStore;
  const embedder = options.embedder ?? getDefaultEmbedder();
  // `sources` are supplied by the caller (the server functions pass the seed
  // catalog). An empty source list yields a graceful `no_sources` result.
  const sources = options.sources ?? [];

  // Corpus may be empty (e.g. no products) — do not call the LLM.
  try {
    await ensureCorpus(store, embedder, sources);
  } catch (error) {
    return answer("embedding_error", describeError(error, "Failed to embed the source corpus"));
  }

  if (store.size === 0) {
    return answer("no_sources", "No source documents are available to research from.");
  }

  // Retrieval phase.
  let retrieved: Awaited<ReturnType<typeof retrieve>>;
  try {
    retrieved = await retrieve(store, embedder, query, {
      topK: options.topK ?? 6,
      minScore: options.minScore ?? DEFAULT_MIN_SCORE,
      minSharedTokens: options.minSharedTokens,
      filter: input.filter,
    });
  } catch (error) {
    return answer("embedding_error", describeError(error, "Failed to embed the query"));
  }

  if (retrieved.length === 0) {
    return answer(
      "empty_retrieval",
      "No relevant source chunks matched this query, so no answer could be grounded in the catalog.",
    );
  }

  // Context construction.
  const context = buildContext(retrieved);
  if (context.chunks.length === 0) {
    return answer("empty_retrieval", "Retrieved chunks did not fit the context budget.");
  }

  // Generation phase — fully separate from retrieval.
  const generator = options.generator ?? generateGroundedAnswer;
  try {
    const result = await generator(query, context);
    return {
      answer: result.answer,
      citations: result.citations,
      grounded: result.grounded,
      status: "ok",
      retrievedCount: retrieved.length,
      contextChunkCount: context.chunks.length,
    };
  } catch (error) {
    return answer("generation_error", describeError(error, "The AI generation step failed"));
  }
}

/** Research a single product: grounded summary + citations for that product. */
export async function researchProduct(
  productId: string,
  options: PipelineOptions = {},
): Promise<ResearchAnswer> {
  const sources = options.sources ?? [];
  const productDoc = sources.find((doc) => doc.metadata.productId === productId);
  if (!productDoc) {
    return answer("invalid_query", `Unknown product id: ${productId}`);
  }
  const title = productDoc.title;
  return runResearchQuery(
    {
      query: `Summarize ${title}: what it is, key ingredients and nutrition, pros and cons, and any certifications or lab verification.`,
      filter: { productId },
    },
    { ...options, sources },
  );
}

function answer(status: ResearchStatus, message: string): ResearchAnswer {
  return {
    answer: "",
    citations: [],
    grounded: false,
    status,
    retrievedCount: 0,
    contextChunkCount: 0,
    message,
  };
}

function describeError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return `${fallback}: ${error.message}`;
  return fallback;
}
