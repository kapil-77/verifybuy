import { Link, useRouterState } from "@tanstack/react-router";
import { Scale, ArrowRight, X } from "lucide-react";
import { products } from "@/lib/data";
import { useApp } from "@/lib/store";
import { ProductImage } from "@/components/ui/ProductImage";

export function CompareBar() {
  const { compare, toggleCompare, clearCompare } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (compare.length === 0 || pathname === "/compare") return null;

  const items = products.filter((p) => compare.includes(p.id));

  return (
    <div className="fixed bottom-6 left-1/2 z-40 w-[min(680px,calc(100%-2rem))] -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-white/95 p-3 shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-2">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Scale className="h-5 w-5" />
        </div>

        <div className="flex -space-x-2">
          {items.map((p) => (
            <div key={p.id} className="relative group">
              <ProductImage
                src={p.image}
                alt={p.title}
                className="h-10 w-10 rounded-lg border-2 border-white"
              />
              <button
                onClick={() => toggleCompare(p.id)}
                aria-label={`Remove ${p.title}`}
                className="absolute -top-1.5 -right-1.5 grid h-4 w-4 place-items-center rounded-full bg-foreground text-white opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="ml-1 text-text-muted sm:block">
          <div className="text-sm font-medium">
            {compare.length} selected
          </div>
          <div className="text-xs text-text-muted">
            {compare.length < 2 ? "Add one more to compare" : "Ready to compare"}
          </div>
        </div>

        <button
          onClick={clearCompare}
          className="ml-auto text-xs text-text-muted hover:text-danger transition"
        >
          Clear
        </button>

        <Link
          to="/compare"
          className={`inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-white transition ${
            compare.length < 2
              ? "bg-muted-foreground/40 pointer-events-none"
              : "gradient-primary hover:brightness-110"
          }`}
        >
          Compare
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
