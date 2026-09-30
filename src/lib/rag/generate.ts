/**
 * Generation — the LLM step of the RAG pipeline.
 *
 * Reuses the exact same AI infrastructure as the rest of the app:
 * `@ai-sdk/openai-compatible` → Gemini's OpenAI-compatible endpoint with the
 * Vercel AI SDK `generateText`, mirroring `src/lib/diet.functions.ts`.
 *
 * The model returns `{ answer, citations: number[] }`. Citation indices are
 * validated server-side against the context that was actually shown, so the
 * pipeline can never emit fabricated sources.
 */
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import type { BuiltContext } from "./context.ts";
import type { Citation } from "./types.ts";

/** Chat model used for source-grounded answers. */
export const GENERATION_MODEL = "google/gemini-3-flash-preview";

const GeneratedAnswerSchema = z.object({
  answer: z.string().min(1),
  citations: z.array(z.number().int().positive()).optional().default([]),
});

export interface GenerationResult {
  answer: string;
  /** Final citations: only indices mapping to a real context source. */
  citations: Citation[];
  /** True when at least one valid citation backs the answer. */
  grounded: boolean;
}

export interface GenerateOptions {
  modelId?: string;
  temperature?: number;
}

let cachedProvider: ReturnType<typeof createOpenAICompatible> | null = null;

function getGeminiProvider() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY — generation requires a server-side Gemini API key");
  }
  cachedProvider ??= createOpenAICompatible({
    name: "gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    apiKey: process.env.GEMINI_API_KEY,
  });
  return cachedProvider;
}

/**
 * Generate a source-grounded answer for `query` given the retrieved context.
 * Throws on API / parse failure so the caller (pipeline) can decide how to
 * surface it gracefully.
 */
export async function generateGroundedAnswer(
  query: string,
  context: BuiltContext,
  options: GenerateOptions = {},
): Promise<GenerationResult> {
  if (context.citations.length === 0) {
    throw new Error("Refusing to generate without a non-empty source context");
  }

  const model = getGeminiProvider()(options.modelId ?? GENERATION_MODEL);
  const parsed = await callModel(model, query, context.context, options);

  // Enforce strictly that every citation index is backed by a shown chunk.
  const byIndex = new Map(context.citations.map((citation) => [citation.index, citation]));
  const validIndices: number[] = [];
  for (const idx of parsed.citations) {
    if (byIndex.has(idx) && !validIndices.includes(idx)) validIndices.push(idx);
  }
  const citations = validIndices.map((idx) => byIndex.get(idx) as Citation);

  return {
    answer: parsed.answer,
    citations,
    grounded: citations.length > 0,
  };
}

async function callModel(
  model: Parameters<typeof generateText>[0]["model"],
  query: string,
  context: string,
  options: GenerateOptions,
) {
  const prompt = buildPrompt(query, context);
  try {
    const result = await generateText({
      model,
      prompt,
      temperature: options.temperature ?? 0.3,
      output: Output.object({ schema: GeneratedAnswerSchema }),
    });
    return result.output;
  } catch (error) {
    // The AI SDK can surface valid JSON inside the parse error — salvage it
    // (mirrors the diet planner's graceful recovery).
    if (NoObjectGeneratedError.isInstance(error)) {
      const text = (error as { text?: string }).text ?? "";
      if (text) {
        try {
          return GeneratedAnswerSchema.parse(JSON.parse(text));
        } catch {
          /* fall through and rethrow */
        }
      }
    }
    throw error;
  }
}

export function buildPrompt(query: string, context: string): string {
  return `You are VeriFy's product research assistant. Answer the user's question using ONLY the provided sources.

SOURCES
${context}

QUESTION
${query}

RULES
- Answer only from the sources above. Do NOT use any outside knowledge.
- Cite every factual claim with its source number in square brackets, e.g. [1] or [1][2].
- If the sources do not contain enough information, say you could not find supporting sources for that claim.
- Never invent sources, URLs, or facts. Only cite numbers that exist in SOURCES.
- Keep the answer concise (3–6 sentences) and factual.
Return JSON matching: { "answer": string, "citations": number[] }.`;
}
