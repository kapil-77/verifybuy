import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { categories, products } from "@/lib/data";

export const Route = createFileRoute("/categories")({ component: CategoriesPage });

function CategoriesPage() {
  const [active, setActive] = useState<string | "All">("All");
  const filtered = active === "All" ? products : products.filter((p) => p.category === active);

  return (
    <div className="mx-auto max-w-7xl px-6 py-14">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">Categories</h1>
        <p className="mt-2 text-text-secondary">Browse verified products across every category and merchant.</p>
      </div>

      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {categories.map((c, i) => (
          <motion.button
            key={c.name}
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: i * 0.02 }}
            onClick={() => setActive(c.name)}
            className={`card-soft p-4 text-center transition hover:-translate-y-0.5 ${active === c.name ? "border-primary ring-2 ring-primary/15" : ""}`}
          >
            <div className="text-2xl">{c.icon}</div>
            <div className="mt-2 text-sm font-medium">{c.name}</div>
            <div className="text-xs text-text-muted">{c.count} items</div>
          </motion.button>
        ))}
      </div>

      <div className="mt-12 flex items-center gap-2 flex-wrap">
        {["All", ...Array.from(new Set(products.map((p) => p.category)))].map((c) => (
          <button
            key={c}
            onClick={() => setActive(c as any)}
            className={`h-9 rounded-full px-4 text-sm border transition ${active === c ? "bg-foreground text-background border-foreground" : "bg-white border-border hover:border-foreground/30"}`}
          >{c}</button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
      </div>
    </div>
  );
}
