"use client";

import * as React from "react";
import type { GroupDTO } from "@/lib/types";
import { useRecent } from "@/lib/recent";

/**
 * RecentTracker — invisible client island rendered on group detail pages.
 * Pushes a slim snapshot of the visited group into the `cg-recent` store
 * (localStorage, max 8, most recent first) so the homepage can show
 * "Vistos recientemente".
 */
export function RecentTracker({ group }: { group: GroupDTO }) {
  const push = useRecent((s) => s.push);

  React.useEffect(() => {
    push(group);
    // group identity is stable per page — push exactly once per visit
  }, [group.id, push]);

  return null;
}
