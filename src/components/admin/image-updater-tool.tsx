"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import {
  CheckCircle2,
  Cloud,
  Download,
  Globe,
  HardDrive,
  Image as ImageIcon,
  ImageDown,
  ImageOff,
  Layers,
  LayoutGrid,
  Link2,
  ListChecks,
  Loader2,
  MinusCircle,
  Play,
  RefreshCw,
  RotateCcw,
  Rows3,
  Server,
  SlidersHorizontal,
  Square,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

interface PreviewCandidate {
  id: string;
  groupName: string;
  slug: string;
  joinLink: string;
  profileImage: string | null;
  linkStatus: string;
  categoryName: string | null;
  countryName: string | null;
}

interface ScopeCounts {
  missing: number;
  cdn: number;
  null: number;
  local: number;
  total: number;
}

const BATCH_OPTIONS = ["20", "50", "100", "200"];

/** mm:ss for the live elapsed timer. */
function formatElapsed(totalSec: number): string {
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}m ${s}s`;
}

/** KB / MB with Spanish-friendly formatting (no decimals under 1 MB). */
function formatSize(bytes: number): string {
  const kb = bytes / 1024;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb.toFixed(0)} KB`;
}

/** Mirrors the SQL CDN condition (whatsapp.com / whatsapp.net hosts). */
function isCdnLike(url: string | null | undefined): boolean {
  return Boolean(url && (url.includes("whatsapp.com") || url.includes("whatsapp.net")));
}

type ImageState = "local" | "cdn" | "null" | "external";

function imageStateOf(url: string | null): ImageState {
  if (!url) return "null";
  if (url.startsWith("/media/")) return "local";
  if (isCdnLike(url)) return "cdn";
  return "external";
}

const IMAGE_STATE_META: Record<ImageState, { label: string; badgeClass: string }> = {
  local: {
    label: "Local",
    badgeClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  cdn: {
    label: "CDN",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  null: {
    label: "NULL",
    badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  },
  external: {
    label: "Externa",
    badgeClass: "bg-muted text-muted-foreground",
  },
};

const OUTCOME_TOAST: Record<
  ImageRowResult["outcome"],
  { message: string; kind: "success" | "info" | "warning" | "error" }
> = {
  localized: { message: "Imagen descargada y guardada en tu servidor.", kind: "success" },
  "already-local": { message: "El grupo ya tiene una imagen local.", kind: "info" },
  "revoked-link": {
    message:
      "Enlace confirmado revocado (verificado con 3 IPs distintos del proxy): no hay imagen nueva.",
    kind: "warning",
  },
  "no-image": {
    message:
      "Sin imagen tras 3 intentos con IPs distintas. Suele ser temporal — reintenta más tarde.",
    kind: "warning",
  },
  failed: {
    message: "El reintento falló. Revisa el proxy y vuelve a intentarlo.",
    kind: "error",
  },
};

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------

/**
 * Thumbnail with lazy loading + onError fallback. WhatsApp CDN URLs go
 * through the /api/img referer-fix proxy (same as GroupImage); /media/ and
 * other relative paths are served directly by the app.
 */
function Thumb({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [errored, setErrored] = React.useState(false);

  const resolved = React.useMemo(() => {
    if (!src || errored) return null;
    if (
      src.startsWith("https://pps.whatsapp.net/") ||
      src.startsWith("https://mmg.whatsapp.net/")
    ) {
      return `/api/img?url=${encodeURIComponent(src)}&XTransformPort=3000`;
    }
    return src;
  }, [src, errored]);

  if (!resolved) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "grid shrink-0 place-items-center border border-dashed bg-muted text-muted-foreground/50",
          className
        )}
      >
        <ImageIcon className="h-5 w-5" />
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("shrink-0 object-cover", className)}
      onError={() => setErrored(true)}
    />
  );
}

