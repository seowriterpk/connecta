"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type Submission = {
  id: string;
  submissionUid: string;
  fetchedGroupName: string;
  editedGroupName: string;
  contributorDisplayNameSnap: string;
  categoryNameSnapshot: string;
  country: string;
  city: string;
  status: string;
  score: number;
  createdAt: Date | string;
  submittedAt: Date | string | null;
  isAdult: boolean;
};

interface Props {
  submissions: Submission[];
  csrfToken: string;
}

// Inline formatting helpers (cannot pass functions across server/client boundary)
function statusBadge(status: string) {
  switch (status) {
    case "submitted":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        >
          Enviado
        </Badge>
      );
    case "needs_review":
      return (
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300"
        >
          Revisión
        </Badge>
      );
    case "approved":
    case "published":
    case "auto_published":
      return <Badge className="bg-emerald-600 hover:bg-emerald-700">Publicado</Badge>;
    case "rejected":
      return (
        <Badge
          variant="secondary"
          className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
        >
          Rechazado
        </Badge>
      );
    case "spam":
      return <Badge variant="destructive">Spam</Badge>;
    case "duplicate":
      return <Badge variant="outline">Duplicado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function scoreColor(score: number): string {
  if (score >= 70)
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (score >= 40)
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
  return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
}

function formatDate(iso: Date | string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
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

export function AdminUgcTable({ submissions, csrfToken }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<Submission | null>(null);
  const [action, setAction] = React.useState<string | null>(null);

  function openModal(s: Submission) {
    setActive(s);
    setOpen(true);
  }

  async function runAction(kind: "approve" | "reject" | "spam") {
    if (!active || action) return;
    setAction(kind);
    try {
      const res = await fetch(`/api/admin/ugc/${active.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: kind, csrf: csrfToken }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo actualizar.");
        return;
      }
      toast.success(
        kind === "approve"
          ? "Envío aprobado y publicado."
          : kind === "reject"
            ? "Envío rechazado."
            : "Envío marcado como spam."
      );
      setOpen(false);
      setActive(null);
      router.refresh();
    } catch (err) {
      toast.error("Error de red.");
    } finally {
      setAction(null);
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="px-3 text-xs">UID / Nombre</TableHead>
              <TableHead className="px-2 text-xs">Colaborador</TableHead>
              <TableHead className="px-2 text-xs">Cat / País</TableHead>
              <TableHead className="px-2 text-xs">Estado</TableHead>
              <TableHead className="px-2 text-center text-xs">Score</TableHead>
              <TableHead className="px-2 text-xs">Enviado</TableHead>
              <TableHead className="px-2 text-right text-xs">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((s) => {
              const name = s.editedGroupName || s.fetchedGroupName || "(sin nombre)";
              const fetchedMismatch =
                s.fetchedGroupName &&
                s.editedGroupName &&
                s.fetchedGroupName !== s.editedGroupName;
              return (
                <TableRow key={s.id} className="text-xs">
                  <TableCell className="px-3">
                    <button
                      onClick={() => openModal(s)}
                      className="block max-w-[260px] text-left"
                      title="Ver detalles"
                    >
                      <div className="truncate font-medium text-foreground hover:text-emerald-700">
                        {name}
                      </div>
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {s.submissionUid}
                      </div>
                      {fetchedMismatch && (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3 w-3" />
                          Nombre editado
                        </div>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="px-2">{s.contributorDisplayNameSnap || "Anónimo"}</TableCell>
                  <TableCell className="px-2">
                    <div>{s.categoryNameSnapshot || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.country}
                      {s.city ? ` · ${s.city}` : ""}
                    </div>
                  </TableCell>
                  <TableCell className="px-2">{statusBadge(s.status)}</TableCell>
                  <TableCell className="px-2 text-center">
                    <span
                      className={`inline-flex min-w-9 items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-semibold ${scoreColor(
                        s.score
                      )}`}
                    >
                      {s.score}
                    </span>
                  </TableCell>
                  <TableCell className="px-2 whitespace-nowrap">{formatDate(s.submittedAt || s.createdAt)}</TableCell>
                  <TableCell className="px-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => openModal(s)}>
                      Revisar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Review modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Revisar envío UGC
              {active?.isAdult && (
                <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  +18
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {active?.submissionUid}
            </DialogDescription>
          </DialogHeader>

          {active && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Nombre editado
                  </div>
                  <div className="mt-1 text-sm font-medium">{active.editedGroupName || "—"}</div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Nombre fetched (WhatsApp)
                  </div>
                  <div className="mt-1 text-sm font-medium">{active.fetchedGroupName || "—"}</div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Colaborador
                  </div>
                  <div className="mt-1 text-sm font-medium">
                    {active.contributorDisplayNameSnap || "Anónimo"}
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Categoría / País
                  </div>
                  <div className="mt-1 text-sm font-medium">
                    {active.categoryNameSnapshot || "—"} / {active.country}
                    {active.city ? ` · ${active.city}` : ""}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Score de calidad
                    </div>
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                      {active.score}
                      <span className="text-sm text-muted-foreground">/100</span>
                    </div>
                  </div>
                  <div
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${scoreColor(active.score)}`}
                  >
                    {active.score >= 70
                      ? "Auto-publicable"
                      : active.score >= 40
                        ? "Revisión manual"
                        : "Riesgo alto"}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Desglose detallado disponible en la ficha técnica del envío. Score ≥70 →
                  apto para auto-publicación; 40-69 → revisión; &lt;40 → posible spam.
                </p>
              </div>

              <div className="text-xs text-muted-foreground">
                Enviado: {formatDate(active.submittedAt || active.createdAt)} · Estado:{" "}
                {statusBadge(active.status)}
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
              onClick={() => runAction("spam")}
              disabled={action !== null}
            >
              <Loader2 className={`h-4 w-4 animate-spin ${action === "spam" ? "inline" : "hidden"}`} />
              <AlertTriangle className={`h-4 w-4 ${action === "spam" ? "hidden" : "inline"}`} />
              Spam
            </Button>
            <Button
              variant="outline"
              onClick={() => runAction("reject")}
              disabled={action !== null}
            >
              <Loader2 className={`h-4 w-4 animate-spin ${action === "reject" ? "inline" : "hidden"}`} />
              <XCircle className={`h-4 w-4 ${action === "reject" ? "hidden" : "inline"}`} />
              Rechazar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => runAction("approve")}
              disabled={action !== null}
            >
              <Loader2 className={`h-4 w-4 animate-spin ${action === "approve" ? "inline" : "hidden"}`} />
              <CheckCircle2 className={`h-4 w-4 ${action === "approve" ? "hidden" : "inline"}`} />
              Aprobar y publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
