import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createGeminiEmbedder,
  createHashEmbedder,
  embedInBatches,
  MAX_EMBEDDINGS_PER_CALL,
} from "./embeddings.ts";
import type { GeminiEmbedderOptions } from "./embeddings.ts";

describe("embedInBatches", () => {
  it("returns [] and makes no calls for empty input", async () => {
    let calls = 0;
    const out = await embedInBatches([], 10, async () => {
      calls++;
      return [];
    });
    assert.deepEqual(out, []);
    assert.equal(calls, 0);
  });

  it("respects the batch cap and preserves order", async () => {
    const sizes: number[] = [];
    const out = await embedInBatches(["a", "bb", "ccc", "dddd", "eeeee"], 2, async (batch) => {
      sizes.push(batch.length);
      return batch.map((value) => [value.length]);
    });
    assert.deepEqual(sizes, [2, 2, 1]);
    assert.deepEqual(out, [[1], [2], [3], [4], [5]]);
  });

  it("stops at the first failing batch", async () => {
    let calls = 0;
    await assert.rejects(
      embedInBatches(["a", "b", "c"], 1, async (batch) => {
        calls++;
        if (batch[0] === "b") throw new Error("boom");
        return [[batch[0].length]];
      }),
      /boom/,
    );
    // "a" succeeded, "b" failed — "c" must never be embedded.
    assert.equal(calls, 2);
  });

  it("normalizes non-positive batch sizes to 1", async () => {
    const out = await embedInBatches(["a", "b"], 0, async (batch) => [batch.length]);
    assert.deepEqual(out, [1, 1]);
  });
});

describe("createGeminiEmbedder", () => {
  function trackedEmbedder(options: Omit<GeminiEmbedderOptions, "embedBatch"> = {}) {
    const batchSizes: number[] = [];
    const embedder = createGeminiEmbedder({
      ...options,
      embedBatch: async (batch) => {
        batchSizes.push(batch.length);
        return batch.map((value) => [value.length]);
      },
    });
    return { embedder, batchSizes };
  }

  it("batches inputs under the cap and flattens results in order", async () => {
    const { embedder, batchSizes } = trackedEmbedder({ maxEmbeddingsPerCall: 2 });
    const out = await embedder.embed(["a", "bb", "ccc", "dddd"]);

    assert.deepEqual(batchSizes, [2, 2]);
    assert.deepEqual(out, [[1], [2], [3], [4]]);
  });

  it("uses MAX_EMBEDDINGS_PER_CALL by default", async () => {
    const { embedder, batchSizes } = trackedEmbedder();
    const values = Array.from({ length: 70 }, (_, i) => `value ${i}`);

    const out = await embedder.embed(values);

    assert.deepEqual(batchSizes, [MAX_EMBEDDINGS_PER_CALL, 6]);
    assert.equal(out.length, values.length);
  });

  it("skips blank inputs and makes zero calls when nothing remains", async () => {
    const { embedder, batchSizes } = trackedEmbedder();
    const out = await embedder.embed(["   ", "", "\t"]);
    assert.deepEqual(out, []);
    assert.deepEqual(batchSizes, []);
  });

  it("createHashEmbedder is deterministic", async () => {
    const embedder = createHashEmbedder();
    const first = await embedder.embed(["same text again"]);
    const second = await embedder.embed(["same text again"]);
    assert.deepEqual(first, second);
  });
});
