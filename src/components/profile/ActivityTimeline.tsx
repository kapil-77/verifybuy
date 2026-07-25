import { motion } from "framer-motion";
import { Eye, ShoppingBag, Coins, type LucideIcon } from "lucide-react";
import type { ActivityEntry } from "@/lib/activity";
import { cn } from "@/lib/utils";

const activityConfig: Record<
  string,
  { icon: LucideIcon; label: string; color: string; bg: string }
> = {
  viewed_product: {
    icon: Eye,
    label: "Viewed Product",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  clicked_buy: {
    icon: ShoppingBag,
    label: "Clicked Buy",
    color: "text-success",
    bg: "bg-success/10",
  },
  reward_earned: {
    icon: Coins,
    label: "Reward Earned",
    color: "text-warning",
    bg: "bg-warning/10",
  },
};

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function ActivityTimeline({ activities }: { activities: ActivityEntry[] }) {
  if (activities.length === 0) {
    return (
      <div className="card-soft p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-text-muted">
          <Eye className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-foreground">No activity yet</h3>
        <p className="mt-1 text-xs text-text-muted">
          Start browsing products to see your activity here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((entry, i) => {
        const config = activityConfig[entry.type] || activityConfig.viewed_product;
        const Icon = config.icon;

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.3 }}
            className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3.5 shadow-soft transition-all duration-200 hover:shadow-md hover:border-border"
          >
            {/* Icon */}
            <div
              className={cn(
                "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                config.bg,
                config.color,
              )}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {config.label}
                </span>
                <span className="shrink-0 text-[11px] text-text-muted">
                  {formatTimestamp(entry.timestamp)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-text-secondary truncate">
                {entry.productName || entry.label || ""}
              </p>
              {entry.amount != null && (
                <p className="mt-0.5 text-xs font-semibold text-warning">
                  +{entry.amount} coins
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}