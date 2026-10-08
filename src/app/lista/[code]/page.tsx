import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/constants";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { GroupCard } from "@/components/site/group-card";
import { Reveal } from "@/components/site/reveal";
import { getGroupsByIds, getRatingsBatch } from "@/lib/data";
import { getFavListByCode, parseListIds, bumpFavListView } from "@/lib/fav-lists";
import { SharedListActions } from "./shared-list-actions";
import { Link2, Users, CalendarDays, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const list = await getFavListByCode(code);
  if (!list) {
    return {
      title: { absolute: `Lista no encontrada — ${SITE.name}` },
      robots: { index: false, follow: false },
    };
  }
  const ids = parseListIds(list.groupIdsJson);
  const title =
    list.title?.trim() ||
    `Lista compartida de ${ids.length} ${ids.length === 1 ? "grupo" : "grupos"}`;
  return {
    title: { absolute: `${title} — ${SITE.name}` },
    description: `Una colección compartida de grupos de WhatsApp en español: ${ids.length} ${ids.length === 1 ? "comunidad" : "comunidades"} seleccionadas a mano.`,
    alternates: { canonical: `${SITE.url}/lista/${list.shareCode}` },
    // Personal share links → keep out of search engines (they are not
    // evergreen landing pages).
    robots: { index: false, follow: true },
  };
}

export default async function SharedListPage({ params }: Props) {
  const { code } = await params;
  const list = await getFavListByCode(code);
  if (!list) notFound();

  const ids = parseListIds(list.groupIdsJson);
  const groups = ids.length > 0 ? await getGroupsByIds(ids) : [];
  await bumpFavListView(code);

  const ratings = await getRatingsBatch(groups.map((g) => g.id));
  const totalMembers = groups.reduce((acc, g) => acc + (g.members || 0), 0);
  const createdLabel = new Date(list.createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const title =
    list.title?.trim() ||
    `Lista compartida de ${groups.length} ${groups.length === 1 ? "grupo" : "grupos"}`;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-8 sm:py-12">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Link2 className="h-3.5 w-3.5" /> Lista compartida
              </span>
              <h1 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">
                {title}
              </h1>
              <p className="max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
                Una colección de grupos de WhatsApp compartida contigo a través de
                ConectaGrupos. Explora los grupos y únete a los que te interesen.
              </p>

              {/* Stats */}
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-medium">
                  <Users className="h-3.5 w-3.5 text-primary/70" />
                  <span className="tabular-nums">{groups.length}</span> grupos
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-medium">
                  <Users className="h-3.5 w-3.5 text-primary/70" />
                  <span className="tabular-nums">
                    {totalMembers.toLocaleString("es-ES")}
                  </span>{" "}
                  miembros
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-medium text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {createdLabel}
                </span>
                {list.viewCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-medium text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    <span className="tabular-nums">{list.viewCount + 1}</span> visitas
                  </span>
                )}
              </div>

              {/* CTA: save the whole list to your favorites */}
              {groups.length > 0 && (
                <SharedListActions ids={groups.map((g) => g.id)} />
              )}
            </div>
          </div>
        </header>

        {/* List */}
        <section className="py-10 sm:py-12" aria-labelledby="lista-compartida-heading">
          <div className="container mx-auto px-4">
            <h2 id="lista-compartida-heading" className="sr-only">
              Grupos de la lista compartida
            </h2>

            {groups.length > 0 ? (
              <Reveal>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {groups.map((g) => (
                    <GroupCard key={g.id} group={g} rating={ratings[g.id] ?? null} />
                  ))}
                </div>
              </Reveal>
            ) : (
              /* List exists but none of its groups are live anymore */
              <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
                <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-2xl">
                  🔗
                </span>
                <h3 className="text-lg font-bold">Esta lista está vacía ahora</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Los grupos que la formaban ya no están publicados en el directorio.
                  Quizá fueron retirados o sus enlaces caducaron.
                </p>
              </div>
            )}

            <p className="mt-8 text-center text-xs text-muted-foreground">
              Cada enlace de esta lista se comprueba contra el directorio en vivo: los
              grupos retirados desaparecen automáticamente de la vista.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  );
}
