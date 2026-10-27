"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  FilterX,
  AlertCircle,
  RotateCw,
  Inbox,
  UploadCloud,
  MoreHorizontal,
  CheckCircle2,
  Trash2,
  Pencil,
  Copy,
  ListPlus,
  X,
  Timer,
  Clock,
  FolderClock,
  ShieldAlert,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdminTableFetch } from "@/components/admin/use-admin-table-fetch";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { GroupImage } from "@/components/site/group-image";
import {
  adminQueueSearchParams,
  QUEUE_PAGE_SIZES,
  type AdminAdultFilter,
  type AdminPendingRow,
  type AdminQueueFilters,
  type AdminQueuePage,
  type AdminQueueRow,
  type AdminQueueSort,
  type AdminQueueSource,
  type AdminQueueStats,
} from "@/lib/admin-listing-params";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Filters + active tab (source rides along so the hook refetches on switch). */
type QueueTabFilters = AdminQueueFilters & { source: AdminQueueSource };

/** GET /api/admin/queue payload — stats always ride along. */
interface QueueData {
  page: AdminQueuePage;
  stats: AdminQueueStats;
}

interface EditFormState {
  groupName: string;
  joinLink: string;
  description: string;
  category: string;
  country: string;
  city: string;
  tags: string;
  keywords: string;
  isAdult: boolean;
  profileImage: string;
}

interface DeleteConfirm {
  action: "deleteQueue" | "deletePending";
  ids: (number | string)[];
  count: number;
}

interface Props {
  initialData: QueueData;
  initialFilters: AdminQueueFilters;
  initialSource: AdminQueueSource;
  categories: { id: string; name: string }[];
  countries: { id: string; name: string }[];
  csrfToken: string;
  pageSizes?: readonly number[];
}

const DEFAULT_BASE: AdminQueueFilters = {
  q: "",
  category: "all",
  country: "all",
  adult: "all",
  sort: "addedAsc",
  page: 1,
  pageSize: 25,
};

const INVITE_RE = /^https?:\/\/(chat\.whatsapp\.com|wa\.me)\/[A-Za-z0-9_-]+/i;

type BulkAction = "publish" | "move" | "deleteQueue" | "deletePending";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isQueueRow(row: AdminQueueRow | AdminPendingRow): row is AdminQueueRow {
  return typeof row.id === "number";
}

