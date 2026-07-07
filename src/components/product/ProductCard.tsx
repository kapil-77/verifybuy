import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Star, Heart, Scale, ShoppingBag, Share2, Eye, BadgeCheck } from "lucide-react";
import type { Product } from "@/lib/data";
import { useApp, formatPrice } from "@/lib/store";
import { toast } from "sonner";

export function ProductCard({ p, index = 0 }: { p: Product; index?: number }) {
  const { currency, compare, toggleCompare, wishlist, toggleWishlist, addCoins, addPoints } = useApp();
  const inCompare = compare.includes(p.id);
  const inWishlist = wishlist.includes(p.id);
  const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
  const savings = p.originalPrice - p.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      whileHover={{ y: -4 }}
      className="group card-soft overflow-hidden flex flex-col"
    >
      <div className="relative aspect-square bg-muted overflow-hidden">
        <img
          src={p.image}
          alt={p.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="inline-flex items-center rounded-full bg-danger px-2 py-0.5 text-xs font-medium text-white">
              -{discount}%
            </span>
          )}
          {p.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-success">
              <BadgeCheck className="h-3 w-3" /> Verified
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => toggleWishlist(p.id)}
            aria-label="Wishlist"
            className="grid h-8 w-8 place-items-center rounded-full bg-white shadow-soft hover:bg-muted"
          >
            <Heart className={`h-3.5 w-3.5 ${inWishlist ? "fill-danger text-danger" : "text-text-secondary"}`} />
          </button>
          <button aria-label="Share" className="grid h-8 w-8 place-items-center rounded-full bg-white shadow-soft hover:bg-muted">
            <Share2 className="h-3.5 w-3.5 text-text-secondary" />
          </button>
          <Link to="/product/$slug" params={{ slug: p.slug }} aria-label="Quick view" className="grid h-8 w-8 place-items-center rounded-full bg-white shadow-soft hover:bg-muted">
            <Eye className="h-3.5 w-3.5 text-text-secondary" />
          </Link>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="text-xs text-text-muted uppercase tracking-wide">{p.brand}</div>
        <Link to="/product/$slug" params={{ slug: p.slug }} className="mt-1 font-medium text-[15px] leading-snug line-clamp-2 hover:text-primary transition">
          {p.title}
        </Link>

        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
          <span className="font-medium">{p.rating}</span>
          <span className="text-text-muted">({p.reviews.toLocaleString()})</span>
          <span className="ml-auto text-text-muted">{p.website}</span>
        </div>

        <div className="mt-3 flex items-end gap-2">
          <div className="text-xl font-semibold tracking-tight">{formatPrice(p.price, currency)}</div>
          <div className="text-sm text-text-muted line-through mb-0.5">{formatPrice(p.originalPrice, currency)}</div>
        </div>
        <div className="text-xs text-success mt-0.5">Save {formatPrice(savings, currency)} · {p.delivery}</div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              toggleCompare(p.id);
              toast(inCompare ? "Removed from compare" : "Added to compare");
            }}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border text-xs font-medium transition ${
              inCompare
                ? "bg-primary text-white border-primary"
                : "border-border bg-white hover:border-primary/40 hover:text-primary"
            }`}
          >
            <Scale className="h-3.5 w-3.5" />
            {inCompare ? "Added" : "Compare"}
          </button>
          <button
            onClick={() => {
              addCoins(10, `Buy Now · ${p.title}`);
              setTimeout(() => addPoints(100, `Confirmed purchase · ${p.title}`), 1200);
              toast.success("+10 coins credited · redirecting to " + p.website);
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg gradient-primary text-white text-xs font-medium shadow-soft hover:shadow-glow transition"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Buy Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}
