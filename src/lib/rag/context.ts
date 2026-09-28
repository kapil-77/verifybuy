/**
 * Context construction — turns retrieved chunks into the exact prompt block
 * handed to the LLM, plus the canonical citation list.
 *
 * Only chunks that actually made it into the context are eligible to be cited,
 * so citations can never point at sources the model was not shown.
 */
import type { Citation, DocumentChunk, RetrievedChunk } from "./types.ts";

export interface ContextOptions {
  /** Hard cap on total context characters (token-budget proxy). */
  maxChars?: number;
  /** Maximum number of chunks to include. */
  maxChunks?: number;
}

export interface BuiltContext {
  /** Prompt-ready context block. */
  context: string;
  /** Citations canonically derived from the chunks actually included. */
  citations: Citation[];
  /** The chunks used (deduped, budget-capped). */
  chunks: DocumentChunk[];
  /** Number of retrieved chunks that did not fit into the context. */
  dropped: number;
}

export const DEFAULT_MAX_CONTEXT_CHARS = 12_000;
export const DEFAULT_MAX_CONTEXT_CHUNKS = 8;
/** We refuse to include a chunk if its header would eat the entire budget. */
const MIN_SNIPPET_CHARS = 60;

/**
 * Build the LLM context from a ranked list of retrieved chunks.
 * Chunks are ordered by retrieval score; duplicates are skipped; the total
 * character budget is enforced by truncating and dropping trailing chunks.
 */
export function buildContext(
  retrieved: RetrievedChunk[],
  options: ContextOptions = {},
): BuiltContext {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CONTEXT_CHARS;
  const maxChunks = options.maxChunks ?? DEFAULT_MAX_CONTEXT_CHUNKS;

  const citations: Citation[] = [];
  const blocks: string[] = [];
  const chunks: DocumentChunk[] = [];
  const seen = new Set<string>();
  let remaining = maxChars;

  for (const { chunk } of retrieved) {
    if (chunks.length >= maxChunks) break;
    if (seen.has(chunk.id)) continue;
    seen.add(chunk.id);

    const index = citations.length + 1;
    const header = `[${index}] Source: ${chunk.sourceTitle} (${chunk.sourceUrl})`;
    const headerCost = header.length + 1;
    if (remaining - headerCost < MIN_SNIPPET_CHARS) break;

    const body = truncateToBudget(chunk.text, remaining - headerCost);
    if (body.length < 1) break;

    const block = `${header}\n${body}`;
    citations.push({
      index,
      chunkId: chunk.id,
      sourceUrl: chunk.sourceUrl,
      sourceTitle: chunk.sourceTitle,
      snippet: body.slice(0, 120).replace(/\s+/g, " ").trim(),
      metadata: { ...chunk.metadata },
    });
    blocks.push(block);
    chunks.push(chunk);
    remaining -= block.length;
  }

  return {
    context: blocks.join("\n\n"),
    citations,
    chunks,
    dropped: Math.max(0, retrieved.length - chunks.length),
  };
}

/** Truncate `text` to at most `maxLen`, cutting at a sentence/word boundary. */
function truncateToBudget(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const slice = text.slice(0, maxLen);
  const sentenceBoundary = slice.lastIndexOf(". ");
  const cut = sentenceBoundary > maxLen * 0.6 ? sentenceBoundary + 1 : slice.lastIndexOf(" ");
  return (cut > 0 ? slice.slice(0, cut) : slice).trim();
}
