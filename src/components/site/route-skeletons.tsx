import { cn } from "@/lib/utils";

/**
 * Route skeletons — YouTube-style, layout-mimicking loading placeholders.
 *
 * DESIGN CONTRACT (why this file looks the way it does):
 *   • MIMICRY ≥ 50%: every skeleton copies its page's real structure —
 *     same container rhythm (container mx-auto px-4), same section
 *     paddings (py-14 sm:py-20 hero, py-10 sm:py-14 headers, py-12
 *     directory), same element order, same sizes (h-16 header, h-11
 *     inputs, h-[104px] group rows, ~200px cards) and the real grid
 *     column counts. The swap from skeleton → page causes ZERO layout
 *     shift, which is what makes it feel "instant".
 *   • ZERO CLIENT JS: no "use client", no hooks, no effects, no icons —
 *     these render as plain SSR HTML inside the segment loading.tsx
 *     boundaries. Nothing hydrates, nothing listens, nothing re-renders.
 *     When real content resolves, React unmounts the skeleton and every
 *     animation dies with it — no lingering CPU work.
 *   • CHEAP ANIMATION: the only motion is `.cg-skeleton::after`
 *     (translateX shimmer — compositor-only, no content repaints,
 *     disabled under prefers-reduced-motion). Element count is capped
 *     at roughly one viewport worth (~25–50 blocks per route).
 *   • A11Y: each exported skeleton starts with an sr-only "Cargando…";
 *     all decorative blocks are aria-hidden.
 */

/* ---------------------------------------------------------------------------
 * Primitives
 * ------------------------------------------------------------------------- */

/** One skeleton block. `cg-skeleton` supplies bg + shimmer. */
function S({ className }: { className?: string }) {
  return <div aria-hidden className={cn("cg-skeleton", className)} />;
}

/** Site header ghost (pages render their own 64px header). */
function HeaderGhost() {
  return (
    <div
      aria-hidden
      className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/95"
    >
      <div className="container mx-auto flex h-16 items-center gap-3 px-4">
        <S className="h-8 w-8 shrink-0 rounded-xl" />
        <S className="hidden h-5 w-28 rounded-full sm:block" />
        <S className="hidden h-9 w-44 rounded-xl md:block" />
        <S className="ml-auto h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
}

/** Breadcrumb bar ghost (border-b bg-muted/30, py-3). */
function BreadcrumbGhost({ items = 2, py = "py-3" }: { items?: number; py?: string }) {
  return (
    <nav aria-hidden className={cn("border-b bg-muted/30", py)}>
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: items }).map((_, i) => (
            <S
              key={i}
              className={cn(
                "h-3.5 rounded-full",
                i === items - 1 ? "w-32" : "w-14"
              )}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

/** Pill / badge / chip ghost. */
function Pill({ className }: { className?: string }) {
  return <S className={cn("h-6 rounded-full", className)} />;
}

/** Hero badge pill (h-7 like the real px-3 py-1.5 badges). */
function BadgeHero({ className }: { className?: string }) {
  return <S className={cn("h-7 rounded-full", className)} />;
}

/** Mimics one GroupCard (grid pages: categoria/pais/ciudad/buscar/populares,
 *  homepage directory, related-groups sections).
 * 2026 image-top card design: 4:3 cover block + title + meta pills + action
 * row — mirrors GroupCard/SkeletonCard geometry exactly. */
function GroupCardSkeleton() {
  return (
    <div aria-hidden className="relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="aspect-[4/3] w-full shrink-0 bg-muted" />
      <div className="flex flex-1 flex-col gap-2.5 p-2.5 sm:p-3">
        <S className="h-4 w-3/4 rounded-full" />
        <div className="flex items-center gap-1">
          <S className="h-5 w-[68px] rounded-full" />
          <S className="h-5 w-14 rounded-full" />
        </div>
        <div className="mt-auto flex items-center justify-between pt-1">
          <div className="flex items-center gap-0.5">
            <S className="h-7 w-7 rounded-full sm:h-8 sm:w-8" />
            <S className="h-7 w-7 rounded-full sm:h-8 sm:w-8" />
          </div>
          <S className="h-7 w-[74px] rounded-full bg-gradient-to-r from-emerald-500/40 to-teal-600/40 sm:h-8" />
        </div>
      </div>
    </div>
  );
}

/** Filter bar ghost — sticky exactly like the real directory filter bar. */
function DirectoryFilterGhost() {
  return (
    <div
      aria-hidden
      className="sticky top-16 z-30 -mx-4 border-y bg-background/95 px-4 py-3"
    >
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <S className="h-11 flex-1 rounded-xl" />
        <div className="flex flex-wrap items-center gap-2">
          <S className="h-11 w-full rounded-md sm:w-[170px]" />
          <S className="h-11 w-full rounded-md sm:w-[160px]" />
          <S className="h-11 w-full rounded-md sm:w-[140px]" />
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-1">
        <S className="h-3.5 w-16 shrink-0 rounded-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <S key={i} className="h-6 w-[68px] shrink-0 rounded-full" />
        ))}
      </div>
    </div>
  );
}

