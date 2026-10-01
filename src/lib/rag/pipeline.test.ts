import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHashEmbedder } from "./embeddings.ts";
import { runResearchQuery, researchProduct } from "./pipeline.ts";
import { InMemoryVectorStore } from "./vector-store.ts";
import { makeSource } from "./_fixtures.ts";
import type { BuiltContext } from "./context.ts";
import type { GenerationResult } from "./generate.ts";
import type { Embedder } from "./types.ts";

const embedder = createHashEmbedder();

const sources = [
  makeSource({
    id: "p1:overview",
    text: "Whey protein isolate chocolate flavor supplement for muscle growth.",
    sourceUrl: "https://example.com/p1",
    metadata: { productId: "p1", brandId: "b1", categoryId: "c1" },
  }),
  makeSource({
    id: "p1:ratings",
    text: "Rated 4.8 out of 5 from 1000 reviews with pros and cons for this whey product.",
    sourceUrl: "https://example.com/p1",
    sourceType: "merchant",
    metadata: { productId: "p1", brandId: "b1", categoryId: "c1" },
  }),
  makeSource({
    id: "p2:overview",
    text: "Gluten free oatmeal breakfast cereal with whole grains.",
    sourceUrl: "https://example.com/p2",
    metadata: { productId: "p2", brandId: "b2", categoryId: "c2" },
  }),
];

function freshStore(): InMemoryVectorStore {
  return new InMemoryVectorStore();
}

async function fakeGenerator(query: string, context: BuiltContext): Promise<GenerationResult> {
  return {
    answer: `Answer about "${query}" using ${context.chunks.length} source(s).`,
    citations: context.citations.slice(0, 1),
    grounded: true,
  };
}

describe("runResearchQuery", () => {
  it("returns no_sources without calling the generator when the corpus is empty", async () => {
    let called = false;
    const result = await runResearchQuery(
      { query: "anything about wheels" },
      {
        store: freshStore(),
        sources: [],
        embedder,
        generator: async () => {
          called = true;
          throw new Error("should not be called");
        },
        minScore: 0.01,
      },
    );
    assert.equal(result.status, "no_sources");
    assert.equal(called, false);
  });

  it("returns invalid_query for blank input", async () => {
    const result = await runResearchQuery(
      { query: "   " },
      { store: freshStore(), sources, embedder, minScore: 0.01 },
    );
    assert.equal(result.status, "invalid_query");
  });

  it("returns empty_retrieval without calling the LLM when nothing is relevant", async () => {
    let called = false;
    const result = await runResearchQuery(
      { query: "xylophone magnetized linguistics topology" },
      {
        store: freshStore(),
        sources,
        embedder,
        generator: async () => {
          called = true;
          throw new Error("should not be called");
        },
        minScore: 0.0,
      },
    );
    assert.equal(result.status, "empty_retrieval");
    assert.equal(called, false);
  });

  it("grounds an answer in retrieved sources with citations", async () => {
    const result = await runResearchQuery(
      { query: "whey protein chocolate", filter: { productId: "p1" } },
      {
        store: freshStore(),
        sources,
        embedder,
        generator: fakeGenerator,
        minScore: 0.01,
      },
    );

    assert.equal(result.status, "ok");
    assert.ok(result.grounded, "expected a grounded answer");
    assert.match(result.answer, /using \d+ source/);
    assert.ok(result.citations.length >= 1, "expected citations");
    for (const citation of result.citations) {
      assert.equal(citation.metadata.productId, "p1");
      assert.match(citation.sourceUrl, /^https:\/\//);
      assert.ok(citation.snippet.length > 0);
    }
    assert.ok(result.retrievedCount >= 1);
    assert.ok(result.contextChunkCount >= 1);
  });

  it("returns generation_error when the LLM fails", async () => {
    const result = await runResearchQuery(
      { query: "whey protein chocolate" },
      {
        store: freshStore(),
        sources,
        embedder,
        generator: async () => {
          throw new Error("upstream 502");
        },
        minScore: 0.01,
      },
    );
    assert.equal(result.status, "generation_error");
    assert.match(result.message ?? "", /upstream 502/);
  });
});

describe("researchProduct", () => {
  it("grounds a product-specific summary with citations for that product", async () => {
    const result = await researchProduct("p1", {
      store: freshStore(),
      sources,
      embedder,
      generator: fakeGenerator,
      minScore: 0.01,
    });

    assert.equal(result.status, "ok");
    for (const citation of result.citations) {
      assert.equal(citation.metadata.productId, "p1");
    }
  });

  it("returns invalid_query for an unknown product", async () => {
    const result = await researchProduct("nope", {
      store: freshStore(),
      sources,
      embedder,
      minScore: 0.01,
    });
    assert.equal(result.status, "invalid_query");
  });
});
describe("scoped ingestion", () => {
  type Recorder = { calls: string[][]; taskTypes: Array<string | undefined> };
  function recordingEmbedder(recorder: Recorder): Embedder {
    const inner = createHashEmbedder();
    return {
      modelId: "recording",
      async embed(values: string[], options?: { taskType?: string }) {
        recorder.calls.push([...values]);
        recorder.taskTypes.push(options?.taskType ?? undefined);
        return inner.embed(values);
      },
    };
  }

  // Executed sequentially inside a single `it` — Node's test runner executes
  // separate `it`s concurrently, which would race the shared store below.
  it("ingests incrementally per scope and never re-embeds", async () => {
    const store = new InMemoryVectorStore();
    const run = (recorder: Recorder, query: string, filter: { productId: string }) =>
      runResearchQuery(
        { query, filter },
        {
          store,
          sources,
          embedder: recordingEmbedder(recorder),
          generator: fakeGenerator,
          minScore: 0.01,
        },
      );

    // 1) A product-scoped query embeds only that product's chunks.
    const r1: Recorder = { calls: [], taskTypes: [] };
    const result1 = await run(r1, "whey protein chocolate", { productId: "p1" });
    assert.equal(result1.status, "ok");
    const ids1 = store.allChunkIds();
    assert.ok(ids1.length >= 2, `expected p1 chunks, got ${ids1.length}`);
    assert.ok(
      ids1.every((id) => id.startsWith("p1:")),
      `unexpected chunk: ${ids1[0]}`,
    );
    // One ingestion embed call + one query embedding.
    assert.equal(r1.calls.length, 2);

    // 2) A later query for another product ingests only the missing docs.
    const r2: Recorder = { calls: [], taskTypes: [] };
    const result2 = await run(r2, "gluten free oatmeal", { productId: "p2" });
    assert.equal(result2.status, "ok");
    const ids2 = store.allChunkIds();
    assert.ok(
      ids2.some((id) => id.startsWith("p1:")),
      "p1 scope missing",
    );
    assert.ok(
      ids2.some((id) => id.startsWith("p2:")),
      "p2 scope missing",
    );
    assert.equal(r2.calls.length, 2);

    // 3) Re-running an already-scoped query makes ZERO ingestion calls —
    // only the single query-embedding call happens.
    const r3: Recorder = { calls: [], taskTypes: [] };
    const result3 = await run(r3, "whey protein chocolate", { productId: "p1" });
    assert.equal(result3.status, "ok");
    assert.equal(r3.calls.length, 1);
    assert.equal(store.size, ids2.length); // no store growth
  });
});
