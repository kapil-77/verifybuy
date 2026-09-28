import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildProductSourceDocuments,
  listingUrlFor,
  type CatalogCertification,
  type CatalogProduct,
} from "./sources.ts";
import { makeCatalogProduct } from "./_fixtures.ts";

const certs: CatalogCertification[] = [
  { id: "cert-123", name: "Informed Choice", description: "Batch tested.", category: "Lab" },
];

const p1: CatalogProduct = makeCatalogProduct({
  id: "p7",
  title: "ISO100 Hydrolyzed Whey Protein Isolate 5lb",
  website: "Amazon",
  brandId: "brand-004",
  categoryId: "cat-002",
  brandName: "Dymatize",
  categoryName: "Whey Protein",
  nutrition: { protein: 25, carbs: 1, fat: 0.5, fiber: 0, sugar: 0, calories: 110 },
  ingredientFlags: {
    containsArtificialSweetener: true,
    containsSoy: true,
    containsGluten: false,
    containsLactose: true,
    containsSugarAlcohol: false,
  },
  certificationIds: ["cert-123"],
});

describe("listingUrlFor", () => {
  it("derives a real Amazon search URL from store + title", () => {
    assert.equal(
      listingUrlFor(p1),
      "https://www.amazon.com/s?k=ISO100%20Hydrolyzed%20Whey%20Protein%20Isolate%205lb",
    );
  });

  it("derives store-specific URLs", () => {
    const iherb = makeCatalogProduct({ id: "x1", website: "iHerb", title: "Omega-3 Fish Oil" });
    assert.equal(listingUrlFor(iherb), "https://www.iherb.com/search?kw=Omega-3%20Fish%20Oil");

    const healthkart = makeCatalogProduct({ id: "x2", website: "HealthKart", title: "Whey 1kg" });
    assert.equal(listingUrlFor(healthkart), "https://www.healthkart.com/search?q=Whey%201kg");
  });

  it("falls back to a Google search for unknown stores", () => {
    const unknown = makeCatalogProduct({ id: "x3", website: "SomeMall", title: "Mystery Snack" });
    assert.match(listingUrlFor(unknown), /^https:\/\/www\.google\.com\/search\?q=/);
  });
});

describe("buildProductSourceDocuments", () => {
  it("creates overview, ingredients, ratings, value and certification docs", () => {
    const docs = buildProductSourceDocuments([p1], certs);
    const ids = docs.map((doc) => doc.id).sort();

    assert.ok(ids.includes("p7:overview"));
    assert.ok(ids.includes("p7:ingredients"));
    assert.ok(ids.includes("p7:ratings"));
    assert.ok(ids.includes("p7:value"));
    assert.ok(ids.includes("p7:certification:cert-123"));
  });

  it("preserves sourceUrl + business metadata on every document", () => {
    const docs = buildProductSourceDocuments([p1], certs);
    for (const doc of docs) {
      assert.match(doc.sourceUrl, /^https:\/\//);
      assert.equal(doc.metadata.productId, "p7");
      assert.equal(doc.metadata.brandId, "brand-004");
      assert.equal(doc.metadata.categoryId, "cat-002");
      assert.equal(doc.metadata.brandName, "Dymatize");
      assert.equal(doc.metadata.categoryName, "Whey Protein");
      assert.ok(doc.text.length > 0);
    }
  });

  it("sets meaningful per-document content", () => {
    const docs = buildProductSourceDocuments([p1], certs);
    const ingredients = docs.find((doc) => doc.id === "p7:ingredients")?.text ?? "";
    const ratings = docs.find((doc) => doc.id === "p7:ratings")?.text ?? "";
    const certification = docs.find((doc) => doc.id === "p7:certification:cert-123")?.text ?? "";

    assert.ok(ingredients.includes("Ingredients"));
    assert.ok(ingredients.includes("protein 25g"));
    assert.ok(ingredients.includes("contains artificial sweetener"));
    assert.ok(ratings.includes("rated 4.5 out of 5"));
    assert.ok(ratings.includes("Pros:"));
    assert.ok(certification.includes("Informed Choice"));
  });

  it("returns [] for an empty catalog", () => {
    assert.deepEqual(buildProductSourceDocuments([], certs), []);
  });
});