/** Section heading ghost (h-8 title + h-4 subtitle, mb-6). */
function SectionHeadingGhost({ title = "w-72", sub = "w-96" }: { title?: string; sub?: string }) {
  return (
    <div aria-hidden className="mb-6">
      <S className={cn("h-8 rounded-lg", title)} />
      <S className={cn("mt-2 h-4 rounded-full", sub)} />
    </div>
  );
}

/** Soft fade-out cap so the skeleton ends gracefully mid-scroll. */
function FadeCap() {
  return (
    <div
      aria-hidden
      className="h-24 bg-gradient-to-b from-muted/40 to-transparent"
    />
  );
}

/* ---------------------------------------------------------------------------
 * Route skeletons
 * ------------------------------------------------------------------------- */

/** `/` — Hero (badge, title, search, 4 stat cards) + directory (filter bar,
 *  8 group cards) + categories grid preview. */
export function HomeRouteSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <span className="sr-only">Cargando…</span>
      <HeaderGhost />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-14 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <div className="flex justify-center">
                <BadgeHero className="w-44" />
              </div>
              <S className="mx-auto mt-5 h-10 w-4/5 rounded-lg sm:mt-6 sm:h-12 lg:h-14" />
              <S className="mx-auto mt-2 h-10 w-1/2 rounded-lg sm:h-12 lg:h-14" />
              <S className="mx-auto mt-5 h-4 w-full rounded-full" />
              <S className="mx-auto mt-2 h-4 w-3/4 rounded-full" />
              <S className="mx-auto mt-7 h-12 w-full rounded-xl shadow-sm" />
              <div className="mt-8 border-t border-border/40 pt-6 sm:mt-9">
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      aria-hidden
                      className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/70 px-3.5 py-2.5 shadow-sm"
                    >
                      <S className="h-8 w-8 rounded-lg" />
                      <div className="space-y-1.5">
                        <S className="h-4 w-14 rounded-full" />
                        <S className="h-3 w-16 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Groups directory */}
        <section className="border-t bg-background">
          <div className="container mx-auto px-4 py-12 sm:py-16">
            <SectionHeadingGhost title="w-72" sub="w-4/5 sm:w-96" />
            <DirectoryFilterGhost />
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:gap-3.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <GroupCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </section>

        {/* Categories preview */}
        <section className="border-t bg-background/50">
          <div className="container mx-auto px-4 py-14 sm:py-16">
            <div aria-hidden className="mb-7 flex items-end justify-between">
              <div>
                <S className="h-8 rounded-lg w-56" />
                <S className="mt-2 h-4 w-80 rounded-full" />
              </div>
              <S className="hidden h-4 w-36 rounded-full sm:block" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  aria-hidden
                  className="flex h-[120px] flex-col items-start gap-2 rounded-2xl border bg-card p-4 shadow-sm"
                >
                  <S className="h-11 w-11 rounded-xl" />
                  <S className="h-4 w-3/4 rounded-full" />
                  <S className="mt-auto h-3 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </section>
        <FadeCap />
      </main>
    </div>
  );
}

