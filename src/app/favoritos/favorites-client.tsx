"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Share2,
  Trash2,
  Users,
  Sparkles,
  TrendingUp,
  Compass,
  Check,
  Download,
  Upload,
  Loader2,
  ListChecks,
  ArrowUpDown,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFavorites, FAVORITES_MAX } from "@/lib/favorites";
import { GroupCard, SkeletonCard } from "@/components/site/group-card";
import { Reveal } from "@/components/site/reveal";
import { RecentlyViewed } from "@/components/site/recently-viewed";
import type { GroupDTO } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type Ratings = Record<string, { avg: number; count: number }>;

type SortMode = "recent" | "members" | "rating";

const SORT_LABELS: Record<SortMode, string> = {
  recent: "Añadidos recientemente",
  members: "Más miembros",
  rating: "Mejor valorados",
};

interface ExportFile {
  app: string;
  version: number;
  exportedAt: string;
  groups: { id: string; slug: string; title: string }[];
}

const EXPORT_APP = "conectagrupos";
const EXPORT_VERSION = 1;

export function FavoritesClient() {
  const ids = useFavorites((s) => s.ids);
  const hydrated = useFavorites((s) => s.hydrated);
  const clear = useFavorites((s) => s.clear);
  const importIds = useFavorites((s) => s.importIds);
  const { toast } = useToast();

  const [groups, setGroups] = React.useState<GroupDTO[] | null>(null);
  const [ratings, setRatings] = React.useState<Ratings>({});
  const [suggestions, setSuggestions] = React.useState<GroupDTO[]>([]);
  const [suggestionRatings, setSuggestionRatings] = React.useState<Ratings>({});
  const [shareState, setShareState] = React.useState<"idle" | "copied">("idle");
  const [linkState, setLinkState] = React.useState<"idle" | "creating" | "copied">("idle");
  const [importing, setImporting] = React.useState(false);
  const [sortMode, setSortMode] = React.useState<SortMode>("recent");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Favorites order: newest first (store appends at the end).
  const orderedIds = React.useMemo(() => [...ids].reverse(), [ids]);

  // Fetch favorite groups whenever the saved ids change (post-hydration).
  React.useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    async function load() {
      if (orderedIds.length === 0) {
        setGroups([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/groups/favorites?ids=${encodeURIComponent(orderedIds.join(","))}`
        );
        const json = await res.json();
        if (cancelled) return;
        const data: GroupDTO[] = Array.isArray(json?.data) ? json.data : [];
        setGroups(data);
        if (data.length > 0) {
          const rb = await fetch(
            `/api/groups/ratings-batch?ids=${encodeURIComponent(data.map((g) => g.id).join(","))}`
          );
          const rbJson = await rb.json();
          if (!cancelled && rbJson?.ok) setRatings(rbJson.data ?? {});
        }
      } catch {
        if (!cancelled) setGroups([]);
      }
    }
    setGroups(null);
    load();
    return () => {
      cancelled = true;
    };
  }, [hydrated, orderedIds.join(",")]);

  // When the list is empty, show trending suggestions.
  React.useEffect(() => {
    if (!hydrated || (groups !== null && groups.length > 0) || suggestions.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const tr = await fetch("/api/groups/trending");
        const trJson = await tr.json();
        if (cancelled || !trJson?.ok) return;
        const data: GroupDTO[] = Array.isArray(trJson.data) ? trJson.data : [];
        setSuggestions(data);
        if (data.length > 0) {
          const r2 = await fetch(
            `/api/groups/ratings-batch?ids=${encodeURIComponent(data.map((g) => g.id).join(","))}`
          );
          const r2Json = await r2.json();
          if (!cancelled && r2Json?.ok) setSuggestionRatings(r2Json.data ?? {});
        }
      } catch {
        /* suggestions are best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, groups]);

  const totalMembers = React.useMemo(
    () => (groups ?? []).reduce((acc, g) => acc + (g.members || 0), 0),
    [groups]
  );

  // Apply the selected sort to the fetched list (stable copy).
  const sortedGroups = React.useMemo(() => {
    if (!groups) return null;
    const list = [...groups];
    const orderIndex = new Map(orderedIds.map((id, i) => [id, i]));
    if (sortMode === "members") {
      list.sort((a, b) => (b.members ?? 0) - (a.members ?? 0));
    } else if (sortMode === "rating") {
      list.sort(
        (a, b) =>
          (ratings[b.id]?.count ? ratings[b.id].avg : -1) -
          (ratings[a.id]?.count ? ratings[a.id].avg : -1)
      );
    } else {
      // "recent" = the order the user saved them (newest first).
      list.sort(
        (a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0)
      );
    }
    return list;
  }, [groups, sortMode, ratings, orderedIds]);

  async function shareList() {
    if (!groups || groups.length === 0) return;
    const list = groups
      .slice(0, 10)
      .map((g, i) => `${i + 1}. ${g.title} — ${typeof window !== "undefined" ? `${window.location.origin}/grupo/${g.slug}` : g.slug}`)
      .join("\n");
    const text = `Mis grupos favoritos en ConectaGrupos:\n\n${list}${groups.length > 10 ? `\n…y ${groups.length - 10} más.` : ""}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Mis grupos favoritos", text });
        return;
      }
    } catch {
      /* user cancelled share — fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(text);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2500);
      toast({
        title: "Lista copiada",
        description: "Pega tu lista de favoritos donde quieras compartirla.",
      });
    } catch {
      toast({
        title: "No se pudo compartir",
        description: "Tu navegador no permite compartir esta lista.",
        variant: "destructive",
      });
    }
  }

  // ---- Share: create a public server-side list and copy the URL ----
  async function createShareLink() {
    if (!groups || groups.length === 0 || linkState === "creating") return;
    setLinkState("creating");
    try {
      const res = await fetch("/api/favorites/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: groups.map((g) => g.id) }),
      });
      const json = await res.json();
      if (!json?.ok || !json?.data?.shareUrl) {
        throw new Error(json?.error || "No se pudo crear el enlace.");
      }
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}${json.data.shareUrl}`
          : json.data.shareUrl;
      await navigator.clipboard.writeText(url);
      setLinkState("copied");
      setTimeout(() => setLinkState("idle"), 3000);
      toast({
        title: "Enlace público copiado",
        description: "Compártelo: quien lo abra verá tu lista siempre actualizada.",
      });
    } catch (err) {
      setLinkState("idle");
      toast({
        title: "No se pudo crear el enlace",
        description: err instanceof Error ? err.message : "Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  }

  // ---- Export: download a portable JSON backup ----
  function exportList() {
    if (!groups || groups.length === 0) return;
    const payload: ExportFile = {
      app: EXPORT_APP,
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      groups: groups.map((g) => ({ id: g.id, slug: g.slug, title: g.title })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conectagrupos-favoritos-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({
      title: "Copia de seguridad descargada",
      description: `${groups.length} grupos exportados. Guárdala para importarla en otro dispositivo.`,
    });
  }

  // ---- Import: read a JSON backup and merge it ----
  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("El archivo no es un JSON válido.");
      }
      const obj = (parsed ?? {}) as Record<string, unknown>;
      // Accept both our export shape ({groups:[{id,...}]}) and a plain {ids:[...]} list.
      const groupsRaw: unknown[] | null = Array.isArray(obj.groups) ? obj.groups : null;
      const idsRaw: unknown[] | null = Array.isArray(obj.ids) ? obj.ids : null;
      const rawIds: unknown[] = groupsRaw
        ? groupsRaw.map((g) => (g as Record<string, unknown>).id)
        : idsRaw ?? [];
      if (rawIds.length === 0) {
        throw new Error("No se encontraron favoritos en el archivo.");
      }
      const added = importIds(rawIds as string[]);
      if (added > 0) {
        toast({
          title: "Favoritos importados",
          description: `${added} ${added === 1 ? "grupo añadido" : "grupos añadidos"} a tu lista.`,
        });
      } else {
        toast({
          title: "Nada nuevo que importar",
          description: "Todos los grupos del archivo ya estaban en tu lista.",
        });
      }
    } catch (err) {
      toast({
        title: "No se pudo importar",
        description: err instanceof Error ? err.message : "Archivo no reconocido.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  }

  // ---- Loading state (before localStorage hydration) ----
  if (!hydrated || groups === null) {
    return (
      <FavoritesShell count={undefined}>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </FavoritesShell>
    );
  }

  // ---- Empty state ----
  if (groups.length === 0) {
    return (
      <>
        <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="container mx-auto px-4 py-10 sm:py-14">
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
              <span className="relative grid h-20 w-20 place-items-center rounded-3xl bg-rose-500/10 text-rose-500">
                <Heart className="h-10 w-10" />
                <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-background shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </span>
              </span>
              <h1 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">
                Aún no tienes grupos guardados
              </h1>
              <p className="max-w-lg text-pretty text-sm text-muted-foreground sm:text-base">
                Pulsa el corazón <Heart className="inline h-3.5 w-3.5 fill-current text-rose-500" /> de
                cualquier grupo para guardarlo aquí. Tu lista vive en este navegador: sin
                registro, sin cuentas, sin líos.
              </p>
              <p className="max-w-lg text-pretty text-xs text-muted-foreground">
                ¿Vienes de otro dispositivo? Importa tu copia de seguridad abajo y recupera
                tu lista al instante.
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <Button asChild size="sm" className="shadow-sm">
                  <Link href="/">
                    <Compass className="h-4 w-4" /> Explorar grupos
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/categorias">
                    <Sparkles className="h-4 w-4 text-primary" /> Ver categorías
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Importar copia
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={onImportFile}
                  aria-label="Importar favoritos desde un archivo JSON"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Recently viewed (client, localStorage — hidden when empty) */}
        <RecentlyViewed />

        {/* Suggestions */}
        <section className="py-10 sm:py-12" aria-labelledby="sugerencias-heading">
          <div className="container mx-auto px-4">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 id="sugerencias-heading" className="flex items-center gap-2 text-xl font-bold tracking-tight">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Quizá te gustan estos
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Los grupos con más actividad ahora mismo en el directorio.
                </p>
              </div>
            </div>
            {suggestions.length > 0 ? (
              <Reveal>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {suggestions.map((g) => (
                    <GroupCard key={g.id} group={g} rating={suggestionRatings[g.id] ?? null} />
                  ))}
                </div>
              </Reveal>
            ) : (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}
          </div>
        </section>
      </>
    );
  }

  // ---- List state ----
  const displayGroups = sortedGroups ?? groups;
  return (
    <FavoritesShell
      count={groups.length}
      totalMembers={totalMembers}
    >
      {/* Sticky action toolbar — stays visible while scrolling the list */}
      <div className="sticky top-16 z-30 -mx-4 mb-8 border-b border-border/60 bg-background/85 px-4 py-2.5 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <ListChecks className="h-3.5 w-3.5 shrink-0" />
            <span className="tabular-nums">{groups.length}</span>
            <span className="hidden sm:inline">guardados</span>
          </span>
          <span className="hidden min-w-0 items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground md:inline-flex">
            <Users className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span className="tabular-nums">{totalMembers.toLocaleString("es-ES")}</span> miembros
          </span>

          {/* Sort control */}
          <label className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 pl-2.5 pr-1 text-xs text-muted-foreground">
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden />
            <span className="sr-only">Ordenar favoritos</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="h-7 cursor-pointer appearance-none truncate bg-transparent pr-1.5 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Ordenar favoritos"
            >
              {(Object.keys(SORT_LABELS) as SortMode[]).map((m) => (
                <option key={m} value={m}>
                  {SORT_LABELS[m]}
                </option>
              ))}
            </select>
          </label>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={createShareLink}
              disabled={linkState === "creating"}
              className="h-9 gap-1.5 px-2.5 sm:px-3"
              title="Crear enlace público para compartir esta lista"
            >
              {linkState === "creating" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : linkState === "copied" ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {linkState === "copied" ? "¡Enlace copiado!" : "Enlace público"}
              </span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={exportList}
              className="h-9 gap-1.5 px-2.5 sm:px-3"
              title="Descargar copia de seguridad (JSON)"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="h-9 gap-1.5 px-2.5 sm:px-3"
              title="Importar favoritos desde un archivo JSON"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span className="hidden sm:inline">Importar</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={shareList}
              className="h-9 gap-1.5 px-3 shadow-sm"
              title="Compartir tu lista de favoritos"
            >
              {shareState === "copied" ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400">¡Copiada!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Compartir</span>
                </>
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 gap-1.5 px-2.5 text-destructive hover:text-destructive sm:px-3"
                  title="Vaciar la lista de favoritos"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Vaciar</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="cg-pop">
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Vaciar tu lista de favoritos?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se quitarán los {groups.length} grupos guardados de este navegador. Esta
                    acción no se puede deshacer. Si quieres conservarlos, exporta una copia
                    antes de vaciar.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={clear}
                  >
                    Sí, vaciar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Shared hidden file input for import */}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImportFile}
            aria-label="Importar favoritos desde un archivo JSON"
          />
        </div>
      </div>

      <Reveal>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayGroups.map((g) => (
            <motion.div
              key={g.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <GroupCard group={g} rating={ratings[g.id] ?? null} />
            </motion.div>
          ))}
        </div>
      </Reveal>

      {groups.length >= FAVORITES_MAX && (
        <p className="mt-6 rounded-lg border border-amber-300/40 bg-amber-500/10 px-4 py-2.5 text-center text-xs font-medium text-amber-700 dark:text-amber-400">
          Has llegado al máximo de {FAVORITES_MAX} favoritos. Quitaré alguno antes de añadir más.
        </p>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Tus favoritos se guardan solo en este navegador. Exporta una copia para llevarlos a
        otro dispositivo, o impórtala si ya tienes una.
      </p>
    </FavoritesShell>
  );
}

// ---------------------------------------------------------------------------
// Shell with hero shared by loading/list states.
// ---------------------------------------------------------------------------

function FavoritesShell({
  count,
  totalMembers,
  children,
}: {
  count?: number;
  totalMembers?: number;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/40 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-600 dark:text-rose-400">
              <Heart className="h-3.5 w-3.5 fill-current" /> Tu colección personal
            </span>
            <h1 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">
              Mis grupos favoritos
            </h1>
            <p className="max-w-xl text-pretty text-sm text-muted-foreground sm:text-base">
              {count === undefined
                ? "Cargando tu lista…"
                : count === 1
                  ? "Un grupo guardado, listo para unirte cuando quieras."
                  : `${count} grupos guardados${totalMembers ? ` · ${totalMembers.toLocaleString("es-ES")} miembros en total` : ""}.`}
            </p>
            <p className="max-w-xl text-xs text-muted-foreground/80">
              Usa la barra de acciones para compartir tu lista, exportar una copia de
              seguridad o importarla en otro dispositivo.
            </p>
          </div>
        </div>
      </header>

      <section className="py-10 sm:py-12" aria-labelledby="lista-heading">
        <div className="container mx-auto px-4">
          <h2 id="lista-heading" className="sr-only">
            Grupos guardados
          </h2>
          {children}
        </div>
      </section>

      <RecentlyViewed />
    </>
  );
}
