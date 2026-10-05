/**
 * ResearchPanel — the in-app trigger for the RAG pipeline.
 *
 * Calls the `researchProductSummary` server function (which runs the full
 * query → retrieval → context → LLM → cited-answer flow server-side) and
 * renders the source-grounded answer with its citations.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Loader2, ScrollText, Sparkles, TriangleAlert } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { researchProductSummary } from "@/lib/rag/research.functions";
import type { ResearchAnswer, ResearchStatus } from "@/lib/rag/types";

export function ResearchPanel({
  productId,
  productTitle,
}: {
  productId: string;
  productTitle: string;
}) {
  const [answer, setAnswer] = useState<ResearchAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const research = useServerFn(researchProductSummary);

  async function run() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await research({ data: { productId } });
      setAnswer(result);
    } catch (err) {
      console.error("[rag] research failed:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      toast.error("AI research failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-soft p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-text-secondary">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Product Research
        </span>
        <span className="text-xs text-text-muted">Source-grounded · cites every claim</span>
      </div>

      <p className="mt-4 text-sm text-text-secondary">
        Run a RAG-researched summary of “{productTitle}” — overview, ingredients, pros & cons and
        certifications — with citations traced back to real store listings.
      </p>

      {!answer && !loading && !error && (
        <button
          onClick={run}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-full gradient-primary px-5 text-sm font-medium text-white shadow-glow transition hover:brightness-110"
        >
          <ScrollText className="h-4 w-4" /> Run AI Research
        </button>
      )}

      {loading && (
        <div className="mt-5 flex items-center gap-2 text-sm text-text-secondary">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Retrieving sources and generating a cited answer…
        </div>
      )}

      {error && !answer && (
        <div className="mt-5 rounded-xl border border-danger/20 bg-danger/5 p-4">
          <div className="flex items-start gap-2 text-sm text-text-secondary">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <div>
              <div className="font-medium text-foreground">Research failed</div>
              <div className="mt-1 break-words">{error}</div>
            </div>
          </div>
          <button
            onClick={run}
            className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-full border border-border px-4 text-xs font-medium transition hover:border-foreground/30"
          >
            Try again
          </button>
        </div>
      )}

      {answer && <AnswerResult answer={answer} />}
    </div>
  );
}
function AnswerResult({ answer }: { answer: ResearchAnswer }) {
  if (answer.status !== "ok") {
    return (
      <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4">
        <div className="flex items-start gap-2 text-sm text-text-secondary">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <div className="font-medium text-foreground">{statusLabel(answer.status)}</div>
            {answer.message && <p className="mt-1 break-words">{answer.message}</p>}
            <p className="mt-2 text-xs text-text-muted">
              The pipeline never generated an answer without relevant sources.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-5 space-y-4"
    >
      {answer.answer && (
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
            {answer.answer}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-text-muted">
            <span className="rounded-full bg-card px-2 py-0.5">
              retrieved {answer.retrievedCount} chunks
            </span>
            <span className="rounded-full bg-card px-2 py-0.5">
              {answer.contextChunkCount} in context
            </span>
            <span className="rounded-full bg-card px-2 py-0.5">
              {answer.citations.length} citations
            </span>
          </div>
        </div>
      )}

      {answer.citations.length > 0 ? (
        <div>
          <div className="text-xs font-medium text-text-muted uppercase tracking-wide">Sources</div>
          <ul className="mt-2 space-y-2">
            {answer.citations.map((citation) => (
              <li key={citation.chunkId} className="rounded-xl border border-border p-3">
                <a
                  href={citation.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px]">
                    {citation.index}
                  </span>
                  <span className="line-clamp-2">{citation.sourceTitle}</span>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                </a>
                {citation.snippet && (
                  <p className="mt-1.5 line-clamp-2 pl-7 text-xs text-text-muted">
                    “{citation.snippet}”
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-text-muted">
          This answer was generated without source citations. Nothing was invented — the model
          simply did not attach a valid source reference.
        </p>
      )}
    </motion.div>
  );
}

function statusLabel(status: ResearchStatus): string {
  switch (status) {
    case "no_sources":
      return "No source documents available";
    case "empty_retrieval":
      return "No relevant sources found";
    case "embedding_error":
      return "Embeddings unavailable";
    case "generation_error":
      return "AI generation failed";
    case "invalid_query":
      return "Invalid query";
    default:
      return "Research unavailable";
  }
}
