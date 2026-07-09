import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, Zap, Users } from "lucide-react";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-xs text-text-secondary">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> About VeriFy
        </div>
        <h1 className="mt-5 text-5xl font-semibold tracking-tight">Shop with certainty.</h1>
        <p className="mt-4 text-lg text-text-secondary">
          We're building the most trustworthy way to compare, verify and purchase products across the world's leading eCommerce sites.
        </p>
      </div>

      <div className="mt-16 grid md:grid-cols-2 gap-5">
        {[
          { icon: ShieldCheck, title: "Verified authenticity", body: "Every product is checked against lab reports, third-party testing and manufacturer certificates." },
          { icon: Zap, title: "Fair price discovery", body: "Real-time price comparisons across Amazon, iHerb, HealthKart and more." },
          { icon: Sparkles, title: "AI-powered guidance", body: "Ask our assistant about ingredients, alternatives, or your health goals." },
          { icon: Users, title: "Community-driven", body: "Reviews, ratings and shopper insights help you decide with confidence." },
        ].map((f) => (
          <div key={f.title} className="card-soft p-6">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><f.icon className="h-5 w-5" /></div>
            <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
            <p className="mt-1 text-sm text-text-secondary">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
