"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Link2,
  Loader2,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
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

interface CheckRowResult {
  id: string;
  name: string;
  slug: string;
  oldStatus: string;
  newStatus: string;
  changed: boolean;
}

const STALE_OPTIONS = [
  { value: "0", label: "Todos (sin filtro de antigüedad)" },
  { value: "24", label: "No comprobados en 24 h" },
  { value: "72", label: "No comprobados en 3 días" },
  { value: "168", label: "No comprobados en 7 días" },
  { value: "720", label: "No comprobados en 30 días" },
];

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-700">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Activo
        </Badge>
      );
    case "revoked":
      return (
        <Badge className="bg-rose-600 hover:bg-rose-700">
          <XCircle className="mr-1 h-3 w-3" />
          Revocado
        </Badge>
      );
    case "unknown":
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <HelpCircle className="mr-1 h-3 w-3" />
          Desconocido
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function LinkCheckerTool({
  csrfToken,
  categories,
  countries,
  stats,
  defaultBatch,
}: Props) {
  const router = useRouter();

  // --- Filter state ---
  const [statusScope, setStatusScope] = React.useState("live");
  const [linkScope, setLinkScope] = React.useState("all");
  const [categoryId, setCategoryId] = React.useState("all");
  const [countryId, setCountryId] = React.useState("all");
  const [staleHours, setStaleHours] = React.useState("0");
  const [batchSize, setBatchSize] = React.useState(String(Math.min(defaultBatch, 50)));

  // --- Run state ---
  const runningRef = React.useRef(false);
  const [running, setRunning] = React.useState(false);
  const [rows, setRows] = React.useState<CheckRowResult[]>([]);
  const [checked, setChecked] = React.useState(0);
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [finished, setFinished] = React.useState(false);

  const counters = React.useMemo(() => {
    let active = 0;
    let revoked = 0;
    let unknown = 0;
    let changed = 0;
    for (const r of rows) {
      if (r.newStatus === "active") active++;
      else if (r.newStatus === "revoked") revoked++;
      else unknown++;
      if (r.changed) changed++;
    }
    return { active, revoked, unknown, changed };
  }, [rows]);

  function reset() {
    if (running) return;
    setRows([]);
    setChecked(0);
    setRemaining(null);
    setFinished(false);
  }

  async function start() {
    if (running) return;
    runningRef.current = true;
    setRunning(true);
    setFinished(false);

    const filter = {
      status: statusScope,
      linkStatus: linkScope,
      categoryId: categoryId === "all" ? undefined : categoryId,
      countryId: countryId === "all" ? undefined : countryId,
      checkedBeforeHours: Number(staleHours) > 0 ? Number(staleHours) : undefined,
    };

    try {
      let done = 0;
      const seen = new Set<string>();

      for (;;) {
        if (!runningRef.current) break;

        const res = await fetch("/api/admin/tools/link-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filter, limit: Number(batchSize), csrf: csrfToken }),
        });
        const data = (await res.json().catch(() => null)) as
          | { ok: boolean; error?: string; rows?: CheckRowResult[]; scanned?: number; remaining?: number }
          | null;

        if (!res.ok || !data?.ok) {
          toast.error(data?.error || "Error al comprobar el lote.");
          break;
        }

        const batch = data.rows ?? [];
        done += data.scanned ?? batch.length;

        // Guard against re-checking forever: without a time filter the same
        // rows get re-selected; when a whole batch was already checked this
        // session, the population is exhausted.
        const fresh = batch.filter((r) => !seen.has(r.id));
        for (const r of batch) seen.add(r.id);
        if (batch.length > 0 && fresh.length === 0) break;

        setRemaining(data.remaining ?? 0);
        setChecked(done);
        setRows((prev) => [...batch.slice().reverse(), ...prev]);

        const scanned = data.scanned ?? batch.length;
        if (scanned === 0) break;
        if (scanned < Number(batchSize)) break;
        if ((data.remaining ?? 0) === 0) break;
      }

      setFinished(true);
    } catch {
      toast.error("Error de red durante la comprobación.");
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
    remaining === null && checked === 0
      ? 0
      : Math.min(100, Math.round((checked / Math.max(checked + (remaining ?? 0), 1)) * 100));

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Enlaces activos</div>
            <div className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.linkActive.toLocaleString("es-ES")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Revocados (Expirado)</div>
            <div className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-400">
              {stats.linkRevoked.toLocaleString("es-ES")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Nunca comprobados</div>
            <div className="mt-1 text-2xl font-bold">
              {stats.neverChecked.toLocaleString("es-ES")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-xs text-muted-foreground">Comprobados 24 h</div>
            <div className="mt-1 text-2xl font-bold">
              {stats.checkedLast24h.toLocaleString("es-ES")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + run card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros y ejecución</CardTitle>
          <CardDescription>
            Cada lote se comprueba con concurrencia baja a través del proxy
            residencial. Puedes parar en cualquier momento: lo ya comprobado
            queda guardado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
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
              <Label className="text-xs">Estado del enlace</Label>
              <Select value={linkScope} onValueChange={setLinkScope} disabled={running}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Solo activos</SelectItem>
                  <SelectItem value="revoked">Solo revocados (re-check)</SelectItem>
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
              <Label className="text-xs">Antigüedad</Label>
              <Select value={staleHours} onValueChange={setStaleHours} disabled={running}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STALE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
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

          {/* Progress + controls */}
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {running ? "Comprobando…" : finished ? "Completado" : "Listo para empezar"}
                </span>
                <span className="text-muted-foreground">
                  {checked.toLocaleString("es-ES")} comprobados
                  {running && remaining !== null && (
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
                  Iniciar comprobación
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
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{counters.active}</div>
                <div className="text-xs text-muted-foreground">Activos</div>
              </div>
              <div className="rounded-md border bg-rose-50/50 px-3 py-2 text-center dark:bg-rose-950/20">
                <div className="text-lg font-bold text-rose-700 dark:text-rose-400">{counters.revoked}</div>
                <div className="text-xs text-muted-foreground">Revocados</div>
              </div>
              <div className="rounded-md border bg-amber-50/50 px-3 py-2 text-center dark:bg-amber-950/20">
                <div className="text-lg font-bold text-amber-700 dark:text-amber-400">{counters.unknown}</div>
                <div className="text-xs text-muted-foreground">Desconocidos</div>
              </div>
              <div className="rounded-md border bg-card px-3 py-2 text-center">
                <div className="text-lg font-bold">{counters.changed}</div>
                <div className="text-xs text-muted-foreground">Cambiaron de estado</div>
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
              <Link2 className="h-4 w-4 text-emerald-600" />
              Resultados ({rows.length.toLocaleString("es-ES")})
            </CardTitle>
            <CardDescription>
              Los cambios se aplican a la base de datos en tiempo real. Los
              revocados conservan su imagen y el badge rojo «Expirado».
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="px-3 text-xs">Grupo</TableHead>
                    <TableHead className="px-2 text-xs">Antes</TableHead>
                    <TableHead className="px-2 text-xs">Ahora</TableHead>
                    <TableHead className="px-2 text-xs">Cambio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={`${r.id}-${r.newStatus}`} className="text-xs">
                      <TableCell className="max-w-[280px] px-3">
                        <div className="truncate font-medium">{r.name}</div>
                        <div className="truncate font-mono text-muted-foreground">{r.slug}</div>
                      </TableCell>
                      <TableCell className="px-2">{statusBadge(r.oldStatus)}</TableCell>
                      <TableCell className="px-2">{statusBadge(r.newStatus)}</TableCell>
                      <TableCell className="px-2">
                        {r.changed ? (
                          <Badge
                            variant="secondary"
                            className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          >
                            Cambió
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Follow-up hint */}
      {finished && counters.revoked > 0 && (
        <Card className="border-amber-200/60 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardContent className="flex flex-col gap-2 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
              <span className="font-medium text-amber-700 dark:text-amber-300">
                {counters.revoked} enlaces revocados.
              </span>{" "}
              Los grupos siguen listados con badge «Expirado». ¿Quieres ocultarlos
              o cambiar su estado en masa?
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/grupos">
                Actualización masiva
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
