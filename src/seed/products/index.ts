import type { Product } from "@/lib/data";
import { supplementProducts } from "./supplements";
import { otherProducts } from "./otherCategories";

export const products: Product[] = [
  ...supplementProducts,
  ...otherProducts,
];
