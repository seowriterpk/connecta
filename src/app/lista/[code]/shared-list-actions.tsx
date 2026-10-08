"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart, Check, Loader2, HeartOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/lib/favorites";
import { useToast } from "@/hooks/use-toast";

/**
 * Toolbar shown on a shared list page:
 * - "Guardar lista" imports every group into your localStorage favorites
 *   (dedup + cap handled by the store's importIds).
 */
export function SharedListActions({ ids }: { ids: string[] }) {
  const importIds = useFavorites((s) => s.importIds);
  const currentIds = useFavorites((s) => s.ids);
  const hydrated = useFavorites((s) => s.hydrated);
  const { toast } = useToast();
  const router = useRouter();
  const [justSaved, setJustSaved] = React.useState(false);

  // Avoid hydration mismatch: only render decisions after localStorage hydration.
  const allSaved = React.useMemo(
    () => hydrated && ids.length > 0 && ids.every((id) => currentIds.includes(id)),
    [hydrated, ids, currentIds]
  );

  function saveList() {
    const added = importIds(ids);
    if (added > 0) {
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
      toast({
        title: "Lista guardada",
        description: `${added} ${added === 1 ? "grupo añadido" : "grupos añadidos"} a tus favoritos.`,
      });
      router.refresh();
    } else {
      toast({
        title: "Ya lo tienes todo",
        description: "Todos los grupos de esta lista ya están en tus favoritos.",
      });
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
      <Button
        size="sm"
        variant={allSaved ? "outline" : "default"}
        onClick={saveList}
        disabled={allSaved}
        className="shadow-sm"
      >
        {allSaved ? (
          <>
            <Check className="h-4 w-4 text-emerald-600" /> Lista guardada
          </>
        ) : justSaved ? (
          <>
            <Check className="h-4 w-4" /> ¡Guardada!
          </>
        ) : (
          <>
            <Heart className="h-4 w-4" /> Guardar lista en mis favoritos
          </>
        )}
      </Button>
      {!allSaved && hydrated && currentIds.length > 0 && ids.length > 0 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            // Replace favorites with exactly this list: clear, then import.
            useFavorites.getState().clear();
            importIds(ids);
            toast({
              title: "Lista guardada",
              description: "Tus favoritos ahora son exactamente esta lista.",
            });
            router.refresh();
          }}
          className="text-muted-foreground"
          title="Reemplaza tus favoritos actuales por esta lista"
        >
          <HeartOff className="h-4 w-4" /> Reemplazar mis favoritos
        </Button>
      )}
    </div>
  );
}
