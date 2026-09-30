/**
 * Ingestion — clean → chunk → embed → store, with duplicate detection and
 * per-document error isolation.
 *
 * Duplicate documents (same `doc.id`) are skipped. A source is only marked as
 * ingested after its chunks were embedded and stored successfully, so an
 * embedding API failure does not poison the corpus for the next attempt.
 */
import { chunkDocument, isValidSource } from "./chunking.ts";
import { EMBEDDING_TASK_DOCUMENT } from "./embeddings.ts";
import { InMemoryVectorStore } from "./vector-store.ts";
import type { ChunkOptions, Embedder, SourceDocument } from "./types.ts";

export interface IngestReport {
  documentsProcessed: number;
  documentsSkippedDuplicate: number;
  documentsSkippedInvalid: number;
  chunksIngested: number;
  chunksSkippedEmpty: number;
}

export async function ingestDocuments(
  docs: SourceDocument[],
  embedder: Embedder,
  store: InMemoryVectorStore,
  seenDocs: Set<string>,
  options: { chunk?: ChunkOptions } = {},
): Promise<IngestReport> {
  const report: IngestReport = {
    documentsProcessed: 0,
    documentsSkippedDuplicate: 0,
    documentsSkippedInvalid: 0,
    chunksIngested: 0,
    chunksSkippedEmpty: 0,
  };

  // Phase 1: validate + chunk (no I/O).
  const pending: { doc: SourceDocument; chunks: ReturnType<typeof chunkDocument> }[] = [];
  for (const doc of docs) {
    if (seenDocs.has(doc.id)) {
      report.documentsSkippedDuplicate++;
      continue;
    }
    if (!isValidSource(doc)) {
      report.documentsSkippedInvalid++;
      continue;
    }
    const chunks = chunkDocument(doc, options.chunk ?? {});
    report.documentsProcessed++;
    if (chunks.length === 0) {
      report.chunksSkippedEmpty++;
      continue;
    }
    pending.push({ doc, chunks });
  }

  if (pending.length === 0) return report;

  // Phase 2: embed every pending chunk in one batched call. If this throws
  // the calling pipeline returns an embedding error and `seenDocs` is untouched,
  // so the corpus can be retried on the next request.
  const allChunks = pending.flatMap((entry) => entry.chunks);
  const vectors = await embedder.embed(
    allChunks.map((chunk) => chunk.text),
    {
      taskType: EMBEDDING_TASK_DOCUMENT,
    },
  );

  // Phase 3: store + mark seen (only on success).
  let offset = 0;
  for (const { doc, chunks } of pending) {
    let docOk = true;
    for (const chunk of chunks) {
      const embedding = vectors[offset++];
      if (!embedding || embedding.length === 0) {
        report.chunksSkippedEmpty++;
        docOk = false;
        continue;
      }
      store.upsert(chunk, embedding);
      report.chunksIngested++;
    }
    if (docOk) seenDocs.add(doc.id);
    else report.documentsSkippedInvalid++;
  }

  return report;
}
