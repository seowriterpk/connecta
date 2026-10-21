"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
  ImageDown,
  Loader2,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { ToolStats } from "@/lib/admin-tools";

interface BankItem {
  id: string;
  name: string;
}

interface Props {
  csrfToken: string;
  categories: BankItem[];
  countries: BankItem[];
  stats: ToolStats;
  defaultBatch: number;
}

interface ImageRowResult {
  id: string;
  name: string;
  outcome: "localized" | "already-local" | "revoked-link" | "no-image" | "failed";
  bytes: number;
  localUrl: string | null;
}

function outcomeBadge(outcome: ImageRowResult["outcome"], bytes: number) {
  switch (outcome) {
    case "localized":
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-700">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Guardada {(bytes / 1024).toFixed(0)} KB
        </Badge>
      );
    case "already-local":
      return (
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          Ya local
        </Badge>
      );
    case "revoked-link":
      return (
        <Badge variant="secondary" className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          Enlace revocado
        </Badge>
      );
    case "no-image":
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Sin imagen
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Falló
        </Badge>
      );
  }
}

export function ImageUpdaterTool({
  csrfToken,
  categories,
  countries,
  stats,
  defaultBatch,
}: Props) {
  const router = useRouter();

  // --- Filter state ---
  const [scope, setScope] = React.useState("missing");
  const [statusScope, setStatusScope] = React.useState("live");
  const [onlyActiveLinks, setOnlyActiveLinks] = React.useState(true);
  const [overwrite, setOverwrite] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState("all");
  const [countryId, setCountryId] = React.useState("all");
  const [batchSize, setBatchSize] = React.useState(String(Math.min(defaultBatch, 50)));

  // --- Run state ---
  const runningRef = React.useRef(false);
  const [running, setRunning] = React.useState(false);
  const [rows, setRows] = React.useState<ImageRowResult[]>([]);
  const [done, setDone] = React.useState(0);
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [finished, setFinished] = React.useState(false);

  const counters = React.useMemo(() => {
    let localized = 0;
    let failed = 0;
    let skipped = 0;
    let bytes = 0;
    for (const r of rows) {
      if (r.outcome === "localized") {
        localized++;
        bytes += r.bytes;
      } else if (r.outcome === "failed") failed++;
      else skipped++;
    }
    return { localized, failed, skipped, bytes };
  }, [rows]);

  function reset() {
    if (running) return;
    setRows([]);
    setDone(0);
    setRemaining(null);
    setFinished(false);
  }

  async function start() {
    if (running) return;
    runningRef.current = true;
    setRunning(true);
    setFinished(false);

    const filter = {
      scope,
      status: statusScope,
      onlyActiveLinks,
      overwrite,
      categoryId: categoryId === "all" ? undefined : categoryId,
      countryId: countryId === "all" ? undefined : countryId,
    };

    try {
      let processed = 0;
      const seen = new Set<string>();

      for (;;) {
        if (!runningRef.current) break;

        const res = await fetch("/api/admin/tools/image-localize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filter, limit: Number(batchSize), csrf: csrfToken }),
        });
        const data = (await res.json().catch(() => null)) as
          | { ok: boolean; error?: string; rows?: ImageRowResult[]; scanned?: number; remaining?: number }
          | null;

        if (!res.ok || !data?.ok) {
          toast.error(data?.error || "Error al procesar el lote.");
          break;
        }

        const batch = data.rows ?? [];
        processed += data.scanned ?? batch.length;

        // Guard against re-downloading forever: without a time filter the
        // same rows get re-selected; when a whole batch was already processed
        // this session, the population is exhausted.
        const fresh = batch.filter((r) => !seen.has(r.id));
        for (const r of batch) seen.add(r.id);
        if (batch.length > 0 && fresh.length === 0) break;

        setRemaining(data.remaining ?? 0);
        setDone(processed);
        setRows((prev) => [...batch.slice().reverse(), ...prev]);

        const scanned = data.scanned ?? batch.length;
        if (scanned === 0) break;
        if (scanned < Number(batchSize)) break;
        if ((data.remaining ?? 0) === 0) break;
      }

      setFinished(true);
    } catch {
      toast.error("Error de red durante la descarga.");
    } finally {
      runningRef.current = false;
      setRunning(false);
      router.refresh();
    }
  }

  function stop() {
    runningRef.current = false;
  }

  const progressPct =
    remaining === null && done === 0
      ? 0
      : Math.min(100, Math.round((done / Math.max(done + (remaining ?? 0), 1)) * 100));

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Imágenes autohospedadas</div>
            <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.localImages.toLocaleString("es-ES")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Sin imagen (NULL)</div>
            <div className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.nullImages.toLocaleString("es-ES")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Aún en CDN de WhatsApp</div>
            <div className="mt-1 text-2xl font-bold">
              {stats.cdnImages.toLocaleString("es-ES")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Enlaces activos</div>
            <div className="mt-1 text-2xl font-bold">
              {stats.linkActive.toLocaleString("es-ES")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + run */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros y ejecución</CardTitle>
          <CardDescription>
            Política de descarga única: un grupo con imagen ya local no se vuelve a
            descargar salvo que marques «Re-descargar». Las descargas usan el proxy
            residencial en lotes pequeños.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-1.5">
              <Label className="text-xs">Ámbito</Label>
              <Select value={scope} onValueChange={setScope} disabled={running}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="missing">Faltantes (recomendado)</SelectItem>
                  <SelectItem value="cdn">Solo CDN de WhatsApp</SelectItem>
                  <SelectItem value="null">Solo NULL</SelectItem>
                  <SelectItem value="all">Todo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Estado del grupo</Label>
              <Select value={statusScope} onValueChange={setStatusScope} disabled={running}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Publicados (live)</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoría</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={running}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">País</Label>
              <Select value={countryId} onValueChange={setCountryId} disabled={running}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tamaño de lote</Label>
              <Select value={batchSize} onValueChange={setBatchSize} disabled={running}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["10", "20", "30", "50"].map((v) => (
                    <SelectItem key={v} value={v}>{v} por lote</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
            <label className="flex items-center gap-2 text-sm" htmlFor="img-active-links">
              <Checkbox
                id="img-active-links"
                checked={onlyActiveLinks}
                onCheckedChange={(v) => setOnlyActiveLinks(v === true)}
                disabled={running}
              />
              <span className="text-muted-foreground">
                Solo enlaces activos <span className="text-xs">(ahorra ancho de banda del proxy)</span>
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm" htmlFor="img-overwrite">
              <Checkbox
                id="img-overwrite"
                checked={overwrite}
                onCheckedChange={(v) => setOverwrite(v === true)}
                disabled={running}
              />
              <span className="text-muted-foreground">
                Re-descargar también las que ya son locales <span className="text-xs">(paga proxy de nuevo)</span>
              </span>
            </label>
          </div>

          {/* Progress + controls */}
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {running ? "Descargando…" : finished ? "Completado" : "Listo para empezar"}
                </span>
                <span className="text-muted-foreground">
                  {done.toLocaleString("es-ES")} procesados
                  {remaining !== null && (
                    <> · quedan {remaining.toLocaleString("es-ES")}</>
                  )}
                </span>
              </div>
              <Progress value={progressPct} className="mt-2 h-2" />
            </div>
            <div className="flex items-center gap-2">
              {running ? (
                <Button variant="destructive" size="sm" onClick={stop}>
                  <Square className="h-4 w-4" />
                  Detener
                </Button>
              ) : (
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={start}>
                  <Play className="h-4 w-4" />
                  Iniciar descarga
                </Button>
              )}
              {!running && rows.length > 0 && (
                <Button variant="outline" size="sm" onClick={reset}>
                  <RotateCcw className="h-4 w-4" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Live counters */}
          {rows.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-md border bg-emerald-50/50 px-3 py-2 text-center dark:bg-emerald-950/20">
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{counters.localized}</div>
                <div className="text-xs text-muted-foreground">Guardadas</div>
              </div>
              <div className="rounded-md border bg-card px-3 py-2 text-center">
                <div className="text-lg font-bold">{(counters.bytes / 1024).toFixed(0)} KB</div>
                <div className="text-xs text-muted-foreground">Descargados</div>
              </div>
              <div className="rounded-md border bg-amber-50/50 px-3 py-2 text-center dark:bg-amber-950/20">
                <div className="text-lg font-bold text-amber-700 dark:text-amber-400">{counters.skipped}</div>
                <div className="text-xs text-muted-foreground">Omitidos</div>
              </div>
              <div className="rounded-md border bg-rose-50/50 px-3 py-2 text-center dark:bg-rose-950/20">
                <div className="text-lg font-bold text-rose-700 dark:text-rose-400">{counters.failed}</div>
                <div className="text-xs text-muted-foreground">Fallidos</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {rows.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageDown className="h-4 w-4 text-emerald-600" />
              Resultados ({rows.length.toLocaleString("es-ES")})
            </CardTitle>
            <CardDescription>
              Cada imagen se guarda en <code>/media/group_images/</code> con el
              nombre del grupo (slug) y queda bloqueada para Google
              (noindex + robots).
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="px-3 text-xs">Grupo</TableHead>
                    <TableHead className="px-2 text-xs">Resultado</TableHead>
                    <TableHead className="px-2 text-xs">Archivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={`${r.id}-${i}`} className="text-xs">
                      <TableCell className="max-w-[280px] px-3">
                        <div className="truncate font-medium">{r.name}</div>
                      </TableCell>
                      <TableCell className="px-2">{outcomeBadge(r.outcome, r.bytes)}</TableCell>
                      <TableCell className="max-w-[220px] truncate px-2 font-mono text-muted-foreground">
                        {r.localUrl || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
