import { createFileRoute, Link } from "@tanstack/react-router";
import { X, Plus, BadgeCheck, Star, Sparkles } from "lucide-react";
import { products } from "@/lib/data";
import { useApp, formatPrice } from "@/lib/store";
import { useMemo } from "react";

export const Route = createFileRoute("/compare")({ component: ComparePage });

function ComparePage() {
  const { compare, toggleCompare, clearCompare, currency } = useApp();
  const selected = useMemo(() => products.filter((p) => compare.includes(p.id)), [compare]);
  const available = products.filter((p) => !compare.includes(p.id));

  const rows: { label: string; get: (p: typeof products[0]) => React.ReactNode; highlight?: "min" | "max" }[] = [
    { label: "Price", get: (p) => formatPrice(p.price, currency), highlight: "min" },
    { label: "Website", get: (p) => p.website },
    { label: "Rating", get: (p) => <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-warning text-warning" /> {p.rating}</span>, highlight: "max" },
    { label: "Serving Size", get: (p) => p.servingSize },
    { label: "Protein", get: (p) => `${p.protein}g`, highlight: "max" },
    { label: "Carbs", get: (p) => `${p.carbs}g` },
    { label: "Fat", get: (p) => `${p.fat}g` },
    { label: "Fiber", get: (p) => `${p.fiber}g` },
    { label: "Sugar", get: (p) => `${p.sugar}g`, highlight: "min" },
    { label: "Calories", get: (p) => p.calories },
    { label: "Ingredients", get: (p) => <div className="text-xs text-text-secondary">{p.ingredients.slice(0, 4).join(", ")}</div> },
    { label: "Country", get: (p) => p.country },
    { label: "Manufacturer", get: (p) => <span className="text-xs">{p.manufacturer}</span> },
    { label: "Lab Tested", get: (p) => p.labTested ? <span className="inline-flex items-center gap-1 text-success"><BadgeCheck className="h-4 w-4" /> Yes</span> : "No" },
    { label: "Certifications", get: (p) => <div className="flex flex-wrap gap-1">{p.certifications.map((c) => <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{c}</span>)}</div> },
    { label: "Best For", get: (p) => <span className="text-xs">{p.bestFor}</span> },
    { label: "Pros", get: (p) => <ul className="text-xs text-text-secondary space-y-0.5">{p.pros.map((x) => <li key={x}>• {x}</li>)}</ul> },
    { label: "Cons", get: (p) => <ul className="text-xs text-text-secondary space-y-0.5">{p.cons.map((x) => <li key={x}>• {x}</li>)}</ul> },
    { label: "Warnings", get: (p) => <span className="text-xs text-warning">{p.warnings}</span> },
  ];

  function highlightFor(row: typeof rows[number], values: (string | number)[]): (v: string | number) => boolean {
    if (!row.highlight) return () => false;
    const nums = values.map((v) => parseFloat(String(v).replace(/[^0-9.-]/g, "")));
    if (nums.some(isNaN)) return () => false;
    const target = row.highlight === "min" ? Math.min(...nums) : Math.max(...nums);
    return (v) => parseFloat(String(v).replace(/[^0-9.-]/g, "")) === target;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-14">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Compare Products</h1>
          <p className="mt-2 text-text-secondary">Side-by-side comparison with ingredient, nutrition and authenticity details.</p>
        </div>
        {selected.length > 0 && (
          <button onClick={clearCompare} className="text-sm text-text-secondary hover:text-danger transition">Clear all</button>
        )}
      </div>

      {selected.length === 0 ? (
        <div className="mt-10 card-soft p-12 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary"><Sparkles className="h-6 w-6" /></div>
          <h3 className="mt-4 text-lg font-semibold">Nothing to compare yet</h3>
          <p className="mt-1 text-text-secondary text-sm">Add products from any card's Compare button. Compare up to 4 at once.</p>
          <Link to="/categories" className="mt-6 inline-flex h-10 items-center rounded-full gradient-primary px-6 text-sm font-medium text-white">Browse products</Link>
        </div>
      ) : (
        <div className="mt-10 card-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white border-b border-border z-10">
                <tr>
                  <th className="text-left p-4 w-48 text-text-muted font-medium">Attribute</th>
                  {selected.map((p) => (
                    <th key={p.id} className="p-4 min-w-[240px] text-left align-top">
                      <div className="relative">
                        <button onClick={() => toggleCompare(p.id)} className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-muted hover:bg-danger hover:text-white transition"><X className="h-3 w-3" /></button>
                        <img src={p.image} alt="" className="h-24 w-24 rounded-lg object-cover" />
                        <div className="mt-2 text-xs text-text-muted uppercase">{p.brand}</div>
                        <div className="font-medium leading-snug">{p.title}</div>
                      </div>
                    </th>
                  ))}
                  {selected.length < 4 && (
                    <th className="p-4 min-w-[200px] align-top">
                      <div className="grid h-24 w-24 place-items-center rounded-lg border-2 border-dashed border-border text-text-muted"><Plus /></div>
                      <div className="mt-2 text-xs text-text-muted">Add up to {4 - selected.length} more</div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const values = selected.map((p) => row.get(p) as any);
                  const check = highlightFor(row, values as any);
                  return (
                    <tr key={row.label} className="border-t border-border hover:bg-muted/40">
                      <td className="p-4 text-text-secondary font-medium">{row.label}</td>
                      {values.map((v, i) => {
                        const isBest = check(v);
                        return (
                          <td key={i} className={`p-4 align-top ${isBest ? "bg-success/5" : ""}`}>
                            <div className="flex items-start gap-2">
                              <span>{v}</span>
                              {isBest && <span className="mt-0.5 rounded-full bg-success/15 px-1.5 text-[10px] font-medium text-success">Best</span>}
                            </div>
                          </td>
                        );
                      })}
                      {selected.length < 4 && <td />}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected.length > 0 && available.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-semibold">Add more to compare</h3>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {available.slice(0, 4).map((p) => (
              <button key={p.id} onClick={() => toggleCompare(p.id)} className="card-soft p-3 text-left hover:border-primary/40 transition">
                <img src={p.image} alt="" className="h-24 w-full rounded-md object-cover" />
                <div className="mt-2 text-xs text-text-muted">{p.brand}</div>
                <div className="text-sm font-medium line-clamp-2">{p.title}</div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary"><Plus className="h-3 w-3" /> Add</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
