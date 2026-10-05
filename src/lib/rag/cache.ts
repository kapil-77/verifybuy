/**
 * Bounded in-memory answer cache for the RAG pipeline.
 *
 * Same principle as the vector store: server-side, per-isolate, no extra
 * infrastructure. Repeating an identical research question short-circuits the
 * whole pipeline — zero embedding calls, zero LLM calls — for subsequent runs.
 * Only successful (`status === "ok"`) answers are ever stored.
 */
import type { ResearchAnswer } from "./types.ts";

export interface AnswerCache {
  get(key: string): ResearchAnswer | undefined;
  set(key: string, answer: ResearchAnswer): void;
  /** Number of entries currently held. */
  readonly size: number;
  clear(): void;
  keys(): string[];
}

export const DEFAULT_CACHE_LIMIT = 64;

/** LRU `Map`-backed cache that evicts the least-recently-used entry at capacity. */
export function createAnswerCache(limit: number = DEFAULT_CACHE_LIMIT): AnswerCache {
  const entries = new Map<string, ResearchAnswer>();
  const maxEntries = Math.max(1, Math.floor(limit));

  return {
    get size() {
      return entries.size;
    },
    get(key: string): ResearchAnswer | undefined {
      const hit = entries.get(key);
      if (hit) {
        // Refresh LRU recency.
        entries.delete(key);
        entries.set(key, hit);
      }
      return hit;
    },
    set(key: string, answer: ResearchAnswer): void {
      if (entries.has(key)) entries.delete(key);
      entries.set(key, answer);
      while (entries.size > maxEntries) {
        const oldest = entries.keys().next().value;
        if (oldest === undefined) break;
        entries.delete(oldest);
      }
    },
    clear(): void {
      entries.clear();
    },
    keys(): string[] {
      return [...entries.keys()];
    },
  };
}
