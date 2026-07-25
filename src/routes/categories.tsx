import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { products, getCategoryName } from "@/lib/data";

export const Route = createFileRoute("/categories")({ component: CategoriesPage });

function CategoriesPage() {
  const [active, setActive] = useState<string | "All">("All");
  const allCategories = Array.from(new Set(products.map((p) => getCategoryName(p.categoryId))));
  const filtered = active === "All" ? products : products.filter((p) => getCategoryName(p.categoryId) === active);

  return (
    <div className="mx-auto max-w-7xl px-6 py-14">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">Categories</h1>
        <p className="mt-2 text-text-secondary">Browse verified products across every category and merchant.</p>
      </div>

      <div className="mt-12 flex items-center gap-2 flex-wrap">
        {["All", ...allCategories].map((c) => (
          <button
            key={c}
            onClick={() => setActive(c as any)}
            className={`h-9 rounded-full px-4 text-sm border transition ${active === c ? "bg-[#2A5580] text-white border-[#2A5580]" : "bg-[#2A5580] text-white/85 border-[#2A5580]/60 hover:bg-[#2A5580]/90 hover:text-white"}`}
          >{c}</button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
      </div>
    </div>
  );
}