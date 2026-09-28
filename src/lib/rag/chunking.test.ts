import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  chunkDocument,
  chunkText,
  cleanText,
  isValidSource,
  MIN_SOURCE_CHARS,
} from "./chunking.ts";
import { makeSource } from "./_fixtures.ts";

function repeatedSentenceSource(count: number): string {
  const sentences: string[] = [];
  for (let i = 1; i <= count; i++) {
    sentences.push(
      `This is sentence number ${i} about the whey protein powder that retails online.`,
    );
  }
  return sentences.join(" ");
}

describe("cleanText", () => {
  it("trim", () => {
    assert.equal(cleanText("   hello   "), "hello");
  });

  it("collapses repeated whitespace", () => {
    assert.equal(cleanText("alpha \t beta\n\n\n gamma"), "alpha beta\n\n gamma");
  });

  it("returns empty string for empty / non-string input", () => {
    assert.equal(cleanText(""), "");
    assert.equal(cleanText("   "), "");
  });
});

describe("chunkText", () => {
  it("returns a single chunk for short text", () => {
    const chunks = chunkText("Short product summary.");
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0], "Short product summary.");
  });

  it("splits long text into bounded chunks", () => {
    const text = repeatedSentenceSource(20);
    const chunks = chunkText(text, { maxChars: 300, overlap: 60 });
    assert.ok(chunks.length > 1, "expected multiple chunks");
    for (const chunk of chunks) {
      assert.ok(chunk.length <= 300, `chunk exceeds maxChars: ${chunk.length}`);
    }
  });

  it("carries overlap between consecutive chunks", () => {
    // Numbered sentences let us verify which sentence each chunk starts at.
    const text = Array.from(
      { length: 20 },
      (_, i) =>
        `Sentence ${String(i + 1).padStart(2, "0")} about the whey protein powder that retails online.`,
    ).join(" ");

    const withOverlap = chunkText(text, { maxChars: 300, overlap: 600 });
    const noOverlap = chunkText(text, { maxChars: 300, overlap: 0 });

    assert.ok(withOverlap.length > 1);
    assert.ok(noOverlap.length > 1);

    const firstSentence = (chunk: string) => Number(chunk.match(/Sentence (\d+)/)?.[1] ?? 0);
    // Overlap replays the tail of chunk 0 at the start of chunk 1.
    assert.ok(
      firstSentence(withOverlap[1]) <= firstSentence(noOverlap[1]),
      "overlap did not carry earlier content into the next chunk",
    );
    // Without overlap, chunk 1 starts at a strictly later sentence.
    assert.ok(firstSentence(noOverlap[1]) > firstSentence(withOverlap[1]));
  });

  it("keeps oversized single words intact via hard split", () => {
    const text = `${"T".repeat(500)} after`;
    const chunks = chunkText(text, { maxChars: 200, overlap: 0 });
    assert.ok(chunks.length >= 3);
    for (const chunk of chunks) assert.ok(chunk.length <= 200);
  });

  it("returns [] for empty text", () => {
    assert.equal(chunkText("").length, 0);
  });
});

describe("isValidSource", () => {
  it("accepts a well-formed source", () => {
    assert.ok(isValidSource(makeSource({ id: "s1", text: "x".repeat(80) })));
  });

  it("rejects text that is too short (malformed content)", () => {
    assert.ok(!isValidSource(makeSource({ id: "s1", text: "x".repeat(MIN_SOURCE_CHARS - 1) })));
  });

  it("rejects sources without an http(s) url", () => {
    assert.ok(
      !isValidSource(makeSource({ id: "s1", text: "x".repeat(80), sourceUrl: "not-a-url" })),
    );
  });

  it("rejects sources without an id", () => {
    // @ts-expect-error id is required by the fixture type; simulate bad data
    assert.ok(!isValidSource({ text: "x".repeat(80), sourceUrl: "https://x.com" }));
  });
});

describe("chunkDocument", () => {
  it("preserves sourceUrl + metadata on every chunk", () => {
    const docs = chunkDocument(
      makeSource({
        id: "p7:overview",
        text: "x".repeat(2400),
        sourceUrl: "https://example.com/p7",
        metadata: { productId: "p7", brandId: "b1" },
      }),
      { maxChars: 300, overlap: 50 },
    );

    assert.ok(docs.length > 1, "expected multiple chunks");
    for (const chunk of docs) {
      assert.equal(chunk.sourceUrl, "https://example.com/p7");
      assert.equal(chunk.metadata.productId, "p7");
      assert.equal(chunk.metadata.brandId, "b1");
      assert.ok(chunk.id.startsWith("p7:overview::"));
    }
  });

  it("returns [] for malformed / empty source content", () => {
    assert.deepEqual(chunkDocument(makeSource({ id: "s1", text: "" })), []);
    assert.deepEqual(chunkDocument(makeSource({ id: "s1", text: "too short" })), []);
  });
});
