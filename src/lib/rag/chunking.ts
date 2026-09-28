/**
 * Text extraction & cleaning + deterministic document chunking.
 *
 * Pure functions — no I/O, no external dependencies. This keeps chunking
 * trivially unit-testable and safe to bundle anywhere.
 */
import type { ChunkOptions, DocumentChunk, SourceDocument } from "./types.ts";

export const DEFAULT_MAX_CHARS = 900;
export const DEFAULT_OVERLAP = 120;
/** Sources shorter than this are treated as malformed / too thin to chunk. */
export const MIN_SOURCE_CHARS = 40;

/**
 * Normalize raw extracted text: normalize line endings & whitespace, drop
 * zero-width characters and trim surrounding noise.
 */
export function cleanText(raw: string): string {
  if (typeof raw !== "string" || raw.length === 0) return "";
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\u200b|\u200c|\u200d|\ufeff/g, "")
    .trim();
}

/**
 * Split text into sentence-aligned chunks no longer than `maxChars`,
 * carrying `overlap` characters of the previous chunk into the next one so
 * retrieved boundaries retain context.
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const overlap = Math.min(options.overlap ?? DEFAULT_OVERLAP, Math.floor(maxChars / 2));

  const cleaned = cleanText(text);
  if (!cleaned) return [];
  if (cleaned.length <= maxChars) return [cleaned];

  const sentences = splitSentences(cleaned);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      // Oversized sentence: flush the current chunk and hard-split the
      // sentence on word boundaries (with per-chunk overlap).
      if (current) chunks.push(current);
      const pieces = splitTooLong(sentence, maxChars);
      for (let i = 0; i < pieces.length; i++) {
        pieces[i] = i > 0 ? tailOverlap(pieces[i - 1], overlap) + pieces[i] : pieces[i];
        chunks.push(pieces[i]);
      }
      current = "";
      continue;
    }

    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) chunks.push(current);
      current = joinWithOverlap(current, sentence, overlap, maxChars);
    }
  }

  if (current) chunks.push(current);
  return chunks.map((c) => c.trim()).filter(Boolean);
}

/**
 * Validate a raw source document before it enters the pipeline.
 * Guards against malformed / empty source content.
 */
export function isValidSource(doc: SourceDocument): boolean {
  if (!doc || typeof doc.id !== "string" || doc.id.length === 0) return false;
  if (typeof doc.text !== "string" || cleanText(doc.text).length < MIN_SOURCE_CHARS) return false;
  if (typeof doc.sourceUrl !== "string" || !doc.sourceUrl.startsWith("http")) return false;
  if (typeof doc.title !== "string" || doc.title.length === 0) return false;
  return true;
}

/**
 * Chunk a single source document, preserving `sourceUrl` and all document
 * metadata on every chunk so citations remain traceable end-to-end.
 */
export function chunkDocument(doc: SourceDocument, options: ChunkOptions = {}): DocumentChunk[] {
  const cleaned = cleanText(doc.text);
  if (cleaned.length < MIN_SOURCE_CHARS || !doc.sourceUrl) return [];

  return chunkText(cleaned, options).map((text, order) => ({
    id: `${doc.id}::${order}`,
    docId: doc.id,
    order,
    text,
    sourceUrl: doc.sourceUrl,
    sourceTitle: doc.title,
    sourceType: doc.sourceType,
    metadata: { ...doc.metadata },
  }));
}

// ─── Internals ──────────────────────────────────────────────────────────────

/** Split into sentences; only split at boundaries that look like real ones. */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'“(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Build `next` preceded by as much overlap tail of `prev` as fits the budget. */
function joinWithOverlap(prev: string, next: string, overlap: number, maxChars: number): string {
  const tail = tailOverlap(prev, overlap);
  const budget = maxChars - next.length;
  return (budget > 0 ? tail.slice(0, budget) : "") + next;
}

/** Last ~n characters of text, cut at the first word boundary. */
function tailOverlap(text: string, n: number): string {
  if (n <= 0) return "";
  if (text.length <= n) return text;
  const tail = text.slice(-n);
  const at = tail.indexOf(" ");
  return at > 0 ? tail.slice(at + 1) : tail;
}

/** Hard-split an oversized string on word boundaries, keeping pieces ≤ maxChars. */
function splitTooLong(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const pieces: string[] = [];
  let piece = "";
  const flush = () => {
    if (piece) {
      pieces.push(piece);
      piece = "";
    }
  };

  for (const word of words) {
    if (word.length > maxChars) {
      flush();
      for (let start = 0; start < word.length; start += maxChars) {
        pieces.push(word.slice(start, start + maxChars));
      }
      continue;
    }
    const candidate = piece ? `${piece} ${word}` : word;
    if (candidate.length > maxChars) {
      flush();
      piece = word;
    } else {
      piece = candidate;
    }
  }
  flush();
  return pieces;
}
