"use client";

import * as React from "react";
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
import { Loader2, Ban, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Contributor = {
  id: string;
  contributorUid: string;
  displayName: string;
  displaySlug: string;
  avatarUrl: string;
  publishedCount: number;
  submittedCount: number;
  rejectedCount: number;
  reputationScore: number;
  isBlocked: boolean;
  isRemoved: boolean;
  blockedReason: string;
  lastSubmissionAt: Date | string | null;
  createdAt: Date | string;
};

interface Props {
  contributors: Contributor[];
  csrfToken: string;
}

function repColor(score: number): string {
  if (score >= 50) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (score >= 20) return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
  return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
}

function formatDate(iso: Date | string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function AdminContributorsTable({
  contributors,
  csrfToken,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  async function act(id: string, action: "block" | "unblock" | "remove") {
    if (busy) return;
    setBusy(`${action}:${id}`);
    try {
      const res = await fetch(`/api/admin/contribuidores/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, csrf: csrfToken }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo actualizar.");
        return;
      }
      toast.success(
        action === "block"
          ? "Colaborador bloqueado."
          : action === "unblock"
            ? "Colaborador reactivado."
            : "Colaborador eliminado."
      );
      router.refresh();
    } catch (err) {
      toast.error("Error de red.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="px-3 text-xs">Colaborador</TableHead>
            <TableHead className="px-2 text-center text-xs">Publicados</TableHead>
            <TableHead className="px-2 text-center text-xs">Enviados</TableHead>
            <TableHead className="px-2 text-center text-xs">Rechazados</TableHead>
            <TableHead className="px-2 text-center text-xs">Reputación</TableHead>
            <TableHead className="px-2 text-xs">Estado</TableHead>
            <TableHead className="px-2 text-xs">Último envío</TableHead>
            <TableHead className="px-2 text-right text-xs">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contributors.map((c) => (
            <TableRow key={c.id} className="text-xs">
              <TableCell className="px-3">
                <div className="flex items-center gap-2">
                  {c.avatarUrl ? (
                    <img
                      src={c.avatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full border object-cover"
                    />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-semibold">
                      {c.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.displayName}</div>
                    <div className="truncate font-mono text-xs text-muted-foreground">
                      {c.contributorUid.slice(0, 16)}…
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-2 text-center tabular-nums">{c.publishedCount}</TableCell>
              <TableCell className="px-2 text-center tabular-nums">{c.submittedCount}</TableCell>
              <TableCell className="px-2 text-center tabular-nums">{c.rejectedCount}</TableCell>
              <TableCell className="px-2 text-center">
                <span
                  className={`inline-flex min-w-9 items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-semibold ${repColor(
                    c.reputationScore
                  )}`}
                >
                  {c.reputationScore}
                </span>
              </TableCell>
              <TableCell className="px-2">
                {c.isRemoved ? (
                  <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">Eliminado</Badge>
                ) : c.isBlocked ? (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Bloqueado</Badge>
                ) : (
                  <Badge className="bg-emerald-600 hover:bg-emerald-700">Activo</Badge>
                )}
              </TableCell>
              <TableCell className="px-2 whitespace-nowrap">{formatDate(c.lastSubmissionAt)}</TableCell>
              <TableCell className="px-2 whitespace-nowrap text-right">
                <div className="inline-flex items-center gap-1">
                  {c.isBlocked || c.isRemoved ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      onClick={() => act(c.id, "unblock")}
                      disabled={busy !== null}
                      title="Reactivar"
                    >
                      {busy === `unblock:${c.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                      onClick={() => act(c.id, "block")}
                      disabled={busy !== null}
                      title="Bloquear"
                    >
                      {busy === `block:${c.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Ban className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                  {!c.isRemoved && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      onClick={() => act(c.id, "remove")}
                      disabled={busy !== null}
                      title="Eliminar (soft)"
                    >
                      {busy === `remove:${c.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
