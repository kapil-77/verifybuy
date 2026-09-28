/**
 * Source ingestion — builds `SourceDocument`s from a product catalog.
 *
 * Pure module: receives the catalog + certification data as arguments, so it
 * can be unit-tested with Node without pulling in app wiring. The
 * `catalog.ts` adapter supplies the real seed catalog server-side.
 *
 * Each product becomes several documents (overview, ingredients/nutrition,
 * ratings/pros-cons, certifications, value) so different research questions
 * retrieve fine-grained, sourceable evidence. Every document carries the
 * product's listing URL and its business metadata (productId, brand,
 * category) end-to-end.
 */
import { cleanText } from "./chunking.ts";
import type { SourceDocument } from "./types.ts";

/** Minimal structural view of a catalog product needed by the source builder. */
export interface CatalogProduct {
  id: string;
  title: string;
  website: string;
  brandId: string;
  categoryId: string;
  brandName: string;
  categoryName: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice: number;
  delivery: string;
  servingSize: string;
  ingredients: string[];
  pros: string[];
  cons: string[];
  bestFor: string;
  warnings: string;
  country: string;
  manufacturer: string;
  labTested: boolean;
  verified: boolean;
  certificationIds: string[];
  nutrition: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    calories: number;
  };
  dietaryInfo: { vegetarian: boolean; vegan: boolean; glutenFree: boolean; lactoseFree: boolean };
  ingredientFlags: Record<string, boolean>;
  highlights: string[];
  aiSummary: string;
}

