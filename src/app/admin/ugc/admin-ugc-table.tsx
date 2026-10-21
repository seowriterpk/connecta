"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Pencil,
  ListChecks,
  Trash2,
  Eraser,
} from "lucide-react";
import { toast } from "sonner";
import type { AdminSettings } from "@/lib/admin-settings";

type Submission = {
  id: string;
  submissionUid: string;
  fetchedGroupName: string;
  editedGroupName: string;
  contributorDisplayNameSnap: string;
  categoryNameSnapshot: string;
  categoryId: string;
  country: string;
  city: string;
  status: string;
  score: number;
  createdAt: Date | string;
  submittedAt: Date | string | null;
  isAdult: boolean;
  selectedTagsJson: string;
  keywordsJson: string;
  adminNotes: string;
  inviteUrl: string;
  finalImageUrl: string;
  detectedLanguage: string;
};

interface BankItem {
  id: string;
  name: string;
  isAdult?: boolean;
}

interface Props {
  submissions: Submission[];
  csrfToken: string;
  categories: BankItem[];
  countries: BankItem[];
  settings: AdminSettings;
}

const ACTION_STATUS: Record<string, string> = {
  approve: "approved",
  reject: "rejected",
  spam: "spam",
};

const PENDING_STATUSES = new Set(["submitted", "needs_review"]);

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
          className="bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-amber-300"
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

