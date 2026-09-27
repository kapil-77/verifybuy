import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHashEmbedder } from "./embeddings.ts";
import { runResearchQuery, researchProduct } from "./pipeline.ts";
import { InMemoryVectorStore } from "./vector-store.ts";
import { makeSource } from "./_fixtures.ts";
import type { BuiltContext } from "./context.ts";
import type { GenerationResult } from "./generate.ts";

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
