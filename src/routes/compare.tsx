import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";
import { X, Plus, BadgeCheck, Star, Sparkles, Check, Minus } from "lucide-react";
import { products, getBrandName, type Product } from "@/lib/data";
import { useApp, formatPrice } from "@/lib/store";
import { ProductImage } from "@/components/ui/ProductImage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/compare")({ component: ComparePage });

type Row = {
  label: string;
  render: (p: Product) => ReactNode;
  compare?: "min" | "max";
  numeric?: (p: Product) => number;
};

function ComparePage() {
  const { compare, toggleCompare, clearCompare, currency } = useApp();
  const selected = useMemo(() => products.filter((p) => compare.includes(p.id)), [compare]);
  const available = products.filter((p) => !compare.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-6 py-14 pb-32">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Compare Products</h1>
          <p className="mt-2 text-text-secondary">
            Side-by-side with ingredients, nutrition and authenticity details.
          </p>
        </div>
        {selected.length > 0 && (
          <button onClick={clearCompare} className="text-sm text-text-secondary hover:text-danger transition">
            Clear all
          </button>
        )}
      </header>

      {selected.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="mt-10 space-y-8">
          <ProductHeaderRow selected={selected} onRemove={toggleCompare} />

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="proscons">Pros & Cons</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <CompareTable
                selected={selected}
                rows={[
                  { label: "Price", render: (p) => formatPrice(p.price, currency), compare: "min", numeric: (p) => p.price },
                  { label: "Website", render: (p) => p.website },
                  {
                    label: "Rating",
                    render: (p) => (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" /> {p.rating}
                      </span>
                    ),
                    compare: "max",
                    numeric: (p) => p.rating,
                  },
                  { label: "Serving Size", render: (p) => p.servingSize },
                  { label: "Best For", render: (p) => p.bestFor },
                  { label: "Country", render: (p) => p.country },
                  { label: "Manufacturer", render: (p) => p.manufacturer },
                  {
                    label: "Lab Tested",
                    render: (p) =>
                      p.labTested ? (
                        <span className="inline-flex items-center gap-1 text-success">
                          <BadgeCheck className="h-4 w-4" /> Yes
                        </span>
                      ) : (
                        <span className="text-text-muted">No</span>
                      ),
                  },
                  {
                    label: "Certifications",
                    render: (p) => (
                      <div className="flex flex-wrap gap-1">
                        {p.certificationIds.map((c) => (
                          <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{c}</span>
                        ))}
                      </div>
                    ),
                  },
                ]}
              />
            </TabsContent>

            <TabsContent value="ingredients" className="mt-6">
              <IngredientsMatrix selected={selected} />
            </TabsContent>

            <TabsContent value="proscons" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {selected.map((p) => (
                  <div key={p.id} className="card-soft p-5">
                    <div className="text-xs uppercase text-text-muted">{getBrandName(p.brandId)}</div>
                    <div className="font-medium leading-snug">{p.title}</div>

                    <div className="mt-4">
                      <div className="text-xs font-semibold text-success">PROS</div>
                      <ul className="mt-2 space-y-1.5 text-sm text-text-secondary">
                        {p.pros.map((x) => (
                          <li key={x} className="flex gap-2">
                            <Check className="h-4 w-4 text-success shrink-0 mt-0.5" /> {x}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs font-semibold text-danger">CONS</div>
                      <ul className="mt-2 space-y-1.5 text-sm text-text-secondary">
                        {p.cons.map((x) => (
                          <li key={x} className="flex gap-2">
                            <Minus className="h-4 w-4 text-danger shrink-0 mt-0.5" /> {x}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {p.warnings && (
                      <p className="mt-4 rounded-lg bg-warning/10 p-2 text-xs text-warning">
                        ⚠ {p.warnings}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="nutrition" className="mt-6">
              <CompareTable
                selected={selected}
                rows={[
                  { label: "Calories", render: (p) => p.nutrition.calories, compare: "min", numeric: (p) => p.nutrition.calories },
                  { label: "Protein", render: (p) => `${p.nutrition.protein}g`, compare: "max", numeric: (p) => p.nutrition.protein },
                  { label: "Carbs", render: (p) => `${p.nutrition.carbs}g`, compare: "min", numeric: (p) => p.nutrition.carbs },
                  { label: "Sugar", render: (p) => `${p.nutrition.sugar}g`, compare: "min", numeric: (p) => p.nutrition.sugar },
                  { label: "Fat", render: (p) => `${p.nutrition.fat}g`, compare: "min", numeric: (p) => p.nutrition.fat },
                  { label: "Fiber", render: (p) => `${p.nutrition.fiber}g`, compare: "max", numeric: (p) => p.nutrition.fiber },
                ]}
              />
            </TabsContent>
          </Tabs>
        </section>
      )}

      {selected.length > 0 && available.length > 0 && (
        <section className="mt-12">
          <h3 className="text-lg font-semibold">Add more to compare</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {available.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => toggleCompare(p.id)}
                className="card-soft p-3 text-left transition hover:border-primary/40"
              >
                <ProductImage src={p.image} alt={p.title} className="h-24 w-full rounded-md" />
                <div className="mt-2 text-xs text-text-muted">{getBrandName(p.brandId)}</div>
                <div className="text-sm font-medium line-clamp-2">{p.title}</div>
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
                  <Plus className="h-3 w-3" /> Add
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 card-soft p-12 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Nothing to compare yet</h3>
      <p className="mt-1 text-sm text-text-secondary">
        Add products from any card. Compare up to 4 at once.
      </p>
      <Link
        to="/categories"
        className="mt-6 inline-flex h-10 items-center rounded-full gradient-primary px-6 text-sm font-medium text-white"
      >
        Browse products
      </Link>
    </div>
  );
}

function ProductHeaderRow({
  selected,
  onRemove,
}: {
  selected: Product[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {selected.map((p) => (
        <div key={p.id} className="card-soft relative p-4">
          <button
            onClick={() => onRemove(p.id)}
            aria-label="Remove"
            className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-muted hover:bg-danger hover:text-white transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <ProductImage src={p.image} alt={p.title} className="h-28 w-full rounded-lg" />
          <div className="mt-3 text-[11px] uppercase text-text-muted">{getBrandName(p.brandId)}</div>
          <div className="font-medium leading-snug line-clamp-2">{p.title}</div>
        </div>
      ))}
    </div>
  );
}

function CompareTable({ selected, rows }: { selected: Product[]; rows: Row[] }) {
  return (
    <div className="card-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="w-48 p-4 text-left font-medium text-text-muted">Attribute</th>
              {selected.map((p) => (
                <th key={p.id} className="min-w-[200px] p-4 text-left text-xs font-medium text-text-secondary">
                  {getBrandName(p.brandId)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const best = bestIndex(row, selected);
              return (
                <tr key={row.label} className="border-t border-border hover:bg-muted/30">
                  <td className="p-4 font-medium text-text-secondary">{row.label}</td>
                  {selected.map((p, i) => (
                    <td key={p.id} className={`p-4 align-top ${i === best ? "bg-success/5" : ""}`}>
                      <div className="flex items-start gap-2">
                        <span>{row.render(p)}</span>
                        {i === best && (
                          <span className="mt-0.5 rounded-full bg-success/15 px-1.5 text-[10px] font-medium text-success">
                            Best
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function bestIndex(row: Row, selected: Product[]): number {
  if (!row.compare || !row.numeric) return -1;
  const values = selected.map(row.numeric);
  const target = row.compare === "min" ? Math.min(...values) : Math.max(...values);
  return values.indexOf(target);
}

function IngredientsMatrix({ selected }: { selected: Product[] }) {
  const all = Array.from(new Set(selected.flatMap((p) => p.ingredients))).sort();

  return (
    <div className="card-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="p-4 text-left font-medium text-text-muted">Ingredient</th>
              {selected.map((p) => (
                <th key={p.id} className="min-w-[160px] p-4 text-left text-xs font-medium text-text-secondary">
                  {getBrandName(p.brandId)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {all.map((ing) => (
              <tr key={ing} className="border-t border-border hover:bg-muted/30">
                <td className="p-3 pl-4 text-text-secondary">{ing}</td>
                {selected.map((p) => (
                  <td key={p.id} className="p-3">
                    {p.ingredients.includes(ing) ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Minus className="h-4 w-4 text-text-muted/40" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