function parseJsonArray(raw: string): string[] {
  try {
    const arr = JSON.parse(raw || "[]");
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

export function AdminUgcTable({ submissions, csrfToken, categories, countries, settings }: Props) {
  const router = useRouter();

  // Local copy of the rows — edited/updated in place so changes appear
  // WITHOUT a reload; resynced whenever the server sends new props.
  const [rows, setRows] = React.useState<Submission[]>(submissions);
  React.useEffect(() => setRows(submissions), [submissions]);

  // --- Selection (bulk) ---
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = React.useState(false);
  const [bulkProgress, setBulkProgress] = React.useState({ done: 0, total: 0 });

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = selected.size > 0 && !allSelected;

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(rows.map((r) => r.id)) : new Set());
  }
  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  /** Bulk approve/reject/spam in chunks of 50, with progress + local sync. */
  async function runBulk(action: "approve" | "reject" | "spam") {
    const ids = [...selected];
    if (ids.length === 0 || bulkRunning) return;

    const verb =
      action === "approve" ? "aprobar" : action === "reject" ? "rechazar" : "marcar como spam";
    if (!window.confirm(`¿Seguro que quieres ${verb} ${ids.length} envío(s)?`)) return;

    setBulkRunning(true);
    setBulkProgress({ done: 0, total: ids.length });

    let okCount = 0;
    let failCount = 0;
    const newStatus = ACTION_STATUS[action];

    try {
      for (let i = 0; i < ids.length; i += 50) {
        const chunk = ids.slice(i, i + 50);
        const res = await fetch("/api/admin/ugc/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: chunk, action, csrf: csrfToken }),
        });
        const data = (await res.json().catch(() => null)) as
          | { ok: boolean; error?: string; counts?: { ok: number; failed: number } }
          | null;
        if (!res.ok || !data?.ok) {
          toast.error(data?.error || "Error en el lote masivo.");
          break;
        }
        okCount += data.counts?.ok ?? 0;
        failCount += data.counts?.failed ?? 0;
        setBulkProgress({ done: Math.min(i + chunk.length, ids.length), total: ids.length });

        // Instant local sync — no reload needed.
        const chunkSet = new Set(chunk);
        setRows((prev) =>
          prev.map((r) => (chunkSet.has(r.id) ? { ...r, status: newStatus } : r))
        );
      }
    } catch {
      toast.error("Error de red durante la acción masiva.");
    } finally {
      setBulkRunning(false);
      setSelected(new Set());
      if (okCount > 0) {
        toast.success(
          `${okCount} envío(s) procesados${failCount ? `, ${failCount} fallaron` : ""}.`
        );
      }
      router.refresh();
    }
  }

  // --- Single actions (review modal) ---
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [action, setAction] = React.useState<string | null>(null);
  const active = rows.find((r) => r.id === activeId) ?? null;

  function openReview(s: Submission) {
    setActiveId(s.id);
    setReviewOpen(true);
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
      setRows((prev) =>
        prev.map((r) => (r.id === active.id ? { ...r, status: ACTION_STATUS[kind] } : r))
      );
      setReviewOpen(false);
      setActiveId(null);
      router.refresh();
    } catch {
      toast.error("Error de red.");
    } finally {
      setAction(null);
    }
  }

  // --- Inline edit dialog ---
  const [editOpen, setEditOpen] = React.useState(false);
  const [editSaving, setEditSaving] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    editedGroupName: "",
    categoryId: "none",
    country: "none",
    city: "",
    tags: "",
    keywords: "",
    isAdult: false,
    adminNotes: "",
  });

  function openEdit(s: Submission) {
    setActiveId(s.id);
    setEditForm({
      editedGroupName: s.editedGroupName || s.fetchedGroupName,
      categoryId: s.categoryId || "none",
      country: s.country || "none",
      city: s.city || "",
      tags: parseJsonArray(s.selectedTagsJson).join(", "),
      keywords: parseJsonArray(s.keywordsJson).join(", "),
      isAdult: s.isAdult,
      adminNotes: s.adminNotes || "",
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!activeId || editSaving) return;
    setEditSaving(true);
    try {
      const patch = {
        editedGroupName: editForm.editedGroupName,
        categoryId: editForm.categoryId !== "none" ? editForm.categoryId : undefined,
        country: editForm.country !== "none" ? editForm.country : "",
        city: editForm.city,
        selectedTags: editForm.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        keywords: editForm.keywords
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        isAdult: editForm.isAdult,
        adminNotes: editForm.adminNotes,
      };
      const res = await fetch(`/api/admin/ugc/${activeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch, csrf: csrfToken }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo guardar.");
        return;
      }
      toast.success("Envío actualizado.");
      // Instant local sync — the row reflects the edit without a reload.
      const cat = categories.find((c) => c.id === editForm.categoryId);
      setRows((prev) =>
        prev.map((r) =>
          r.id === activeId
            ? {
                ...r,
                editedGroupName: editForm.editedGroupName,
                categoryId: editForm.categoryId !== "none" ? editForm.categoryId : "",
                categoryNameSnapshot: cat?.name ?? r.categoryNameSnapshot,
                country: editForm.country !== "none" ? editForm.country : r.country,
                city: editForm.city,
                selectedTagsJson: JSON.stringify(patch.selectedTags),
                keywordsJson: JSON.stringify(patch.keywords),
                isAdult: editForm.isAdult,
                adminNotes: editForm.adminNotes,
              }
            : r
        )
      );
      setEditOpen(false);
      router.refresh();
    } catch {
      toast.error("Error de red.");
    } finally {
      setEditSaving(false);
    }
  }

  const selectedCount = selected.size;

  return (
    <>
      {/* Bulk action bar */}
      {rows.length > 0 && (
        <div className="flex flex-col gap-2 border-b bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={allSelected ? true : someSelected ? "indeterminate" : false}
              onCheckedChange={(v) => toggleAll(v === true)}
              aria-label="Seleccionar todos"
            />
            <span className="text-muted-foreground">
              {selectedCount > 0 ? (
                <>
                  <span className="font-semibold text-foreground">{selectedCount}</span>{" "}
                  seleccionado(s)
                </>
              ) : (
                "Marca casillas para acciones en masa"
              )}
            </span>
            {selectedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => setSelected(new Set())}
                disabled={bulkRunning}
              >
                <Eraser className="h-3.5 w-3.5" />
                Limpiar
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {bulkRunning && (
              <div className="w-40">
                <Progress
                  value={Math.round((bulkProgress.done / Math.max(bulkProgress.total, 1)) * 100)}
                  className="h-2"
                />
              </div>
            )}
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={selectedCount === 0 || bulkRunning}
              onClick={() => runBulk("approve")}
            >
              {bulkRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Aprobar en masa
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={selectedCount === 0 || bulkRunning}
              onClick={() => runBulk("reject")}
            >
              <XCircle className="h-4 w-4" />
              Rechazar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
              disabled={selectedCount === 0 || bulkRunning}
              onClick={() => runBulk("spam")}
            >
              <Trash2 className="h-4 w-4" />
              Spam
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10 px-3" />
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
            {rows.map((s) => {
              const name = s.editedGroupName || s.fetchedGroupName || "(sin nombre)";
              const fetchedMismatch =
                s.fetchedGroupName &&
                s.editedGroupName &&
                s.fetchedGroupName !== s.editedGroupName;
              const isSel = selected.has(s.id);
              return (
                <TableRow
                  key={s.id}
                  className={`text-xs ${isSel ? "bg-emerald-50/50 dark:bg-emerald-950/10" : ""}`}
                >
                  <TableCell className="px-3">
                    <Checkbox
                      checked={isSel}
                      onCheckedChange={(v) => toggleOne(s.id, v === true)}
                      aria-label={`Seleccionar ${name}`}
                      disabled={bulkRunning}
                    />
                  </TableCell>
                  <TableCell className="px-3">
                    <button
                      onClick={() => openReview(s)}
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
                    <div className="flex items-center justify-end gap-1">
                      {PENDING_STATUSES.has(s.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 px-2 text-xs"
                          onClick={() => openEdit(s)}
                          title="Edición rápida sin recargar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => openReview(s)}>
                        Revisar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Review modal */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
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
            <DialogDescription>{active?.submissionUid}</DialogDescription>
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
                <div className="rounded-lg border bg-muted/30 p-3 sm:col-span-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Enlace de invitación
                  </div>
                  <div className="mt-1 truncate text-sm font-medium">
                    <a
                      href={active.inviteUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      {active.inviteUrl}
                    </a>
                  </div>
                </div>
              </div>

              {(parseJsonArray(active.selectedTagsJson).length > 0 ||
                parseJsonArray(active.keywordsJson).length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {parseJsonArray(active.selectedTagsJson).map((t) => (
                    <Badge key={`t-${t}`} variant="secondary">{t}</Badge>
                  ))}
                  {parseJsonArray(active.keywordsJson).map((k) => (
                    <Badge key={`k-${k}`} variant="outline">{k}</Badge>
                  ))}
                </div>
              )}

              {active.adminNotes && (
                <div className="rounded-lg border bg-amber-50/50 p-3 text-sm dark:bg-amber-950/20">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Notas del admin
                  </div>
                  <div className="mt-1">{active.adminNotes}</div>
                </div>
              )}

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
                  <div className={`rounded-md px-3 py-1.5 text-xs font-semibold ${scoreColor(active.score)}`}>
                    {active.score >= settings.autoPublishScoreMin
                      ? "Auto-publicable"
                      : active.score >= settings.reviewScoreMin
                        ? "Revisión manual"
                        : "Riesgo alto"}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Umbral actual: score ≥ {settings.autoPublishScoreMin} →
                  auto-publicable{settings.autoPublishEnabled ? "" : " (auto-publicación DESACTIVADA)"}; ≥{" "}
                  {settings.reviewScoreMin} → revisión; menos → posible spam.
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
            <Button variant="outline" onClick={() => runAction("reject")} disabled={action !== null}>
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

      {/* Inline edit modal (no reload) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-emerald-600" />
              Edición rápida del envío
            </DialogTitle>
            <DialogDescription>
              Los cambios se guardan al instante, sin recargar la página. La
              categoría adulta marca el envío como +18 automáticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs" htmlFor="edit-name">Nombre del grupo</Label>
              <Input
                id="edit-name"
                value={editForm.editedGroupName}
                onChange={(e) => setEditForm((f) => ({ ...f, editedGroupName: e.target.value }))}
                maxLength={255}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoría</Label>
              <Select
                value={editForm.categoryId}
                onValueChange={(v) => setEditForm((f) => ({ ...f, categoryId: v }))}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sin resolver —</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.isAdult ? " 🔞" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">País</Label>
              <Select
                value={editForm.country}
                onValueChange={(v) => setEditForm((f) => ({ ...f, country: v }))}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Sin país —</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="edit-city">Ciudad</Label>
              <Input
                id="edit-city"
                value={editForm.city}
                onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                maxLength={120}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <div>
                <div className="text-sm font-medium">Contenido adulto (+18)</div>
                <div className="text-xs text-muted-foreground">Se sincroniza con la categoría.</div>
              </div>
              <Switch
                checked={editForm.isAdult}
                onCheckedChange={(v) => setEditForm((f) => ({ ...f, isAdult: v }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="edit-tags">Etiquetas (separadas por coma)</Label>
              <Input
                id="edit-tags"
                value={editForm.tags}
                onChange={(e) => setEditForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="amistad, juegos, memes"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="edit-keywords">Palabras clave (coma)</Label>
              <Input
                id="edit-keywords"
                value={editForm.keywords}
                onChange={(e) => setEditForm((f) => ({ ...f, keywords: e.target.value }))}
                placeholder="pubg, español, móvil"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs" htmlFor="edit-notes">Notas internas (opcional)</Label>
              <Textarea
                id="edit-notes"
                value={editForm.adminNotes}
                onChange={(e) => setEditForm((f) => ({ ...f, adminNotes: e.target.value }))}
                rows={3}
                placeholder="Contexto de la revisión, razones del cambio…"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editSaving}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={saveEdit}
              disabled={editSaving || !editForm.editedGroupName.trim()}
            >
              {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk-mode helper icon for screen readers */}
      <span className="sr-only">
        <ListChecks /> Herramienta de gestión en masa activa
      </span>
    </>
  );
}
