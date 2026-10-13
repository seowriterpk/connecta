import { permanentRedirect } from "next/navigation";

// /blog/{slug} → /guias/{slug} — posts now live under the merged "Guías"
// section. 308 permanent redirect; slugs are 1:1, so no lookup needed.
interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostRedirect({ params }: PageProps) {
  const { slug } = await params;
  permanentRedirect(`/guias/${slug}`);
}
