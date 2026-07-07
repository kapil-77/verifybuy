import { Link } from "@tanstack/react-router";
import { Sparkles, Twitter, Github, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-6 py-14 grid gap-10 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">ComparePrime</span>
          </div>
          <p className="mt-4 text-sm text-text-secondary max-w-sm">
            Compare products across leading eCommerce sites with verified authenticity, lab reports and AI guidance.
          </p>
          <div className="mt-6 flex gap-2">
            {[Twitter, Github, Instagram, Linkedin].map((I, i) => (
              <a key={i} href="#" aria-label="Social" className="grid h-9 w-9 place-items-center rounded-full border border-border text-text-secondary hover:text-foreground hover:border-foreground/40 transition">
                <I className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        {[
          { title: "Product", links: [["Categories", "/categories"], ["Compare", "/compare"], ["Rewards", "/rewards"], ["AI Assistant", "/assistant"]] },
          { title: "Company", links: [["About", "/about"], ["Contact", "/about"], ["Careers", "/about"]] },
          { title: "Legal", links: [["Privacy", "/about"], ["Terms", "/about"], ["Cookies", "/about"]] },
        ].map((col) => (
          <div key={col.title}>
            <div className="text-sm font-semibold">{col.title}</div>
            <ul className="mt-4 space-y-3 text-sm text-text-secondary">
              {col.links.map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="hover:text-foreground transition">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-5 text-xs text-text-muted flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} ComparePrime. All rights reserved.</div>
          <div>Made with care · v1.0</div>
        </div>
      </div>
    </footer>
  );
}
