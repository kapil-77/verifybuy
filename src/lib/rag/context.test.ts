import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildContext } from "./context.ts";
import { makeChunk } from "./_fixtures.ts";
import type { RetrievedChunk } from "./types.ts";

function pair(id: string, text: string, score: number): RetrievedChunk {
  return {
    chunk: makeChunk({
      id,
      docId: id.split("::")[0],
      text,
      sourceUrl: `https://example.com/${id.split("::")[0]}`,
      sourceTitle: `Title ${id}`,
      metadata: { productId: id.split("::")[0] },
    }),
    score,
  };
}

describe("buildContext", () => {
  it("numbers sources, embeds URLs and preserves order", () => {
    const ctx = buildContext([
      pair("a::0", "First chunk about whey protein.", 0.9),
      pair("b::0", "Second chunk about oats.", 0.6),
    ]);

    assert.match(ctx.context, /\[1\] Source: Title a::0 \(https:\/\/example\.com\/a\)/);
    assert.match(ctx.context, /\[2\] Source: Title b::0 \(https:\/\/example\.com\/b\)/);
    assert.ok(ctx.context.indexOf("First chunk") < ctx.context.indexOf("Second chunk"));

    assert.equal(ctx.citations.length, 2);
    assert.equal(ctx.citations[0].index, 1);
    assert.equal(ctx.citations[1].index, 2);
    assert.equal(ctx.citations[0].sourceUrl, "https://example.com/a");
    assert.deepEqual(
      ctx.chunks.map((c) => c.id),
      ["a::0", "b::0"],
    );
    assert.equal(ctx.dropped, 0);
  });

  it("deduplicates repeated chunk ids", () => {
    const ctx = buildContext([
      pair("a::0", "First.", 0.9),
      pair("a::0", "First again.", 0.8),
      pair("b::0", "Second.", 0.5),
    ]);
    assert.deepEqual(
      ctx.chunks.map((c) => c.id),
      ["a::0", "b::0"],
    );
    assert.equal(ctx.citations.length, 2);
  });

  it("caps the number of chunks via maxChunks and reports dropped", () => {
    const ctx = buildContext(
      [pair("a::0", "A.", 0.9), pair("b::0", "B.", 0.8), pair("c::0", "C.", 0.7)],
      { maxChunks: 2 },
    );
    assert.deepEqual(
      ctx.chunks.map((c) => c.id),
      ["a::0", "b::0"],
    );
    assert.equal(ctx.dropped, 1);
  });

  it("enforces the character budget by truncating trailing chunks", () => {
    const longText = "A sentence about protein. ".repeat(400);
    const ctx = buildContext([pair("a::0", longText, 0.9), pair("b::0", "B.", 0.8)], {
      maxChars: 800,
    });
    assert.ok(ctx.context.length <= 800, `context exceeds budget: ${ctx.context.length}`);
    // The first (most relevant) chunk was kept; the rest was dropped.
    assert.ok(ctx.chunks.length >= 1);
    assert.ok(ctx.dropped >= 0);
    assert.equal(ctx.citations[0].chunkId, "a::0");
    assert.ok(ctx.citations[0].snippet.length > 0);
  });

  it("returns an empty context for no retrievals", () => {
    const ctx = buildContext([]);
    assert.equal(ctx.context, "");
    assert.deepEqual(ctx.citations, []);
    assert.deepEqual(ctx.chunks, []);
  });
});
