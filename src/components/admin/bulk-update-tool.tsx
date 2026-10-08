"use client";

/**
 * BulkUpdateTool — 2026 admin UX for bulk UPDATES (not just inserts).
 *
 * 1. Find groups by typing their NAME (debounced search, typeahead chips).
 * 2. Pick the changes to apply — all via auto-suggest dropdowns:
 *    move to category / country, add/remove tags, toggle 18+, set status.
 * 3. One click → POST /api/admin/bulk-update → audited.
 *
 * No manual IDs anywhere. A child could use it.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  X,
  Loader2,
  CheckCircle2,
  Layers,
  Users,
  Tag as TagIcon,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { SmartSuggest, TagSuggest, type SuggestOption, type TagOption } from "@/components/admin/smart-suggest";

interface Props {
  csrfToken: string;
  categories: { id: string; name: string; icon: string; isAdult: boolean; groupCount: number }[];
  countries: { id: string; name: string; flag: string; code: string }[];
  tagSuggestions: TagOption[];
}

type GroupLite = {
  id: string;
  title: string;
  category?: { name: string; icon?: string };
  country?: { name: string; flag?: string };
  isAdult: boolean;
};

type AdultMode = "keep" | "clean" | "adult";

const STATUS_OPTIONS = ["", "live", "pending", "rejected", "flagged", "pruned"];
const LINK_STATUS_OPTIONS = ["", "active", "revoked", "unknown"];

export function BulkUpdateTool({ csrfToken, categories, countries, tagSuggestions }: Props) {
  const router = useRouter();

  const categoryOptions: SuggestOption[] = React.useMemo(
    () =>
      categories.map((c) => ({
        value: c.id,
        label: c.name,
        icon: c.icon || undefined,
        badge: c.isAdult ? "18+" : c.groupCount > 0 ? `${c.groupCount}` : undefined,
      })),
    [categories]
  );
  const countryOptions: SuggestOption[] = React.useMemo(
    () => countries.map((c) => ({ value: c.id, label: c.name, icon: c.flag || undefined, badge: c.code?.toUpperCase() })),
    [countries]
  );

  // --- group search (typeahead over live groups, adult included for admin) ---
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GroupLite[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [selected, setSelected] = React.useState<Map<string, GroupLite>>(new Map());
  const [showResults, setShowResults] = React.useState(false);
  const searchRootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(() => {
      fetch(`/api/groups?q=${encodeURIComponent(q)}&adult=1&limite=12&XTransformPort=3000`)
        .then((r) => r.json())
        .then((j) => {
          if (cancelled) return;
          if (j?.ok && Array.isArray(j.data)) {
            setResults(
              j.data.map((g: any) => ({
                id: g.id,
                title: g.title,
                category: g.category ? { name: g.category.name, icon: g.category.icon } : undefined,
                country: g.country ? { name: g.country.name, flag: g.country.flag } : undefined,
                isAdult: !!g.isAdult,
              }))
            );
            setShowResults(true);
          }
        })
        .catch(() => {})
        .finally(() => !cancelled && setSearching(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!searchRootRef.current?.contains(e.target as Node)) setShowResults(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function toggleGroup(g: GroupLite) {
    setSelected((m) => {
      const next = new Map(m);
      if (next.has(g.id)) next.delete(g.id);
      else next.set(g.id, g);
      return next;
    });
  }

  // --- changes to apply ---
  const [categoryId, setCategoryId] = React.useState<string>("");
  const [countryId, setCountryId] = React.useState<string>("");
  const [addTags, setAddTags] = React.useState<string[]>([]);
  const [removeTags, setRemoveTags] = React.useState<string[]>([]);
  const [adultMode, setAdultMode] = React.useState<AdultMode>("keep");
  const [status, setStatus] = React.useState("");
  const [linkStatus, setLinkStatus] = React.useState("");
  const [applying, setApplying] = React.useState(false);
  const [done, setDone] = React.useState<{ updated: number; skipped: number } | null>(null);

  const selectedList = [...selected.values()];
  const hasChanges =
    categoryId !== "" ||
    countryId !== "" ||
    addTags.length > 0 ||
    removeTags.length > 0 ||
    adultMode !== "keep" ||
    status !== "" ||
    linkStatus !== "";

  function summaryParts(): string[] {
    const parts: string[] = [];
    const cat = categories.find((c) => c.id === categoryId);
    if (cat) parts.push(`Categoría → ${cat.name}`);
    const co = countries.find((c) => c.id === countryId);
    if (co) parts.push(`País → ${co.name}`);
    if (addTags.length) parts.push(`+ tags: ${addTags.join(", ")}`);
    if (removeTags.length) parts.push(`− tags: ${removeTags.join(", ")}`);
    if (adultMode === "clean") parts.push("Marcar como apto (sin 18+)");
    if (adultMode === "adult") parts.push("Marcar 18+");
    if (status) parts.push(`Estado → ${status}`);
    if (linkStatus) parts.push(`Enlace → ${linkStatus}`);
    return parts;
  }

  async function apply() {
    if (selectedList.length === 0) {
      toast.error("Selecciona al menos un grupo (busca por nombre).");
      return;
    }
    if (!hasChanges) {
      toast.error("No has configurado ningún cambio.");
      return;
    }
    setApplying(true);
    setDone(null);
    try {
      const res = await fetch("/api/admin/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupIds: selectedList.map((g) => g.id),
          changes: {
            ...(categoryId !== "" ? { categoryId } : {}),
            ...(countryId !== "" ? { countryId } : {}),
            ...(addTags.length > 0 ? { addTags } : {}),
            ...(removeTags.length > 0 ? { removeTags } : {}),
            ...(adultMode !== "keep" ? { isAdult: adultMode === "adult" } : {}),
            ...(status !== "" ? { status } : {}),
            ...(linkStatus !== "" ? { linkStatus } : {}),
          },
          csrf: csrfToken,
        }),
      });
      const data = await res.json().catch(() => ({ ok: false, error: "Respuesta inválida." }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo aplicar la actualización.");
        return;
      }
      setDone({ updated: data.updated ?? 0, skipped: data.skipped ?? 0 });
      toast.success(`${data.updated ?? 0} grupos actualizados.`);
      setSelected(new Map());
      setCategoryId("");
      setCountryId("");
      setAddTags([]);
      setRemoveTags([]);
      setAdultMode("keep");
      setStatus("");
      setLinkStatus("");
      setQuery("");
      router.refresh();
    } catch (e: any) {
      toast.error("Error de red: " + (e?.message || ""));
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Step 1 — find + select groups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              <span>1</span>
            </span>
            Busca y selecciona grupos
          </CardTitle>
          <CardDescription>
            Escribe el nombre del grupo (o parte de él) y pulsa en los resultados para añadirlos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div ref={searchRootRef} className="relative">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.trim().length >= 2 && setShowResults(true)}
                placeholder="Ej. Memes, Programadores, Digital Accounts…"
                className="h-11 pl-10"
                aria-label="Buscar grupos para actualizar"
              />
              {searching && (
                <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {showResults && results.length > 0 && (
              <ul
                role="listbox"
                aria-label="Resultados de búsqueda"
                className="absolute z-40 mt-1.5 w-full overflow-hidden rounded-xl border bg-popover p-1 shadow-lg"
              >
                {results.map((g) => {
                  const isSel = selected.has(g.id);
                  return (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => toggleGroup(g)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                          isSel ? "bg-emerald-500/10" : "hover:bg-accent"
                        }`}
                      >
                        {g.category?.icon && <span className="text-base leading-none">{g.category.icon}</span>}
                        <span className="min-w-0 flex-1 truncate font-medium">{g.title}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {g.country?.flag} {g.category?.name}
                        </span>
                        {g.isAdult && (
                          <Badge variant="outline" className="shrink-0 bg-rose-500/10 px-1 py-0 text-[9px] text-rose-600 dark:text-rose-400">
                            18+
                          </Badge>
                        )}
                        {isSel && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {selectedList.length > 0 && (
            <div className="rounded-xl border bg-muted/30 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {selectedList.length} {selectedList.length === 1 ? "grupo seleccionado" : "grupos seleccionados"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(new Map())}
                  className="h-6 px-2 text-xs text-muted-foreground"
                >
                  <X className="h-3 w-3" />
                  <span>Quitar todos</span>
                </Button>
              </div>
              <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                {selectedList.map((g) => (
                  <span
                    key={g.id}
                    className="inline-flex max-w-[240px] items-center gap-1.5 rounded-full border bg-card py-1 pl-2.5 pr-1 text-xs font-medium shadow-sm"
                  >
                    <span className="truncate">{g.title}</span>
                    {g.isAdult && <span className="text-[9px] font-bold text-rose-500">18+</span>}
                    <button
                      type="button"
                      aria-label={`Quitar ${g.title}`}
                      onClick={() => toggleGroup(g)}
                      className="grid h-4.5 w-4.5 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2 — define changes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              <span>2</span>
            </span>
            Elige los cambios a aplicar
          </CardTitle>
          <CardDescription>
            Solo se aplican los campos que rellenes — el resto queda intacto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                Mover a categoría
              </Label>
              <SmartSuggest
                id="bu-category"
                options={categoryOptions}
                value={categoryId || null}
                onChange={(v) => setCategoryId(v)}
                placeholder="Sin cambio"
                emptyText="Sin resultados"
                allowClear
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Mover a país
              </Label>
              <SmartSuggest
                id="bu-country"
                options={countryOptions}
                value={countryId || null}
                onChange={(v) => setCountryId(v)}
                placeholder="Sin cambio"
                allowClear
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
                Añadir etiquetas
              </Label>
              <TagSuggest
                id="bu-addtags"
                suggestions={tagSuggestions}
                value={addTags}
                onChange={setAddTags}
                placeholder="Etiquetas que se añadirán…"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <TagIcon className="h-3.5 w-3.5 text-muted-foreground rotate-180" />
                Quitar etiquetas
              </Label>
              <TagSuggest
                id="bu-removetags"
                suggestions={tagSuggestions}
                value={removeTags}
                onChange={setRemoveTags}
                placeholder="Etiquetas que se eliminarán…"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Contenido 18+</Label>
              <div className="flex items-center gap-1.5 rounded-xl border bg-muted/30 p-1">
                {(
                  [
                    ["keep", "Sin cambio"],
                    ["clean", "Apto"],
                    ["adult", "18+"],
                  ] as [AdultMode, string][]
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={adultMode === mode}
                    onClick={() => setAdultMode(mode)}
                    className={`h-8 flex-1 rounded-lg text-xs font-semibold transition ${
                      adultMode === mode
                        ? mode === "adult"
                          ? "bg-rose-500 text-white shadow-sm"
                          : "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bu-status">Estado</Label>
              <select
                id="bu-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm shadow-xs"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "" ? "Sin cambio" : s}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bu-linkstatus">Estado del enlace</Label>
              <select
                id="bu-linkstatus"
                value={linkStatus}
                onChange={(e) => setLinkStatus(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm shadow-xs"
              >
                {LINK_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "" ? "Sin cambio" : s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3 — review + apply */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              <span>3</span>
            </span>
            Revisa y aplica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasChanges && selectedList.length > 0 ? (
            <div className="rounded-xl border border-emerald-300/60 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
              <div className="text-sm font-semibold">
                Se actualizarán {selectedList.length} {selectedList.length === 1 ? "grupo" : "grupos"}:
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {summaryParts().map((p) => (
                  <li key={p} className="flex items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-emerald-600" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {selectedList.length === 0
                ? "Selecciona grupos en el paso 1."
                : "Configura al menos un cambio en el paso 2."}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={apply} disabled={applying || !hasChanges || selectedList.length === 0} className="h-11">
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>{applying ? "Aplicando…" : `Actualizar ${selectedList.length || ""} grupos`}</span>
            </Button>
            <span className="text-xs text-muted-foreground">
              Todo queda registrado en la auditoría del panel.
            </span>
          </div>

          {done && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-800 dark:bg-emerald-950/30">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                ✓ {done.updated} grupos actualizados
              </span>
              {done.skipped > 0 && <span className="text-muted-foreground"> · {done.skipped} omitidos</span>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
