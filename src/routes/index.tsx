import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp, BadgeCheck, Zap } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { categories, products } from "@/lib/data";
import { useApp, formatPrice } from "@/lib/store";
import { StarfieldBackground } from "@/components/StarfieldBackground";
import { useState } from "react";
import { toast } from "sonner";


export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { currency } = useApp();
  return (
    <div>
      <Hero />
      <FeaturedCategories />
      <TrendingSection title="Trending Products" items={products.slice(0, 4)} />
      <TrendingSection title="Best Deals" items={products.slice(2, 6)} accent />
      <TrendingSection title="Recently Compared" items={products.slice(1, 5)} />
      <Newsletter />
    </div>
  );
}

function Hero() {
  const { currency } = useApp();
  return (
    <section className="relative overflow-hidden isolate">
      <div className="absolute inset-0 -z-10">
        <StarfieldBackground />
      </div>
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-24 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-16 items-center">
        <div className="glass rounded-3xl border border-border/60 p-8 shadow-elevated">

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-3 py-1.5 text-xs text-text-secondary backdrop-blur">
            <span className="grid h-4 w-4 place-items-center rounded-full bg-success text-white"><BadgeCheck className="h-3 w-3" /></span>
            Verified by 25,000+ shoppers
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-5 text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Compare, verify and <span className="text-gradient">buy smarter</span> across every store.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-5 text-lg text-text-secondary max-w-xl">
            One place to compare products from Amazon, iHerb, HealthKart, MuscleBlaze and more —
            with lab reports, ingredient analysis and an AI guide to help you choose.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-8 flex flex-wrap gap-3">
            <Link to="/categories" className="inline-flex items-center gap-2 h-12 rounded-full gradient-primary px-6 text-sm font-medium text-white shadow-glow hover:brightness-110 transition">
              Explore Categories <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/assistant" className="inline-flex items-center gap-2 h-12 rounded-full border border-border bg-white px-6 text-sm font-medium hover:border-foreground/30 transition">
              <Sparkles className="h-4 w-4 text-primary" /> Ask the AI Assistant
            </Link>
          </motion.div>
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-lg">
            {[
              { icon: ShieldCheck, label: "Lab-tested", value: "12K+" },
              { icon: TrendingUp, label: "Products", value: "48K+" },
              { icon: Zap, label: "Avg savings", value: "22%" },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex items-center gap-2 text-text-muted text-xs"><s.icon className="h-3.5 w-3.5" /> {s.label}</div>
                <div className="mt-1 text-2xl font-semibold">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side floating mocks */}
        <div className="relative h-[520px] hidden lg:block">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 right-0 w-72 card-soft p-4"
          >
            <div className="flex items-center gap-3">
              <img src={products[0].image} className="h-14 w-14 rounded-lg object-cover" alt="" />
              <div className="min-w-0">
                <div className="text-xs text-text-muted">{products[0].brand}</div>
                <div className="text-sm font-medium truncate">{products[0].title}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {["Protein", "Sugar", "Cals"].map((k, i) => (
                <div key={k} className="rounded-lg bg-muted p-2">
                  <div className="text-[10px] text-text-muted uppercase">{k}</div>
                  <div className="text-sm font-semibold">{[24, 1, 120][i]}g</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-lg font-semibold">{formatPrice(products[0].price, currency)}</div>
              <span className="text-xs text-success font-medium">Best price</span>
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-8 left-0 w-80 card-soft p-5"
          >
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>Price comparison · Whey Isolate</span>
              <span className="text-success font-medium">Save 22%</span>
            </div>
            <div className="mt-4 space-y-3">
              {products.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-text-muted">{p.website}</div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full gradient-primary" style={{ width: `${(p.price / 60) * 100}%` }} />
                  </div>
                  <div className="w-16 text-right text-sm font-medium">{formatPrice(p.price, currency)}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-40 left-16 w-52 card-soft p-4"
          >
            <div className="flex items-center gap-2 text-xs text-text-secondary"><BadgeCheck className="h-4 w-4 text-success" /> Authenticity verified</div>
            <div className="mt-2 text-sm font-medium">Lab report available</div>
            <div className="mt-3 flex gap-1.5">
              {["FSSAI", "GMP", "ISO"].map((c) => (
                <span key={c} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-text-secondary">{c}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FeaturedCategories() {
  return (
    <section className="mx-auto max-w-7xl px-6">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">Featured Categories</h2>
          <p className="text-text-secondary mt-1">Browse curated categories across every store.</p>
        </div>
        <Link to="/categories" className="hidden md:inline text-sm text-primary hover:underline">View all →</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {categories.slice(0, 14).map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ y: -3 }}
            className="card-soft p-4 text-center cursor-pointer hover:border-primary/40 transition"
          >
            <div className="text-2xl">{c.icon}</div>
            <div className="mt-2 text-sm font-medium">{c.name}</div>
            <div className="text-xs text-text-muted">{c.count} items</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function TrendingSection({ title, items, accent }: { title: string; items: typeof products; accent?: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-6 mt-20">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
          {accent && <p className="text-text-secondary mt-1">Handpicked deals with verified savings.</p>}
        </div>
        <Link to="/categories" className="text-sm text-primary hover:underline">See all →</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {items.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  return (
    <section className="mx-auto max-w-7xl px-6 mt-24">
      <div className="relative overflow-hidden rounded-3xl gradient-primary p-10 md:p-14 text-white">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="max-w-2xl">
          <h3 className="text-3xl md:text-4xl font-semibold tracking-tight">Get the best deals in your inbox.</h3>
          <p className="mt-3 text-white/85">Weekly digest of verified product drops, price alerts and AI picks. No spam.</p>
          <form
            onSubmit={(e) => { e.preventDefault(); if (!email.includes("@")) return toast.error("Enter a valid email"); toast.success("Subscribed 🎉"); setEmail(""); }}
            className="mt-6 flex flex-col sm:flex-row gap-3 max-w-lg"
          >
            <input
              value={email} onChange={(e) => setEmail(e.target.value)}
              type="email" placeholder="you@company.com" aria-label="Email"
              className="flex-1 h-12 rounded-full bg-white/10 border border-white/20 px-5 text-white placeholder-white/60 outline-none focus:bg-white/15"
            />
            <button className="h-12 rounded-full bg-white px-6 text-primary text-sm font-semibold hover:bg-white/90 transition">Subscribe</button>
          </form>
        </div>
      </div>
    </section>
  );
}
