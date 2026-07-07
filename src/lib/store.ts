import { create } from "zustand";
import { persist } from "zustand/middleware";
import { currencies, type CurrencyCode } from "./data";

type AppState = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  coins: number;
  points: number;
  history: { id: string; label: string; type: "coin" | "point"; amount: number; at: number }[];
  compare: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  addCoins: (n: number, label: string) => void;
  addPoints: (n: number, label: string) => void;
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      currency: "USD",
      setCurrency: (currency) => set({ currency }),
      coins: 40,
      points: 180,
      history: [
        { id: "h1", label: "Welcome bonus", type: "coin", amount: 40, at: Date.now() - 86400000 },
        { id: "h2", label: "First purchase", type: "point", amount: 100, at: Date.now() - 43200000 },
        { id: "h3", label: "Referred a friend", type: "point", amount: 80, at: Date.now() - 3600000 },
      ],
      compare: [],
      toggleCompare: (id) =>
        set((s) => ({
          compare: s.compare.includes(id)
            ? s.compare.filter((x) => x !== id)
            : s.compare.length >= 4 ? s.compare : [...s.compare, id],
        })),
      clearCompare: () => set({ compare: [] }),
      wishlist: [],
      toggleWishlist: (id) =>
        set((s) => ({
          wishlist: s.wishlist.includes(id) ? s.wishlist.filter((x) => x !== id) : [...s.wishlist, id],
        })),
      addCoins: (n, label) =>
        set((s) => ({
          coins: s.coins + n,
          history: [{ id: crypto.randomUUID(), label, type: "coin", amount: n, at: Date.now() }, ...s.history],
        })),
      addPoints: (n, label) =>
        set((s) => ({
          points: s.points + n,
          history: [{ id: crypto.randomUUID(), label, type: "point", amount: n, at: Date.now() }, ...s.history],
        })),
    }),
    { name: "compareprime-app" },
  ),
);

export function formatPrice(usd: number, code: CurrencyCode) {
  const c = currencies.find((x) => x.code === code)!;
  const value = usd * c.rate;
  const formatted = value.toLocaleString(undefined, {
    maximumFractionDigits: value >= 100 ? 0 : 2,
  });
  return `${c.symbol}${formatted}`;
}