/** `/guias` — breadcrumb + gradient header + quick-start grid + post cards. */
export function GuiasRouteSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <span className="sr-only">Cargando…</span>
      <HeaderGhost />
      <BreadcrumbGhost />
      <main className="flex-1">
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto max-w-3xl">
              <BadgeHero className="w-40" />
              <S className="mt-4 h-10 w-2/3 rounded-lg sm:h-12" />
              <S className="mt-3 h-4 w-full rounded-full" />
              <S className="mt-2 h-4 w-4/5 rounded-full" />
            </div>
          </div>
        </header>
        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4">
            {/* Quick starts */}
            <div aria-hidden className="mb-8">
              <S className="h-5 w-52 rounded-full" />
              <S className="mt-1.5 h-3 w-72 rounded-full" />
            </div>
            <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  aria-hidden
                  className="flex h-[84px] items-start gap-3 rounded-2xl border bg-card p-4 shadow-sm"
                >
                  <S className="h-10 w-10 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <S className="h-4 w-2/3 rounded-full" />
                    <S className="h-3 w-4/5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
            {/* Post cards */}
            <div aria-hidden className="mb-4">
              <S className="h-6 w-64 rounded-lg" />
              <S className="mt-2 h-3.5 w-80 rounded-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  aria-hidden
                  className="flex h-[240px] flex-col rounded-2xl border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <S className="h-11 w-11 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <S className="h-4 w-11/12 rounded-full" />
                      <S className="h-3 w-1/2 rounded-full" />
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <S className="h-3 w-full rounded-full" />
                    <S className="h-3 w-11/12 rounded-full" />
                    <S className="h-3 w-3/4 rounded-full" />
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t pt-3">
                    <div className="flex gap-1.5">
                      <S className="h-5 w-12 rounded-full" />
                      <S className="h-5 w-12 rounded-full" />
                    </div>
                    <S className="h-3 w-12 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <FadeCap />
      </main>
    </div>
  );
}

/** `/guias/[slug]` — article header (emoji tile, meta, title, tags) + prose
 *  blocks + related-groups aside + keep-reading mini cards. */
export function GuiaArticleSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <span className="sr-only">Cargando…</span>
      <HeaderGhost />
      <BreadcrumbGhost items={3} />
      <main className="flex-1">
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-8 sm:py-12">
            <div className="mx-auto max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <S className="h-12 w-12 shrink-0 rounded-2xl" />
                <S className="h-3 w-64 rounded-full" />
              </div>
              <S className="mt-4 h-9 w-full rounded-lg sm:h-11" />
              <S className="mt-2 h-9 w-3/5 rounded-lg sm:h-11" />
              <S className="mt-3 h-4 w-11/12 rounded-full" />
              <S className="mt-1.5 h-4 w-4/5 rounded-full" />
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Pill className="w-14" />
                <Pill className="w-16" />
                <Pill className="w-12" />
              </div>
            </div>
          </div>
        </header>
        <article className="py-8 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl space-y-8">
              {/* paragraph group 1 */}
              <div className="space-y-2.5">
                <S className="h-3 w-full rounded-full" />
                <S className="h-3 w-11/12 rounded-full" />
                <S className="h-3 w-5/6 rounded-full" />
              </div>
              {/* heading + paragraph group 2 */}
              <div className="space-y-3">
                <S className="h-5 w-1/3 rounded-lg" />
                <div className="space-y-2.5">
                  <S className="h-3 w-full rounded-full" />
                  <S className="h-3 w-full rounded-full" />
                  <S className="h-3 w-2/3 rounded-full" />
                </div>
              </div>
              {/* paragraph group 3 */}
              <div className="space-y-2.5">
                <S className="h-3 w-full rounded-full" />
                <S className="h-3 w-4/5 rounded-full" />
              </div>
              {/* quote block */}
              <div className="space-y-2.5 rounded-r-xl border-l-[3px] border-primary/30 bg-muted/40 p-4">
                <S className="h-3 w-11/12 rounded-full" />
                <S className="h-3 w-3/4 rounded-full" />
              </div>
              {/* paragraph group 4 */}
              <div className="space-y-2.5">
                <S className="h-3 w-full rounded-full" />
                <S className="h-3 w-5/6 rounded-full" />
              </div>
            </div>
          </div>
        </article>
        {/* Related groups */}
        <div className="container mx-auto px-4 pb-8">
          <div className="mx-auto max-w-3xl">
            <aside className="mt-4 rounded-3xl border bg-muted/20 p-5 sm:p-6">
              <S className="h-5 w-52 rounded-full" />
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    aria-hidden
                    className="flex h-[150px] flex-col rounded-2xl border bg-card p-4 shadow-sm"
                  >
                    <S className="h-12 w-12 rounded-xl" />
                    <S className="mt-3 h-4 w-11/12 rounded-full" />
                    <S className="mt-1.5 h-3 w-2/3 rounded-full" />
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

