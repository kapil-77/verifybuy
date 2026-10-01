/**
 * In-memory vector store with cosine similarity, top-k search, metadata
 * filtering and upsert deduplication.
 *
 * Why in-memory? VeriFy ships as a Cloudflare Worker via Nitro with no
 * database / KV dependency. The seeded source corpus is small (hundreds of
 * chunks) so a linear-scan store is both the simplest and the fastest option
 * for this project. The store is a per-isolate singleton, so it refills
 * lazily on the first research call.
 */
import type { DocumentChunk, RagFilter, RetrievedChunk } from "./types.ts";

interface StoredEntry {
  chunk: DocumentChunk;
  /** Normalized embedding vector. */
  embedding: number[];
}

export class InMemoryVectorStore {
  private readonly entries = new Map<string, StoredEntry>();

  get size(): number {
    return this.entries.size;
  }

  has(chunkId: string): boolean {
    return this.entries.has(chunkId);
  }

  /** Insert or replace a chunk's embedding (idempotent per chunk id). */
  upsert(chunk: DocumentChunk, embedding: number[]): void {
    const normalized = normalize(embedding);
    if (!normalized || normalized.length === 0) return;
    this.entries.set(chunk.id, { chunk, embedding: normalized });
  }

  remove(chunkId: string): void {
    this.entries.delete(chunkId);
  }

  clear(): void {
    this.entries.clear();
  }

  allChunkIds(): string[] {
    return [...this.entries.keys()];
  }

  /**
   * Return the top-k chunks nearest to `query`, scored by cosine similarity,
   * honoring the minimum score threshold and the metadata filter.
   */
  search(
    query: number[],
    options: {
      topK?: number;
      minScore?: number;
      filter?: RagFilter;
      excludeChunkIds?: string[];
    } = {},
  ): RetrievedChunk[] {
    const topK = options.topK ?? 6;
    const minScore = options.minScore ?? 0;
    const excluded = new Set(options.excludeChunkIds ?? []);
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return [];

    const scored: RetrievedChunk[] = [];
    for (const { chunk, embedding } of this.entries.values()) {
      if (excluded.has(chunk.id)) continue;
      if (!matchesFilter(chunk, options.filter)) continue;
      const score = cosineSimilarity(normalizedQuery, embedding);
      if (score < minScore || !Number.isFinite(score)) continue;
      scored.push({ chunk, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

/** Check whether a chunk satisfies the retrieval metadata filter. */
export function matchesFilter(
  chunk: Pick<DocumentChunk, "metadata" | "sourceType">,
  filter: RagFilter | undefined,
): boolean {
  if (!filter) return true;
  if (filter.productId && chunk.metadata.productId !== filter.productId) return false;
  if (filter.categoryId && chunk.metadata.categoryId !== filter.categoryId) return false;
  if (filter.sourceType && chunk.sourceType !== filter.sourceType) return false;
  return true;
}

/** L2-normalize a vector in place (returns a new array). */
export function normalize(vector: number[]): number[] | null {
  if (!vector || vector.length === 0) return null;
  let sumSq = 0;
  for (const value of vector) sumSq += value * value;
  if (sumSq <= 0) return null;
  const magnitude = Math.sqrt(sumSq);
  const out = new Array<number>(vector.length);
  for (let i = 0; i < vector.length; i++) out[i] = vector[i] / magnitude;
  return out;
}

/** Cosine similarity between two vectors of (possibly unequal) length. */
export function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
