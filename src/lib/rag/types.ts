/**
 * Shared types for the VeriFy RAG pipeline.
 *
 * Deliberately dependency-free: every RAG module stays pure / isomorphic so
 * the pipeline can be unit-tested with Node's built-in test runner and can
 * never leak server secrets into the client bundle.
 */

/**
 * A raw source document extracted from a product/review source.
 *
 * `sourceUrl` + `metadata` are carried through chunking → storage → retrieval
 * → context construction → generation so every generated claim can trace back
 * to its exact origin.
 */
export interface SourceDocument {
  /** Stable unique id (e.g. "p7:overview"). */
  id: string;
  /** Human readable title of the source (usually the product title). */
  title: string;
  /** Cleaned source text. */
  text: string;
  /** Verifiable URL where this source content can be found. */
  sourceUrl: string;
  /** Kind of source. */
  sourceType: SourceType;
  /** String-keyed metadata (productId, brandId, categoryId…). */
  metadata: Record<string, string>;
  /** ISO timestamp when the source was extracted. */
  extractedAt?: string;
}

export type SourceType = "product" | "merchant" | "certification";

/** A chunked slice of a source document. */
export interface DocumentChunk {
  /** Stable id: `${docId}::${order}`. */
  id: string;
  /** Parent source document id. */
  docId: string;
  /** 0-based order within the parent document. */
  order: number;
  text: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceType: SourceType;
  metadata: Record<string, string>;
}

/** A chunk surfaced by semantic retrieval together with its relevance score. */
export interface RetrievedChunk {
  chunk: DocumentChunk;
  /** Cosine similarity in [0, 1]. */
  score: number;
}

/** Metadata filter applied at retrieval time. */
export interface RagFilter {
  productId?: string;
  categoryId?: string;
  sourceType?: SourceType;
}

/** A single source citation attached to a generated answer. */
export interface Citation {
  /** 1-based citation index as it appears in the answer text. */
  index: number;
  chunkId: string;
  sourceUrl: string;
  sourceTitle: string;
  /** Short excerpt of the supporting chunk. */
  snippet: string;
  metadata: Record<string, string>;
}

/** Result of running a research query through the RAG pipeline. */
export interface ResearchAnswer {
  /** The source-grounded LLM answer. */
  answer: string;
  /** Citations strictly derived from retrieved chunks the model actually used. */
  citations: Citation[];
  /** True when the answer is backed by at least one retrieved source. */
  grounded: boolean;
  /** Pipeline outcome. */
  status: ResearchStatus;
  /** Number of candidate chunks retrieved from the vector store. */
  retrievedCount: number;
  /** Number of chunks that made it into the LLM context. */
  contextChunkCount: number;
  /** Optional diagnostic message (e.g. API failure / missing sources). */
  message?: string;
}

export type ResearchStatus =
  | "ok"
  | "no_sources"
  | "empty_retrieval"
  | "embedding_error"
  | "generation_error"
  | "invalid_query";

/** Options for a single embedding call (e.g. Gemini task type). */
export interface EmbedOptions {
  /**
   * Embedding task type (Gemini REST): "RETRIEVAL_DOCUMENT" for indexed
   * chunks and "RETRIEVAL_QUERY" for query vectors measurably improve
   * retrieval for RAG. Ignored by embedders that don't support it.
   */
  taskType?: string;
}

/** Embedder abstraction so tests can inject a deterministic fake. */
export interface Embedder {
  readonly modelId: string;
  embed(values: string[], options?: EmbedOptions): Promise<number[][]>;
}

/** Chunking options. */
export interface ChunkOptions {
  /** Target maximum chunk length in characters. */
  maxChars?: number;
  /** Overlap in characters between consecutive chunks. */
  overlap?: number;
}

/** Retrieval options. */
export interface RetrievalOptions {
  /** Number of top-k chunks to return. */
  topK?: number;
  /** Minimum cosine similarity for a chunk to be considered relevant. */
  minScore?: number;
  /** Minimum number of shared meaningful tokens required (lexical guard). */
  minSharedTokens?: number;
  /** Metadata filter applied before ranking. */
  filter?: RagFilter;
  /** Chunk ids to exclude from results. */
  excludeChunkIds?: string[];
}
