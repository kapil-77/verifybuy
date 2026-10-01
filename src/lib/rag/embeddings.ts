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
  /**
   * Number of attempts for quota (429 / RESOURCE_EXHAUSTED) responses. The
   * embedder honors the API's retry delay between attempts. Defaults to 3.
   */
  maxRetries?: number;
  /** Upper bound (ms) waited per retry. Defaults to MAX_RETRY_DELAY_MS. */
  maxRetryDelayMs?: number;
  /** Test hook: replace the real sleep (no real waits in tests). */
  sleepImpl?: (ms: number) => Promise<void>;
}

/** Fallback wait when a 429 response carries no usable retry delay. */
export const DEFAULT_RETRY_DELAY_MS = 30_000;
/** Upper bound on a single quota-retry wait. */
export const MAX_RETRY_DELAY_MS = 60_000;

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
  const retry: EmbedRetryConfig = {
    maxRetries: options.maxRetries ?? 3,
    maxRetryDelayMs: options.maxRetryDelayMs ?? MAX_RETRY_DELAY_MS,
    sleepImpl:
      options.sleepImpl ??
      (async (ms: number) => {
        await new Promise<void>((resolve) => setTimeout(resolve, ms));
      }),
  };

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
        embedBatch(fetchImpl, url, modelPath, batch, embedOptions?.taskType, retry),
      );
    },
  };
}

interface EmbedRetryConfig {
  maxRetries: number;
  maxRetryDelayMs: number;
  sleepImpl: (ms: number) => Promise<void>;
}

async function embedBatch(
  fetchImpl: EmbeddingFetch,
  url: string,
  modelPath: string,
  batch: string[],
  taskType: string | undefined,
  retry: EmbedRetryConfig,
): Promise<number[][]> {
  const body = {
    requests: batch.map((text) => ({
      model: modelPath,
      taskType,
      content: { parts: [{ text }] },
    })),
  };

  for (let attempt = 0; attempt <= retry.maxRetries; attempt++) {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
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

    const detail = await response.text().catch(() => "");
    // Quota responses (429 / RESOURCE_EXHAUSTED) carry a retry delay — honor
    // it and retry the batch, so transient free-tier limits don't fail a run.
    if (response.status === 429 && attempt < retry.maxRetries) {
      const waitMs = retryDelayMs(detail, retry.maxRetryDelayMs);
      await retry.sleepImpl(waitMs);
      continue;
    }

    throw new Error(`Gemini embeddings request failed (${response.status}): ${detail}`);
  }
  // Unreachable: the loop either returns or throws on its final attempt.
  throw new Error("Gemini embeddings request failed");
}

/** Extract a quota retry delay (ms) from a 429 body or fall back to the default. */
function retryDelayMs(body: string, maxDelayMs: number): number {
  const seconds = parseRetryDelaySeconds(body);
  const ms = (seconds ?? DEFAULT_RETRY_DELAY_MS / 1000) * 1000;
  return Math.min(Math.max(0, Math.round(ms)), maxDelayMs);
}

/**
 * Parses the `retryDelay` of Gemini's RetryInfo error detail (e.g. "9s") or a
 * "retry in Xs" hint from the message, returning seconds.
 */
function parseRetryDelaySeconds(body: string): number | undefined {
  try {
    const parsed = JSON.parse(body) as {
      error?: { details?: Array<{ "@type"?: string; retryDelay?: string }> };
    };
    for (const detail of parsed.error?.details ?? []) {
      if (detail?.["@type"]?.includes("RetryInfo") && detail.retryDelay) {
        const seconds = parseFloat(detail.retryDelay);
        if (Number.isFinite(seconds)) return seconds;
      }
    }
  } catch {
    // Not JSON — fall through to the message regex.
  }
  const match = body.match(/retry in ([\d.]+)s/i);
  return match ? parseFloat(match[1]) : undefined;
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
