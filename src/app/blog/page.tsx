import { permanentRedirect } from "next/navigation";

// /blog → /guias — the blog and the guides hub were merged into ONE section:
// "Guías" (the Spanish term for this how-to content). 308 permanent redirect
// so any legacy link or cached URL flows to the canonical /guias page.
export default function BlogPageRedirect() {
  permanentRedirect("/guias");
}
