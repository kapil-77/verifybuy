/**
 * Server-only adapter that supplies the real VeriFy seed catalog to the RAG
 * source builder. Imported only from server functions (`research.functions.ts`)
 * so it never ships to the client.
 */
import { products, getBrandName, getCategoryName } from "../data";
import { certifications } from "../../seed/certifications";
import { buildProductSourceDocuments, type CatalogProduct } from "./sources.ts";
import type { SourceDocument } from "./types.ts";

let cachedSources: SourceDocument[] | undefined;

/** All source documents derived from the seed catalog (lazy, cached). */
export function getCatalogSourceDocuments(): SourceDocument[] {
  cachedSources ??= buildProductSourceDocuments(toCatalogProducts(), certifications);
  return cachedSources;
}

export { buildProductSourceDocuments } from "./sources.ts";
export type { CatalogProduct } from "./sources.ts";

function toCatalogProducts(): CatalogProduct[] {
  return products.map((product) => ({
    id: product.id,
    title: product.title,
    website: product.website,
    brandId: product.brandId,
    categoryId: product.categoryId,
    brandName: getBrandName(product.brandId),
    categoryName: getCategoryName(product.categoryId),
    rating: product.rating,
    reviews: product.reviews,
    price: product.price,
    originalPrice: product.originalPrice,
    delivery: product.delivery,
    servingSize: product.servingSize,
    ingredients: product.ingredients,
    pros: product.pros,
    cons: product.cons,
    bestFor: product.bestFor,
    warnings: product.warnings,
    country: product.country,
    manufacturer: product.manufacturer,
    labTested: product.labTested,
    verified: product.verified,
    certificationIds: product.certificationIds,
    nutrition: product.nutrition,
    dietaryInfo: product.dietaryInfo,
    ingredientFlags: product.ingredientFlags,
    highlights: product.highlights,
    aiSummary: product.aiSummary,
  }));
}
