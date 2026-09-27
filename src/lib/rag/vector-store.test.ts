import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { cosineSimilarity, InMemoryVectorStore, normalize } from "./vector-store.ts";
import { makeChunk } from "./_fixtures.ts";

describe("cosineSimilarity", () => {
  it("is 1 for identical vectors", () => {
    assert.ok(Math.abs(cosineSimilarity([1, 2, 3], [1, 2, 3]) - 1) < 1e-9);
  });

  it("is 0 for orthogonal vectors", () => {
    assert.ok(Math.abs(cosineSimilarity([1, 0], [0, 1])) < 1e-9);
  });

  it("is scale-invariant", () => {
    const a = cosineSimilarity([1, 2], [3, 4]);
    const b = cosineSimilarity([10, 20], [3, 4]);
    assert.ok(Math.abs(a - b) < 1e-9);
  });

  it("handles zero vectors gracefully", () => {
    assert.equal(cosineSimilarity([0, 0], [1, 1]), 0);
  });
});

describe("normalize", () => {
  it("produces unit-length vectors", () => {
    const vec = normalize([3, 4]);
    assert.ok(vec);
    assert.ok(Math.abs(Math.hypot(vec![0], vec![1]) - 1) < 1e-9);
  });

  it("returns null for a zero vector", () => {
    assert.equal(normalize([0, 0]), null);
  });
});

describe("InMemoryVectorStore", () => {
  it("upserts by chunk id (dedup) and reports size", () => {
    const store = new InMemoryVectorStore();
    store.upsert(makeChunk({ id: "a::0", text: "alpha" }), [1, 0]);
    store.upsert(makeChunk({ id: "a::0", text: "alpha-revised" }), [1, 0]);
    store.upsert(makeChunk({ id: "b::0", text: "beta" }), [0, 1]);
    assert.equal(store.size, 2);
    assert.ok(store.has("a::0"));
  });

  it("ranks by cosine similarity and applies topK", () => {
    const store = new InMemoryVectorStore();
    store.upsert(makeChunk({ id: "a::0", text: "alpha" }), [1, 0]);
    store.upsert(makeChunk({ id: "b::0", text: "beta" }), [0, 1]);
    store.upsert(makeChunk({ id: "c::0", text: "gamma" }), [0.7, 0.3]);

    const results = store.search([0.2, 1], { topK: 2 });
    assert.deepEqual(
      results.map((r) => r.chunk.id),
      ["b::0", "c::0"],
    );
    assert.ok(results[0].score > results[1].score);

    const top1 = store.search([0.2, 1], { topK: 1 });
    assert.deepEqual(
      top1.map((r) => r.chunk.id),
      ["b::0"],
    );
  });

  it("filters by minimum score", () => {
    const store = new InMemoryVectorStore();
    store.upsert(makeChunk({ id: "a::0", text: "alpha" }), [1, 0]);
    const results = store.search([0.2, 1], { minScore: 0.9, topK: 5 });
    assert.deepEqual(
      results.map((r) => r.chunk.id),
      [],
    );
  });

  it("filters by metadata (productId / sourceType)", () => {
    const store = new InMemoryVectorStore();
    store.upsert(makeChunk({ id: "a::0", text: "alpha", metadata: { productId: "p1" } }), [1, 0]);
    store.upsert(
      makeChunk({
        id: "b::0",
        text: "beta",
        metadata: { productId: "p2" },
        sourceType: "certification",
      }),
      [0, 1],
    );

    const filtered = store.search([1, 0], { topK: 5, filter: { productId: "p1" } });
    assert.deepEqual(
      filtered.map((r) => r.chunk.id),
      ["a::0"],
    );

    const certs = store.search([1, 0], { topK: 5, filter: { sourceType: "certification" } });
    assert.deepEqual(
      certs.map((r) => r.chunk.id),
      ["b::0"],
    );
  });

  it("supports excludeChunkIds", () => {
    const store = new InMemoryVectorStore();
    store.upsert(makeChunk({ id: "a::0", text: "alpha" }), [1, 0]);
    store.upsert(makeChunk({ id: "b::0", text: "beta" }), [1, 0]);
    const results = store.search([1, 0], { topK: 5, excludeChunkIds: ["a::0"] });
    assert.deepEqual(
      results.map((r) => r.chunk.id),
      ["b::0"],
    );
  });

  it("returns [] for an empty or zero query vector", () => {
    const store = new InMemoryVectorStore();
    store.upsert(makeChunk({ id: "a::0", text: "alpha" }), [1, 0]);
    assert.deepEqual(store.search([], { topK: 5 }), []);
    assert.deepEqual(store.search([0, 0], { topK: 5 }), []);
  });

  it("clear() empties the store", () => {
    const store = new InMemoryVectorStore();
    store.upsert(makeChunk({ id: "a::0", text: "alpha" }), [1, 0]);
    store.clear();
    assert.equal(store.size, 0);
  });
});