function StateBadge({ url }: { url: string | null }) {
  const meta = IMAGE_STATE_META[imageStateOf(url)];
  return (
    <Badge
      variant="secondary"
      className={cn("px-1.5 text-[10px] font-semibold uppercase", meta.badgeClass)}
    >
      {meta.label}
    </Badge>
  );
}

function OutcomeBadge({
  outcome,
  bytes,
}: {
  outcome: ImageRowResult["outcome"];
  bytes: number;
}) {
  switch (outcome) {
    case "localized":
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-700">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Guardada {formatSize(bytes)}
        </Badge>
      );
    case "already-local":
      return (
        <Badge
          variant="secondary"
          className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          Ya local
        </Badge>
      );
    case "revoked-link":
      return (
        <Badge
          variant="secondary"
          className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
        >
          Enlace revocado
        </Badge>
      );
    case "no-image":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        >
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

type HeroTone = "emerald" | "amber" | "neutral";

const HERO_TONES: Record<HeroTone, string> = {
  emerald:
    "border-emerald-200/80 bg-emerald-50 text-emerald-600 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400",
  amber:
    "border-amber-200/80 bg-amber-50 text-amber-600 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400",
  neutral: "border-border bg-muted text-foreground",
};

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: HeroTone;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Card className="py-0 transition-colors hover:border-emerald-200/70 dark:hover:border-emerald-900/50">
      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
        <div
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl border",
            HERO_TONES[tone]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl font-bold tracking-tight tabular-nums">
            {value.toLocaleString("es-ES")}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground/80">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

type PillTone = "emerald" | "neutral" | "amber" | "rose";

const PILL_TONES: Record<PillTone, string> = {
  emerald:
    "border-emerald-200/70 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400",
  neutral: "bg-muted/60 text-foreground",
  amber:
    "border-amber-200/70 bg-amber-50/70 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400",
  rose:
    "border-rose-200/70 bg-rose-50/70 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-400",
};

function CounterPill({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: PillTone;
  value: string | number;
  label: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors",
        PILL_TONES[tone]
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="text-sm font-bold tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

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
  const initialBatch = String(Math.min(defaultBatch, 200));
  const [batchSize, setBatchSize] = React.useState(
    BATCH_OPTIONS.includes(initialBatch) ? initialBatch : "20"
  );

  // --- Live metadata (scope counts + queue preview) ---
  const [scopes, setScopes] = React.useState<ScopeCounts | null>(null);
  const [preview, setPreview] = React.useState<PreviewCandidate[]>([]);
  const [metaLoading, setMetaLoading] = React.useState(true);
  const [metaTick, setMetaTick] = React.useState(0);

  // --- Run state ---
  const runningRef = React.useRef(false);
  const [running, setRunning] = React.useState(false);
  const [rows, setRows] = React.useState<ImageRowResult[]>([]);
  const [done, setDone] = React.useState(0);
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [finished, setFinished] = React.useState(false);

  // --- Live run telemetry (Task 34: the run must FEEL alive) ---
  const [batchIdx, setBatchIdx] = React.useState(0);
  const [inFlight, setInFlight] = React.useState(false);
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const startedAtRef = React.useRef(0);

  // 1s tick while running — proves the process is alive even while a big
  // batch POST is still streaming rows server-side.
  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setElapsedSec(Math.max(0, Math.round((Date.now() - startedAtRef.current) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const throughputPerMin = React.useMemo(() => {
    if (elapsedSec < 5 || done === 0) return 0;
    return Math.max(1, Math.round(done / (elapsedSec / 60)));
  }, [done, elapsedSec]);

  const etaMin =
    throughputPerMin > 0 && remaining !== null && remaining > 0
      ? Math.max(1, Math.ceil(remaining / throughputPerMin))
      : null;

  // --- Results presentation ---
  const [view, setView] = React.useState<"grid" | "table">("grid");
  const [retryingIds, setRetryingIds] = React.useState<Set<string>>(new Set());

  // Instant dynamic loads: live scope counts + queue preview for the
  // current filter — on mount, on every filter change and after each run
  // (metaTick). Never swapped while a run is in progress.
  const filterKey = React.useMemo(
    () =>
      JSON.stringify({ scope, statusScope, onlyActiveLinks, overwrite, categoryId, countryId }),
    [scope, statusScope, onlyActiveLinks, overwrite, categoryId, countryId]
  );

  React.useEffect(() => {
    if (runningRef.current) return;
    let cancelled = false;

    const params = new URLSearchParams({
      scope,
      status: statusScope,
      onlyActiveLinks: String(onlyActiveLinks),
      overwrite: String(overwrite),
      preview: "12",
    });
    if (categoryId !== "all") params.set("categoryId", categoryId);
    if (countryId !== "all") params.set("countryId", countryId);

    setMetaLoading(true);
    fetch(`/api/admin/tools/image-localize?${params.toString()}`, { cache: "no-store" })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as
          | { ok: boolean; scopes?: ScopeCounts; preview?: PreviewCandidate[] }
          | null;
        if (cancelled || !res.ok || !data?.ok) return;
        setScopes(data.scopes ?? null);
        setPreview(data.preview ?? []);
      })
      .catch(() => {
        /* transient network error — keep the previous data on screen */
      })
      .finally(() => {
        if (!cancelled) setMetaLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filterKey, metaTick, scope, statusScope, onlyActiveLinks, overwrite, categoryId, countryId]);

  const counters = React.useMemo(() => {
    let localized = 0;
    let failed = 0;
    let alreadyLocal = 0;
    let skipped = 0;
    let bytes = 0;
    for (const r of rows) {
      if (r.outcome === "localized") {
        localized++;
        bytes += r.bytes;
      } else if (r.outcome === "failed") failed++;
      else if (r.outcome === "already-local") alreadyLocal++;
      else skipped++; // revoked-link + no-image (sin imagen nueva)
    }
    return { localized, failed, alreadyLocal, skipped, bytes };
  }, [rows]);

  /** Rows the current scope would process (chips + queue summary). */
  const queueCount = React.useMemo(() => {
    if (!scopes) return null;
    if (scope === "all") return overwrite ? scopes.total : scopes.missing;
    if (scope === "cdn") return scopes.cdn;
    if (scope === "null") return scopes.null;
    return scopes.missing;
  }, [scopes, scope, overwrite]);

  const allScopesDone =
    scopes !== null && scopes.missing === 0 && scopes.cdn === 0 && scopes.null === 0;

  const totalWithImages = Math.max(stats.groupsTotal - stats.nullImages, 1);
  const coveragePct = Math.min(
    100,
    Math.round((stats.localImages / totalWithImages) * 100)
  );

  const scopeChips: Array<{
    value: string;
    label: string;
    count: number | null;
    icon: React.ComponentType<{ className?: string }>;
    hint: string;
  }> = [
    {
      value: "missing",
      label: "Faltantes",
      count: scopes?.missing ?? null,
      icon: ImageDown,
      hint: "Grupos sin imagen local (NULL, CDN o externa)",
    },
    {
      value: "cdn",
      label: "CDN",
      count: scopes?.cdn ?? null,
      icon: Cloud,
      hint: "Solo imágenes en el CDN de WhatsApp",
    },
    {
      value: "null",
      label: "NULL",
      count: scopes?.null ?? null,
      icon: ImageOff,
      hint: "Solo grupos sin ninguna imagen",
    },
    {
      value: "all",
      label: "Todas",
      count: scopes ? (overwrite ? scopes.total : scopes.missing) : null,
      icon: Layers,
      hint: overwrite
        ? "Todos los grupos del contexto"
        : "Sin re-descarga equivale a Faltantes",
    },
  ];

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
    setBatchIdx(0);
    setElapsedSec(0);
    startedAtRef.current = Date.now();

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

        setInFlight(true);
        const res = await fetch("/api/admin/tools/image-localize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filter, limit: Number(batchSize), csrf: csrfToken }),
        }).catch(() => null);
        setInFlight(false);
        const data = (await res?.json().catch(() => null)) as
          | { ok: boolean; error?: string; rows?: ImageRowResult[]; scanned?: number; remaining?: number }
          | null;

        if (!res || !res.ok || !data?.ok) {
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
        setBatchIdx((i) => i + 1);

        const scanned = data.scanned ?? batch.length;
        if (scanned === 0) break;
        if (scanned < Number(batchSize)) break;
        if ((data.remaining ?? 0) === 0) break;
      }

      setFinished(true);
    } catch {
      toast.error("Error de red durante la descarga.");
    } finally {
      setInFlight(false);
      runningRef.current = false;
      setRunning(false);
      router.refresh();
      setMetaTick((t) => t + 1);
    }
  }

  function stop() {
    runningRef.current = false;
  }

  /** Per-group "Reintentar": one fresh localization attempt (POST single). */
  async function retryGroup(groupId: string) {
    if (running || retryingIds.has(groupId)) return;
    setRetryingIds((prev) => new Set(prev).add(groupId));
    try {
      const res = await fetch("/api/admin/tools/image-localize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "single", groupId, csrf: csrfToken }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string; row?: ImageRowResult }
        | null;
      if (!res.ok || !data?.ok || !data.row) {
        toast.error(data?.error || "No se pudo reintentar la descarga.");
        return;
      }
      const row = data.row;
      setRows((prev) => prev.map((r) => (r.id === groupId ? { ...r, ...row } : r)));
      const t = OUTCOME_TOAST[row.outcome];
      if (t.kind === "success") toast.success(t.message);
      else if (t.kind === "error") toast.error(t.message);
      else if (t.kind === "warning") toast.warning(t.message);
      else toast.info(t.message);
      setMetaTick((tick) => tick + 1);
      router.refresh();
    } catch {
      toast.error("Error de red al reintentar.");
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
    }
  }

  const progressPct =
    remaining === null && done === 0
      ? 0
      : Math.min(100, Math.round((done / Math.max(done + (remaining ?? 0), 1)) * 100));

  const showCounters = rows.length > 0;

  return (
    <div className="space-y-6">
      {/* --- Cobertura: stat cards + barra de progreso --------------------- */}
      <section
        aria-label="Cobertura de imágenes"
        className="grid grid-cols-2 gap-4 xl:grid-cols-4"
      >
        <StatCard
          icon={Server}
          tone="emerald"
          label="Imágenes autohospedadas"
          value={stats.localImages}
          hint="Servidas desde /media en tu servidor"
        />
        <StatCard
          icon={ImageOff}
          tone="amber"
          label="Sin imagen (NULL)"
          value={stats.nullImages}
          hint="Grupos sin og:image detectada"
        />
        <StatCard
          icon={Globe}
          tone="neutral"
          label="Aún en CDN de WhatsApp"
          value={stats.cdnImages}
          hint="Referencia externa, conviene localizar"
        />
        <StatCard
          icon={Link2}
          tone="emerald"
          label="Enlaces activos"
          value={stats.linkActive}
          hint={`de ${stats.groupsTotal.toLocaleString("es-ES")} grupos en total`}
        />
      </section>

      <Card className="py-0">
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center lg:gap-6">
          <div className="shrink-0 lg:w-72">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <HardDrive className="h-4 w-4 text-emerald-600" />
              Cobertura de imágenes autohospedadas
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Grupos con imagen ya guardada en tu servidor frente al total con imagen.
            </p>
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <Progress
              value={coveragePct}
              className="h-3"
              aria-label={`Cobertura de imágenes autohospedadas: ${coveragePct}%`}
            />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
                Autohospedadas {stats.localImages.toLocaleString("es-ES")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
                CDN {stats.cdnImages.toLocaleString("es-ES")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full bg-muted-foreground/40"
                  aria-hidden="true"
                />
                Sin imagen {stats.nullImages.toLocaleString("es-ES")}
              </span>
            </div>
          </div>
          <div className="shrink-0 lg:w-24 lg:text-right">
            <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {coveragePct}%
            </div>
            <div className="text-[11px] text-muted-foreground">autohospedado</div>
          </div>
        </CardContent>
      </Card>

      {/* --- Filtros ------------------------------------------------------ */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
            Filtros y ejecución
          </CardTitle>
          <CardDescription>
            Define qué grupos entran en la cola. Política de descarga única: un grupo
            con imagen ya local no se vuelve a descargar salvo que marques
            «Re-descargar». Las descargas usan el proxy residencial en lotes pequeños.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Ámbito con recuentos en vivo */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">
              Ámbito de la cola
            </span>
            <div role="group" aria-label="Ámbito de la cola" className="flex flex-wrap gap-2">
              {scopeChips.map((chip) => {
                const active = scope === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setScope(chip.value)}
                    disabled={running}
                    aria-pressed={active}
                    title={chip.hint}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
                      active
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                        : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <chip.icon className="h-4 w-4 shrink-0" />
                    {chip.label}
                    <span
                      className={cn(
                        "inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-semibold tabular-nums",
                        active ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {chip.count === null ? (
                        <span aria-hidden="true" className="animate-pulse">
                          …
                        </span>
                      ) : (
                        chip.count.toLocaleString("es-ES")
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Los recuentos se actualizan al instante con cada filtro y tras cada
              ejecución.
            </p>
          </div>

          {/* Selectores */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="img-status-select">
                Estado del grupo
              </Label>
              <Select value={statusScope} onValueChange={setStatusScope} disabled={running}>
                <SelectTrigger id="img-status-select" className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Publicados (live)</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="img-category-select">
                Categoría
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={running}>
                <SelectTrigger id="img-category-select" className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="img-country-select">
                País
              </Label>
              <Select value={countryId} onValueChange={setCountryId} disabled={running}>
                <SelectTrigger id="img-country-select" className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="img-batch-select">
                Tamaño de lote
              </Label>
              <Select value={batchSize} onValueChange={setBatchSize} disabled={running}>
                <SelectTrigger id="img-batch-select" className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BATCH_OPTIONS.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v} por lote
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Casillas de política */}
          <div className="grid gap-4 rounded-xl border bg-muted/40 p-4 sm:grid-cols-2">
            <label
              className="flex cursor-pointer items-start gap-3"
              htmlFor="img-active-links"
            >
              <Checkbox
                id="img-active-links"
                checked={onlyActiveLinks}
                onCheckedChange={(v) => setOnlyActiveLinks(v === true)}
                disabled={running}
                className="mt-0.5"
              />
              <span>
                <span className="text-sm font-medium">Solo enlaces activos</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Omite grupos con enlace revocado y ahorra ancho de banda del proxy.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3" htmlFor="img-overwrite">
              <Checkbox
                id="img-overwrite"
                checked={overwrite}
                onCheckedChange={(v) => setOverwrite(v === true)}
                disabled={running}
                className="mt-0.5"
              />
              <span>
                <span className="text-sm font-medium">Re-descargar también las locales</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Vuelve a usar el proxy por cada imagen ya autohospedada. Márkalo solo
                  para refrescar.
                </span>
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* --- Cola de proceso (vista previa) ------------------------------- */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-4 w-4 text-emerald-600" />
            Cola de proceso
          </CardTitle>
          <CardDescription>
            Los próximos grupos que el lote procesará con los filtros actuales —
            exactamente en el mismo orden.
          </CardDescription>
          <CardAction>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex h-7 items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 text-xs font-medium"
                aria-live="polite"
              >
                {queueCount === null ? (
                  <Skeleton className="h-3 w-10" />
                ) : (
                  <span className="font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {queueCount.toLocaleString("es-ES")}
                  </span>
                )}
                grupos en cola
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMetaTick((t) => t + 1)}
                disabled={running || metaLoading}
                aria-label="Actualizar la cola de proceso"
              >
                <RefreshCw className={cn("h-4 w-4", metaLoading && "animate-spin")} />
                Actualizar
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          {metaLoading && preview.length === 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border p-3"
                  aria-hidden="true"
                >
                  <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : preview.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-10 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold">
                {allScopesDone
                  ? "Todo al día: todas las imágenes ya están autohospedadas."
                  : "Ningún grupo coincide con los filtros actuales."}
              </p>
              <p className="max-w-md text-xs text-muted-foreground">
                {allScopesDone
                  ? "Cuando importes grupos nuevos o sus enlaces cambien, volverán a aparecer aquí."
                  : "Prueba a cambiar el ámbito, el estado o los bancos de categoría y país."}
              </p>
            </div>
          ) : (
            <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {preview.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-emerald-200/80 hover:bg-emerald-50/30 dark:hover:border-emerald-900/50 dark:hover:bg-emerald-950/20"
                >
                  <Thumb
                    src={c.profileImage}
                    alt={c.groupName}
                    className="h-12 w-12 overflow-hidden rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={c.groupName}>
                      {c.groupName}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {c.categoryName ?? "Sin categoría"} · {c.countryName ?? "Sin país"}
                    </p>
                  </div>
                  <StateBadge url={c.profileImage} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Barra de ejecución fija -------------------------------------- */}
      <div className="sticky bottom-4 z-30">
        <div className="rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="min-w-0 flex-1 space-y-2">
              <div
                role="status"
                aria-live="polite"
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
              >
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  {running ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  ) : finished ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Play className="h-4 w-4 text-muted-foreground" />
                  )}
                  {running
                    ? `Descargando imágenes · lote ${batchIdx + 1} · ${formatElapsed(elapsedSec)}`
                    : finished
                      ? "Ejecución completada"
                      : "Listo para iniciar"}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {progressPct}% · procesados {done.toLocaleString("es-ES")}
                  {remaining !== null && (
                    <> · quedan {remaining.toLocaleString("es-ES")}</>
                  )}
                  {running && throughputPerMin > 0 && (
                    <> · ~{throughputPerMin.toLocaleString("es-ES")}/min{etaMin ? ` · ~${etaMin} min restantes` : ""}</>
                  )}
                </span>
              </div>
              <Progress value={progressPct} className="h-2.5" />
              {running ? (
                <p className="truncate text-xs text-muted-foreground">
                  {inFlight
                    ? `Procesando lote ${batchIdx + 1} (${batchSize} grupos, 12 en paralelo, 1 IP por petición)… los resultados aparecen al completarse el lote.`
                    : rows[0]
                      ? `Último procesado: ${rows[0].name}`
                      : "Iniciando primer lote…"}
                </p>
              ) : null}
            </div>

            {showCounters && (
              <div className="flex flex-wrap items-center gap-2">
                <CounterPill
                  icon={CheckCircle2}
                  tone="emerald"
                  value={counters.localized}
                  label="Guardadas"
                />
                <CounterPill
                  icon={Download}
                  tone="emerald"
                  value={formatSize(counters.bytes)}
                  label="Descargados"
                />
                <CounterPill
                  icon={CheckCircle2}
                  tone="emerald"
                  value={counters.alreadyLocal}
                  label="Ya locales"
                />
                <CounterPill
                  icon={MinusCircle}
                  tone="amber"
                  value={counters.skipped}
                  label="Revocados/Sin imagen"
                />
                <CounterPill
                  icon={XCircle}
                  tone="rose"
                  value={counters.failed}
                  label="Fallidos"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              {running ? (
                <Button variant="destructive" size="sm" onClick={stop}>
                  <Square className="h-4 w-4" />
                  Detener
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={start}
                  disabled={scopes !== null && queueCount === 0}
                  title={
                    scopes !== null && queueCount === 0
                      ? "No hay grupos en la cola con los filtros actuales"
                      : undefined
                  }
                >
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
        </div>
      </div>

      {/* --- Resultados ---------------------------------------------------- */}
      {rows.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageDown className="h-4 w-4 text-emerald-600" />
              Resultados
              <span className="font-normal text-muted-foreground">
                ({rows.length.toLocaleString("es-ES")})
              </span>
            </CardTitle>
            <CardDescription>
              Cada imagen se guarda en <code>/media/group_images/</code> con el nombre
              del grupo (slug) y queda bloqueada para Google (noindex + robots).
            </CardDescription>
            <CardAction>
              <div
                role="group"
                aria-label="Vista de resultados"
                className="flex items-center gap-0.5 rounded-lg border bg-muted/40 p-0.5"
              >
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  aria-pressed={view === "grid"}
                  title="Vista de galería"
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    view === "grid"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Galería</span>
                </button>
                <button
                  type="button"
                  onClick={() => setView("table")}
                  aria-pressed={view === "table"}
                  title="Vista de tabla"
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    view === "table"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Rows3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tabla</span>
                </button>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            {view === "grid" ? (
              <div className="max-h-[40rem] overflow-y-auto pr-1">
                <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {rows.map((r, i) => (
                    <ResultCard
                      key={`${r.id}-${i}`}
                      row={r}
                      retrying={retryingIds.has(r.id)}
                      disabled={running}
                      onRetry={retryGroup}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-h-[32rem] overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="px-3 text-xs">Grupo</TableHead>
                      <TableHead className="px-2 text-xs">Resultado</TableHead>
                      <TableHead className="px-2 text-xs">Archivo</TableHead>
                      <TableHead className="px-2 text-right text-xs">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r, i) => {
                      const retryable = r.outcome === "failed" || r.outcome === "no-image";
                      const retrying = retryingIds.has(r.id);
                      return (
                        <TableRow key={`${r.id}-${i}`} className="text-xs">
                          <TableCell className="max-w-[280px] px-3">
                            <div className="truncate font-medium" title={r.name}>
                              {r.name}
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <OutcomeBadge outcome={r.outcome} bytes={r.bytes} />
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate px-2 font-mono text-muted-foreground">
                            {r.localUrl || "—"}
                          </TableCell>
                          <TableCell className="px-2 text-right">
                            {retryable ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => retryGroup(r.id)}
                                disabled={running || retrying}
                                aria-label={`Reintentar descarga de imagen de ${r.name}`}
                              >
                                {retrying ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-3.5 w-3.5" />
                                )}
                                Reintentar
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResultCard({
  row,
  retrying,
  disabled,
  onRetry,
}: {
  row: ImageRowResult;
  retrying: boolean;
  disabled: boolean;
  onRetry: (groupId: string) => void;
}) {
  const retryable = row.outcome === "failed" || row.outcome === "no-image";
  return (
    <article className="flex items-start gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-emerald-200/80 hover:bg-emerald-50/30 dark:hover:border-emerald-900/50 dark:hover:bg-emerald-950/20">
      <Thumb
        src={row.localUrl}
        alt={row.name}
        className="h-14 w-14 overflow-hidden rounded-lg"
      />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold" title={row.name}>
          {row.name}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <OutcomeBadge outcome={row.outcome} bytes={row.bytes} />
          {retryable && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onRetry(row.id)}
              disabled={disabled || retrying}
              aria-label={`Reintentar descarga de imagen de ${row.name}`}
            >
              {retrying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              Reintentar
            </Button>
          )}
        </div>
        {row.localUrl ? (
          <p
            className="mt-1.5 truncate font-mono text-[11px] text-muted-foreground"
            title={row.localUrl}
          >
            {row.localUrl}
          </p>
        ) : null}
      </div>
    </article>
  );
}
