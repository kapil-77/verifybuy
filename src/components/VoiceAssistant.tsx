import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { useNavigate } from "@tanstack/react-router";
import { Mic, MicOff, Loader2, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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

function VoiceAssistantInner() {
  const [connecting, setConnecting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const conversation = useConversation();

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
          {conversation.message && (
            <p className="mt-3 line-clamp-4 text-xs text-text-secondary">{conversation.message}</p>
          )}
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

export function VoiceAssistant() {
  const navigate = useNavigate();
  const { toggleCompare, clearCompare, compare } = useApp();
  const { toggle: toggleTheme } = useTheme();

  const clientTools = useMemo(
    () => {
      const wrap =
        <P,>(name: string, fn: (p: P) => string) =>
        (params: P) => {
          try {
            const result = fn((params ?? {}) as P);
            console.log(`[voice] ${name}`, params, "->", result);
            toast.message(`🎙 ${name}`, { description: String(result) });
            return result;
          } catch (e) {
            console.error(`[voice] ${name} failed`, e);
            return `Error running ${name}`;
          }
        };
      return {
        navigateTo: wrap<{ page: string }>("navigateTo", (p) => {
          const target = ROUTES[String(p.page || "").toLowerCase().trim()];
          if (!target) return `Unknown page: ${p.page}`;
          navigate({ to: target });
          return `Navigated to ${target}`;
        }),
        searchCategory: wrap<{ query: string }>("searchCategory", (p) => {
          navigate({ to: "/categories", search: { q: String(p.query || "") } as never });
          return `Filtered categories by ${p.query}`;
        }),
        openProduct: wrap<{ slug: string }>("openProduct", (p) => {
          const raw = String(p.slug || "").trim();
          if (!raw) return "No product specified";
          const id = findProductId(raw);
          const finalSlug = id ? products.find((x) => x.id === id)!.slug : raw;
          navigate({ to: "/product/$slug", params: { slug: finalSlug } });
          return `Opened ${finalSlug}`;
        }),
        addToCompare: wrap<{ slug: string }>("addToCompare", (p) => {
          const id = findProductId(String(p.slug || ""));
          if (!id) return `Product not found: ${p.slug}`;
          if (compare.includes(id)) return "Already in compare";
          toggleCompare(id);
          return `Added ${p.slug} to compare`;
        }),
        removeFromCompare: wrap<{ slug: string }>("removeFromCompare", (p) => {
          const id = findProductId(String(p.slug || ""));
          if (!id || !compare.includes(id)) return "Not in compare";
          toggleCompare(id);
          return `Removed ${p.slug}`;
        }),
        clearCompare: wrap<Record<string, never>>("clearCompare", () => { clearCompare(); return "Cleared compare list"; }),
        openCompare: wrap<Record<string, never>>("openCompare", () => { navigate({ to: "/compare" }); return "Opened compare page"; }),
        openDietPlanner: wrap<Record<string, never>>("openDietPlanner", () => { navigate({ to: "/assistant" }); return "Opened diet planner"; }),
        scrollToSection: wrap<{ id: string }>("scrollToSection", (p) => {
          const el = document.getElementById(String(p.id || ""));
          if (!el) return `Section not found: ${p.id}`;
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          return `Scrolled to ${p.id}`;
        }),
        toggleTheme: wrap<Record<string, never>>("toggleTheme", () => { toggleTheme(); return "Toggled theme"; }),
      };
    },
    [navigate, toggleCompare, clearCompare, compare, toggleTheme],
  );

  return (
    <ConversationProvider
      clientTools={clientTools}
      onConnect={() => toast.success("Voice assistant connected")}
      onUnhandledClientToolCall={(call) => {
        console.warn("[voice] Unhandled tool call:", call);
        toast.error(`Unhandled tool: ${call.tool_name}`);
      }}
      onError={(e) => { console.error("[voice] error", e); toast.error(typeof e === "string" ? e : "Voice assistant error"); }}
    >
      <VoiceAssistantInner />
    </ConversationProvider>
  );
}

export { AGENT_ID };
