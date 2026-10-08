"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string;
  groupName: string;
  slug: string;
  category: string;
  country: string;
  city: string | null;
  status: string;
  linkStatus: string;
  clicks: number;
  createdAt: Date | string;
  profileImage: string | null;
  isAdult: boolean;
};

interface Props {
  groups: Row[];
  csrfToken: string;
  adminUser: string;
}

// Inline formatting helpers (avoid passing functions across the server/client boundary)
function statusBadge(status: string) {
  switch (status) {
    case "live":
      return <Badge className="bg-emerald-600 hover:bg-emerald-700">Publicar</Badge>;
    case "pending":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/50 dark:text-amber-300"
        >
          Pendiente
        </Badge>
      );
    case "rejected":
      return (
        <Badge
          variant="secondary"
          className="bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/50 dark:text-rose-300"
        >
          Rechazado
        </Badge>
      );
    case "flagged":
      return (
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-950/50 dark:text-orange-300"
        >
          Marcado
        </Badge>
      );
    case "pruned":
      return <Badge variant="outline">Pruned</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function linkStatusBadge(s: string) {
  if (s === "revoked") {
    return (
      <Badge
        variant="secondary"
        className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
      >
        Revocado
      </Badge>
    );
  }
  if (s === "unknown") {
    return <Badge variant="outline">Desconocido</Badge>;
  }
  return (
    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">
      Activo
    </Badge>
  );
}

function formatDate(iso: Date | string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function AdminGroupsTable({
  groups,
  csrfToken,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [action, setAction] = React.useState<string | null>(null);

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
      router.refresh();
    } catch (err) {
      toast.error("Error de red.");
    } finally {
      setAction(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Bulk action bar */}
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
        <span className="text-xs font-medium text-muted-foreground">
          {selected.size > 0
            ? `${selected.size} seleccionado(s)`
            : "Selecciona grupos para acciones en lote"}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="default"
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

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10 px-3">
                <Checkbox
                  checked={allChecked ? true : someChecked ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                  aria-label="Seleccionar todo"
                />
              </TableHead>
              <TableHead className="px-2 text-xs">ID / Nombre</TableHead>
              <TableHead className="px-2 text-xs">Categoría</TableHead>
              <TableHead className="px-2 text-xs">País</TableHead>
              <TableHead className="px-2 text-xs">Estado</TableHead>
              <TableHead className="px-2 text-xs">Enlace</TableHead>
              <TableHead className="px-2 text-right text-xs">Clicks</TableHead>
              <TableHead className="px-2 text-xs">Creado</TableHead>
              <TableHead className="px-2 text-right text-xs">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => (
              <TableRow key={g.id} className="text-xs">
                <TableCell className="px-3">
                  <Checkbox
                    checked={selected.has(g.id)}
                    onCheckedChange={() => toggle(g.id)}
                    aria-label={`Seleccionar ${g.groupName}`}
                  />
                </TableCell>
                <TableCell className="px-2">
                  <div className="flex items-center gap-2">
                    <GroupImage
                      src={g.profileImage}
                      alt={g.groupName}
                      title={g.groupName}
                      size={28}
                      className="rounded-full border"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 font-medium text-foreground">
                        <span className="truncate" title={g.groupName}>
                          {g.groupName}
                        </span>
                        {g.isAdult && (
                          <Badge
                            variant="outline"
                            className="bg-rose-50 px-1 py-0 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                          >
                            +18
                          </Badge>
                        )}
                      </div>
                      <div className="truncate font-mono text-xs text-muted-foreground" title={g.id}>
                        {g.id.slice(0, 12)}…
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-2">{g.category}</TableCell>
                <TableCell className="px-2">
                  <div>{g.country}</div>
                  {g.city && <div className="text-xs text-muted-foreground">{g.city}</div>}
                </TableCell>
                <TableCell className="px-2">{statusBadge(g.status)}</TableCell>
                <TableCell className="px-2">{linkStatusBadge(g.linkStatus)}</TableCell>
                <TableCell className="px-2 text-right tabular-nums">
                  {g.clicks.toLocaleString("es-ES")}
                </TableCell>
                <TableCell className="px-2 whitespace-nowrap">{formatDate(g.createdAt)}</TableCell>
                <TableCell className="px-2 whitespace-nowrap text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                      <Link href={`/grupo/${g.slug}`} target="_blank" title="Ver en el sitio">
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                      <Link href={`/admin/grupos/${g.id}`} title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
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
