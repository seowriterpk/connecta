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
  Loader2,
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
import { useFavorites } from "@/lib/favorites";
import { GroupCard, SkeletonCard } from "@/components/site/group-card";
import { Reveal } from "@/components/site/reveal";
import type { GroupDTO } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type Ratings = Record<string, { avg: number; count: number }>;

export function FavoritesClient() {
  const ids = useFavorites((s) => s.ids);
  const hydrated = useFavorites((s) => s.hydrated);
  const clear = useFavorites((s) => s.clear);
  const { toast } = useToast();

  const [groups, setGroups] = React.useState<GroupDTO[] | null>(null);
  const [ratings, setRatings] = React.useState<Ratings>({});
  const [suggestions, setSuggestions] = React.useState<GroupDTO[]>([]);
  const [suggestionRatings, setSuggestionRatings] = React.useState<Ratings>({});
  const [shareState, setShareState] = React.useState<"idle" | "copied">("idle");

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
              </div>
            </div>
          </div>
        </header>

        {/* Suggestions */}
        <section className="py-10 sm:py-12" aria-labelledby="sugerencias-heading">
          <div className="container mx-auto px-4">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 id="sugerencias-heading" className="flex items-center gap-2 text-xl font-bold tracking-tight">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Quizá te gusten estos
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
  return (
    <FavoritesShell
      count={groups.length}
      totalMembers={totalMembers}
      onShare={shareList}
      shareState={shareState}
      onClear={clear}
    >
      <Reveal>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {groups.map((g) => (
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

      {groups.length > 0 && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Tus favoritos se guardan solo en este navegador. Si lo limpias o cambias de
          dispositivo, la lista se reinicia.
        </p>
      )}
    </FavoritesShell>
  );
}

// ---------------------------------------------------------------------------
// Shell with hero + actions shared by loading/list states.
// ---------------------------------------------------------------------------

function FavoritesShell({
  count,
  totalMembers,
  onShare,
  shareState,
  onClear,
  children,
}: {
  count?: number;
  totalMembers?: number;
  onShare?: () => void;
  shareState?: "idle" | "copied";
  onClear?: () => void;
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

            {count !== undefined && count > 0 && (
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" onClick={onShare} className="shadow-sm">
                  {shareState === "copied" ? (
                    <>
                      <Check className="h-4 w-4" /> ¡Copiada!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" /> Compartir lista
                    </>
                  )}
                </Button>

                {onClear && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" /> Vaciar favoritos
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="cg-pop">
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Vaciar tu lista de favoritos?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se quitarán los {count} grupos guardados de este navegador. Esta
                          acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={onClear}
                        >
                          Sí, vaciar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
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
    </>
  );
}
