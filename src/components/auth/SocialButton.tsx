import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SocialButtonProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

export function SocialButton({ icon, label, onClick, className }: SocialButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center justify-center gap-3 rounded-xl border border-[#3a3b3c] bg-[#2a2b2c] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#3a3b3c] hover:shadow-md hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
}