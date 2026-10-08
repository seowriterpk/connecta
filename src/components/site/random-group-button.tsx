"use client";

import * as React from "react";
import { Shuffle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { GroupDTO } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function RandomGroupButton({ className }: { className?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  async function pick() {
    setLoading(true);
    try {
      const res = await fetch("/api/groups/random?XTransformPort=3000");
      const json = await res.json();
      if (!res.ok || !json.ok || !json.data) {
        throw new Error(json.error || "No disponible");
      }
      const g = json.data as GroupDTO;
      toast({ title: "¡Grupo sorpresa! 🎲", description: g.title });
      router.push(`/grupo/${g.slug}`);
    } catch (e: any) {
      toast({ title: "No se pudo cargar", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={pick}
      disabled={loading}
      variant="outline"
      size="sm"
      className={`gap-1.5 ${className ?? ""}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Shuffle className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">Grupo aleatorio</span>
      <span className="sm:hidden">Sorpréndeme</span>
    </Button>
  );
}
