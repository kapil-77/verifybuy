import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHashEmbedder, EMBEDDING_TASK_QUERY } from "./embeddings.ts";
import { retrieve } from "./retrieval.ts";
import { InMemoryVectorStore } from "./vector-store.ts";
import { chunkDocument } from "./chunking.ts";
import { makeSource } from "./_fixtures.ts";
import type { Embedder } from "./types.ts";

const docs = [
  makeSource({
    id: "whey:overview",
    text: "Whey protein isolate powder chocolate flavor supplement for post workout muscle growth recovery.",
    sourceUrl: "https://example.com/whey",
    sourceType: "product",
    metadata: { productId: "p1", brandId: "b1" },
  }),
  makeSource({
    id: "oats:overview",
    text: "Gluten free oatmeal breakfast cereal whole grains oats fiber rich energy.",
    sourceUrl: "https://example.com/oats",
    sourceType: "product",
    metadata: { productId: "p2", brandId: "b2" },
  }),
  makeSource({
    id: "vitamins:overview",
    text: "Vitamin C and D capsules immunity support daily multivitamin tablets health.",
    sourceUrl: "https://example.com/vitamins",
    sourceType: "certification",
    metadata: { productId: "p3", brandId: "b3" },
  }),
];

async function buildStore(): Promise<InMemoryVectorStore> {
  const embedder = createHashEmbedder();
  const store = new InMemoryVectorStore();
  const vectors = await embedder.embed(docs.map((doc) => doc.text));
  for (let i = 0; i < docs.length; i++) {
    for (const chunk of chunkDocument(docs[i])) {
      store.upsert(chunk, vectors[i]);
    }
  }
  return store;
}

describe("retrieve", () => {
  it("returns the semantically most similar chunks first", async () => {
    const store = await buildStore();
    const results = await retrieve(store, createHashEmbedder(), "chocolate whey protein isolate", {
      topK: 3,
      minScore: 0.05,
    });
    assert.ok(results.length > 0, "expected retrievals");
    assert.equal(results[0].chunk.metadata.productId, "p1");
  });

  it("respects topK", async () => {
    const store = await buildStore();
    const results = await retrieve(store, createHashEmbedder(), "whey protein", {
      topK: 1,
      minScore: 0.05,
    });
    assert.ok(results.length <= 1);
  });

  it("filters by productId metadata", async () => {
    const store = await buildStore();
    const results = await retrieve(store, createHashEmbedder(), "oats cereal breakfast", {
      topK: 3,
      minScore: 0.05,
      filter: { productId: "p2" },
    });
    assert.ok(results.length > 0);
    for (const r of results) assert.equal(r.chunk.metadata.productId, "p2");
  });

  it("returns nothing when the score threshold is too strict", async () => {
    const store = await buildStore();
    const results = await retrieve(store, createHashEmbedder(), "chocolate whey protein", {
      topK: 3,
      minScore: 0.999,
    });
    assert.deepEqual(results, []);
  });

  it("blocks irrelevant chunks via the lexical relevance guard", async () => {
    const store = await buildStore();
    // Shares no meaningful tokens with any document.
    const results = await retrieve(
      store,
      createHashEmbedder(),
      "xylophone magnetized quasimodo linguistic topology",
      { topK: 3, minScore: 0.0 },
    );
    assert.deepEqual(results, []);
  });

  it("returns [] for an empty query and for an empty store", async () => {
    const store = await buildStore();
    assert.deepEqual(await retrieve(store, createHashEmbedder(), "   ", { topK: 3 }), []);
    assert.deepEqual(
      await retrieve(new InMemoryVectorStore(), createHashEmbedder(), "anything", { topK: 3 }),
      [],
    );
  });

  it("embeds the query with the RETRIEVAL_QUERY task type", async () => {
    const store = await buildStore();
    const seenTaskTypes: Array<string | undefined> = [];
    const inner = createHashEmbedder();
    const recording: Embedder = {
      modelId: "recording",
      async embed(values, options) {
        seenTaskTypes.push(options?.taskType);
        return inner.embed(values);
      },
    };

    await retrieve(store, recording, "whey protein chocolate", { topK: 2, minScore: 0.05 });

    assert.deepEqual(seenTaskTypes, [EMBEDDING_TASK_QUERY]);
  });
});
