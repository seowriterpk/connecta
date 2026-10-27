"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Check, X, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  AdminReportStatusBadge,
  AdminGroupStatusBadge,
  AdminLinkStatusBadge,
} from "@/components/admin/admin-badges";
import type { AdminReportRow } from "@/lib/admin-listing-params";

interface Props {
  reports: AdminReportRow[];
  csrfToken: string;
  /** Explorer callback: refetch the current view after an action. */
  onChanged?: () => void;
}

function formatDate(iso: string): string {
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

export function AdminReportsTable({ reports, csrfToken, onChanged }: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  async function act(id: string, action: "resolve" | "dismiss") {
    if (busy) return;
    setBusy(`${action}:${id}`);
    try {
      const res = await fetch(`/api/admin/reportes/${id}`, {
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
        action === "resolve" ? "Reporte marcado como resuelto." : "Reporte descartado."
      );
      if (onChanged) onChanged();
      else router.refresh();
    } catch {
      toast.error("Error de red.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Table containerClassName="cg-scroll max-h-[70vh] overflow-y-auto">
      <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow className="bg-background hover:bg-background">
            <TableHead className="px-3 text-xs">Grupo</TableHead>
            <TableHead className="px-2 text-xs">Motivo</TableHead>
            <TableHead className="px-2 text-xs">IP reportante</TableHead>
            <TableHead className="px-2 text-xs">Estado</TableHead>
            <TableHead className="px-2 text-xs">Fecha</TableHead>
            <TableHead className="px-2 text-right text-xs">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((r) => (
            <TableRow key={r.id} className="text-xs transition-colors">
              <TableCell className="px-3">
                {r.groupName != null ? (
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/admin/grupos/${r.groupId}`}
                      className="max-w-[220px] truncate text-sm font-medium hover:text-emerald-700 dark:hover:text-emerald-400"
                      title={r.groupName}
                    >
                      {r.groupName}
                    </Link>
                    <div className="flex items-center gap-1">
                      {r.groupStatus && <AdminGroupStatusBadge status={r.groupStatus} />}
                      {r.groupLinkStatus && (
                        <AdminLinkStatusBadge linkStatus={r.groupLinkStatus} />
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="italic text-muted-foreground">Grupo eliminado</span>
                )}
              </TableCell>
              <TableCell className="max-w-[240px] px-2">
                <div className="truncate" title={r.reason}>
                  {r.reason || "—"}
                </div>
              </TableCell>
              <TableCell className="px-2 font-mono text-xs">{r.reporterIp}</TableCell>
              <TableCell className="px-2">
                <AdminReportStatusBadge status={r.status} />
              </TableCell>
              <TableCell className="px-2 whitespace-nowrap">{formatDate(r.createdAt)}</TableCell>
              <TableCell className="px-2 whitespace-nowrap text-right">
                <div className="inline-flex items-center gap-1">
                  {r.groupName != null && (
                    <>
                      <Button
                        asChild
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-muted-foreground hover:text-foreground"
                      >
                        <Link
                          href={`/grupo/${r.groupSlug}`}
                          target="_blank"
                          title="Ver grupo"
                          aria-label={`Ver ${r.groupName} en el sitio`}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-muted-foreground hover:text-foreground"
                      >
                        <Link
                          href={`/admin/grupos/${r.groupId}`}
                          title="Editar grupo"
                          aria-label={`Editar ${r.groupName}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </>
                  )}
                  {r.status === "OPEN" && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        onClick={() => act(r.id, "resolve")}
                        disabled={busy !== null}
                        title="Marcar resuelto"
                        aria-label="Marcar reporte como resuelto"
                      >
                        {busy === `resolve:${r.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-muted-foreground hover:bg-muted"
                        onClick={() => act(r.id, "dismiss")}
                        disabled={busy !== null}
                        title="Descartar"
                        aria-label="Descartar reporte"
                      >
                        {busy === `dismiss:${r.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
  );
}
