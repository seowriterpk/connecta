"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Save, Pencil, Trash2, Plus, Check, Search, FileDown, FileUp, Database } from "lucide-react";
import { toast } from "sonner";

type OverrideData = {
  id: number;
  pageType: string;
  entityId: string;
  metaTitleOverride: string | null;
  metaDescriptionOverride: string | null;
  robotsOverride: string | null;
};

type IntroData = {
  id: number;
  entityType: string;
  entityName: string;
  customTitle: string | null;
  customHeroDesc: string | null;
  customIntro: string | null;
};

type SearchOption = { value: string; label: string; name: string; sub: string };

const PAGE_TYPES = ["home", "category", "country", "city", "tag", "group", "search", "static"];
const ENTITY_TYPES = ["category", "country", "city", "tag"];

/** pageType → predictive-search type (null = no autocomplete available). */
function pageTypeToSearchType(pageType: string): string | null {
  switch (pageType) {
    case "group":
    case "category":
    case "country":
    case "city":
    case "tag":
      return pageType;
    default:
      return null;
  }
}

/* ---------------------------------------------------------- */
/* EntityPicker — predictive search (autocomplete) with
   click-to-add options and contextual info (total groups…). */
/* ---------------------------------------------------------- */

interface PickerProps {
  searchType: string | null;
  value: string;
  onValueChange: (v: string) => void;
  /** What a click fills: "value" (slug, overrides) or "name" (intros). */
  pick?: "value" | "name";
  placeholder?: string;
  id: string;
  disabled?: boolean;
}

