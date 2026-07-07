import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Mic, User, Bot } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export const Route = createFileRoute("/assistant")({ component: AssistantPage });

type Msg = { id: string; role: "user" | "assistant"; content: string };

const suggested = [
  "Compare whey isolate vs concentrate",
  "Best creatine under $30",
  "How much protein do I need daily?",
  "Suggest a cutting stack",
  "Which fish oil has the best purity?",
];

const cannedReplies: Record<string, string> = {
  whey: "**Whey Isolate vs Concentrate**\n\n- **Isolate** is filtered further: ~90% protein, <1g fat/carbs, easier on lactose-sensitive folks.\n- **Concentrate** is 70–80% protein, retains more bioactive peptides, and is more affordable.\n\n*Best for cutting* → Isolate. *Best value overall* → Concentrate.",
  creatine: "Under $30, **Optimum Nutrition Micronized Creatine** ($24.99) is the top pick — pure Creapure®, Informed Choice tested. Effective dose is 3–5g daily; no loading required.",
  protein: "Rule of thumb: **1.6–2.2g protein per kg of body weight per day** if training. Spread across 3–5 meals of 20–40g each for optimal MPS (muscle protein synthesis).",
  fish: "For purity, look for **IFOS 5-star rated** fish oils. NOW Foods Omega-3 and Nordic Naturals both consistently pass heavy-metal and oxidation tests.",
  cutting: "**Cutting stack**\n1. Whey Isolate (25g post-workout)\n2. Creatine 5g daily\n3. Caffeine 100–200mg pre-workout\n4. Omega-3 for recovery\n5. Multivitamin\n\nStay in a 300–500 kcal deficit and hit protein targets.",
};

function replyFor(q: string) {
  const l = q.toLowerCase();
  for (const [k, v] of Object.entries(cannedReplies)) if (l.includes(k)) return v;
  return "Great question! Based on the products in our catalog, I'd recommend comparing the top 2–3 options side by side using the Compare page. Look at price per serving, ingredient quality (Informed Choice / IFOS badges), and third-party lab reports. Want me to shortlist something specific?";
}

function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: "welcome", role: "assistant", content: "Hi! I'm your **ComparePrime AI Assistant**. Ask me about products, ingredients, nutrition, or shopping decisions." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages, typing]);

  function send(text: string) {
    const q = text.trim(); if (!q) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: q }]);
    setInput(""); setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: replyFor(q) }]);
    }, 900);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="text-center mb-8">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-white px-3 py-1.5 text-xs text-text-secondary">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Powered by ComparePrime AI
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">AI Assistant</h1>
        <p className="mt-2 text-text-secondary">Ask anything about products, nutrition, ingredients or diet.</p>
      </div>

      <div className="card-soft flex flex-col h-[560px]">
        <div ref={listRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
              >
                {m.role === "assistant" && (
                  <div className="shrink-0 grid h-8 w-8 place-items-center rounded-full gradient-primary text-white"><Bot className="h-4 w-4" /></div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-white" : "bg-muted"}`}>
                  {m.content.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
                    chunk.startsWith("**") ? <strong key={i}>{chunk.slice(2, -2)}</strong> : <span key={i}>{chunk}</span>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="shrink-0 grid h-8 w-8 place-items-center rounded-full bg-foreground text-background"><User className="h-4 w-4" /></div>
                )}
              </motion.div>
            ))}
            {typing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="shrink-0 grid h-8 w-8 place-items-center rounded-full gradient-primary text-white"><Bot className="h-4 w-4" /></div>
                <div className="rounded-2xl px-4 py-3 bg-muted">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                        className="block h-1.5 w-1.5 rounded-full bg-text-muted" />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {messages.length <= 1 && (
          <div className="px-6 pb-3 flex flex-wrap gap-2">
            {suggested.map((s) => (
              <button key={s} onClick={() => send(s)} className="text-xs rounded-full border border-border bg-white px-3 py-1.5 hover:border-primary hover:text-primary transition">
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="border-t border-border p-3 flex items-center gap-2"
        >
          <button type="button" aria-label="Voice input" className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted transition">
            <Mic className="h-4 w-4 text-text-secondary" />
          </button>
          <input
            value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a product, ingredient, or diet…"
            className="flex-1 h-10 rounded-full bg-muted px-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit" disabled={!input.trim()}
            className="grid h-10 w-10 place-items-center rounded-full gradient-primary text-white disabled:opacity-40 hover:brightness-110 transition"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
