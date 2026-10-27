"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GroupImage } from "@/components/site/group-image";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Eye,
  Pencil,
  Loader2,
  CheckCircle2,
  XCircle,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  AdminGroupStatusBadge,
  AdminLinkStatusBadge,
} from "@/components/admin/admin-badges";
import type {
  AdminGroupRow,
  AdminGroupSort,
  SortDir,
} from "@/lib/admin-listing-params";

interface Props {
  groups: AdminGroupRow[];
  csrfToken: string;
  adminUser: string;
  sort: AdminGroupSort;
  dir: SortDir;
  onSort: (key: AdminGroupSort) => void;
  /** Explorer callback: refetch the current page after a bulk action. */
  onChanged?: () => void;
  fetching?: boolean;
}

function formatDate(iso: string): string {
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

/** Sortable column header button with the three-state icon. */
function SortHeader({
  label,
  sortKey,
  sort,
  dir,
  onSort,
  className,
}: {
  label: string;
  sortKey: AdminGroupSort;
  sort: AdminGroupSort;
  dir: SortDir;
  onSort: (key: AdminGroupSort) => void;
  className?: string;
}) {
  const active = sort === sortKey;
  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`inline-flex h-6 items-center gap-1 rounded px-1 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      } ${className ?? ""}`}
    >
      {label}
      <Icon className={`h-3 w-3 ${active ? "text-emerald-600" : "opacity-50"}`} />
    </button>
  );
}

/** aria-sort value for a column header (must live on the <th>). */
function ariaSortFor(
  sortKey: AdminGroupSort,
  sort: AdminGroupSort,
  dir: SortDir
): "none" | "ascending" | "descending" {
  if (sort !== sortKey) return "none";
  return dir === "asc" ? "ascending" : "descending";
}