/** `/grupo/[slug]` — group header + sticky join bar + two-column main
 *  (article left, activity/uploader/info sidebar right). */
export function GrupoRouteSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <span className="sr-only">Cargando…</span>
      <HeaderGhost />
      <BreadcrumbGhost items={3} py="py-2" />
      <main className="flex-1">
        {/* Group header */}
        <section className="border-b bg-background">
          <div className="container mx-auto px-4 py-4 sm:py-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <S className="h-16 w-16 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap gap-1">
                  <Pill className="w-16" />
                  <Pill className="w-20" />
                  <Pill className="w-14" />
                </div>
                <S className="h-6 w-2/3 rounded-lg" />
                <S className="h-3 w-1/2 rounded-full" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              <S className="h-3 w-20 rounded-full" />
              <S className="h-3 w-24 rounded-full" />
              <S className="h-3 w-16 rounded-full" />
            </div>
          </div>
        </section>

        {/* Sticky join bar */}
        <section className="sticky top-16 z-30 border-b bg-background/95">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center gap-2">
              <S className="h-11 min-w-0 flex-1 rounded-xl bg-gradient-to-r from-emerald-500/40 to-teal-600/40" />
              <S className="h-11 w-11 shrink-0 rounded-full sm:h-9" />
              <S className="h-11 w-11 shrink-0 rounded-full sm:h-9" />
              <S className="hidden h-11 w-11 shrink-0 rounded-full sm:h-9 sm:block" />
            </div>
          </div>
        </section>

        {/* Two-column main */}
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <article className="min-w-0 space-y-6">
              <section>
                <S className="mb-2 h-4 w-32 rounded-full" />
                <div className="space-y-2.5">
                  <S className="h-3 w-full rounded-full" />
                  <S className="h-3 w-11/12 rounded-full" />
                  <S className="h-3 w-4/5 rounded-full" />
                  <S className="h-3 w-2/3 rounded-full" />
                </div>
              </section>
              <section>
                <S className="mb-2 h-4 w-24 rounded-full" />
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Pill key={i} className="w-[72px]" />
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border bg-card p-5 shadow-sm">
                <S className="h-5 w-40 rounded-full" />
                <S className="mt-2 h-3 w-56 rounded-full" />
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <S className="h-11 w-full rounded-xl sm:flex-1" />
                  <S className="h-11 w-full rounded-xl sm:flex-1" />
                </div>
              </section>
              <section className="rounded-3xl border bg-gradient-to-b from-muted/40 to-transparent p-4 sm:p-6">
                <S className="h-6 w-48 rounded-lg" />
                <S className="mt-1.5 h-3.5 w-64 rounded-full" />
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:gap-3.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      aria-hidden
                      className="flex h-[150px] flex-col rounded-2xl border bg-card p-4 shadow-sm"
                    >
                      <S className="h-12 w-12 rounded-xl" />
                      <S className="mt-3 h-4 w-11/12 rounded-full" />
                      <S className="mt-1.5 h-3 w-2/3 rounded-full" />
                    </div>
                  ))}
                </div>
              </section>
            </article>

            <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
              {/* Activity card */}
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <S className="h-3 w-24 rounded-full" />
                  <S className="h-3 w-14 rounded-full" />
                </div>
                <S className="mt-3 h-11 w-full rounded-lg" />
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      aria-hidden
                      className="rounded-xl bg-muted/50 px-2 py-2 text-center"
                    >
                      <S className="mx-auto h-6 w-10 rounded-md" />
                      <S className="mx-auto mt-1.5 h-3 w-12 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Uploader card */}
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <S className="h-3 w-28 rounded-full" />
                <div className="mt-3 flex items-center gap-3">
                  <S className="h-12 w-12 rounded-full" />
                  <div className="space-y-1.5">
                    <S className="h-4 w-28 rounded-full" />
                    <S className="h-3 w-24 rounded-full" />
                  </div>
                </div>
              </div>
              {/* Info card */}
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="space-y-2.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      aria-hidden
                      className="flex items-center justify-between"
                    >
                      <S className="h-3 w-24 rounded-full" />
                      <S className="h-3 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
        <FadeCap />
      </main>
    </div>
  );
}

