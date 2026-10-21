"use client";

import * as React from "react";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type FeedbackAction = "like" | "dislike";

interface GroupFeedbackProps {
  groupId: string;
  slug: string;
  /** Honest server-recounted values (0 at start — never faked). */
  initialLikes: number;
  initialDislikes: number;
  /** SSR always passes null; the client restores the visitor's own vote
   *  from localStorage after hydration. */
  initialMyAction?: FeedbackAction | null;
}

/**
 * GroupFeedback — simple like / dislike rating for a group page.
 *
 * - Clean semantic HTML only (section + h3 + two buttons): Google can read
 *   the question, labels and counts straight from the server HTML.
 *   NO JSON-LD / structured data of any kind.
 * - One vote per visitor per group (server enforces it via a visitor hash);
 *   clicking the other button switches the vote.
 * - Counts only change after the server response — honest numbers, no
 *   optimistic inflation. The pressed state is optimistic and reverts
 *   with an error toast if the request fails.
 * - The visitor's own vote is remembered in localStorage (gh-vote-{slug}).
 */
export function GroupFeedback({
  groupId: _groupId,
  slug,
  initialLikes,
  initialDislikes,
  initialMyAction = null,
}: GroupFeedbackProps) {
  const { toast } = useToast();
  const [likes, setLikes] = React.useState(initialLikes);
  const [dislikes, setDislikes] = React.useState(initialDislikes);
  const [myAction, setMyAction] = React.useState<FeedbackAction | null>(initialMyAction);
  const [submitting, setSubmitting] = React.useState(false);

  // Restore this visitor's previous vote (never affects the public counts).
  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(`gh-vote-${slug}`);
      if (stored === "like" || stored === "dislike") {
        setMyAction((cur) => cur ?? stored);
      }
    } catch {
      /* localStorage unavailable — vote state simply won't persist */
    }
  }, [slug]);

  async function vote(action: FeedbackAction) {
    if (submitting || myAction === action) return;
    const prev = myAction;
    setSubmitting(true);
    setMyAction(action); // optimistic pressed state (counts stay honest)
    try {
      const res = await fetch("/api/groups/feedback?XTransformPort=3000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Error");
      // Only the server recount moves the public numbers.
      setLikes(json.data.likes);
      setDislikes(json.data.dislikes);
      try {
        window.localStorage.setItem(`gh-vote-${slug}`, action);
      } catch {
        /* ignore */
      }
    } catch {
      setMyAction(prev); // revert the pressed state on failure
      toast({
        title: "No se pudo registrar tu voto",
        description: "Comprueba tu conexión e inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-label="Valoración del grupo" className="mt-5 rounded-2xl border bg-card p-4 shadow-sm sm:mt-6 sm:p-5">
      <h3 className="text-sm font-bold tracking-tight sm:text-base">¿Te resultó útil este grupo?</h3>
      <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
        Tu voto ayuda a otros a decidir antes de entrar.
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:gap-3">
        {/* LIKE */}
        <button
          type="button"
          onClick={() => vote("like")}
          disabled={submitting}
          aria-pressed={myAction === "like"}
          aria-label="Me gusta"
          className={`inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:flex-1 sm:gap-2 sm:px-4 sm:text-sm ${
            myAction === "like"
              ? "border-emerald-600 bg-emerald-600/15 text-emerald-700 ring-1 ring-emerald-600/40 dark:text-emerald-300"
              : "border-emerald-600/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300"
          }`}
        >
          {submitting && myAction === "like" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ThumbsUp className={`h-4 w-4 ${myAction === "like" ? "fill-current" : ""}`} aria-hidden />
          )}
          <span>Me gusta</span>
          <span className="tabular-nums opacity-80">({likes})</span>
        </button>
        {/* DISLIKE — red */}
        <button
          type="button"
          onClick={() => vote("dislike")}
          disabled={submitting}
          aria-pressed={myAction === "dislike"}
          aria-label="No me gusta"
          className={`inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:flex-1 sm:gap-2 sm:px-4 sm:text-sm ${
            myAction === "dislike"
              ? "border-red-600 bg-red-600 text-white shadow-sm"
              : "border-red-600/40 bg-red-600/5 text-red-700 hover:bg-red-600/10 dark:text-red-400"
          }`}
        >
          {submitting && myAction === "dislike" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <ThumbsDown className={`h-4 w-4 ${myAction === "dislike" ? "fill-current" : ""}`} aria-hidden />
          )}
          <span>No me gusta</span>
          <span className="tabular-nums opacity-80">({dislikes})</span>
        </button>
      </div>
    </section>
  );
}
