/** Segment loading fallback (16) — taxonomy skeleton mirroring /categoria/[slug]:
 *  icon-tile header + chips + 4-column group-card grid. */
import { TaxonomyRouteSkeleton } from "@/components/site/route-skeletons";

export default function Loading() {
  return <TaxonomyRouteSkeleton tile="icon" />;
}
