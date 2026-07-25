import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { useApp } from "@/lib/store";
import { useEffect } from "react";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { authUser } = useApp();
  const navigate = useNavigate();

  // If authenticated, redirect away from auth page
  useEffect(() => {
    if (authUser) {
      navigate({ to: "/" });
    }
  }, [authUser, navigate]);

  // Show nothing while checking auth (avoids flash)
  if (authUser) return null;

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full">
      {/* Left side — Aceternity-style branding */}
      <div className="relative hidden w-1/2 lg:flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/[0.03] via-transparent to-secondary/[0.03]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #2563EB 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" aria-hidden="true" />

        <div className="relative z-10 max-w-md px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/20">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="text-4xl font-bold tracking-tight leading-[1.15]">
              <span className="bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
                Compare, verify and buy smarter
              </span>
            </h2>
            <p className="mt-4 text-base text-text-secondary leading-relaxed">
              One place to compare products from every store — with lab reports, ingredient analysis, and an AI guide to help you choose.
            </p>
            <div className="mt-8 space-y-3 text-left">
              {[
                { label: "Verified authenticity", desc: "Lab-tested products from trusted sources" },
                { label: "Smart comparisons", desc: "Side-by-side with ingredients and nutrition" },
                { label: "AI-powered guidance", desc: "Personalized diet plans and recommendations" },
              ].map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-[#2a2b2c66] p-3.5 backdrop-blur-sm"
                >
                  <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{f.label}</div>
                    <div className="text-xs text-text-muted mt-0.5">{f.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side — Auth card */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12">
        <AuthCard />
      </div>
    </div>
  );
}