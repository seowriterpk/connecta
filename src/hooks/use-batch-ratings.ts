"use client";

import * as React from "react";

export type RatingMap = Record<string, { avg: number; count: number }>;

/** Fetches ratings for a list of group IDs (batched, debounced). */
export function useBatchRatings(ids: string[]): RatingMap {
  const [ratings, setRatings] = React.useState<RatingMap>({});

  React.useEffect(() => {
    if (ids.length === 0) return;
    let cancelled = false;
    const t = setTimeout(() => {
      fetch(`/api/groups/ratings-batch?ids=${ids.join(",")}&XTransformPort=3000`)
        .then((r) => r.json())
        .then((json) => {
          if (cancelled) return;
          if (json.ok && json.data) setRatings(json.data);
        })
        .catch(() => {});
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [ids.join(",")]);

  return ratings;
}
