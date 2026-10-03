import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildPrompt,
  GENERATION_MODEL,
  parseAnswerText,
  resolveGenerationModel,
} from "./generate.ts";

describe("generate", () => {
  it("uses a model id accepted by the OpenAI-compatible chat endpoint", () => {
    // The "google/" prefix 404s on /v1beta/openai/chat/completions — the
    // endpoint expects the bare model id. Guard against regressing this.
    assert.ok(
      !GENERATION_MODEL.startsWith("google/"),
      "GENERATION_MODEL must not carry the google/ prefix",
    );
    assert.match(GENERATION_MODEL, /^gemini-/);
  });

  it("resolveGenerationModel respects the env override", () => {
    const previous = process.env.GEMINI_GENERATION_MODEL;
    process.env.GEMINI_GENERATION_MODEL = "custom-chat-model";
    try {
      assert.equal(resolveGenerationModel(), "custom-chat-model");
      assert.equal(GENERATION_MODEL, "gemini-3-flash-preview");
    } finally {
      if (previous === undefined) delete process.env.GEMINI_GENERATION_MODEL;
      else process.env.GEMINI_GENERATION_MODEL = previous;
    }
  });

  it("buildPrompt embeds sources, the question and the JSON instruction", () => {
    const prompt = buildPrompt(
      "Is it lactose free?",
      "[1] Source: Sample Product (https://example.com/p1)\nIngredients: Whey Protein Isolate.",
    );
    assert.match(prompt, /SOURCES/);
    assert.match(prompt, /Sample Product/);
    assert.match(prompt, /QUESTION/);
    assert.match(prompt, /Is it lactose free\?/);
    assert.match(prompt, /"answer": string/);
  });
});

describe("parseAnswerText", () => {
  it("parses a plain JSON reply", () => {
    const parsed = parseAnswerText('{"answer":"Great product.","citations":[1,2]}');
    assert.deepEqual(parsed, { answer: "Great product.", citations: [1, 2] });
  });

  it("parses markdown-fenced JSON", () => {
    const parsed = parseAnswerText('```json\n{"answer":"Fenced answer.","citations":[3]}\n```');
    assert.equal(parsed.answer, "Fenced answer.");
    assert.deepEqual(parsed.citations, [3]);
  });

  it("parses JSON embedded in surrounding prose", () => {
    const parsed = parseAnswerText(
      'Here is my answer:\n{"answer":"Prose answer.","citations":[]}\nHope that helps.',
    );
    assert.equal(parsed.answer, "Prose answer.");
    assert.deepEqual(parsed.citations, []);
  });

  it("defaults missing citations to []", () => {
    const parsed = parseAnswerText('{"answer":"No citations."}');
    assert.equal(parsed.answer, "No citations.");
    assert.deepEqual(parsed.citations, []);
  });

  it("throws a clear error on invalid JSON", () => {
    assert.throws(() => parseAnswerText("not json at all"), /valid JSON research answer/);
  });
});
