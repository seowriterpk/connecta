/** Segment loading fallback (16) — article skeleton mirroring /guias/[slug]:
 *  header meta + prose blocks + related-groups aside. */
import { GuiaArticleSkeleton } from "@/components/site/route-skeletons";

export default function Loading() {
  return <GuiaArticleSkeleton />;
}
