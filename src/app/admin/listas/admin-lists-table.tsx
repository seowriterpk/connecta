"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Loader2, Eye, Trash2, Copy, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type ListRow = {
  id: string;
  shareCode: string;
  title: string | null;
  groupCount: number;
  viewCount: number;
  createdAt: Date | string;
  lastViewedAt: Date | string | null;
  stale: boolean;
};

interface Props {
  lists: ListRow[];
  csrfToken: string;
  staleCount: number;
  staleDays: number;
}

function formatDate(iso: Date | string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function copyLink(code: string) {
  const url = `${window.location.origin}/lista/${code}`;
  navigator.clipboard
    .writeText(url)
    .then(() => toast.success("Enlace copiado al portapapeles."))
    .catch(() => toast.error("No se pudo copiar el enlace."));
}

export function AdminListsTable({ lists, csrfToken, staleCount, staleDays }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [gcBusy, setGcBusy] = React.useState(false);
  const [localStale, setLocalStale] = React.useState(staleCount);

  async function deleteList(id: string, shareCode: string) {
    if (busyId || gcBusy) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/lists/${id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken },
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo eliminar la lista.");
        return;
      }
      toast.success(`Lista ${shareCode} eliminada.`);
      router.refresh();
    } catch {
      toast.error("Error de red.");
    } finally {
      setBusyId(null);
    }
  }

  async function runGc() {
    if (busyId || gcBusy) return;
    setGcBusy(true);
    try {
      const res = await fetch("/api/admin/lists/gc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrf: csrfToken }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo ejecutar la limpieza.");
        return;
      }
      const { deleted } = data.data ?? { deleted: 0 };
      if (deleted > 0) {
        toast.success(`Limpieza completada: ${deleted} listas obsoletas eliminadas.`);
        setLocalStale(0);
      } else {
        toast.info("No había listas obsoletas que eliminar.");
        setLocalStale(0);
      }
      router.refresh();
    } catch {
      toast.error("Error de red.");
    } finally {
      setGcBusy(false);
    }
  }

  return (
    <div>
      {/* GC banner */}
      {localStale > 0 && (
        <div className="mx-3 mb-2 flex flex-col gap-2 rounded-xl border border-amber-300/60 bg-amber-50/80 p-3 text-sm dark:border-amber-500/30 dark:bg-amber-950/30 sm:mx-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="font-medium">
                {localStale} {localStale === 1 ? "lista obsoleta" : "listas obsoletas"}
              </p>
              <p className="text-xs text-muted-foreground">
                Sin visitas y creadas hace más de {staleDays} días. Líbralas para mantener
                la tabla limpia.
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 border-amber-400/60 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
                disabled={gcBusy || busyId !== null}
              >
                {gcBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Limpiar ahora
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar {localStale} listas obsoletas?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminarán permanentemente las listas sin visitas creadas hace más de{" "}
                  {staleDays} días. Los enlaces /lista/ asociados dejarán de funcionar.
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={runGc}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Sí, limpiar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="px-3 text-xs">Código</TableHead>
              <TableHead className="px-2 text-xs">Título</TableHead>
              <TableHead className="px-2 text-xs">Grupos</TableHead>
              <TableHead className="px-2 text-xs">Visitas</TableHead>
              <TableHead className="px-2 text-xs">Creada</TableHead>
              <TableHead className="px-2 text-xs">Última visita</TableHead>
              <TableHead className="px-2 text-right text-xs">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lists.map((l) => (
              <TableRow key={l.id} className="text-xs">
                <TableCell className="px-3">
                  <Link
                    href={`/lista/${l.shareCode}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 font-mono font-semibold text-teal-700 hover:underline dark:text-teal-400"
                    title={`Abrir /lista/${l.shareCode}`}
                  >
                    {l.shareCode}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </Link>
                </TableCell>
                <TableCell className="px-2 max-w-[220px]">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate" title={l.title ?? undefined}>
                      {l.title ?? <span className="italic text-muted-foreground">Sin título</span>}
                    </span>
                    {l.stale && (
                      <Badge
                        variant="outline"
                        className="shrink-0 border-amber-300/60 bg-amber-50 px-1.5 text-[9px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                      >
                        Obsoleta
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-2 tabular-nums">{l.groupCount}</TableCell>
                <TableCell className="px-2">
                  <Badge
                    variant="outline"
                    className={`tabular-nums ${
                      l.viewCount > 0
                        ? "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    {l.viewCount}
                  </Badge>
                </TableCell>
                <TableCell className="px-2 whitespace-nowrap">{formatDate(l.createdAt)}</TableCell>
                <TableCell className="px-2 whitespace-nowrap">
                  {formatDate(l.lastViewedAt)}
                </TableCell>
                <TableCell className="px-2 text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      title="Copiar enlace público"
                      onClick={() => copyLink(l.shareCode)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          disabled={busyId !== null || gcBusy}
                          title="Eliminar lista"
                        >
                          {busyId === l.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar la lista {l.shareCode}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            El enlace público /lista/{l.shareCode} dejará de funcionar
                            ({l.groupCount} grupos, {l.viewCount} visitas). Esta acción no se
                            puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteList(l.id, l.shareCode)}
                            className="bg-rose-600 hover:bg-rose-700"
                          >
                            Sí, eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
