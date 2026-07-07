import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Star, BadgeCheck, ShieldCheck, Download, FileCheck, ShoppingBag, Heart, Share2 } from "lucide-react";
import { products } from "@/lib/data";
import { useApp, formatPrice } from "@/lib/store";
import { toast } from "sonner";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
  loader: ({ params }) => {
    const p = products.find((x) => x.slug === params.slug);
    if (!p) throw notFound();
    return { product: p };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl p-16 text-center">
      <h1 className="text-3xl font-semibold">Product not found</h1>
      <Link to="/categories" className="mt-6 inline-flex text-primary">Browse products →</Link>
    </div>
  ),
});

function ProductPage() {
  const { product: p } = Route.useLoaderData();
  const { currency, addCoins, addPoints, toggleWishlist, wishlist } = useApp();
  const priceHistory = Array.from({ length: 8 }, (_, i) => ({ m: `W${i + 1}`, price: p.price + (Math.sin(i) * 6) + i * 0.4 }));
  const similar = products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
  const inWish = wishlist.includes(p.id);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="text-xs text-text-muted"><Link to="/" className="hover:text-foreground">Home</Link> / <Link to="/categories" className="hover:text-foreground">{p.category}</Link> / <span className="text-foreground">{p.title}</span></div>

      <div className="mt-6 grid lg:grid-cols-[1fr_360px] gap-10">
        <div>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-soft aspect-square overflow-hidden">
              <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
            </motion.div>
            <div>
              <div className="text-xs uppercase text-text-muted tracking-wide">{p.brand}</div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">{p.title}</h1>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span className="font-medium">{p.rating}</span>
                <span className="text-text-muted">({p.reviews.toLocaleString()} reviews)</span>
                {p.verified && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success"><BadgeCheck className="h-3 w-3" /> Verified</span>}
              </div>

              <div className="mt-6 flex items-end gap-3">
                <div className="text-4xl font-bold tracking-tight">{formatPrice(p.price, currency)}</div>
                <div className="text-lg text-text-muted line-through mb-1">{formatPrice(p.originalPrice, currency)}</div>
                <span className="mb-1.5 rounded-full bg-danger px-2 py-0.5 text-xs text-white font-medium">-{Math.round(((p.originalPrice-p.price)/p.originalPrice)*100)}%</span>
              </div>
              <div className="text-sm text-success mt-1">Save {formatPrice(p.originalPrice - p.price, currency)} · {p.delivery} · via {p.website}</div>

              <div className="mt-6 grid grid-cols-4 gap-2 text-center">
                {[["Protein", `${p.protein}g`], ["Carbs", `${p.carbs}g`], ["Fat", `${p.fat}g`], ["Cals", `${p.calories}`]].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-muted p-3">
                    <div className="text-[10px] text-text-muted uppercase">{k}</div>
                    <div className="mt-1 text-sm font-semibold">{v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2">
                <div className="text-sm"><span className="text-text-muted">Best for:</span> {p.bestFor}</div>
                <div className="text-sm text-warning">{p.warnings}</div>
              </div>
            </div>
          </div>

          <Section title="Ingredients">
            <div className="flex flex-wrap gap-2">
              {p.ingredients.map((i) => <span key={i} className="rounded-full bg-muted px-3 py-1 text-sm">{i}</span>)}
            </div>
          </Section>

          <Section title="Pros & Cons">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card-soft p-5">
                <div className="text-success font-medium text-sm">Pros</div>
                <ul className="mt-2 space-y-1.5 text-sm text-text-secondary">{p.pros.map((x) => <li key={x}>✓ {x}</li>)}</ul>
              </div>
              <div className="card-soft p-5">
                <div className="text-danger font-medium text-sm">Cons</div>
                <ul className="mt-2 space-y-1.5 text-sm text-text-secondary">{p.cons.map((x) => <li key={x}>✗ {x}</li>)}</ul>
              </div>
            </div>
          </Section>

          <Section title="Authenticity & Certifications">
            <div className="card-soft p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-success/15 text-success"><ShieldCheck className="h-5 w-5" /></div>
                <div>
                  <div className="font-medium">Verified Authentic</div>
                  <div className="text-xs text-text-muted">Manufactured by {p.manufacturer} · {p.country}</div>
                </div>
              </div>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {p.certifications.map((c) => (
                  <div key={c} className="flex items-center justify-between rounded-xl border border-border p-3">
                    <div className="flex items-center gap-2 text-sm"><FileCheck className="h-4 w-4 text-primary" /> {c}</div>
                    <button className="text-xs inline-flex items-center gap-1 text-primary hover:underline"><Download className="h-3 w-3" /> Download</button>
                  </div>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Price History">
            <div className="card-soft p-5 h-64">
              <ResponsiveContainer>
                <LineChart data={priceHistory}>
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                  <Tooltip />
                  <Line type="monotone" dataKey="price" stroke="#2563EB" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>

          <Section title="Similar Products">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similar.map((s) => (
                <Link key={s.id} to="/product/$slug" params={{ slug: s.slug }} className="card-soft overflow-hidden hover:-translate-y-0.5 transition">
                  <img src={s.image} className="aspect-square w-full object-cover" alt="" />
                  <div className="p-3">
                    <div className="text-xs text-text-muted">{s.brand}</div>
                    <div className="text-sm font-medium line-clamp-1">{s.title}</div>
                    <div className="mt-1 text-sm font-semibold">{formatPrice(s.price, currency)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        </div>

        {/* Sticky purchase sidebar */}
        <aside>
          <div className="sticky top-24 space-y-4">
            <div className="card-soft p-5">
              <div className="text-xs text-text-muted">Best price on {p.website}</div>
              <div className="mt-1 text-3xl font-semibold">{formatPrice(p.price, currency)}</div>
              <div className="text-xs text-success mt-1">{p.delivery}</div>
              <button
                onClick={() => { addCoins(10, `Buy Now · ${p.title}`); setTimeout(() => addPoints(100, `Confirmed · ${p.title}`), 1200); toast.success("+10 coins credited"); }}
                className="mt-4 w-full h-11 rounded-full gradient-primary text-white text-sm font-medium shadow-glow hover:brightness-110 transition inline-flex items-center justify-center gap-2"
              ><ShoppingBag className="h-4 w-4" /> Buy Now</button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button onClick={() => toggleWishlist(p.id)} className="h-10 rounded-full border border-border text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:border-foreground/30"><Heart className={`h-3.5 w-3.5 ${inWish ? "fill-danger text-danger" : ""}`} /> {inWish ? "Saved" : "Wishlist"}</button>
                <button className="h-10 rounded-full border border-border text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:border-foreground/30"><Share2 className="h-3.5 w-3.5" /> Share</button>
              </div>
            </div>
            <div className="card-soft p-5">
              <div className="text-sm font-medium">Available on</div>
              <div className="mt-3 space-y-2">
                {["Amazon", "iHerb", "HealthKart"].map((w, i) => (
                  <div key={w} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{w}</span>
                    <span className="font-medium">{formatPrice(p.price + i * 2.5, currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold tracking-tight mb-4">{title}</h2>
      {children}
    </section>
  );
}
