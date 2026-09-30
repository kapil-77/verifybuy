/**
 * Semantic retrieval — clearly separated from generation.
 *
 * Retrieves the top-k relevant chunks for a query from the vector store and
 * applies a two-part relevance guard so irrelevant chunks never reach the LLM:
 *
 * 1. a minimum cosine-similarity score from the vector store, and
 * 2. a lexical token-overlap floor between the query and the chunk text.
 */
import { cleanText } from "./chunking.ts";
import { EMBEDDING_TASK_QUERY } from "./embeddings.ts";
import { InMemoryVectorStore } from "./vector-store.ts";
import type { Embedder, RetrievedChunk, RetrievalOptions } from "./types.ts";

/** Default minimum cosine similarity for a chunk to be "relevant". */
export const DEFAULT_MIN_SCORE = 0.3;
/** Default minimum number of shared meaningful tokens for chunk relevance. */
export const DEFAULT_MIN_SHARED_TOKENS = 1;

/**
 * Embed the query and return the top-k relevant chunks.
 * Returns an empty list when the query is empty, embeddings fail, or nothing
 * clears both relevance guards.
 */
export async function retrieve(
  store: InMemoryVectorStore,
  embedder: Embedder,
  query: string,
  options: RetrievalOptions = {},
): Promise<RetrievedChunk[]> {
  const cleaned = cleanText(query);
  if (!cleaned) return [];

  const [queryEmbedding] = await embedder.embed([cleaned], { taskType: EMBEDDING_TASK_QUERY });
  if (!queryEmbedding || queryEmbedding.length === 0) return [];

  const minScore = options.minScore ?? DEFAULT_MIN_SCORE;
  const minSharedTokens = options.minSharedTokens ?? DEFAULT_MIN_SHARED_TOKENS;

  const candidates = store.search(queryEmbedding, {
    topK: options.topK,
    minScore,
    filter: options.filter,
    excludeChunkIds: options.excludeChunkIds,
  });

  return candidates.filter(({ chunk }) =>
    sharesMeaningfulTokens(cleaned, chunk.text, minSharedTokens),
  );
}

function tokenizeForRelevance(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function sharesMeaningfulTokens(query: string, chunkText: string, minShared: number): boolean {
  if (minShared <= 0) return true;
  const queryTokens = new Set(tokenizeForRelevance(query));
  if (queryTokens.size === 0) return true;
  let shared = 0;
  for (const token of tokenizeForRelevance(chunkText)) {
    if (queryTokens.has(token) && ++shared >= minShared) return true;
  }
  return false;
}
