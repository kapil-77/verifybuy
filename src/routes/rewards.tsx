import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Gift, Sparkles, Trophy, Coins, Clock, Check, Lock } from "lucide-react";
import { useApp } from "@/lib/store";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/rewards")({ component: RewardsPage });

const tiers = [
  { name: "Bronze", min: 0, perk: "Welcome coins", color: "bg-amber-100 text-amber-800" },
  { name: "Silver", min: 300, perk: "12% discount unlock", color: "bg-slate-100 text-slate-800" },
  { name: "Gold", min: 800, perk: "Early product access", color: "bg-yellow-100 text-yellow-800" },
  { name: "Platinum", min: 1500, perk: "Free priority shipping", color: "bg-indigo-100 text-indigo-800" },
];

function RewardsPage() {
  const { points, coins, history } = useApp();
  const nextTier = tiers.find((t) => t.min > points) ?? tiers[tiers.length - 1];
  const currentTier = [...tiers].reverse().find((t) => points >= t.min)!;
  const progress = Math.min(100, (points / nextTier.min) * 100);

  return (
    <div className="mx-auto max-w-7xl px-6 py-14">
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 relative overflow-hidden rounded-3xl gradient-primary p-8 text-white">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
          <div className="flex items-center gap-2 text-sm text-white/85"><Trophy className="h-4 w-4" /> Current tier · {currentTier.name}</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">You have {points} points</h1>
          <p className="mt-2 text-white/85">{nextTier.min - points > 0 ? `${nextTier.min - points} points to unlock ${nextTier.perk}` : "You've reached the top tier!"}</p>
          <div className="mt-6">
            <div className="h-3 rounded-full bg-white/20 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }} className="h-full bg-white" />
            </div>
            <div className="mt-2 flex justify-between text-xs text-white/80">
              <span>{currentTier.min}</span><span>{nextTier.min}</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card-soft p-6">
            <div className="flex items-center gap-2 text-text-muted text-xs"><Coins className="h-4 w-4" /> Coins</div>
            <div className="mt-2 text-4xl font-semibold">{coins}</div>
            <div className="mt-1 text-xs text-text-secondary">Earn 10 per Buy Now</div>
          </div>
          <div className="card-soft p-6">
            <div className="flex items-center gap-2 text-text-muted text-xs"><Sparkles className="h-4 w-4" /> Points</div>
            <div className="mt-2 text-4xl font-semibold">{points}</div>
            <div className="mt-1 text-xs text-text-secondary">100 per confirmed order</div>
          </div>
          <div className="col-span-2 card-soft p-6">
            <div className="flex items-center gap-2 text-text-muted text-xs"><Gift className="h-4 w-4" /> Next reward</div>
            <div className="mt-2 font-semibold">{nextTier.perk}</div>
            <Progress value={progress} className="mt-4" />
          </div>
        </div>
      </div>

      <div className="mt-10 grid lg:grid-cols-2 gap-6">
        <div className="card-soft p-6">
          <h2 className="text-lg font-semibold">Tiers</h2>
          <div className="mt-4 space-y-3">
            {tiers.map((t) => {
              const unlocked = points >= t.min;
              const current = t.name === currentTier.name;
              return (
                <div key={t.name} className={`flex items-center gap-4 p-4 rounded-xl border ${current ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div className={`grid h-10 w-10 place-items-center rounded-full ${unlocked ? "bg-success/15 text-success" : "bg-muted text-text-muted"}`}>
                    {unlocked ? <Check className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-text-secondary">{t.perk}</div>
                  </div>
                  <div className="text-xs text-text-muted">{t.min}+ pts</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card-soft p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-text-muted" /> Recent activity</h2>
          <div className="mt-4 divide-y divide-border">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm">{h.label}</div>
                  <div className="text-xs text-text-muted">{new Date(h.at).toLocaleString()}</div>
                </div>
                <div className={`text-sm font-semibold ${h.type === "coin" ? "text-warning" : "text-primary"}`}>+{h.amount} {h.type === "coin" ? "coins" : "pts"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
