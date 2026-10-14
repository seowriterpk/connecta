/**
 * Root loading fallback (16) — the root SEGMENT is the homepage, so its
 * boundary must mirror the HOME layout (hero + filter bar + rows), not a
 * generic grid. Every other public route has its own segment loading.tsx.
 */
import { HomeRouteSkeleton } from "@/components/site/route-skeletons";

export default function Loading() {
  return <HomeRouteSkeleton />;
}
