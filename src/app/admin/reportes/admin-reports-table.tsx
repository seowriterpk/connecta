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
import { Loader2, Check, X, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";

type Report = {
  id: string;
  reason: string;
  reporterIp: string;
  status: string;
  createdAt: Date | string;
  group: {
    id: string;
    groupName: string;
    slug: string;
    status: string;
    linkStatus: string;
  } | null;
};

interface Props {
  reports: Report[];
  csrfToken: string;
}

function statusBadge(s: string) {
  if (s === "OPEN")
    return <Badge className="bg-amber-600 hover:bg-amber-700">Abierto</Badge>;
  if (s === "RESOLVED")
    return <Badge className="bg-emerald-600 hover:bg-emerald-700">Resuelto</Badge>;
  return <Badge variant="outline">Descartado</Badge>;
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

export function AdminReportsTable({ reports, csrfToken }: Props) {
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
      toast.success(action === "resolve" ? "Reporte marcado como resuelto." : "Reporte descartado.");
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
            <TableRow key={r.id} className="text-xs">
              <TableCell className="px-3">
                {r.group ? (
                  <div className="flex flex-col gap-1">
                    <Link
                      href={`/admin/grupos/${r.group.id}`}
                      className="truncate font-medium hover:text-emerald-700"
                      title={r.group.groupName}
                    >
                      {r.group.groupName}
                    </Link>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="px-1 py-0 text-[9px]"
                      >
                        {r.group.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="px-1 py-0 text-[9px]"
                      >
                        {r.group.linkStatus}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">Grupo eliminado</span>
                )}
              </TableCell>
              <TableCell className="px-2 max-w-[240px]">
                <div className="truncate" title={r.reason}>
                  {r.reason || "—"}
                </div>
              </TableCell>
              <TableCell className="px-2 font-mono text-xs">{r.reporterIp}</TableCell>
              <TableCell className="px-2">{statusBadge(r.status)}</TableCell>
              <TableCell className="px-2 whitespace-nowrap">{formatDate(r.createdAt)}</TableCell>
              <TableCell className="px-2 whitespace-nowrap text-right">
                <div className="inline-flex items-center gap-1">
                  {r.group && (
                    <>
                      <Button asChild size="icon" variant="ghost" className="h-7 w-7" title="Ver grupo">
                        <Link href={`/grupo/${r.group.slug}`} target="_blank">
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button asChild size="icon" variant="ghost" className="h-7 w-7" title="Editar grupo">
                        <Link href={`/admin/grupos/${r.group.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </>
                  )}
                  {r.status === "OPEN" && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        onClick={() => act(r.id, "resolve")}
                        disabled={busy !== null}
                        title="Marcar resuelto"
                      >
                        {busy === `resolve:${r.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:bg-muted"
                        onClick={() => act(r.id, "dismiss")}
                        disabled={busy !== null}
                        title="Descartar"
                      >
                        {busy === `dismiss:${r.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
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
    </div>
  );
}
