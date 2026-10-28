"use client";

/**
 * AdminSitemapCard — dashboard card for the XML sitemap.
 *
 * Shows freshness at a glance (live groups in DB vs groups in the sitemap
 * files), a per-file breakdown, and a "Regenerate now" button that hits
 * POST /api/admin/sitemap so new groups are discoverable INSTANTLY instead
 * of waiting for the nightly 2am cron.
 */

import * as React from "react";
import { toast } from "sonner";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Network,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
} from "lucide-react";
import type { SitemapStatus } from "@/lib/sitemap";

interface Props {
  csrfToken: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "nunca";
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (!Number.isFinite(diff) || diff < 0) return "ahora";
    const min = Math.floor(diff / 60_000);
    if (min < 1) return "hace segundos";
    if (min < 60) return `hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `hace ${h} h`;
    const days = Math.floor(h / 24);
    return `hace ${days} ${days === 1 ? "día" : "días"}`;
  } catch {
    return "—";
  }
}

export function AdminSitemapCard({ csrfToken }: Props) {
  const [status, setStatus] = React.useState<SitemapStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [regenerating, setRegenerating] = React.useState(false);
  const [lastRefresh, setLastRefresh] = React.useState<number>(Date.now());

  const loadStatus = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sitemap", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setStatus(json.data as SitemapStatus);
      } else {
        toast.error(json.error || "No se pudo leer el estado del sitemap.");
      }
    } catch {
      toast.error("No se pudo leer el estado del sitemap.");
    } finally {
      setLoading(false);
      setLastRefresh(Date.now());
    }
  }, []);

  React.useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Keep the freshness badge honest while the tab is open (publishes from
  // other tabs / the cron would otherwise leave a stale "Al día" badge).
  React.useEffect(() => {
    const t = setInterval(loadStatus, 60_000);
    return () => clearInterval(t);
  }, [loadStatus]);

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/admin/sitemap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrf: csrfToken }),
      });
      const json = await res.json();
      if (json.ok) {
        const d = json.data;
        toast.success("Sitemap regenerado", {
          description: `${d.groups.toLocaleString("es-ES")} grupos · ${d.totalUrls.toLocaleString("es-ES")} URLs · ${d.durationMs} ms`,
        });
        await loadStatus();
      } else {
        toast.error(json.error || "No se pudo regenerar el sitemap.");
      }
    } catch {
      toast.error("No se pudo regenerar el sitemap.");
    } finally {
      setRegenerating(false);
    }
  };

  // ---- States ---------------------------------------------------------------

  if (loading && !status) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3.5 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <Skeleton className="h-9 w-44" />
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  const stale = status.stale;
  const missing = Math.max(0, status.liveGroupsInDb - status.groupsInSitemap);

  return (
    <Card
      className={
        stale
          ? "border-amber-200/80 dark:border-amber-900/50"
          : "border-emerald-200/60 dark:border-emerald-900/40"
      }
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span
            className={`grid h-8 w-8 place-items-center rounded-lg ${
              stale
                ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
            }`}
          >
            <Network className="h-4 w-4" />
          </span>
          Sitemap XML
        </CardTitle>
        <CardDescription>
          Estado de descubrimiento para Google — regenera al instante tras publicar grupos.
        </CardDescription>
        <CardAction>
          {status.exists ? (
            stale ? (
              <Badge
                variant="outline"
                className="gap-1 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400"
              >
                <AlertTriangle className="h-3 w-3" />
                Desactualizado
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
              >
                <CheckCircle2 className="h-3 w-3" />
                Al día
              </Badge>
            )
          ) : (
            <Badge
              variant="outline"
              className="gap-1 border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-400"
            >
              <AlertTriangle className="h-3 w-3" />
              No generado
            </Badge>
          )}
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key numbers */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
            <div className="text-lg font-bold tabular-nums leading-tight">
              {status.totalUrls.toLocaleString("es-ES")}
            </div>
            <div className="text-[11px] text-muted-foreground">URLs totales</div>
          </div>
          <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
            <div className="text-lg font-bold tabular-nums leading-tight">
              {status.groupsInSitemap.toLocaleString("es-ES")}
            </div>
            <div className="text-[11px] text-muted-foreground">grupos en sitemap</div>
          </div>
          <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
            <div
              className={`text-lg font-bold tabular-nums leading-tight ${
                stale ? "text-amber-600 dark:text-amber-400" : ""
              }`}
            >
              {status.liveGroupsInDb.toLocaleString("es-ES")}
            </div>
            <div className="text-[11px] text-muted-foreground">grupos publicados</div>
          </div>
        </div>

        {/* Stale warning */}
        {stale && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {status.exists
                ? missing > 0
                  ? `Hay ${missing.toLocaleString("es-ES")} ${missing === 1 ? "grupo publicado que no está" : "grupos publicados que no están"} en el sitemap. Regenera para que Google los descubra.`
                  : "El sitemap incluye grupos que ya no están publicados. Regenera para limpiarlo."
                : "Todavía no se ha generado ningún sitemap. Regénéralo para que Google pueda descubrir los grupos."}
            </span>
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Última generación: {formatRelative(status.generatedAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {status.files.length} {status.files.length === 1 ? "archivo" : "archivos"}
          </span>
          <span className="inline-flex items-center gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            comprobado {formatRelative(new Date(lastRefresh).toISOString())}
          </span>
        </div>

        {/* File list — scrollable */}
        {status.files.length > 0 && (
          <div className="max-h-44 overflow-y-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr className="text-left text-muted-foreground">
                  <th className="px-3 py-1.5 font-medium">Archivo</th>
                  <th className="px-3 py-1.5 text-right font-medium">URLs</th>
                  <th className="px-3 py-1.5 text-right font-medium">Tamaño</th>
                </tr>
              </thead>
              <tbody>
                {status.files.map((f) => (
                  <tr key={f.filename} className="border-t">
                    <td className="px-3 py-1.5 font-mono text-[11px]">{f.filename}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {f.urlCount.toLocaleString("es-ES")}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                      {formatBytes(f.bytes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={regenerate}
            disabled={regenerating}
            size="sm"
            className={
              stale
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }
          >
            {regenerating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Regenerando…
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerar ahora
              </>
            )}
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Ver sitemap.xml
            </a>
          </Button>
          <p className="text-[11px] text-muted-foreground">
            También se regenera automáticamente al publicar grupos y cada noche (cron 02:00).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