/** "chat.whatsapp.com/Qa30bX…k1F2" — keep head + tail for long invite codes. */
function middleTruncate(s: string, max = 34): string {
  if (s.length <= max) return s;
  const head = Math.ceil((max - 1) / 2);
  const tail = Math.floor((max - 1) / 2);
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/** "hace 45 s / hace 5 min / hace 3 h / hace 2 días" from a ms timestamp. */
function relativeFromMs(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 5) return "ahora";
  if (s < 60) return `hace ${s} s`;
  const min = Math.floor(s / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} ${d === 1 ? "día" : "días"}`;
  const months = Math.floor(d / 30);
  return `hace ${months} ${months === 1 ? "mes" : "meses"}`;
}

function relativeFromIso(iso: string | null): string {
  if (!iso) return "—";
  try {
    return relativeFromMs(Date.now() - new Date(iso).getTime());
  } catch {
    return "—";
  }
}

/** Stored JSON list ("[\"a\",\"b\"]") → "a, b" for the edit inputs. */
function storedListToCsv(raw: string): string {
  try {
    const v = JSON.parse(raw || "[]");
    if (Array.isArray(v)) return v.map(String).join(", ");
  } catch {
    /* raw comma-separated value from older rows */
  }
  return raw ?? "";
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QueueManager({
  initialData,
  initialFilters,
  initialSource,
  categories,
  countries,
  csrfToken,
  pageSizes = QUEUE_PAGE_SIZES,
}: Props) {
  const buildUrl = React.useCallback((f: QueueTabFilters) => {
    const { source, ...rest } = f;
    return `/api/admin/queue?${adminQueueSearchParams(rest, source).toString()}`;
  }, []);
  const buildPath = React.useCallback((f: QueueTabFilters) => {
    const { source, ...rest } = f;
    return `/admin/cola?${adminQueueSearchParams(rest, source).toString()}`;
  }, []);

  const { filters, setFilters, data, fetching, error, refetch } =
    useAdminTableFetch<QueueTabFilters, QueueData>({
      buildUrl,
      buildPath,
      initialFilters: { ...initialFilters, source: initialSource },
      initialData,
      shouldDebounce: (prev, next) => prev.q !== next.q,
    });

  const source = filters.source;
  const page = data.page;
  const stats = data.stats;

  // Per-tab filter memory: switching tabs restores each tab's last filters.
  const filterMemory = React.useRef<Record<AdminQueueSource, AdminQueueFilters>>({
    queue: initialSource === "queue" ? initialFilters : { ...DEFAULT_BASE },
    pending: initialSource === "pending" ? initialFilters : { ...DEFAULT_BASE },
  });

  const patch = React.useCallback(
    (p: Partial<AdminQueueFilters>) => {
      setFilters((prev) => ({ ...prev, ...p, source: prev.source, page: p.page ?? 1 }));
    },
    [setFilters]
  );

  const switchTab = React.useCallback(
    (next: AdminQueueSource) => {
      setFilters((prev) => {
        if (prev.source === next) return prev;
        const { source: _old, ...rest } = prev;
        filterMemory.current[prev.source] = rest;
        return { ...filterMemory.current[next], source: next, page: 1 };
      });
    },
    [setFilters]
  );

  // ---------------------------------------------------------- rows + selection
  const queueRows = React.useMemo(
    () => (source === "queue" ? (page.rows as AdminQueueRow[]) : []),
    [source, page.rows]
  );
  const pendingRows = React.useMemo(
    () => (source === "pending" ? (page.rows as AdminPendingRow[]) : []),
    [source, page.rows]
  );

  const [selectedQueue, setSelectedQueue] = React.useState<Set<number>>(new Set());
  const [selectedPending, setSelectedPending] = React.useState<Set<string>>(new Set());
  const selected = source === "queue" ? selectedQueue : selectedPending;
  const selectedCount = selected.size;

  // Prune selection to ids still on the current page (survives polls,
  // clears itself on page change / after deletes).
  React.useEffect(() => {
    const keepQueue = new Set(queueRows.map((r) => r.id));
    setSelectedQueue((s) => {
      if (s.size === 0) return s;
      const n = new Set([...s].filter((id) => keepQueue.has(id)));
      return n.size === s.size ? s : n;
    });
    const keepPending = new Set(pendingRows.map((r) => r.id));
    setSelectedPending((s) => {
      if (s.size === 0) return s;
      const n = new Set([...s].filter((id) => keepPending.has(id)));
      return n.size === s.size ? s : n;
    });
  }, [queueRows, pendingRows]);

  function toggleQueue(id: number) {
    setSelectedQueue((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function togglePending(id: string) {
    setSelectedPending((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const allChecked = page.rows.length > 0 && selectedCount === page.rows.length;
  const someChecked = selectedCount > 0 && !allChecked;

  function toggleAll() {
    if (source === "queue") {
      setSelectedQueue((s) =>
        s.size === queueRows.length ? new Set() : new Set(queueRows.map((r) => r.id))
      );
    } else {
      setSelectedPending((s) =>
        s.size === pendingRows.length
          ? new Set()
          : new Set(pendingRows.map((r) => r.id))
      );
    }
  }

  function clearSelection() {
    setSelectedQueue(new Set());
    setSelectedPending(new Set());
  }

  // ---------------------------------------------------------- mutations
  const [busyAction, setBusyAction] = React.useState<BulkAction | null>(null);
  const [confirm, setConfirm] = React.useState<DeleteConfirm | null>(null);
  const [editing, setEditing] = React.useState<AdminQueueRow | null>(null);
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [form, setForm] = React.useState<EditFormState | null>(null);

  async function postQueue(
    body: Record<string, unknown>
  ): Promise<{ ok: boolean; error?: string; [k: string]: unknown }> {
    const res = await fetch("/api/admin/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, csrf: csrfToken }),
    });
    return (await res.json().catch(() => ({
      ok: false,
      error: "Respuesta inválida del servidor.",
    }))) as { ok: boolean; error?: string; [k: string]: unknown };
  }

  const runBulk = React.useCallback(
    async function runBulk(kind: BulkAction, ids: (number | string)[]) {
      if (ids.length === 0 || busyAction) return;
      setBusyAction(kind);
      try {
        const res = await postQueue({ action: kind, ids });
        if (!res.ok) {
          toast.error(res.error || "No se pudo aplicar la acción.");
          return;
        }
        if (kind === "publish" || kind === "move") {
          const done = Number(res[kind === "publish" ? "published" : "moved"] ?? 0);
          const skipped = Number(res.skipped ?? 0);
          const errs = (res.errors as { name: string; reason: string }[] | undefined) ?? [];
          let msg =
            kind === "publish"
              ? `${done} ${done === 1 ? "grupo publicado" : "grupos publicados"}`
              : `${done} ${done === 1 ? "grupo movido" : "grupos movidos"} a la cola`;
          if (skipped > 0) {
            msg +=
              kind === "publish"
                ? ` · ${skipped} omitido${skipped === 1 ? "" : "s"} (duplicado${skipped === 1 ? "" : "s"})`
                : ` · ${skipped} omitido${skipped === 1 ? "" : "s"}`;
          }
          toast.success(msg);
          if (errs.length > 0) {
            toast.error(`${errs.length} error(es): ${errs[0].reason}`);
          }
        } else {
          const deleted = Number(res.deleted ?? 0);
          toast.success(
            `${deleted} ${deleted === 1 ? "elemento eliminado" : "elementos eliminados"}`
          );
        }
        clearSelection();
        refetch();
      } catch {
        toast.error("Error de red. Inténtalo de nuevo.");
      } finally {
        setBusyAction(null);
      }
    },
    [busyAction, csrfToken, refetch]
  );

  function askDelete(action: "deleteQueue" | "deletePending", ids: (number | string)[]) {
    if (ids.length === 0) return;
    setConfirm({ action, ids, count: ids.length });
  }

  function openEdit(row: AdminQueueRow) {
    setEditing(row);
    setForm({
      groupName: row.groupName,
      joinLink: row.joinLink,
      description: row.description,
      category: row.category,
      country: row.country,
      city: row.city ?? "",
      tags: storedListToCsv(row.tags),
      keywords: storedListToCsv(row.keywords),
      isAdult: row.isAdult,
      profileImage: row.profileImage ?? "",
    });
  }

  async function saveEdit() {
    if (!editing || !form || savingEdit) return;
    // Fast client-side mirrors of the server validation (Spanish messages).
    const name = form.groupName.trim();
    const link = form.joinLink.trim();
    const desc = form.description.trim();
    if (name.length < 3 || name.length > 120) {
      toast.error("El nombre debe tener entre 3 y 120 caracteres.");
      return;
    }
    if (!INVITE_RE.test(link)) {
      toast.error("El enlace no es una invitación válida de WhatsApp (chat.whatsapp.com/…).");
      return;
    }
    if (desc.length < 20 || desc.length > 8000) {
      toast.error("La descripción debe tener entre 20 y 8000 caracteres.");
      return;
    }
    if (!form.category.trim()) {
      toast.error("Selecciona una categoría.");
      return;
    }
    if (!form.country.trim()) {
      toast.error("Selecciona un país.");
      return;
    }
    if (form.profileImage.trim() && !/^https?:\/\//i.test(form.profileImage.trim())) {
      toast.error("La URL de la imagen debe comenzar con http(s)://");
      return;
    }
    setSavingEdit(true);
    try {
      const res = await postQueue({ action: "editQueue", id: editing.id, fields: form });
      if (!res.ok) {
        toast.error(res.error || "No se pudo guardar el elemento.");
        return;
      }
      toast.success("Elemento actualizado.");
      setEditing(null);
      refetch();
    } catch {
      toast.error("Error de red. Inténtalo de nuevo.");
    } finally {
      setSavingEdit(false);
    }
  }

  // ---------------------------------------------------------- auto-poll + clocks
  const [lastUpdated, setLastUpdated] = React.useState(() => Date.now());
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    setLastUpdated(Date.now());
  }, [data]);

  // Label ticker (10s) — keeps "Actualizado hace Xs" fresh.
  React.useEffect(() => {
    const iv = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(iv);
  }, []);

  // Auto-poll every 30s, paused while the tab is hidden.
  React.useEffect(() => {
    const iv = window.setInterval(() => {
      if (!document.hidden) refetch();
    }, 30_000);
    return () => window.clearInterval(iv);
  }, [refetch]);

  // If the current page fell out of range, hop back to the last valid page.
  React.useEffect(() => {
    if (page.rows.length === 0 && page.total > 0 && page.page > page.totalPages) {
      setFilters((prev) => ({ ...prev, page: page.totalPages }));
    }
  }, [page, setFilters]);

  // ---------------------------------------------------------- derived UI state
  const hasActiveFilters =
    filters.q !== "" ||
    filters.category !== "all" ||
    filters.country !== "all" ||
    filters.adult !== "all";

  const activeFilterCount = [
    filters.q !== "",
    filters.category !== "all",
    filters.country !== "all",
    filters.adult !== "all",
  ].filter(Boolean).length;

  const scheduledCategories = stats.categories.filter((c) => c.queue > 0).length;
  const busy = busyAction !== null;
  const rowDisabled = busy || fetching;

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* ------------------------------------------------ Stats: KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={<Timer className="h-5 w-5" />}
          label="En cola"
          value={stats.queueTotal}
          sub={
            stats.queueTotal > 0
              ? `El más antiguo: ${relativeFromIso(stats.queueOldest)}`
              : "Nada programado"
          }
        />
        <KpiCard
          icon={<Clock className="h-5 w-5" />}
          label="Pendientes"
          value={stats.pendingTotal}
          sub={`${stats.pendingAdult} con +18`}
        />
        <KpiCard
          icon={<FolderClock className="h-5 w-5" />}
          label="Categorías programadas"
          value={scheduledCategories}
          sub={`${stats.categories.length} con actividad`}
        />
        <KpiCard
          icon={<ShieldAlert className="h-5 w-5" />}
          label="+18 en cola"
          value={stats.queueAdult}
          sub="Requieren verificación de edad"
        />
      </div>

      {/* ------------------------------------------------ Stats: category chips */}
      {stats.categories.length > 0 && (
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="hidden shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:block">
                Por categoría
              </span>
              <div
                className="cg-scroll flex flex-1 gap-2 overflow-x-auto pb-1"
                role="group"
                aria-label="Filtrar por categoría"
              >
                {stats.categories.map((c) => {
                  const active = filters.category === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => patch({ category: active ? "all" : c.name })}
                      aria-pressed={active}
                      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        active
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                          : "bg-background text-muted-foreground hover:border-emerald-300 hover:text-foreground dark:hover:border-emerald-800"
                      }`}
                    >
                      {c.name}:{" "}
                      <span className="tabular-nums">{c.queue}</span> en cola
                      <span className="opacity-70"> · </span>
                      <span className="tabular-nums">{c.pending}</span> pend.
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ------------------------------------------------ Main card */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col">
            {/* Tabs */}
            <div className="border-b px-4 pt-4">
              <Tabs
                value={source}
                onValueChange={(v) => switchTab(v as AdminQueueSource)}
              >
                <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
                  <TabsTrigger value="queue" className="gap-2">
                    Cola drip-feed
                    <span className="rounded-full bg-emerald-600/10 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {stats.queueTotal}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="gap-2">
                    Grupos pendientes
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                      {stats.pendingTotal}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Filter toolbar */}
            <div className="border-b p-4">
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <div className="relative xl:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={filters.q}
                    onChange={(e) => patch({ q: e.target.value })}
                    placeholder="Buscar por nombre o enlace…"
                    className="h-9 pl-9"
                    maxLength={120}
                    aria-label="Buscar en la cola"
                    inputMode="search"
                    type="search"
                  />
                </div>

                <SelectField
                  label="Categoría"
                  value={filters.category}
                  onValueChange={(v) => patch({ category: v })}
                >
                  <SelectItem value="all">Todas</SelectItem>
                  {stats.categories.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name} ({c.queue + c.pending})
                    </SelectItem>
                  ))}
                </SelectField>

                <SelectField
                  label="País"
                  value={filters.country}
                  onValueChange={(v) => patch({ country: v })}
                >
                  <SelectItem value="all">Todos</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectField>

                <SelectField
                  label="Contenido"
                  value={filters.adult}
                  onValueChange={(v) => patch({ adult: v as AdminAdultFilter })}
                >
                  <SelectItem value="all">General y 18+</SelectItem>
                  <SelectItem value="exclude">Solo general</SelectItem>
                  <SelectItem value="only">Solo 18+</SelectItem>
                </SelectField>

                <SelectField
                  label="Ordenar por"
                  value={filters.sort}
                  onValueChange={(v) => patch({ sort: v as AdminQueueSort })}
                >
                  <SelectItem value="addedAsc">Más antiguos primero</SelectItem>
                  <SelectItem value="added">Más recientes primero</SelectItem>
                  <SelectItem value="name">Nombre (A–Z)</SelectItem>
                </SelectField>

                <SelectField
                  label="Filas por página"
                  value={String(filters.pageSize)}
                  onValueChange={(v) => patch({ pageSize: Number(v) })}
                >
                  {pageSizes.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / pág.
                    </SelectItem>
                  ))}
                </SelectField>
              </div>

              {/* Result summary + refresh */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium tabular-nums">
                  {hasActiveFilters
                    ? `${page.total.toLocaleString("es-ES")} con filtros`
                    : `${page.total.toLocaleString("es-ES")} ${
                        source === "queue" ? "en la cola" : "pendientes"
                      }`}
                </span>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        ...DEFAULT_BASE,
                        source: prev.source,
                        pageSize: prev.pageSize,
                      }))
                    }
                  >
                    <FilterX className="h-3.5 w-3.5" />
                    Quitar {activeFilterCount} filtro{activeFilterCount === 1 ? "" : "s"}
                  </Button>
                )}
                <span className="sr-only" aria-live="polite">
                  {fetching
                    ? "Actualizando resultados"
                    : `${page.total} resultados`}
                </span>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  {error && (
                    <>
                      <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {error}
                      </span>
                      <Button variant="outline" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={refetch}>
                        Reintentar
                      </Button>
                    </>
                  )}
                  <span className="hidden text-[11px] text-muted-foreground sm:inline">
                    Actualizado {relativeFromMs(now - lastUpdated)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-xs"
                    onClick={refetch}
                    disabled={fetching}
                  >
                    {fetching ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCw className="h-3.5 w-3.5" />
                    )}
                    Actualizar
                  </Button>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------ Table / states */}
            <div
              className={
                fetching && page.rows.length > 0
                  ? "opacity-60 transition-opacity"
                  : "transition-opacity"
              }
              aria-busy={fetching}
            >
              {page.rows.length > 0 ? (
                <Table containerClassName="cg-scroll max-h-[70vh] overflow-y-auto">
                  <TableHeader className="sticky top-0 z-10 bg-background">
                    <TableRow className="bg-background hover:bg-background">
                      <TableHead className="w-10 px-3">
                        <Checkbox
                          checked={
                            allChecked ? true : someChecked ? "indeterminate" : false
                          }
                          onCheckedChange={toggleAll}
                          aria-label="Seleccionar todo"
                          disabled={rowDisabled}
                        />
                      </TableHead>
                      <TableHead className="px-2 text-xs">Grupo</TableHead>
                      <TableHead className="px-2 text-xs">Categoría</TableHead>
                      <TableHead className="px-2 text-xs">País</TableHead>
                      <TableHead className="px-2 text-xs">Enlace</TableHead>
                      <TableHead className="px-2 text-xs">
                        {source === "queue" ? "Añadido" : "Creado"}
                      </TableHead>
                      <TableHead className="px-2 text-right text-xs">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {source === "queue"
                      ? queueRows.map((row) => (
                          <QueueTableRow
                            key={row.id}
                            row={row}
                            selected={selectedQueue.has(row.id)}
                            disabled={rowDisabled}
                            busyAction={busyAction}
                            onToggle={() => toggleQueue(row.id)}
                            onPublish={() => runBulk("publish", [row.id])}
                            onEdit={() => openEdit(row)}
                            onDelete={() => askDelete("deleteQueue", [row.id])}
                          />
                        ))
                      : pendingRows.map((row) => (
                          <PendingTableRow
                            key={row.id}
                            row={row}
                            selected={selectedPending.has(row.id)}
                            disabled={rowDisabled}
                            busyAction={busyAction}
                            onToggle={() => togglePending(row.id)}
                            onMove={() => runBulk("move", [row.id])}
                            onDelete={() => askDelete("deletePending", [row.id])}
                          />
                        ))}
                  </TableBody>
                </Table>
              ) : fetching ? (
                <SkeletonTableRows pageSize={page.pageSize} />
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                    {source === "queue" ? (
                      <Timer className="h-6 w-6" />
                    ) : (
                      <Inbox className="h-6 w-6" />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium">
                      {hasActiveFilters
                        ? "No hay grupos con estos filtros"
                        : source === "queue"
                          ? "No hay grupos en la cola"
                          : "No hay grupos pendientes"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {hasActiveFilters
                        ? "Prueba a quitar algún filtro o amplía la búsqueda."
                        : source === "queue"
                          ? "Sube grupos desde la carga masiva con destino «cola» para programar su publicación."
                          : "Los grupos con estado «pendiente» aparecerán aquí para moverlos a la cola."}
                    </p>
                  </div>
                  {hasActiveFilters ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          ...DEFAULT_BASE,
                          source: prev.source,
                          pageSize: prev.pageSize,
                        }))
                      }
                    >
                      <FilterX className="h-3.5 w-3.5" />
                      Quitar filtros
                    </Button>
                  ) : source === "queue" ? (
                    <Button asChild variant="outline" size="sm" className="mt-1">
                      <Link href="/admin/bulk-upload">
                        <UploadCloud className="h-3.5 w-3.5" />
                        Ir a la carga masiva
                      </Link>
                    </Button>
                  ) : null}
                </div>
              )}
            </div>

            {/* ------------------------------------------------ Pagination */}
            {page.total > 0 && page.totalPages > 1 && (
              <div className="border-t px-4 py-3">
                <AdminPagination
                  page={page.page}
                  totalPages={page.totalPages}
                  total={page.total}
                  pageSize={page.pageSize}
                  onPageChange={(n) => patch({ page: n })}
                  disabled={fetching}
                />
              </div>
            )}

            {/* ------------------------------------------------ Bulk bar (sticky) */}
            {selectedCount > 0 && (
              <div className="sticky bottom-0 z-30 flex flex-wrap items-center gap-2 border-t border-emerald-200 bg-emerald-50/95 px-4 py-2.5 backdrop-blur dark:border-emerald-900 dark:bg-emerald-950/95">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-800 tabular-nums dark:text-emerald-300">
                  {selectedCount.toLocaleString("es-ES")} seleccionado
                  {selectedCount === 1 ? "" : "s"}
                </span>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  {source === "queue" ? (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={busy || fetching}
                      onClick={() => runBulk("publish", Array.from(selectedQueue))}
                    >
                      {busyAction === "publish" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      Publicar ahora
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={busy || fetching}
                      onClick={() => runBulk("move", Array.from(selectedPending))}
                    >
                      {busyAction === "move" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ListPlus className="h-3.5 w-3.5" />
                      )}
                      Mover a cola
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                    disabled={busy || fetching}
                    onClick={() => {
                      const ids: (number | string)[] =
                        source === "queue"
                          ? Array.from(selectedQueue)
                          : Array.from(selectedPending);
                      askDelete(
                        source === "queue" ? "deleteQueue" : "deletePending",
                        ids
                      );
                    }}
                  >
                    {busyAction === "deleteQueue" || busyAction === "deletePending" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Eliminar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-emerald-800 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                    onClick={clearSelection}
                    disabled={busy}
                  >
                    <X className="h-3.5 w-3.5" />
                    Limpiar selección
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------ Edit dialog */}
      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar elemento de la cola</DialogTitle>
            <DialogDescription>
              Los cambios se guardan en la cola — el grupo se publicará con estos
              datos cuando llegue su turno (o al pulsar «Publicar ahora»).
            </DialogDescription>
          </DialogHeader>

          {form && (
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="qa-name">Nombre del grupo</Label>
                  <Input
                    id="qa-name"
                    value={form.groupName}
                    maxLength={120}
                    onChange={(e) => setForm({ ...form, groupName: e.target.value })}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {form.groupName.trim().length} / 120 caracteres
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qa-link">Enlace de invitación</Label>
                  <Input
                    id="qa-link"
                    value={form.joinLink}
                    onChange={(e) => setForm({ ...form, joinLink: e.target.value })}
                    placeholder="https://chat.whatsapp.com/…"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qa-desc">Descripción</Label>
                <Textarea
                  id="qa-desc"
                  rows={6}
                  maxLength={8000}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <p className="text-[11px] text-muted-foreground">
                  {form.description.trim().length} / 8000 caracteres (mínimo 20)
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Categoría</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger className="w-full" aria-label="Categoría">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {!categories.some((c) => c.name === form.category) &&
                        form.category && (
                          <SelectItem value={form.category}>{form.category}</SelectItem>
                        )}
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>País</Label>
                  <Select
                    value={form.country}
                    onValueChange={(v) => setForm({ ...form, country: v })}
                  >
                    <SelectTrigger className="w-full" aria-label="País">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {!countries.some((c) => c.name === form.country) &&
                        form.country && (
                          <SelectItem value={form.country}>{form.country}</SelectItem>
                        )}
                      {countries.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="qa-city">Ciudad (opcional)</Label>
                  <Input
                    id="qa-city"
                    value={form.city}
                    maxLength={120}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="qa-adult" className="text-sm">
                      Contenido +18
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Slug tipo «invite-…» al publicar
                    </p>
                  </div>
                  <Switch
                    id="qa-adult"
                    checked={form.isAdult}
                    onCheckedChange={(v) => setForm({ ...form, isAdult: v })}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="qa-tags">Etiquetas</Label>
                  <Input
                    id="qa-tags"
                    value={form.tags}
                    maxLength={300}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="amistad, chat, juegos"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Separadas por comas (máximo 10)
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="qa-keywords">Palabras clave</Label>
                  <Input
                    id="qa-keywords"
                    value={form.keywords}
                    maxLength={300}
                    onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                    placeholder="hacer amigos, comunidad"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Separadas por comas (máximo 10)
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qa-image">Imagen de perfil (URL)</Label>
                <div className="flex items-center gap-3">
                  <GroupImage
                    src={form.profileImage || null}
                    alt={form.groupName || "Grupo"}
                    title={form.groupName}
                    size={40}
                    className="shrink-0 rounded-lg border"
                  />
                  <Input
                    id="qa-image"
                    value={form.profileImage}
                    maxLength={512}
                    onChange={(e) => setForm({ ...form, profileImage: e.target.value })}
                    placeholder="https://… (vacío = sin imagen)"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={savingEdit}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={saveEdit}
              disabled={savingEdit}
            >
              {savingEdit && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------ Delete confirm */}
      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar {confirm?.count ?? 0} grupo{confirm?.count === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === "deleteQueue"
                ? "Se quitarán de la cola de publicación y no podrán recuperarse. Los grupos publicados no se ven afectados."
                : "Se eliminarán definitivamente los grupos pendientes (nunca llegaron a publicarse). Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={async () => {
                const c = confirm;
                setConfirm(null);
                if (c) await runBulk(c.action, c.ids);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row components
// ---------------------------------------------------------------------------

function AdultBadge() {
  return (
    <Badge
      variant="outline"
      className="bg-rose-50 px-1 py-0 text-[9px] text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
    >
      18+
    </Badge>
  );
}

function QueueTableRow({
  row,
  selected,
  disabled,
  busyAction,
  onToggle,
  onPublish,
  onEdit,
  onDelete,
}: {
  row: AdminQueueRow;
  selected: boolean;
  disabled: boolean;
  busyAction: BulkAction | null;
  onToggle: () => void;
  onPublish: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const desc =
    row.description.length > 300 ? `${row.description.slice(0, 300)}…` : row.description;
  return (
    <TableRow className="text-xs transition-colors" data-state={selected ? "selected" : undefined}>
      <TableCell className="px-3">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          aria-label={`Seleccionar ${row.groupName}`}
          disabled={disabled}
        />
      </TableCell>
      <TableCell className="px-2">
        <div className="flex items-center gap-2.5">
          <GroupImage
            src={row.profileImage}
            alt={row.groupName}
            title={row.groupName}
            size={32}
            className="rounded-lg border"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-sm font-medium text-foreground">
              <span className="max-w-[240px] truncate" title={row.groupName}>
                {row.groupName}
              </span>
              {row.isAdult && <AdultBadge />}
            </div>
            {desc && (
              <div
                className="max-w-[420px] truncate text-[11px] text-muted-foreground"
                title={row.description}
              >
                {desc}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="px-2">
        <span className="max-w-[140px] truncate" title={row.category}>
          {row.category || "—"}
        </span>
      </TableCell>
      <TableCell className="px-2">
        <div>{row.country || "—"}</div>
        {row.city && <div className="text-[11px] text-muted-foreground">{row.city}</div>}
      </TableCell>
      <TableCell className="px-2">
        <button
          type="button"
          className="max-w-[220px] truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title={`${row.joinLink} — clic para copiar`}
          onClick={async () => {
            const ok = await copyText(row.joinLink);
            if (ok) toast.success("Enlace copiado al portapapeles.");
            else toast.error("No se pudo copiar el enlace.");
          }}
          aria-label={`Copiar enlace de ${row.groupName}`}
        >
          {middleTruncate(row.joinLink.replace(/^https?:\/\//, ""))}
        </button>
      </TableCell>
      <TableCell className="whitespace-nowrap px-2" title={row.addedAt}>
        {formatDateTime(row.addedAt)}
      </TableCell>
      <TableCell className="whitespace-nowrap px-2 text-right">
        <RowActions
          label={row.groupName}
          busyAction={busyAction}
          onPublish={onPublish}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}

function PendingTableRow({
  row,
  selected,
  disabled,
  busyAction,
  onToggle,
  onMove,
  onDelete,
}: {
  row: AdminPendingRow;
  selected: boolean;
  disabled: boolean;
  busyAction: BulkAction | null;
  onToggle: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow className="text-xs transition-colors" data-state={selected ? "selected" : undefined}>
      <TableCell className="px-3">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          aria-label={`Seleccionar ${row.groupName}`}
          disabled={disabled}
        />
      </TableCell>
      <TableCell className="px-2">
        <div className="flex items-center gap-2.5">
          <GroupImage
            src={row.profileImage}
            alt={row.groupName}
            title={row.groupName}
            size={32}
            className="rounded-lg border"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-sm font-medium text-foreground">
              <span className="max-w-[240px] truncate" title={row.groupName}>
                {row.groupName}
              </span>
              {row.isAdult && <AdultBadge />}
            </div>
            <div className="truncate font-mono text-[11px] text-muted-foreground" title={row.slug}>
              {row.slug}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-2">
        <span className="max-w-[140px] truncate" title={row.category}>
          {row.category || "—"}
        </span>
      </TableCell>
      <TableCell className="px-2">
        <div>{row.country || "—"}</div>
        {row.city && <div className="text-[11px] text-muted-foreground">{row.city}</div>}
      </TableCell>
      <TableCell className="px-2">
        <button
          type="button"
          className="max-w-[220px] truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title={`${row.joinLink} — clic para copiar`}
          onClick={async () => {
            const ok = await copyText(row.joinLink);
            if (ok) toast.success("Enlace copiado al portapapeles.");
            else toast.error("No se pudo copiar el enlace.");
          }}
          aria-label={`Copiar enlace de ${row.groupName}`}
        >
          {middleTruncate(row.joinLink.replace(/^https?:\/\//, ""))}
        </button>
      </TableCell>
      <TableCell className="whitespace-nowrap px-2" title={row.createdAt}>
        {formatDateTime(row.createdAt)}
      </TableCell>
      <TableCell className="whitespace-nowrap px-2 text-right">
        <RowActions
          label={row.groupName}
          busyAction={busyAction}
          onMove={onMove}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}

function RowActions({
  label,
  busyAction,
  onPublish,
  onEdit,
  onMove,
  onDelete,
}: {
  label: string;
  busyAction: BulkAction | null;
  onPublish?: () => void;
  onEdit?: () => void;
  onMove?: () => void;
  onDelete: () => void;
}) {
  const busy = busyAction !== null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label={`Acciones de ${label}`}
          disabled={busy}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onPublish && (
          <DropdownMenuItem
            onClick={onPublish}
            disabled={busyAction === "publish"}
            className="gap-2 text-emerald-700 focus:text-emerald-700 dark:text-emerald-400 dark:focus:text-emerald-400"
          >
            {busyAction === "publish" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Publicar ahora
          </DropdownMenuItem>
        )}
        {onMove && (
          <DropdownMenuItem
            onClick={onMove}
            disabled={busyAction === "move"}
            className="gap-2 text-emerald-700 focus:text-emerald-700 dark:text-emerald-400 dark:focus:text-emerald-400"
          >
            {busyAction === "move" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ListPlus className="h-4 w-4" />
            )}
            Mover a cola
          </DropdownMenuItem>
        )}
        {onEdit && (
          <DropdownMenuItem onClick={onEdit} disabled={busy} className="gap-2">
            <Pencil className="h-4 w-4" />
            Editar
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          disabled={busy}
          className="gap-2 text-rose-600 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------

function KpiCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold leading-none tabular-nums">
            {value.toLocaleString("es-ES")}
          </p>
          <p className="mt-1 truncate text-xs font-medium text-muted-foreground" title={label}>
            {label}
          </p>
          {sub && (
            <p className="truncate text-[11px] text-muted-foreground/70" title={sub}>
              {sub}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SelectField({
  label,
  value,
  onValueChange,
  children,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-9 w-full" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function SkeletonTableRows({ pageSize }: { pageSize: number }) {
  return (
    <div className="space-y-2 p-4" aria-hidden>
      {Array.from({ length: Math.min(pageSize, 8) }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="ml-auto h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}
