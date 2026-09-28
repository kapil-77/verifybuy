/**
 * Embedding providers for the RAG pipeline.
 *
 * - `createGeminiEmbedder` reuses the exact AI infrastructure already used by
 *   the app (Vercel AI SDK + `@ai-sdk/openai-compatible` → Gemini's OpenAI
 *   compatible endpoint) and is the production embedder used server-side.
 * - `createHashEmbedder` is a deterministic, dependency-free fake used by the
 *   unit tests so tests never call a network API.
 *
 * API keys live server-side only (`process.env.GEMINI_API_KEY`) and are never
 * exposed to the client.
 *
 * Embedding requests are split into small batches because the Gemini endpoint
 * rejects requests with more than 100 items ("at most 100 requests can be in
 * one batch") while the AI SDK provider's default allows up to 2048 — so we
 * batch ourselves before calling `embedMany`.
 */
import { embedMany } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { normalize } from "./vector-store.ts";
import type { Embedder } from "./types.ts";

/** Gemini embedding model exposed through the OpenAI-compatible endpoint. */
export const EMBEDDING_MODEL = "text-embedding-004";
/** Dimension count for the deterministic hash embedder (tests / fallbacks). */
export const HASH_EMBEDDING_DIMENSIONS = 256;
/**
 * Maximum items per embedding request — conservatively below the Gemini API's
 * 100-item batch limit so ingesting the full catalog never fails.
 */
export const MAX_EMBEDDINGS_PER_CALL = 64;

export interface GeminiEmbedderOptions {
  modelId?: string;
  /** Max items per Gemini request (defaults to MAX_EMBEDDINGS_PER_CALL). */
  maxEmbeddingsPerCall?: number;
  /** Test hook: override how a single batch is embedded (no network in tests). */
  embedBatch?: (batch: string[]) => Promise<number[][]>;
}

let cachedProvider: ReturnType<typeof createOpenAICompatible> | null = null;

function getGeminiProvider() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY — embeddings require a server-side Gemini API key");
  }
  cachedProvider ??= createOpenAICompatible({
    name: "gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    apiKey: process.env.GEMINI_API_KEY,
  });
  return cachedProvider;
}

/**
 * `embed` splits `values` into batches of at most `maxEmbeddingsPerCall`,
 * embeds each batch via Gemini and concatenates the vectors in order. A clean
 * retry is always possible on failure because a corpus is only marked as
 * ingested after all of its batches succeeded.
 */
export function createGeminiEmbedder(options: GeminiEmbedderOptions = {}): Embedder {
  const modelId = options.modelId ?? EMBEDDING_MODEL;
  const maxEmbeddingsPerCall = options.maxEmbeddingsPerCall ?? MAX_EMBEDDINGS_PER_CALL;
  const embedBatch: (batch: string[]) => Promise<number[][]> =
    options.embedBatch ??
    (async (batch) => {
      const { embeddings } = await embedMany({
        model: getGeminiProvider().embeddingModel(modelId),
        values: batch,
      });
      return embeddings.map((embedding) => Array.from(embedding));
    });

  return {
    modelId,
    async embed(values: string[]): Promise<number[][]> {
      const inputs = values.filter((v) => v.trim().length > 0);
      if (inputs.length === 0) return [];
      return embedInBatches(inputs, maxEmbeddingsPerCall, embedBatch);
    },
  };
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
    async embed(values: string[]): Promise<number[][]> {
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
