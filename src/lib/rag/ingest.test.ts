import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHashEmbedder } from "./embeddings.ts";
import { ingestDocuments } from "./ingest.ts";
import { InMemoryVectorStore } from "./vector-store.ts";
import { makeSource } from "./_fixtures.ts";

const embedder = createHashEmbedder();

const LONG_TEXT =
  "Whey protein isolate chocolate flavor supplement for muscle recovery post workout.";

describe("ingestDocuments", () => {
  it("ingests documents and marks them as seen", async () => {
    const store = new InMemoryVectorStore();
    const seen = new Set<string>();

    const report = await ingestDocuments(
      [makeSource({ id: "s1", text: LONG_TEXT })],
      embedder,
      store,
      seen,
    );

    assert.equal(report.documentsProcessed, 1);
    assert.ok(report.chunksIngested >= 1);
    assert.ok(store.size >= 1);
    assert.ok(seen.has("s1"));
  });

  it("skips duplicate documents when the ledger already contains them", async () => {
    const store = new InMemoryVectorStore();
    const seen = new Set<string>();

    await ingestDocuments([makeSource({ id: "s1", text: LONG_TEXT })], embedder, store, seen);
    const before = store.size;

    const report = await ingestDocuments(
      [makeSource({ id: "s1", text: LONG_TEXT })],
      embedder,
      store,
      seen,
    );

    assert.equal(report.documentsSkippedDuplicate, 1);
    assert.equal(report.documentsProcessed, 0);
    assert.equal(store.size, before);
  });

  it("skips malformed sources and reports them as invalid", async () => {
    const store = new InMemoryVectorStore();
    const seen = new Set<string>();

    const report = await ingestDocuments(
      [
        makeSource({ id: "s1", text: "x".repeat(10) }), // too short -> invalid
        makeSource({ id: "s2", text: "Valid whey protein isolate chocolate flavor." }),
      ],
      embedder,
      store,
      seen,
    );

    assert.equal(report.documentsSkippedInvalid, 1);
    assert.equal(report.documentsProcessed, 1);
    assert.ok(!seen.has("s1"));
    assert.ok(seen.has("s2"));
  });

  it("returns a zero report when there is nothing to ingest", async () => {
    const store = new InMemoryVectorStore();
    const report = await ingestDocuments([], embedder, store, new Set());
    assert.equal(report.documentsProcessed, 0);
    assert.equal(report.chunksIngested, 0);
  });
});