/** `/categoria/[slug]`, `/pais/[code]`, `/ciudad/[slug]` — icon/flag tile
 *  header + chips + 4-column group-card grid. */
export function TaxonomyRouteSkeleton({
  tile = "icon",
}: {
  tile?: "icon" | "flag";
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <span className="sr-only">Cargando…</span>
      <HeaderGhost />
      <BreadcrumbGhost items={3} />
      <main className="flex-1">
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto flex max-w-4xl flex-col items-start gap-5">
              <div className="flex w-full items-start gap-4">
                <div
                  aria-hidden
                  className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/10 sm:h-20 sm:w-20"
                >
                  {tile === "flag" ? (
                    <S className="h-8 w-12 rounded-[3px]" />
                  ) : (
                    <S className="h-8 w-8 rounded-lg" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <S className="h-3 w-20 rounded-full" />
                  <S className="h-10 w-2/3 rounded-lg sm:h-12" />
                  <S className="mt-1 h-4 w-full max-w-2xl rounded-full" />
                  <S className="h-4 w-3/4 rounded-full" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Pill key={i} className="h-7 w-28 border" />
                ))}
              </div>
            </div>
          </div>
        </header>
        <section className="py-10 sm:py-12">
          <div className="container mx-auto px-4">
            <div aria-hidden className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <S className="h-7 w-56 rounded-lg" />
                <S className="mt-2 h-3.5 w-64 rounded-full" />
              </div>
              <S className="h-10 w-36 rounded-xl bg-primary/20" />
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:gap-3.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <GroupCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </section>
        <FadeCap />
      </main>
    </div>
  );
}

/** `/populares` — orange hero + stat chips + orden tabs + filter card +
 *  ranked 4-column grid with podium badges. */
export function PopularesRouteSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <span className="sr-only">Cargando…</span>
      <HeaderGhost />
      <BreadcrumbGhost items={2} />
      <main className="flex-1">
        <header className="border-b bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
              <div className="flex justify-center">
                <S className="h-6 w-32 rounded-full bg-orange-500/20" />
              </div>
              <S className="h-10 w-3/5 rounded-lg sm:h-12" />
              <S className="h-4 w-full max-w-xl rounded-full" />
              <S className="h-4 w-2/3 max-w-xl rounded-full" />
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <S key={i} className="h-7 w-24 rounded-full border bg-background" />
                ))}
              </div>
            </div>
          </div>
        </header>
        <section className="pt-2 sm:pt-4">
          <div className="container mx-auto px-4">
            {/* Orden tabs */}
            <div
              aria-hidden
              className="flex w-fit flex-wrap items-center gap-1.5 rounded-xl border bg-card p-1.5 shadow-sm"
            >
              <S className="h-8 w-24 rounded-lg bg-gradient-to-r from-orange-500/50 to-amber-500/50" />
              <S className="h-8 w-24 rounded-lg" />
              <S className="h-8 w-28 rounded-lg" />
            </div>
            {/* Filters card */}
            <div
              aria-hidden
              className="mt-3 rounded-2xl border bg-card/70 p-4 shadow-sm sm:p-5"
            >
              <div className="flex items-center justify-between">
                <S className="h-3 w-36 rounded-full" />
                <S className="h-5 w-24 rounded-full" />
              </div>
              <div className="mt-3 flex items-start gap-2">
                <S className="h-4 w-12 shrink-0 rounded-full" />
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <S key={i} className="h-7 w-[104px] rounded-full border" />
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-start gap-2 border-t pt-3">
                <S className="h-4 w-12 shrink-0 rounded-full" />
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <S key={i} className="h-7 w-[96px] rounded-full border" />
                  ))}
                </div>
              </div>
            </div>
            {/* Ranked grid */}
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:gap-3.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="relative">
                  <S
                    className={cn(
                      "absolute left-2.5 top-2.5 z-20 h-5 w-10 rounded-full",
                      i < 3 &&
                        "bg-gradient-to-r from-amber-400/50 to-yellow-500/50"
                    )}
                  />
                  <GroupCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        </section>
        <FadeCap />
      </main>
    </div>
  );
}

