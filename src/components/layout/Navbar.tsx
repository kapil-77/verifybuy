import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Search, Gift, User, Sparkles, ChevronDown, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { currencies, products } from "@/lib/data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useScrolled } from "@/hooks/useScrolled";
import { useTheme } from "@/hooks/useTheme";

const nav = [
  { to: "/", label: "Home" },
  { to: "/categories", label: "Categories" },
  { to: "/compare", label: "Compare" },
  { to: "/assistant", label: "AI Assistant" },
  { to: "/rewards", label: "Rewards" },
  { to: "/about", label: "About" },
];

export function Navbar() {
  const { currency, setCurrency, points, coins } = useApp();
  const [q, setQ] = useState("");
  const scrolled = useScrolled(80);
  const { theme, toggle } = useTheme();

  const suggestions =
    q.length > 0
      ? products
          .filter((p) =>
            [p.title, p.brand, p.category, ...p.ingredients].some((v) =>
              v.toLowerCase().includes(q.toLowerCase()),
            ),
          )
          .slice(0, 5)
      : [];

  return (
    <header
      className={`sticky top-0 z-50 glass border-b border-border/70 transition-colors duration-300 ${
        scrolled ? "nav-scrolled" : ""
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-white shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">VeriFy</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="nav-link px-3 py-2 text-sm text-text-secondary rounded-lg hover:text-foreground hover:bg-muted transition-colors"
              activeProps={{ className: "nav-link nav-link-active px-3 py-2 text-sm text-foreground font-medium rounded-lg bg-muted" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1 hidden md:block relative max-w-sm ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, brands, ingredients…"
              aria-label="Search"
              className="nav-search w-full h-10 rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-2 card-soft overflow-hidden"
            >
              {suggestions.map((s) => (
                <Link
                  key={s.id}
                  to="/product/$slug"
                  params={{ slug: s.slug }}
                  onClick={() => setQ("")}
                  className="flex items-center gap-3 p-3 hover:bg-muted transition"
                >
                  <img src={s.image} alt="" className="h-10 w-10 rounded-md object-cover" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.title}</div>
                    <div className="text-xs text-text-muted">{s.brand} · {s.category}</div>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-auto md:ml-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="nav-icon-btn gap-1 rounded-full text-text-secondary">
                {currency}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {currencies.map((c) => (
                <DropdownMenuItem key={c.code} onClick={() => setCurrency(c.code)}>
                  <span className="w-6 text-text-muted">{c.symbol}</span>
                  <span>{c.code}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            className="nav-icon-btn rounded-full"
            onClick={toggle}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Link
            to="/rewards"
            className="nav-chip relative inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary/40 transition"
            aria-label="Rewards"
          >
            <Gift className="h-4 w-4 text-primary" />
            <span className="font-medium">{points}</span>
            <span className="text-text-muted hidden sm:inline">pts · {coins}c</span>
          </Link>

          <Button variant="ghost" size="icon" className="nav-icon-btn rounded-full" aria-label="Profile">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
