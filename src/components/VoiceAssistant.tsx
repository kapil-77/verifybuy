import { useConversation } from "@elevenlabs/react";
import { useNavigate } from "@tanstack/react-router";
import { Mic, MicOff, Loader2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/lib/store";
import { products } from "@/lib/data";
import { useTheme } from "@/hooks/useTheme";

const AGENT_ID = "agent_5001kx0meymyf1f8kg0tnm5ry3am";

const ROUTES: Record<string, string> = {
  home: "/", landing: "/",
  categories: "/categories", category: "/categories", products: "/categories",
  compare: "/compare", comparison: "/compare",
  assistant: "/assistant", diet: "/assistant", planner: "/assistant",
  rewards: "/rewards", account: "/rewards",
};

function findProductId(slug: string): string | undefined {
  const s = slug.toLowerCase().trim();
  return (
    products.find((p) => p.slug === s)?.id ??
    products.find((p) => p.slug.includes(s) || p.title.toLowerCase().includes(s))?.id
  );
}

export function VoiceAssistant() {
  const navigate = useNavigate();
  const { toggleCompare, clearCompare, compare } = useApp();
  const { toggle: toggleTheme } = useTheme();
  const [connecting, setConnecting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");

  const conversation = useConversation({
    clientTools: {
      navigateTo: (params: { page: string }) => {
        const target = ROUTES[String(params.page || "").toLowerCase().trim()];
        if (!target) return `Unknown page: ${params.page}`;
        navigate({ to: target });
        return `Navigated to ${target}`;
      },
      searchCategory: (params: { query: string }) => {
        navigate({ to: "/categories", search: { q: String(params.query || "") } as never });
        return `Filtered categories by ${params.query}`;
      },
      openProduct: (params: { slug: string }) => {
        const slug = String(params.slug || "").trim();
        if (!slug) return "No product specified";
        navigate({ to: "/product/$slug", params: { slug } });
        return `Opened ${slug}`;
      },
      addToCompare: (params: { slug: string }) => {
        const id = findProductId(String(params.slug || ""));
        if (!id) return `Product not found: ${params.slug}`;
        if (compare.includes(id)) return "Already in compare";
        toggleCompare(id);
        return `Added ${params.slug} to compare`;
      },
      removeFromCompare: (params: { slug: string }) => {
        const id = findProductId(String(params.slug || ""));
        if (!id || !compare.includes(id)) return "Not in compare";
        toggleCompare(id);
        return `Removed ${params.slug}`;
      },
      clearCompare: () => { clearCompare(); return "Cleared compare list"; },
      openCompare: () => { navigate({ to: "/compare" }); return "Opened compare page"; },
      openDietPlanner: () => { navigate({ to: "/assistant" }); return "Opened diet planner"; },
      scrollToSection: (params: { id: string }) => {
        const el = document.getElementById(String(params.id || ""));
        if (!el) return `Section not found: ${params.id}`;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return `Scrolled to ${params.id}`;
      },
      toggleTheme: () => { toggleTheme(); return "Toggled theme"; },
    },
    onConnect: () => toast.success("Voice assistant connected"),
    onDisconnect: () => setExpanded(false),
    onMessage: (m: { message?: string; source?: string }) => {
      if (m.message) setLastMessage(m.message);
    },
    onError: (e) => { console.error(e); toast.error("Voice assistant error"); },
  });

  const start = useCallback(async () => {
    setConnecting(true);
    try {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        const name = (err as DOMException)?.name;
        if (name === "NotAllowedError" || name === "SecurityError")
          toast.error("Microphone blocked. Enable it in browser settings and reload.");
        else if (name === "NotFoundError") toast.error("No microphone found.");
        else if (name === "NotReadableError") toast.error("Microphone in use by another app.");
        else toast.error("Couldn't access microphone.");
        return;
      }
      const res = await fetch("/api/elevenlabs/token", { method: "POST" });
      if (!res.ok) throw new Error(`Token failed: ${res.status}`);
      const { token, error } = (await res.json()) as { token?: string; error?: string };
      if (!token) throw new Error(error || "No token");
      await conversation.startSession({ conversationToken: token, connectionType: "webrtc" });
      setExpanded(true);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to start voice assistant");
    } finally {
      setConnecting(false);
    }
  }, [conversation]);

  const stop = useCallback(async () => {
    await conversation.endSession();
    setExpanded(false);
  }, [conversation]);

  const connected = conversation.status === "connected";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {expanded && connected && (
        <div className="w-72 rounded-2xl border border-border bg-card p-4 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              <span className="text-sm font-medium">
                {conversation.isSpeaking ? "Speaking…" : "Listening…"}
              </span>
            </div>
            <button onClick={stop} className="grid h-6 w-6 place-items-center rounded-full hover:bg-muted" aria-label="Close">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {lastMessage && <p className="mt-3 line-clamp-4 text-xs text-text-secondary">{lastMessage}</p>}
          <p className="mt-3 text-[11px] text-text-muted">
            Try: "Open compare" · "Add creatine to compare" · "Open diet planner" · "Toggle theme"
          </p>
        </div>
      )}

      <button
        onClick={connected ? stop : start}
        disabled={connecting}
        aria-label={connected ? "Stop voice assistant" : "Start voice assistant"}
        className={`grid h-14 w-14 place-items-center rounded-full text-white shadow-xl transition hover:brightness-110 disabled:opacity-60 ${
          connected ? "bg-red-500" : "gradient-primary"
        }`}
      >
        {connecting ? <Loader2 className="h-5 w-5 animate-spin" /> : connected ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>
    </div>
  );
}

export { AGENT_ID };
