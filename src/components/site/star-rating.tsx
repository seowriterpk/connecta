"use client";

import * as React from "react";
import { Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function StarRating({ groupId }: { groupId: string }) {
  const { toast } = useToast();
  const [avg, setAvg] = React.useState(0);
  const [count, setCount] = React.useState(0);
  const [userRating, setUserRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [fetching, setFetching] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setFetching(true);
    Promise.all([
      fetch(`/api/groups/rate?id=${groupId}&XTransformPort=3000`).then((r) => r.json()),
      fetch(`/api/groups/rate?user=1&id=${groupId}&XTransformPort=3000`).then((r) => r.json()).catch(() => null),
    ])
      .then(([stats, user]) => {
        if (cancelled) return;
        if (stats.ok && stats.data) {
          setAvg(stats.data.avg);
          setCount(stats.data.count);
        }
        if (user?.ok && typeof user.data === "number") {
          setUserRating(user.data);
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setFetching(false));
    return () => { cancelled = true; };
  }, [groupId]);

  async function submit(rating: number) {
    if (userRating === rating) return;
    const wasUpdating = userRating > 0;
    setLoading(true);
    const prev = userRating;
    setUserRating(rating);
    try {
      const res = await fetch("/api/groups/rate?XTransformPort=3000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, rating }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Error");
      setAvg(json.data.avg);
      setCount(json.data.count);
      toast({
        title: wasUpdating ? "Valoración actualizada" : "¡Gracias por tu voto!",
        description: `${rating}/5 estrellas`,
      });
    } catch (e: any) {
      setUserRating(prev);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const display = hover || userRating || Math.round(avg);

  if (fetching) {
    return (
      <div className="flex items-center gap-2">
        {[1,2,3,4,5].map((s) => (
          <Star key={s} className="h-4 w-4 text-muted-foreground/20" />
        ))}
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Stars */}
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHover(star)}
            onClick={() => submit(star)}
            disabled={loading}
            aria-label={`${star} estrella${star > 1 ? "s" : ""}`}
            className="grid h-7 w-7 place-items-center rounded transition hover:scale-110 disabled:opacity-50"
          >
            <Star
              className={`h-4 w-4 transition-colors ${
                star <= display
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/30 hover:text-muted-foreground/50"
              }`}
            />
          </button>
        ))}
      </div>
      {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}

      {/* Text — minimalist */}
      <span className="text-sm text-muted-foreground">
        {userRating > 0 ? (
          <span className="text-amber-600 dark:text-amber-400">Tu voto: {userRating}★</span>
        ) : count > 0 ? (
          <span>{avg.toFixed(1)}</span>
        ) : (
          <span className="text-xs">Valóralo</span>
        )}
      </span>
    </div>
  );
}
