"use client";

/**
 * AdminBlogList — posts table with publish/unpublish + delete actions.
 * Uses `fill`-friendly controls (no bare text nodes inside buttons —
 * translation-extension crash guard).
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, ExternalLink, Eye, EyeOff, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { BlogPostDTO } from "@/lib/blog";
import { cn } from "@/lib/utils";

/** Date formatting lives client-side (functions can't cross the RSC boundary). */
function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  posts: BlogPostDTO[];
  csrfToken: string;
}

export function AdminBlogList({ posts, csrfToken }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  async function toggleStatus(id: string) {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/blog/${id}?XTransformPort=3000`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", csrf: csrfToken }),
      });
      const json = await res.json();
      if (json.ok) {
        toast({
          title: json.post.status === "published" ? "Entrada publicada" : "Entrada despublicada",
          description: json.post.title,
        });
        router.refresh();
      } else {
        toast({ title: "Error", description: json.error ?? "No se pudo actualizar.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error de red", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch(
        `/api/admin/blog/${id}?csrf=${encodeURIComponent(csrfToken)}&XTransformPort=3000`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (json.ok) {
        toast({ title: "Entrada eliminada" });
        setConfirmId(null);
        router.refresh();
      } else {
        toast({ title: "Error", description: json.error ?? "No se pudo eliminar.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error de red", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      {/* Desktop table */}
      <table className="hidden w-full text-sm sm:table">
        <thead>
          <tr className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2.5 font-semibold">Entrada</th>
            <th className="px-3 py-2.5 font-semibold">Estado</th>
            <th className="px-3 py-2.5 font-semibold">Fecha</th>
            <th className="px-3 py-2.5 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id} className={cn("border-b transition-colors hover:bg-muted/30", busyId === p.id && "opacity-50")}>
              <td className="max-w-md px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-lg" aria-hidden>
                    {p.coverEmoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.title}</p>
                    <p className="truncate text-xs text-muted-foreground">/blog/{p.slug} · {p.views.toLocaleString("es-ES")} lecturas</p>
                  </div>
                </div>
              </td>
              <td className="px-3 py-2.5">
                {p.status === "published" ? (
                  <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> <span>Publicada</span>
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Pencil className="h-3 w-3" /> <span>Borrador</span>
                  </Badge>
                )}
              </td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">
                {p.status === "published" ? fmtDate(p.publishedAt) : fmtDate(p.createdAt)}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center justify-end gap-1">
                  {p.status === "published" && (
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Ver en el sitio">
                      <Link href={`/blog/${p.slug}`} target="_blank">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="sr-only">Ver</span>
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title={p.status === "published" ? "Despublicar" : "Publicar"}
                    onClick={() => toggleStatus(p.id)}
                    disabled={busyId === p.id}
                  >
                    {busyId === p.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : p.status === "published" ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    <span className="sr-only">{p.status === "published" ? "Despublicar" : "Publicar"}</span>
                  </Button>
                  <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Editar">
                    <Link href={`/admin/blog/${p.id}`}>
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="sr-only">Editar</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    title="Eliminar"
                    onClick={() => setConfirmId(p.id)}
                    disabled={busyId === p.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Eliminar</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="sm:hidden">
        {posts.map((p) => (
          <div key={p.id} className={cn("border-b p-3 last:border-b-0", busyId === p.id && "opacity-50")}>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-xl" aria-hidden>
                {p.coverEmoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.status === "published" ? `Publicada · ${fmtDate(p.publishedAt)}` : "Borrador"} ·{" "}
                  {p.views.toLocaleString("es-ES")} lecturas
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => toggleStatus(p.id)}
                  disabled={busyId === p.id}
                  title={p.status === "published" ? "Despublicar" : "Publicar"}
                >
                  {busyId === p.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : p.status === "published" ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">{p.status === "published" ? "Despublicar" : "Publicar"}</span>
                </Button>
                <Button asChild variant="ghost" size="icon" className="h-9 w-9" title="Editar">
                  <Link href={`/admin/blog/${p.id}`}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive"
                  onClick={() => setConfirmId(p.id)}
                  disabled={busyId === p.id}
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation inline panel */}
      {confirmId && (
        <div className="border-t bg-destructive/5 px-3 py-3">
          <p className="text-sm font-medium">
            ¿Eliminar esta entrada? Esta acción no se puede deshacer.
          </p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="destructive" onClick={() => remove(confirmId)} disabled={!!busyId}>
              {busyId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              <span>Eliminar definitivamente</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmId(null)}>
              <span>Cancelar</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