function EntityPicker({
  searchType,
  value,
  onValueChange,
  pick = "value",
  placeholder,
  id,
  disabled,
}: PickerProps) {
  const [query, setQuery] = React.useState("");
  const [options, setOptions] = React.useState<SearchOption[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [picked, setPicked] = React.useState<SearchOption | null>(null);
  const boxRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!searchType || query.trim().length < 2) {
      setOptions([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/admin/seo/search?type=${searchType}&q=${encodeURIComponent(query.trim())}`, {
        signal: ctl.signal,
      })
        .then((r) => r.json())
        .then((j) => {
          if (j?.ok && Array.isArray(j.data)) {
            setOptions(j.data);
            setOpen(true);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 150);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [query, searchType]);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (!searchType || disabled) {
    return (
      <Input
        id={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={picked ? picked.label : query}
          onChange={(e) => {
            setPicked(null);
            setQuery(e.target.value);
            onValueChange(e.target.value);
          }}
          placeholder={placeholder ?? "Escribe para buscar…"}
          className="pl-8 pr-8"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>
      {value && !picked && query === value && (
        <p className="mt-1 text-[11px] text-muted-foreground">Valor actual: {value}</p>
      )}
      {picked && (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
          <Check className="h-3 w-3" /> {picked.name} — {picked.sub}
        </p>
      )}
      {open && options.length > 0 && !picked && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  const v = pick === "name" ? o.name : o.value;
                  onValueChange(v);
                  setPicked(o);
                  setOpen(false);
                }}
                className="flex w-full flex-col rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-accent"
              >
                <span className="font-medium">{o.label}</span>
                <span className="text-[11px] text-muted-foreground">{o.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- */
/* SeoOverride form                                            */
/* ---------------------------------------------------------- */

interface OverrideProps {
  csrfToken: string;
  mode: "create" | "edit";
  override?: OverrideData;
}

export function AdminSeoOverrideForm({ csrfToken, mode, override }: OverrideProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [form, setForm] = React.useState({
    pageType: override?.pageType || "category",
    entityId: override?.entityId || "",
    metaTitleOverride: override?.metaTitleOverride || "",
    metaDescriptionOverride: override?.metaDescriptionOverride || "",
    robotsOverride: override?.robotsOverride || "",
  });

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!form.entityId.trim()) {
      toast.error("El ID de entidad es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const url =
        mode === "create" ? "/api/admin/seo/overrides" : `/api/admin/seo/overrides/${override!.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, csrf: csrfToken }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo guardar.");
        return;
      }
      toast.success(mode === "create" ? "Override creado." : "Override actualizado.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error("Error de red.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!override) return;
    if (!confirm("¿Eliminar este override SEO?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/seo/overrides/${override.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrf: csrfToken }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo eliminar.");
        return;
      }
      toast.success("Override eliminado.");
      router.refresh();
    } catch (err) {
      toast.error("Error de red.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={mode === "create" ? "default" : "outline"} className={mode === "create" ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
          {mode === "create" ? (
            <>
              <Plus className="h-3.5 w-3.5" />
              Nuevo
            </>
          ) : (
            <>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nuevo SEO Override" : "Editar SEO Override"}
          </DialogTitle>
          <DialogDescription>
            Override de metadatos para una entidad concreta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ov-type">Tipo de página</Label>
              <select
                id="ov-type"
                value={form.pageType}
                onChange={(e) => update("pageType", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                disabled={mode === "edit"}
              >
                {PAGE_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ov-id">ID de entidad</Label>
              <EntityPicker
                id="ov-id"
                searchType={pageTypeToSearchType(form.pageType)}
                value={form.entityId}
                onValueChange={(v) => update("entityId", v)}
                pick="value"
                placeholder="Escribe para buscar (autocompletado)…"
                disabled={mode === "edit"}
              />
              <p className="text-[11px] text-muted-foreground">
                {pageTypeToSearchType(form.pageType)
                  ? "Predicciones con total de grupos — clic para usar."
                  : "Slug o id de la entidad."}
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ov-title">Meta title override</Label>
            <Input
              id="ov-title"
              value={form.metaTitleOverride}
              onChange={(e) => update("metaTitleOverride", e.target.value)}
              maxLength={120}
            />
            <p className="text-xs text-muted-foreground">{form.metaTitleOverride.length}/120</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ov-desc">Meta description override</Label>
            <Textarea
              id="ov-desc"
              rows={3}
              value={form.metaDescriptionOverride}
              onChange={(e) => update("metaDescriptionOverride", e.target.value)}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">{form.metaDescriptionOverride.length}/300</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ov-robots">Robots override</Label>
            <Input
              id="ov-robots"
              value={form.robotsOverride}
              onChange={(e) => update("robotsOverride", e.target.value)}
              placeholder="index,follow"
            />
          </div>
          <DialogFooter className="gap-2">
            {mode === "edit" && (
              <Button
                type="button"
                variant="outline"
                className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                onClick={onDelete}
                disabled={deleting}
              >
                <Loader2 className={`h-4 w-4 animate-spin ${deleting ? "inline" : "hidden"}`} />
                  <Trash2 className={`h-4 w-4 ${deleting ? "hidden" : "inline"}`} />
                Eliminar
              </Button>
            )}
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              <Loader2 className={`h-4 w-4 animate-spin ${saving ? "inline" : "hidden"}`} />
                  <Check className={`h-4 w-4 ${saving ? "hidden" : "inline"}`} />
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------------- */
/* EntityIntro form                                            */
/* ---------------------------------------------------------- */

interface IntroProps {
  csrfToken: string;
  mode: "create" | "edit";
  intro?: IntroData;
}

export function AdminEntityIntroForm({ csrfToken, mode, intro }: IntroProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [form, setForm] = React.useState({
    entityType: intro?.entityType || "category",
    entityName: intro?.entityName || "",
    customTitle: intro?.customTitle || "",
    customHeroDesc: intro?.customHeroDesc || "",
    customIntro: intro?.customIntro || "",
  });

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!form.entityName.trim()) {
      toast.error("El nombre de entidad es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const url =
        mode === "create" ? "/api/admin/seo/intros" : `/api/admin/seo/intros/${intro!.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, csrf: csrfToken }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo guardar.");
        return;
      }
      toast.success(mode === "create" ? "Intro creada." : "Intro actualizada.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error("Error de red.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!intro) return;
    if (!confirm("¿Eliminar este intro?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/seo/intros/${intro.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrf: csrfToken }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo eliminar.");
        return;
      }
      toast.success("Intro eliminado.");
      router.refresh();
    } catch (err) {
      toast.error("Error de red.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={mode === "create" ? "default" : "outline"} className={mode === "create" ? "bg-emerald-600 hover:bg-emerald-700" : ""}>
          {mode === "create" ? (
            <>
              <Plus className="h-3.5 w-3.5" />
              Nuevo
            </>
          ) : (
            <>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nueva entity intro" : "Editar entity intro"}
          </DialogTitle>
          <DialogDescription>
            Texto intro personalizado para una entidad.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="in-type">Tipo de entidad</Label>
              <select
                id="in-type"
                value={form.entityType}
                onChange={(e) => update("entityType", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                disabled={mode === "edit"}
              >
                {ENTITY_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="in-name">Nombre</Label>
              <EntityPicker
                id="in-name"
                searchType={form.entityType}
                value={form.entityName}
                onValueChange={(v) => update("entityName", v)}
                pick="name"
                placeholder="Escribe para buscar (autocompletado)…"
                disabled={mode === "edit"}
              />
              <p className="text-[11px] text-muted-foreground">
                Predicciones con total de grupos — clic para usar el nombre exacto.
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="in-title">Título personalizado</Label>
            <Input
              id="in-title"
              value={form.customTitle}
              onChange={(e) => update("customTitle", e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="in-hero">Descripción hero</Label>
            <Textarea
              id="in-hero"
              rows={2}
              value={form.customHeroDesc}
              onChange={(e) => update("customHeroDesc", e.target.value)}
              maxLength={300}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="in-intro">Intro (cuerpo)</Label>
            <Textarea
              id="in-intro"
              rows={4}
              value={form.customIntro}
              onChange={(e) => update("customIntro", e.target.value)}
              maxLength={1500}
            />
            <p className="text-xs text-muted-foreground">{form.customIntro.length}/1500</p>
          </div>
          <DialogFooter className="gap-2">
            {mode === "edit" && (
              <Button
                type="button"
                variant="outline"
                className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                onClick={onDelete}
                disabled={deleting}
              >
                <Loader2 className={`h-4 w-4 animate-spin ${deleting ? "inline" : "hidden"}`} />
                  <Trash2 className={`h-4 w-4 ${deleting ? "hidden" : "inline"}`} />
                Eliminar
              </Button>
            )}
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              <Loader2 className={`h-4 w-4 animate-spin ${saving ? "inline" : "hidden"}`} />
                  <Check className={`h-4 w-4 ${saving ? "hidden" : "inline"}`} />
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------------- */
/* AdminBulkIntros — bulk JSON export / import for the long
   bottom descriptions of category, country and city pages.  */
/* ---------------------------------------------------------- */

interface BulkRow {
  entityType: string;
  entityName: string;
  customTitle: string;
  customHeroDesc: string;
  customIntro: string;
}

export function AdminBulkIntros({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();
  const [scope, setScope] = React.useState<"category" | "country" | "city" | "all">("category");
  const [mode, setMode] = React.useState<"empty" | "full">("empty");
  const [exporting, setExporting] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [parsedRows, setParsedRows] = React.useState<BulkRow[] | null>(null);
  const [importing, setImporting] = React.useState(false);

  async function exportJson() {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await fetch(
        `/api/admin/seo/intros/bulk-export?scope=${scope}&mode=${mode}`
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: "Error" }));
        toast.error(j?.error || "No se pudo exportar.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `intros-${scope}-${mode}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("JSON exportado. Edítalo y súbelo aquí para actualizar.");
    } catch {
      toast.error("Error de red al exportar.");
    } finally {
      setExporting(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setParsedRows(null);
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const j = JSON.parse(String(reader.result));
        const rows: unknown = Array.isArray(j) ? j : Array.isArray(j?.rows) ? j.rows : null;
        if (!rows) {
          toast.error("El JSON no contiene un array 'rows'.");
          setFile(null);
          return;
        }
        const clean = (rows as Array<Record<string, unknown>>)
          .map((r) => ({
            entityType: String(r.entityType ?? "").trim(),
            entityName: String(r.entityName ?? "").trim(),
            customTitle: String(r.customTitle ?? ""),
            customHeroDesc: String(r.customHeroDesc ?? ""),
            customIntro: String(r.customIntro ?? ""),
          }))
          .filter((r) => r.entityType && r.entityName);
        if (clean.length === 0) {
          toast.error("Ninguna fila válida (entityType + entityName requeridos).");
          setFile(null);
          return;
        }
        setParsedRows(clean);
      } catch {
        toast.error("Archivo JSON inválido.");
        setFile(null);
      }
    };
    reader.readAsText(f);
  }

  async function importJson() {
    if (!parsedRows || importing) return;
    setImporting(true);
    try {
      const res = await fetch("/api/admin/seo/intros/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows, csrf: csrfToken }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo importar.");
        return;
      }
      toast.success(`Importación completa: ${data.imported} filas (${data.skipped} omitidas).`);
      setFile(null);
      setParsedRows(null);
      router.refresh();
    } catch {
      toast.error("Error de red al importar.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-1 flex items-center gap-2 font-semibold">
        <Database className="h-4 w-4 text-primary" />
        Gestión masiva de intros (categoría / país / ciudad)
      </div>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        Exporta todas las entidades como JSON (vacío para escribir desde cero, o con el contenido
        actual para editarlo), escribe los textos largos de la parte inferior de las páginas y
        vuelve a subir el JSON. Los campos vacíos vuelven al texto dinámico por defecto.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="bulk-scope" className="text-xs font-medium text-muted-foreground">
            Ámbito
          </label>
          <select
            id="bulk-scope"
            value={scope}
            onChange={(e) => setScope(e.target.value as typeof scope)}
            className="h-9 w-36 rounded-md border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="category">Categorías</option>
            <option value="country">Países</option>
            <option value="city">Ciudades</option>
            <option value="all">Todo</option>
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="bulk-mode" className="text-xs font-medium text-muted-foreground">
            Modo de exportación
          </label>
          <select
            id="bulk-mode"
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
            className="h-9 w-44 rounded-md border border-input bg-transparent px-2.5 text-sm"
          >
            <option value="empty">Vacío (escribir desde cero)</option>
            <option value="full">Con contenido actual</option>
          </select>
        </div>
        <Button type="button" onClick={exportJson} disabled={exporting} className="gap-1.5">
          <Loader2 className={`h-4 w-4 animate-spin ${exporting ? "inline" : "hidden"}`} />
          <FileDown className={`h-4 w-4 ${exporting ? "hidden" : "inline"}`} />
          Exportar JSON
        </Button>
      </div>

      <div className="mt-5 border-t pt-4">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="bulk-file">
          Importar JSON editado
        </label>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <input
            id="bulk-file"
            type="file"
            accept="application/json,.json"
            onChange={onFile}
            className="text-sm"
          />
          <Button
            type="button"
            onClick={importJson}
            disabled={!parsedRows || importing}
            className="gap-1.5"
            variant="outline"
          >
            <Loader2 className={`h-4 w-4 animate-spin ${importing ? "inline" : "hidden"}`} />
            <FileUp className={`h-4 w-4 ${importing ? "hidden" : "inline"}`} />
            Importar
          </Button>
        </div>
        {file && (
          <p className="mt-2 text-xs text-muted-foreground">
            {file.name}
            {parsedRows
              ? ` — ${parsedRows.length} filas válidas · con texto: ${
                  parsedRows.filter((r) => r.customIntro.trim().length > 0).length
                }`
              : " — leyendo…"}
          </p>
        )}
      </div>
    </div>
  );
}