/** `/buscar` — centered hero + big search box + results card grid. */
export function SearchRouteSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <span className="sr-only">Cargando…</span>
      <HeaderGhost />
      <BreadcrumbGhost items={3} />
      <main className="flex-1">
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-8 sm:py-12">
            <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
              <div className="flex justify-center">
                <BadgeHero className="w-40" />
              </div>
              <S className="h-9 w-2/3 rounded-lg sm:h-11" />
              <S className="h-4 w-full max-w-xl rounded-full" />
              {/* SearchBox */}
              <div className="relative mt-2 w-full max-w-2xl">
                <S className="h-14 w-full rounded-2xl shadow-sm" />
                <S className="absolute right-2 top-2 h-10 w-24 rounded-xl bg-primary/20" />
              </div>
              <div className="flex gap-2">
                <Pill className="h-7 w-24 border bg-background" />
                <Pill className="h-7 w-20 border bg-background" />
              </div>
            </div>
          </div>
        </header>
        <section className="py-10 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:gap-3.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <GroupCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </section>
        <FadeCap />
      </main>
    </div>
  );
}

/** Form / long-content route — header + big card with input-shaped rows
 *  and a submit button (contacto, enviar-grupo, agregar-grupo, legal pages,
 *  admin). */
export function FormRouteSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <span className="sr-only">Cargando…</span>
      <HeaderGhost />
      <BreadcrumbGhost />
      <main className="flex-1">
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto max-w-3xl">
              <BadgeHero className="w-40" />
              <S className="mt-4 h-10 w-2/3 rounded-lg sm:h-12" />
              <S className="mt-3 h-4 w-full rounded-full" />
              <S className="mt-2 h-4 w-4/5 rounded-full" />
            </div>
          </div>
        </header>
        <section className="py-10 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="space-y-2">
                <S className="h-3.5 w-32 rounded-full" />
                <S className="h-11 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <S className="h-3.5 w-24 rounded-full" />
                <S className="h-11 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <S className="h-3.5 w-36 rounded-full" />
                <S className="h-28 w-full rounded-xl" />
              </div>
              <S className="h-11 w-40 rounded-xl bg-primary/20" />
            </div>
          </div>
        </section>
        <FadeCap />
      </main>
    </div>
  );
}

/** Generic content route — breadcrumb + gradient header + card grid.
 *  Used by every remaining list route (categorias, paises, ciudades,
 *  etiqueta, autor, favoritos, comparar, lista, verificar…) and as the
 *  root-level fallback. */
export function ContentGridRouteSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      <span className="sr-only">Cargando…</span>
      <HeaderGhost />
      <BreadcrumbGhost />
      <main className="flex-1">
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto max-w-3xl">
              <BadgeHero className="w-36" />
              <S className="mt-4 h-10 w-2/3 rounded-lg sm:h-12" />
              <S className="mt-3 h-4 w-full rounded-full" />
              <S className="mt-2 h-4 w-4/5 rounded-full" />
            </div>
          </div>
        </header>
        <section className="py-10 sm:py-12">
          <div className="container mx-auto px-4">
            <SectionHeadingGhost title="w-64" sub="w-80" />
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:gap-3.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <GroupCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </section>
        <FadeCap />
      </main>
    </div>
  );
}
