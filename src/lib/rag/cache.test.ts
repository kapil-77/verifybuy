import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createAnswerCache } from "./cache.ts";
import type { ResearchAnswer } from "./types.ts";

function answer(seed: string): ResearchAnswer {
  return {
    answer: `answer for ${seed}`,
    citations: [],
    grounded: true,
    status: "ok",
    retrievedCount: 3,
    contextChunkCount: 2,
  };
}

describe("createAnswerCache", () => {
  it("returns undefined for a missing key", () => {
    const cache = createAnswerCache();
    assert.equal(cache.get("nope"), undefined);
    assert.equal(cache.size, 0);
  });

  it("round-trips a stored answer", () => {
    const cache = createAnswerCache();
    cache.set("a", answer("a"));
    assert.equal(cache.size, 1);
    assert.equal(cache.get("a")?.answer, "answer for a");
  });

  it("evicts the least-recently-used entry at capacity", () => {
    const cache = createAnswerCache(3);
    cache.set("a", answer("a"));
    cache.set("b", answer("b"));
    cache.set("c", answer("c"));
    assert.equal(cache.size, 3);

    cache.set("d", answer("d")); // evicts "a" (oldest)
    assert.equal(cache.get("a"), undefined);
    assert.equal(cache.get("b")?.answer, "answer for b");
    assert.equal(cache.get("d")?.answer, "answer for d");
  });

  it("get refreshes recency (LRU)", () => {
    const cache = createAnswerCache(3);
    cache.set("a", answer("a"));
    cache.set("b", answer("b"));
    cache.set("c", answer("c"));
    cache.get("a"); // a becomes most-recent

    cache.set("d", answer("d")); // evicts "b"
    assert.equal(cache.get("b"), undefined);
    assert.equal(cache.get("a")?.answer, "answer for a");
  });

  it("overwrites an existing key without growing", () => {
    const cache = createAnswerCache(2);
    cache.set("a", answer("a"));
    cache.set("a", answer("a2"));
    assert.equal(cache.size, 1);
    assert.equal(cache.get("a")?.answer, "answer for a2");
  });

  it("clear empties the cache", () => {
    const cache = createAnswerCache();
    cache.set("a", answer("a"));
    cache.clear();
    assert.equal(cache.size, 0);
    assert.equal(cache.get("a"), undefined);
  });

  it("exposes the current keys", () => {
    const cache = createAnswerCache();
    cache.set("a", answer("a"));
    cache.set("b", answer("b"));
    assert.deepEqual(cache.keys().sort(), ["a", "b"]);
  });
});
