import { brands, type Brand } from "@/seed/brands";
import { categories, type Category } from "@/seed/categories";
import { certifications, type Certification } from "@/seed/certifications";
import { products as seedProducts } from "@/seed/products";

export type { Brand, Category, Certification };
export { brands } from "@/seed/brands";
export { categories } from "@/seed/categories";
export { certifications } from "@/seed/certifications";

export type BuyLinks = {
  amazon?: string;
  flipkart?: string;
  healthkart?: string;
  muscleblaze?: string;
  nykaa?: string;
  iherb?: string;
};

export type Nutrition = {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  calories: number;
};

export type DietaryInfo = {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  lactoseFree: boolean;
};

export type IngredientFlags = {
  containsArtificialSweetener: boolean;
  containsSoy: boolean;
  containsGluten: boolean;
  containsLactose: boolean;
  containsSugarAlcohol: boolean;
};

export type Product = {
  id: string;
  slug: string;
  brandId: string;
  categoryId: string;
  subcategoryId?: string;
  title: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice: number;
  website: string;
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
  certificationIds: string[];
  verified: boolean;
  buyLinks: BuyLinks;
  nutrition: Nutrition;
  healthScore: number;
  cleanLabelScore: number;
  valueScore: number;
  dietaryInfo: DietaryInfo;
  ingredientFlags: IngredientFlags;
  highlights: string[];
  aiSummary: string;
};

// ─── Lookup helpers ───
const brandMap = new Map<string, Brand>(brands.map((b) => [b.id, b]));
const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
const certificationMap = new Map<string, Certification>(certifications.map((c) => [c.id, c]));

export function getBrand(id: string): Brand | undefined {
  return brandMap.get(id);
}

export function getBrandName(id: string): string {
  return brandMap.get(id)?.name ?? id;
}

export function getBrandLogo(id: string): string | undefined {
  return brandMap.get(id)?.logo;
}

export function getCategory(id: string): Category | undefined {
  return categoryMap.get(id);
}

export function getCategoryName(id: string): string {
  return categoryMap.get(id)?.name ?? id;
}

export function getCategoryIcon(id: string): string | undefined {
  return categoryMap.get(id)?.icon;
}

export function getCertification(id: string): Certification | undefined {
  return certificationMap.get(id);
}

export function getCertificationName(id: string): string {
  return certificationMap.get(id)?.name ?? id;
}

// ─── Convenience: root categories (no parent) ───
export function getRootCategories(): Category[] {
  return categories.filter((c) => !c.parent);
}

// ─── Convenience: subcategories by parent name ───
export function getSubcategories(parentName: string): Category[] {
  return categories.filter((c) => c.parent === parentName);
}

// ─── Products (imported from seed data) ───
export const products: Product[] = seedProducts;

// ─── Currencies ───
export const currencies = [
  { code: "INR", symbol: "₹", rate: 90.2 },
  { code: "USD", symbol: "$", rate: 1 },
  { code: "EUR", symbol: "€", rate: 0.92 },
  { code: "GBP", symbol: "£", rate: 0.79 },
  { code: "AED", symbol: "د.إ", rate: 3.67 },
  { code: "CAD", symbol: "C$", rate: 1.37 },
  { code: "AUD", symbol: "A$", rate: 1.52 },
  { code: "JPY", symbol: "¥", rate: 156 },
] as const;

export type CurrencyCode = (typeof currencies)[number]["code"];