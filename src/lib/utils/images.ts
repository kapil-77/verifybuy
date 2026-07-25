const PLACEHOLDER = "/images/placeholder.svg";

export const imageFolders = {
  brands: "/images/brands/",
  products: "/images/products/",
  certifications: "/images/certifications/",
};

export function buildProductImage(brandSlug: string, productSlug: string): string {
  return `${imageFolders.products}${brandSlug}/${productSlug}.webp`;
}

export function buildBrandLogo(brandSlug: string): string {
  return `${imageFolders.brands}${brandSlug}.webp`;
}

export function buildCertificationLogo(slug: string): string {
  return `${imageFolders.certifications}${slug}.webp`;
}

export function getProductImage(imagePath: string | undefined | null): string {
  if (!imagePath || typeof imagePath !== "string" || imagePath.trim() === "") {
    return PLACEHOLDER;
  }
  return imagePath;
}

export function isValidImagePath(path: string | undefined | null): boolean {
  if (!path) return false;
  return path.startsWith("/images/") && path.endsWith(".webp");
}

export function getFallbackImage(): string {
  return PLACEHOLDER;
}