export function AdminGroupsTable({
  groups,
  csrfToken,
  sort,
  dir,
  onSort,
  onChanged,
  fetching,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [action, setAction] = React.useState<string | null>(null);

  // Page-scoped selection: a new page of rows starts clean.
  React.useEffect(() => {
    setSelected(new Set());
  }, [groups]);

  const allChecked = groups.length > 0 && selected.size === groups.length;
  const someChecked = selected.size > 0 && !allChecked;

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    setSelected((s) => (s.size === groups.length ? new Set() : new Set(groups.map((g) => g.id))));
  }

  async function runBulk(kind: "publish" | "reject" | "delete") {
    if (selected.size === 0 || action) return;
    setAction(kind);
    try {
      const res = await fetch("/api/admin/grupos/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selected),
          action: kind,
          csrf: csrfToken,
        }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo aplicar la acción.");
        return;
      }
      toast.success(
        kind === "publish"
          ? `${selected.size} grupo(s) publicado(s).`
          : kind === "reject"
            ? `${selected.size} grupo(s) rechazado(s).`
            : `${selected.size} grupo(s) eliminado(s).`
      );
      setSelected(new Set());
      if (onChanged) onChanged();
      else router.refresh();
    } catch {
      toast.error("Error de red.");
    } finally {
      setAction(null);
    }
  }

  const busy = action !== null || fetching === true;

  return (
    <div className="flex flex-col">
      {/* Bulk action bar */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 px-4 py-2.5">
        <span className="text-xs font-medium text-muted-foreground">
          {selected.size > 0
            ? `${selected.size} seleccionado(s)`
            : "Selecciona grupos para acciones en lote"}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={selected.size === 0 || action !== null}
            onClick={() => runBulk("publish")}
          >
            {action === "publish" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            Publicar
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={selected.size === 0 || action !== null}
            onClick={() => runBulk("reject")}
          >
            {action === "reject" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            Rechazar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
            disabled={selected.size === 0 || action !== null}
            onClick={() => runBulk("delete")}
          >
            {action === "delete" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Eliminar
          </Button>
        </div>
      </div>

      {/* Table — the wrapper itself is the vertical scroll box so the
          sticky header sticks correctly (custom scrollbar included) */}
      <Table containerClassName="cg-scroll max-h-[70vh] overflow-y-auto">
        <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow className="bg-background hover:bg-background">
              <TableHead className="w-10 px-3">
                <Checkbox
                  checked={allChecked ? true : someChecked ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label="Seleccionar todo"
                  disabled={busy}
                />
              </TableHead>
              <TableHead className="px-2 text-xs" aria-sort={ariaSortFor("name", sort, dir)}>
                <SortHeader label="Grupo" sortKey="name" sort={sort} dir={dir} onSort={onSort} />
              </TableHead>
              <TableHead className="px-2 text-xs">Categoría</TableHead>
              <TableHead className="px-2 text-xs">País</TableHead>
              <TableHead className="px-2 text-xs" aria-sort={ariaSortFor("status", sort, dir)}>
                <SortHeader label="Estado" sortKey="status" sort={sort} dir={dir} onSort={onSort} />
              </TableHead>
              <TableHead className="px-2 text-xs">Enlace</TableHead>
              <TableHead className="px-2 text-right text-xs" aria-sort={ariaSortFor("clicks", sort, dir)}>
                <SortHeader
                  label="Clics"
                  sortKey="clicks"
                  sort={sort}
                  dir={dir}
                  onSort={onSort}
                  className="justify-end"
                />
              </TableHead>
              <TableHead className="px-2 text-right text-xs" aria-sort={ariaSortFor("views", sort, dir)}>
                <SortHeader
                  label="Visitas"
                  sortKey="views"
                  sort={sort}
                  dir={dir}
                  onSort={onSort}
                  className="justify-end"
                />
              </TableHead>
              <TableHead className="px-2 text-xs" aria-sort={ariaSortFor("created", sort, dir)}>
                <SortHeader
                  label="Creado"
                  sortKey="created"
                  sort={sort}
                  dir={dir}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead className="px-2 text-right text-xs">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => (
              <TableRow
                key={g.id}
                className="text-xs transition-colors"
                data-state={selected.has(g.id) ? "selected" : undefined}
              >
                <TableCell className="px-3">
                  <Checkbox
                    checked={selected.has(g.id)}
                    onCheckedChange={() => toggle(g.id)}
                    aria-label={`Seleccionar ${g.groupName}`}
                    disabled={busy}
                  />
                </TableCell>
                <TableCell className="px-2">
                  <div className="flex items-center gap-2.5">
                    <GroupImage
                      src={g.profileImage}
                      alt={g.groupName}
                      title={g.groupName}
                      size={32}
                      className="rounded-lg border"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                        <span className="max-w-[220px] truncate" title={g.groupName}>
                          {g.groupName}
                        </span>
                        {g.isAdult && (
                          <Badge
                            variant="outline"
                            className="bg-rose-50 px-1 py-0 text-[9px] text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                          >
                            18+
                          </Badge>
                        )}
                      </div>
                      <div className="truncate font-mono text-[11px] text-muted-foreground" title={g.id}>
                        {g.id.slice(0, 12)}…
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-2">
                  <span className="max-w-[140px] truncate" title={g.category}>
                    {g.category || "—"}
                  </span>
                </TableCell>
                <TableCell className="px-2">
                  <div>{g.country || "—"}</div>
                  {g.city && <div className="text-[11px] text-muted-foreground">{g.city}</div>}
                </TableCell>
                <TableCell className="px-2">
                  <AdminGroupStatusBadge status={g.status} />
                </TableCell>
                <TableCell className="px-2">
                  <AdminLinkStatusBadge linkStatus={g.linkStatus} />
                </TableCell>
                <TableCell className="px-2 text-right tabular-nums">
                  {g.clicks.toLocaleString("es-ES")}
                </TableCell>
                <TableCell className="px-2 text-right tabular-nums">
                  {g.views.toLocaleString("es-ES")}
                </TableCell>
                <TableCell className="px-2 whitespace-nowrap">
                  {formatDate(g.createdAt)}
                </TableCell>
                <TableCell className="px-2 whitespace-nowrap text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button
                      asChild
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground"
                    >
                      <Link
                        href={`/grupo/${g.slug}`}
                        target="_blank"
                        title="Ver en el sitio"
                        aria-label={`Ver ${g.groupName} en el sitio`}
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
                        href={`/admin/grupos/${g.id}`}
                        title="Editar grupo"
                        aria-label={`Editar ${g.groupName}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </div>
  );
}
