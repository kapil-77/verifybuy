/**
 * Embedding providers for the RAG pipeline.
 *
 * - `createGeminiEmbedder` calls the Gemini REST embeddings endpoint
 *   (`POST /v1beta/models/{model}:batchEmbedContents`) directly with a
 *   server-side `fetch`. This is the documented, stable embeddings API — the
 *   OpenAI-compatible `/openai/embeddings` route is beta and in current API
 *   generations only accepts the new `gemini-embedding-*` model family.
 * - `createHashEmbedder` is a deterministic, dependency-free fake used by the
 *   unit tests so tests never call a network API.
 *
 * API keys live server-side only (`process.env.GEMINI_API_KEY`) and are never
 * exposed to the client. The key travels in the query string exactly as the
 * `:batchEmbedContents` documentation specifies.
 */
import { normalize } from "./vector-store.ts";
import type { Embedder, EmbedOptions } from "./types.ts";

/** Gemini text embedding model (gemini-embedding-001 is the current text model). */
export const EMBEDDING_MODEL = "gemini-embedding-001";

/** Resolve the model id — env-overridable without code changes. */
export function resolveEmbeddingModel(): string {
  return process.env.GEMINI_EMBEDDING_MODEL ?? EMBEDDING_MODEL;
}
/** Task type for indexing chunks (better retrieval-document vectors). */
export const EMBEDDING_TASK_DOCUMENT = "RETRIEVAL_DOCUMENT";
/** Task type for query vectors. */
export const EMBEDDING_TASK_QUERY = "RETRIEVAL_QUERY";
/** Dimension count for the deterministic hash embedder (tests / fallbacks). */
export const HASH_EMBEDDING_DIMENSIONS = 256;
/**
 * Maximum items per embedding request — conservatively below the Gemini API's
 * 100-item batch limit so ingesting the full catalog never fails.
 */
export const MAX_EMBEDDINGS_PER_CALL = 64;

/** Minimal response surface needed from the (test-injectable) fetch call. */
export interface EmbeddingResponseLike {
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

/** Fetch compatible with `:batchEmbedContents` (string URL, JSON body). */
export type EmbeddingFetch = (url: string, init?: RequestInit) => Promise<EmbeddingResponseLike>;

export interface GeminiEmbedderOptions {
  /** Model id override (defaults to `resolveEmbeddingModel()`). */
  modelId?: string;
  /** Server-side API key override (defaults to `process.env.GEMINI_API_KEY`). */
  apiKey?: string;
  /** Max items per Gemini request (defaults to MAX_EMBEDDINGS_PER_CALL). */
  maxEmbeddingsPerCall?: number;
  /** Test hook: inject a fetch implementation (no network in tests). */
  fetchImpl?: EmbeddingFetch;
}

/**
 * Production embedder backed by Gemini's `:batchEmbedContents` endpoint.
 *
 * `embed()` splits `values` into batches of at most `maxEmbeddingsPerCall`,
 * posts each batch, extracts `embeddings[].values` and normalizes the vectors
 * in order. A clean retry is always possible on failure because a corpus is
 * only marked as ingested after all of its batches succeeded.
 */
export function createGeminiEmbedder(options: GeminiEmbedderOptions = {}): Embedder {
  const modelId = options.modelId ?? resolveEmbeddingModel();
  const modelPath = `models/${modelId}`;
  const maxEmbeddingsPerCall = options.maxEmbeddingsPerCall ?? MAX_EMBEDDINGS_PER_CALL;
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    modelId,
    async embed(values: string[], embedOptions?: EmbedOptions): Promise<number[][]> {
      const apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY — embeddings require a server-side Gemini API key");
      }

      const inputs = values.filter((v) => v.trim().length > 0);
      if (inputs.length === 0) return [];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:batchEmbedContents?key=${encodeURIComponent(apiKey)}`;

      return embedInBatches(inputs, maxEmbeddingsPerCall, (batch) =>
        embedBatch(fetchImpl, url, modelPath, batch, embedOptions?.taskType),
      );
    },
  };
}

async function embedBatch(
  fetchImpl: EmbeddingFetch,
  url: string,
  modelPath: string,
  batch: string[],
  taskType: string | undefined,
): Promise<number[][]> {
  const body = {
    requests: batch.map((text) => ({
      model: modelPath,
      taskType,
      content: { parts: [{ text }] },
    })),
  };

  const response = await fetchImpl(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Gemini embeddings request failed (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as { embeddings?: Array<{ values?: number[] }> };
  const embeddings = data.embeddings;
  if (!Array.isArray(embeddings) || embeddings.length !== batch.length) {
    throw new Error(
      `Gemini embeddings returned ${Array.isArray(embeddings) ? embeddings.length : "invalid"} results for ${batch.length} inputs`,
    );
  }

  return embeddings.map((entry) => {
    const values = entry.values ?? [];
    return normalize(values) ?? values;
  });
}

/**
 * Split `values` into batches of at most `batchSize`, map each batch through
 * `embedBatch` and concatenate the results preserving order. Stops at the
 * first failure so callers see a single, clearly attributable error.
 */
export async function embedInBatches<T>(
  values: string[],
  batchSize: number,
  embedBatch: (batch: string[]) => Promise<T[]>,
): Promise<T[]> {
  if (values.length === 0) return [];
  const size = Math.max(1, Math.floor(batchSize));
  const results: T[] = [];
  for (let index = 0; index < values.length; index += size) {
    const batch = values.slice(index, index + size);
    const embedded = await embedBatch(batch);
    results.push(...embedded);
  }
  return results;
}

/**
 * Deterministic bag-of-words hash embedder.
 *
 * Every input maps to the same vector every time, so tests can assert
 * retrieval ranking without a real embedding API.
 */
export function createHashEmbedder(options: { dimensions?: number } = {}): Embedder {
  const dimensions = options.dimensions ?? HASH_EMBEDDING_DIMENSIONS;
  return {
    modelId: "deterministic-hash-v1",
    async embed(values: string[], _options?: EmbedOptions): Promise<number[][]> {
      return values.map((value) => hashEmbedding(value, dimensions));
    },
  };
}

function hashEmbedding(value: string, dimensions: number): number[] {
  const tokens = (value ?? "").toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const vector = new Array<number>(dimensions).fill(0);
  for (const token of tokens) {
    if (token.length < 2) continue;
    vector[hashString(token) % dimensions] += 1;
  }
  return normalize(vector) ?? vector;
}

/** FNV-1a string hash (deterministic, no deps). */
function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
