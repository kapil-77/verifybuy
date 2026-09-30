/**
 * Shared fixtures for RAG unit tests. Not a test file itself — the Node test
 * runner only executes files matching `*.test.*` / `test-*` patterns.
 */
import type { DocumentChunk, SourceDocument } from "./types.ts";
import type { CatalogProduct } from "./sources.ts";

export function makeSource(
  overrides: Partial<SourceDocument> & { id: string; text: string },
): SourceDocument {
  return {
    title: `Source ${overrides.id}`,
    sourceUrl: `https://example.com/${overrides.id}`,
    sourceType: "product",
    metadata: {},
    ...overrides,
  };
}

export function makeChunk(
  overrides: Partial<DocumentChunk> & { id: string; text: string },
): DocumentChunk {
  return {
    docId: overrides.id.split("::")[0],
    order: 0,
    sourceUrl: `https://example.com/${overrides.id}`,
    sourceTitle: `Source ${overrides.id}`,
    sourceType: "product",
    metadata: {},
    ...overrides,
  };
}

export function makeCatalogProduct(
  overrides: Partial<CatalogProduct> & { id: string },
): CatalogProduct {
  return {
    title: `Product ${overrides.id}`,
    website: "Amazon",
    brandId: "brand-test",
    categoryId: "cat-test",
    brandName: "Test Brand",
    categoryName: "Test Category",
    rating: 4.5,
    reviews: 1200,
    price: 40,
    originalPrice: 50,
    delivery: "Free • 2 days",
    servingSize: "30g",
    ingredients: ["Whey Protein Isolate"],
    pros: ["Good value"],
    cons: ["None"],
    bestFor: "General use",
    warnings: "None",
    country: "USA",
    manufacturer: "Test Inc",
    labTested: true,
    verified: true,
    certificationIds: [],
    nutrition: { protein: 25, carbs: 2, fat: 1, fiber: 0, sugar: 0, calories: 120 },
    dietaryInfo: { vegetarian: true, vegan: false, glutenFree: true, lactoseFree: false },
    ingredientFlags: {
      containsArtificialSweetener: false,
      containsSoy: false,
      containsGluten: false,
      containsLactose: false,
      containsSugarAlcohol: false,
    },
    highlights: ["25g Protein"],
    aiSummary: "A solid product.",
    ...overrides,
  };
}
