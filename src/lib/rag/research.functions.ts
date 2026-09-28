/**
 * VeriFy's RAG research API — server functions.
 *
 * Mirrors the existing AI server-function pattern (`src/lib/diet.functions.ts`)
 * so the research pipeline slots into the current architecture without any UI
 * change. These handlers run server-side only: API keys never reach the
 * client bundle.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getCatalogSourceDocuments } from "./catalog.ts";
import { researchProduct, runResearchQuery } from "./pipeline.ts";
import type { ResearchAnswer } from "./types.ts";

const ProductResearchInput = z.object({
  productId: z.string().min(1).max(80),
});

const QueryResearchInput = z.object({
  query: z.string().min(3).max(500),
  filter: z
    .object({
      productId: z.string().max(80).optional(),
      categoryId: z.string().max(80).optional(),
      sourceType: z.enum(["product", "merchant", "certification"]).optional(),
    })
    .optional(),
});

/**
 * Generate a source-grounded research summary + citations for a single
 * product (by id, e.g. "p7").
 */
export const researchProductSummary = createServerFn({ method: "POST" })
  .validator((input: unknown) => ProductResearchInput.parse(input))
  .handler(async ({ data }): Promise<ResearchAnswer> =>
    researchProduct(data.productId, { sources: getCatalogSourceDocuments() }),
  );

/**
 * Ask an arbitrary research question over the product/review corpus, with
 * optional metadata filtering (product, category, source type).
 */
export const answerResearchQuery = createServerFn({ method: "POST" })
  .validator((input: unknown) => QueryResearchInput.parse(input))
  .handler(async ({ data }): Promise<ResearchAnswer> =>
    runResearchQuery(
      { query: data.query, filter: data.filter ?? undefined },
      { sources: getCatalogSourceDocuments() },
    ),
  );