export interface CatalogCertification {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface BaseDoc {
  title: string;
  sourceUrl: string;
  extractedAt: string;
  metadata: Record<string, string>;
}

/**
 * Deterministic, real, navigable listing URL for a product.
 *
 * The catalog stores a marketplace name (e.g. "Amazon") rather than a deep
 * link, so we derive a store search URL from the store + exact product title.
 * These are genuine URLs where the product can be verified — never invented
 * sources.
 */
export function listingUrlFor(product: CatalogProduct): string {
  const query = encodeURIComponent(product.title);
  switch (storeKey(product.website)) {
    case "amazon":
      return `https://www.amazon.com/s?k=${query}`;
    case "iherb":
      return `https://www.iherb.com/search?kw=${query}`;
    case "healthkart":
      return `https://www.healthkart.com/search?q=${query}`;
    case "flipkart":
      return `https://www.flipkart.com/search?q=${query}`;
    case "myprotein":
      return `https://www.myprotein.com/search/?searchTerms=${query}`;
    case "muscleblaze":
      return `https://www.muscleblaze.com/search?q=${query}`;
    case "nykaa":
      return `https://www.nykaa.com/search/result/?q=${query}`;
    case "gnc":
      return `https://www.gnc.com/search?q=${query}`;
    default:
      return `https://www.google.com/search?q=${encodeURIComponent(`${product.title} ${product.website}`)}`;
  }
}

/** Build the full source corpus for a catalog of products. */
export function buildProductSourceDocuments(
  list: CatalogProduct[],
  certifications: CatalogCertification[],
): SourceDocument[] {
  const docs: SourceDocument[] = [];
  const extractedAt = new Date().toISOString();

  for (const product of list) {
    const base: BaseDoc = {
      title: product.title,
      sourceUrl: listingUrlFor(product),
      extractedAt,
      metadata: {
        productId: product.id,
        brandId: product.brandId,
        categoryId: product.categoryId,
        brandName: product.brandName,
        categoryName: product.categoryName,
      },
    };

    docs.push(buildOverviewDoc(product, base));
    docs.push(buildIngredientsDoc(product, base));
    docs.push(buildRatingsDoc(product, base));
    docs.push(buildValueDoc(product, base));

    for (const certId of product.certificationIds) {
      const certification = certifications.find((cert) => cert.id === certId);
      if (certification) docs.push(buildCertificationDoc(product, certification, base));
    }
  }

  return docs.filter((doc) => cleanText(doc.text).length > 0);
}

function storeKey(website: string): string {
  if (/amazon/i.test(website)) return "amazon";
  if (/iherb/i.test(website)) return "iherb";
  if (/healthkart/i.test(website)) return "healthkart";
  if (/flipkart/i.test(website)) return "flipkart";
  if (/myprotein/i.test(website)) return "myprotein";
  if (/muscleblaze/i.test(website)) return "muscleblaze";
  if (/nykaa/i.test(website)) return "nykaa";
  if (/gnc/i.test(website)) return "gnc";
  return website.toLowerCase();
}

// ─── Document builders ──────────────────────────────────────────────────────

function buildOverviewDoc(product: CatalogProduct, base: BaseDoc): SourceDocument {
  return {
    ...base,
    id: `${product.id}:overview`,
    sourceType: "product",
    text: [
      `${product.title}.`,
      `Best for: ${product.bestFor}.`,
      `Highlights: ${product.highlights.join(", ")}.`,
      product.aiSummary ? product.aiSummary : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

function buildIngredientsDoc(product: CatalogProduct, base: BaseDoc): SourceDocument {
  const flags = Object.entries(product.ingredientFlags)
    .filter(([, value]) => value)
    .map(([key]) => key.replace(/([A-Z])/g, " $1").toLowerCase())
    .join(", ");

  const dietary = [
    product.dietaryInfo.vegetarian ? "vegetarian" : "",
    product.dietaryInfo.vegan ? "vegan" : "",
    product.dietaryInfo.glutenFree ? "gluten-free" : "",
    product.dietaryInfo.lactoseFree ? "lactose-free" : "",
  ]
    .filter(Boolean)
    .join(", ");

  return {
    ...base,
    id: `${product.id}:ingredients`,
    sourceType: "product",
    text: [
      `Ingredients: ${product.ingredients.join(", ")}.`,
      `Nutrition per ${product.servingSize || "serving"}: protein ${product.nutrition.protein}g, carbs ${product.nutrition.carbs}g, fat ${product.nutrition.fat}g, fiber ${product.nutrition.fiber}g, sugar ${product.nutrition.sugar}g, ${product.nutrition.calories} kcal.`,
      dietary ? `Dietary: ${dietary}.` : "",
      flags ? `Ingredient flags: ${flags}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

function buildRatingsDoc(product: CatalogProduct, base: BaseDoc): SourceDocument {
  return {
    ...base,
    id: `${product.id}:ratings`,
    sourceType: "merchant",
    text: [
      `${product.title} is rated ${product.rating} out of 5 from ${product.reviews.toLocaleString()} reviews on ${product.website}.`,
      `Pros: ${product.pros.join("; ")}.`,
      `Cons: ${product.cons.join("; ")}.`,
      product.warnings ? `Warnings: ${product.warnings}.` : "",
      `Best for: ${product.bestFor}.`,
    ]
      .filter(Boolean)
      .join(" "),
  };
}

function buildValueDoc(product: CatalogProduct, base: BaseDoc): SourceDocument {
  return {
    ...base,
    id: `${product.id}:value`,
    sourceType: "merchant",
    text: [
      `Price: $${product.price} (original $${product.originalPrice}) on ${product.website} with ${product.delivery}.`,
      `Country of origin: ${product.country}.`,
      `Manufacturer: ${product.manufacturer}.`,
      `Lab tested: ${product.labTested ? "yes" : "no"}.`,
      `Verified authentic: ${product.verified ? "yes" : "no"}.`,
    ].join(" "),
  };
}

function buildCertificationDoc(
  product: CatalogProduct,
  certification: CatalogCertification,
  base: BaseDoc,
): SourceDocument {
  return {
    ...base,
    id: `${product.id}:certification:${certification.id}`,
    sourceType: "certification",
    text:
      `${product.title} holds the ${certification.name} certification (${certification.category}). ` +
      `${certification.description}`,
  };
}
