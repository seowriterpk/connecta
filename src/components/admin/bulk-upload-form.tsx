"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  AlertTriangle,
  ListChecks,
  Database,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { generateSlugClient } from "@/lib/slug-client";
import { BulkVisualEditor } from "@/components/admin/bulk-visual-editor";
import { BulkUpdateTool } from "@/components/admin/bulk-update-tool";
import type { TagOption } from "@/components/admin/smart-suggest";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RawRow = {
  group_name?: string;
  join_link?: string;
  description?: string;
  category?: string;
  country?: string;
  city?: string;
  tags?: string;
  keywords?: string;
  profile_image?: string;
  is_adult?: string;
};

type RowValidation = {
  row: RawRow;
  rowIndex: number;
  ok: boolean;
  error?: string;
};

type ImportResult = {
  ok: boolean;
  imported: number;
  skipped: number;
  errors: { rowIndex: number; rowName: string; reason: string }[];
  target?: string;
};

interface Props {
  csrfToken: string;
  /** Available categories (rich list for the smart auto-suggest). */
  categories: { id: string; name: string; slug: string; icon: string; isAdult: boolean; groupCount: number }[];
  /** Available countries (rich list for the smart auto-suggest). */
  countries: { id: string; name: string; code: string; flag: string }[];
  /** Tag frequency bank for the TagSuggest hints. */
  tagSuggestions: TagOption[];
}

// Mirror of the server-side validator (sync subset for client preview).
// We do NOT replicate category/country bank lookups here (would require an
// extra fetch per change). The final server-side validator catches those.
function clientValidate(row: RawRow): { ok: boolean; error?: string } {
  const name = String(row.group_name || "").trim();
  if (!name) return { ok: false, error: "Falta group_name." };
  if (name.length < 3) return { ok: false, error: "Nombre muy corto (<3)." };

  const link = String(row.join_link || "").trim();
  if (!link) return { ok: false, error: "Falta join_link." };
  if (!/^https?:\/\/(chat\.whatsapp\.com|wa\.me)\/[A-Za-z0-9_-]+/i.test(link))
    return { ok: false, error: "Enlace no es chat.whatsapp.com/..." };

  const desc = String(row.description || "").trim();
  if (!desc) return { ok: false, error: "Falta description." };
  if (desc.length < 20) return { ok: false, error: "Descripción < 20 chars." };

  if (!String(row.category || "").trim())
    return { ok: false, error: "Falta category." };
  if (!String(row.country || "").trim())
    return { ok: false, error: "Falta country." };

  const img = String(row.profile_image || "").trim();
  if (img && !/^https?:\/\//i.test(img))
    return { ok: false, error: "profile_image debe ser http(s)://." };

  return { ok: true };
}

// ---------------------------------------------------------------------------
// CSV parser (mirrors src/lib/bulk-import.ts but client-side)
// ---------------------------------------------------------------------------

function parseCsvClient(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  if (!cleaned.trim()) return { headers: [], rows: [] };

  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (inQuotes) {
      if (ch === '"') {
        if (cleaned[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const filtered = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (filtered.length === 0) return { headers: [], rows: [] };

  const headers = filtered[0].map((h) => h.trim());
  const out: Record<string, string>[] = [];
  for (let i = 1; i < filtered.length; i++) {
    const r = filtered[i];
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = (r[c] ?? "").trim();
    }
    out.push(obj);
  }
  return { headers, rows: out };
}

// ---------------------------------------------------------------------------
// CSV template (mirrors server-side csvTemplate())
// ---------------------------------------------------------------------------

function csvTemplateString(): string {
  const headers = [
    "group_name",
    "join_link",
    "description",
    "category",
    "country",
    "city",
    "tags",
    "keywords",
    "profile_image",
    "is_adult",
  ];
  const example1 = [
    "Cocina Mexicana Tradicional",
    "https://chat.whatsapp.com/AbCdEfGhIjKlMnOp",
    "Comunidad para compartir recetas tradicionales mexicanas, tips de cocina y lugares para comprar ingredientes.",
    "Gastronomía",
    "México",
    "Ciudad de México",
    "recetas,cocina,mexicana,comida",
    "cocina mexicana,recetas tradicionales,antojitos",
    "",
    "0",
  ];
  const example2 = [
    "Programadores Latam",
    "https://chat.whatsapp.com/ZyXwVuTsRqPoNmLk",
    "Grupo de desarrolladores de Latinoamérica para compartir oportunidades laborales, recursos y proyectos open source.",
    "Tecnología",
    "Argentina",
    "Buenos Aires",
    "programacion,desarrollo,latam,javascript",
    "desarrollo web,programadores latam,open source",
    "",
    "0",
  ];
  const esc = (v: string) =>
    v.includes(",") || v.includes('"') || v.includes("\n")
      ? `"${v.replace(/"/g, '""')}"`
      : v;
  return [headers, example1, example2].map((r) => r.map(esc).join(",")).join("\n");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BulkUploadForm({ csrfToken, categories, countries, tagSuggestions }: Props) {
  const router = useRouter();
  const [tab, setTab] = React.useState<"csv" | "json" | "visual" | "update">("visual");
  const [rows, setRows] = React.useState<RawRow[]>([]);
  const [csvFileName, setCsvFileName] = React.useState<string>("");
  const [jsonText, setJsonText] = React.useState<string>(
    JSON.stringify(
      [
        {
          group_name: "Cocina Mexicana Tradicional",
          join_link: "https://chat.whatsapp.com/AbCdEfGhIjKlMnOp",
          description:
            "Comunidad para compartir recetas tradicionales mexicanas, tips de cocina y lugares para comprar ingredientes.",
          category: "Gastronomía",
          country: "México",
          city: "Ciudad de México",
          tags: "recetas,cocina,mexicana,comida",
          keywords: "cocina mexicana,recetas tradicionales,antojitos",
          profile_image: "",
          is_adult: "0",
        },
      ],
      null,
      2
    )
  );
  const [target, setTarget] = React.useState<"queue" | "pending">("pending");
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Validation results (recomputed when rows change)
  const validations: RowValidation[] = React.useMemo(() => {
    return rows.map((row, i) => {
      const v = clientValidate(row);
      return { row, rowIndex: i + 1, ok: v.ok, error: v.error };
    });
  }, [rows]);

  const validCount = validations.filter((v) => v.ok).length;
  const invalidCount = validations.length - validCount;

  // -------------------------------------------------------------------------
  // CSV file handling
  // -------------------------------------------------------------------------

  function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      toast.error("El archivo debe ser un CSV (.csv).");
      return;
    }
    if (file.size > 2_000_000) {
      toast.error("El archivo es demasiado grande (máx 2MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const parsed = parseCsvClient(text);
        if (parsed.rows.length === 0) {
          toast.error("El CSV no contiene filas de datos.");
          return;
        }
        // Normalize headers — accept both snake_case and the column names
        const cleaned: RawRow[] = parsed.rows.map((r) => ({
          group_name: r.group_name ?? r.groupName ?? r.nombre ?? r.name ?? "",
          join_link:
            r.join_link ?? r.joinLink ?? r.link ?? r.enlace ?? r.url ?? "",
          description: r.description ?? r.descripcion ?? r.desc ?? "",
          category: r.category ?? r.categoria ?? "",
          country: r.country ?? r.pais ?? "",
          city: r.city ?? r.ciudad ?? "",
          tags: r.tags ?? r.etiquetas ?? "",
          keywords: r.keywords ?? r.palabras_clave ?? "",
          profile_image: r.profile_image ?? r.imagen ?? r.image ?? "",
          is_adult: r.is_adult ?? r.adulto ?? r.adult ?? "0",
        }));
        setRows(cleaned);
        setCsvFileName(file.name);
        setResult(null);
        toast.success(`${cleaned.length} filas parseadas.`);
      } catch (e: any) {
        toast.error("No se pudo parsear el CSV: " + (e?.message || ""));
      }
    };
    reader.onerror = () => toast.error("Error leyendo el archivo.");
    reader.readAsText(file);
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input value so the same file can be picked again
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  // -------------------------------------------------------------------------
  // JSON handling
  // -------------------------------------------------------------------------

  const jsonValidation = React.useMemo<{ ok: boolean; error?: string }>(() => {
    const trimmed = jsonText.trim();
    if (!trimmed) return { ok: false, error: "JSON vacío." };
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        return { ok: false, error: "El JSON debe ser un array." };
      }
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || "JSON inválido." };
    }
  }, [jsonText]);

  function applyJson() {
    if (!jsonValidation.ok) {
      toast.error("El JSON no es válido. Corrige los errores primero.");
      return;
    }
    try {
      const parsed = JSON.parse(jsonText.trim()) as any[];
      const cleaned: RawRow[] = parsed.map((r) => ({
        group_name: String(r.group_name ?? r.groupName ?? r.name ?? ""),
        join_link: String(r.join_link ?? r.joinLink ?? r.link ?? r.url ?? ""),
        description: String(r.description ?? r.descripcion ?? ""),
        category: String(r.category ?? r.categoria ?? ""),
        country: String(r.country ?? r.pais ?? ""),
        city: String(r.city ?? r.ciudad ?? ""),
        tags: Array.isArray(r.tags) ? r.tags.join(",") : String(r.tags ?? ""),
        keywords: Array.isArray(r.keywords)
          ? r.keywords.join(",")
          : String(r.keywords ?? ""),
        profile_image: String(r.profile_image ?? r.imagen ?? ""),
        is_adult: String(r.is_adult ?? r.adulto ?? "0"),
      }));
      setRows(cleaned);
      setResult(null);
      toast.success(`${cleaned.length} grupos cargados desde JSON.`);
    } catch (e: any) {
      toast.error("Error al leer el JSON: " + (e?.message || ""));
    }
  }

  function addBlankRow() {
    const newRow: RawRow = {
      group_name: "",
      join_link: "",
      description: "",
      category: "",
      country: "",
      city: "",
      tags: "",
      keywords: "",
      profile_image: "",
      is_adult: "0",
    };
    // Insert into JSON text + apply
    try {
      const parsed = JSON.parse(jsonText.trim() || "[]");
      if (!Array.isArray(parsed)) throw new Error();
      parsed.push(newRow);
      setJsonText(JSON.stringify(parsed, null, 2));
    } catch {
      // If existing text isn't valid JSON, replace with [newRow]
      setJsonText(JSON.stringify([newRow], null, 2));
    }
  }

  function removeLastRow() {
    try {
      const parsed = JSON.parse(jsonText.trim() || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.pop();
        setJsonText(JSON.stringify(parsed, null, 2));
      }
    } catch {
      setJsonText("[]");
    }
  }

  // -------------------------------------------------------------------------
  // Download CSV template
  // -------------------------------------------------------------------------

  function downloadTemplate() {
    const csv = csvTemplateString();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-grupos-conectagrupos.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Plantilla descargada.");
  }

  // -------------------------------------------------------------------------
  // Import
  // -------------------------------------------------------------------------

  async function onImport() {
    if (rows.length === 0) {
      toast.error("No hay filas para importar.");
      return;
    }
    if (validCount === 0) {
      toast.error("Ninguna fila pasó la validación. Corrige los errores.");
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groups: rows,
          mode: tab === "json" ? "json" : "csv", // visual editor produces CSV-equivalent rows
          target,
          csrf: csrfToken,
        }),
      });
      const data = (await res.json().catch(() => ({
        ok: false,
        error: "Respuesta inválida.",
      }))) as ImportResult & { error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "Error al importar.");
        return;
      }
      setResult(data);
      toast.success(
        `Importación completa: ${data.imported} importados, ${data.skipped} omitidos.`
      );
      router.refresh();
    } catch (e: any) {
      toast.error("Error de red: " + (e?.message || ""));
    } finally {
      setImporting(false);
    }
  }

  function resetAll() {
    setRows([]);
    setCsvFileName("");
    setResult(null);
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "csv" | "json" | "visual" | "update")}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="visual">
            <Sparkles className="h-4 w-4" />
            <span>Editor visual</span>
          </TabsTrigger>
          <TabsTrigger value="update">
            <ListChecks className="h-4 w-4" />
            <span>Actualización masiva</span>
          </TabsTrigger>
          <TabsTrigger value="csv">
            <Upload className="h-4 w-4" />
            <span>Subir CSV</span>
          </TabsTrigger>
          <TabsTrigger value="json">
            <FileText className="h-4 w-4" />
            <span>Constructor JSON</span>
          </TabsTrigger>
        </TabsList>

        {/* ============= TAB: VISUAL EDITOR (default) ============= */}
        <TabsContent value="visual" className="space-y-4">
          <BulkVisualEditor
            categories={categories}
            countries={countries}
            tagSuggestions={tagSuggestions}
            rows={rows}
            onChange={(r) => {
              setRows(r);
              setResult(null);
            }}
          />
        </TabsContent>

        {/* ============= TAB: BULK UPDATE (existing groups) ============= */}
        <TabsContent value="update" className="space-y-4">
          <BulkUpdateTool
            csrfToken={csrfToken}
            categories={categories}
            countries={countries}
            tagSuggestions={tagSuggestions}
          />
        </TabsContent>

        {/* ============= TAB 1: CSV ============= */}
        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4 text-emerald-600" />
                Subir archivo CSV
              </CardTitle>
              <CardDescription>
                Arrastra el archivo o haz clic para seleccionarlo. Máximo 2MB.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  dragOver
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                    : "border-muted-foreground/30 hover:border-emerald-400/60 hover:bg-muted/40"
                }`}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">
                  Haz clic o arrastra tu archivo CSV aquí
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Formato: <code>.csv</code> con encabezados en la primera fila
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={onFileInputChange}
                  className="hidden"
                />
              </div>
              {csvFileName && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium">{csvFileName}</span>
                  <Badge variant="outline">{rows.length} filas</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetAll}
                    className="text-muted-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Limpiar</span>
                  </Button>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-3.5 w-3.5" />
                  <span>Descargar plantilla CSV</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============= TAB 2: JSON ============= */}
        <TabsContent value="json" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-emerald-600" />
                Constructor JSON
              </CardTitle>
              <CardDescription>
                Pega o edita un array JSON de grupos. Cada objeto puede tener:
                group_name, join_link, description, category, country, city,
                tags, keywords, profile_image, is_adult.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  rows={14}
                  spellCheck={false}
                  className="font-mono text-xs leading-relaxed"
                  placeholder="[{&quot;group_name&quot;: &quot;...&quot;, &quot;join_link&quot;: &quot;https://chat.whatsapp.com/...&quot;, ...}]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${
                    jsonValidation.ok
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                      : "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
                  }`}
                >
                  {jsonValidation.ok ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      JSON válido
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" />
                      {jsonValidation.error || "JSON inválido"}
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addBlankRow}
                  disabled={!jsonValidation.ok && jsonText.trim() !== "[]"}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Añadir fila</span>
                </Button>
                <Button variant="outline" size="sm" onClick={removeLastRow}>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Quitar última</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={applyJson}
                  disabled={!jsonValidation.ok}
                >
                  <ListChecks className="h-3.5 w-3.5" />
                  <span>Aplicar y validar</span>
                </Button>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="h-3.5 w-3.5" />
                  <span>Plantilla CSV</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insert-only sections — hidden while the bulk-update tab is active */}
      {tab !== "update" && (
        <>
      {/* ============= Column mapping guide ============= */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Guía de columnas esperadas
          </CardTitle>
          <CardDescription>
            Encabezados del CSV (en inglés o español — se aceptan ambos).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ColumnGuide
              name="group_name"
              alt="groupName, nombre, name"
              required
              desc="Nombre del grupo (3–120 caracteres)."
            />
            <ColumnGuide
              name="join_link"
              alt="joinLink, enlace, url"
              required
              desc="URL completa chat.whatsapp.com/..."
            />
            <ColumnGuide
              name="description"
              alt="descripcion, desc"
              required
              desc="Descripción (mínimo 20 caracteres)."
            />
            <ColumnGuide
              name="category"
              alt="categoria"
              required
              desc="Debe existir en el banco de categorías."
            />
            <ColumnGuide
              name="country"
              alt="pais"
              required
              desc="Debe existir en el banco de países."
            />
            <ColumnGuide
              name="city"
              alt="ciudad"
              desc="Ciudad (opcional)."
            />
            <ColumnGuide
              name="tags"
              alt="etiquetas"
              desc="Separadas por coma (máx 10)."
            />
            <ColumnGuide
              name="keywords"
              alt="palabras_clave"
              desc="Separadas por coma (máx 10)."
            />
            <ColumnGuide
              name="profile_image"
              alt="imagen, image"
              desc="URL http(s)://... (opcional)."
            />
            <ColumnGuide
              name="is_adult"
              alt="adulto, adult"
              desc="0 o 1 (opcional, por defecto 0)."
            />
          </div>

          {/* Category + country quick reference */}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                Categorías disponibles ({categories.length})
              </div>
              <div className="max-h-32 overflow-y-auto rounded-md border bg-muted/30 p-2">
                <div className="flex flex-wrap gap-1">
                  {categories.map((c) => (
                    <Badge
                      key={c.slug}
                      variant="outline"
                      className="px-1.5 py-0 text-xs"
                    >
                      {c.name}
                      {c.isAdult ? " 🔞" : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                Países disponibles ({countries.length})
              </div>
              <div className="max-h-32 overflow-y-auto rounded-md border bg-muted/30 p-2">
                <div className="flex flex-wrap gap-1">
                  {countries.map((c) => (
                    <Badge
                      key={c.code}
                      variant="outline"
                      className="px-1.5 py-0 text-xs"
                    >
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ============= Preview table ============= */}
      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">
                  Vista previa ({rows.length} filas)
                </CardTitle>
                <CardDescription>
                  Validación local de campos obligatorios + formato de URL.
                  Las verificaciones de categoría/país y duplicados se aplican
                  al importar.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {validCount} válidas
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                >
                  <XCircle className="h-3 w-3" />
                  {invalidCount} con errores
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="max-h-[28rem] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead className="min-w-[200px]">Grupo</TableHead>
                    <TableHead className="min-w-[200px]">Enlace</TableHead>
                    <TableHead className="min-w-[140px]">Categoría</TableHead>
                    <TableHead className="min-w-[120px]">País</TableHead>
                    <TableHead className="min-w-[200px]">Descripción</TableHead>
                    <TableHead className="w-[100px]">Adulto</TableHead>
                    <TableHead className="w-[80px] text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validations.map((v) => (
                    <TableRow key={v.rowIndex} className="text-xs">
                      <TableCell className="font-mono text-muted-foreground">
                        {v.rowIndex}
                      </TableCell>
                      <TableCell className="font-medium">
                        {v.row.group_name || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-mono text-xs text-muted-foreground">
                        {v.row.join_link || "—"}
                      </TableCell>
                      <TableCell>{v.row.category || "—"}</TableCell>
                      <TableCell>{v.row.country || "—"}</TableCell>
                      <TableCell className="max-w-[260px]">
                        <div className="line-clamp-2 text-muted-foreground">
                          {v.row.description || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {String(v.row.is_adult || "0") === "1" ||
                        String(v.row.is_adult || "").toLowerCase() === "true" ? (
                          <Badge
                            variant="outline"
                            className="bg-rose-50 px-1 py-0 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"
                          >
                            +18
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {v.ok ? (
                          <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" />
                        ) : (
                          <span
                            title={v.error}
                            className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400"
                          >
                            <XCircle className="h-4 w-4" />
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {invalidCount > 0 && (
              <div className="border-t bg-rose-50/50 px-4 py-2 dark:bg-rose-950/20">
                <div className="flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <div>
                    <div className="font-semibold">
                      {invalidCount} filas con errores (no se importarán):
                    </div>
                    <ul className="mt-1 space-y-0.5">
                      {validations
                        .filter((v) => !v.ok)
                        .slice(0, 6)
                        .map((v) => (
                          <li key={v.rowIndex}>
                            <span className="font-mono">#{v.rowIndex}</span>{" "}
                            <span className="font-medium">
                              {v.row.group_name || "(sin nombre)"}:
                            </span>{" "}
                            <span className="text-rose-600 dark:text-rose-400">
                              {v.error}
                            </span>
                          </li>
                        ))}
                      {invalidCount > 6 && (
                        <li className="text-muted-foreground">
                          …y {invalidCount - 6} más.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============= Import controls ============= */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Importar a la base de datos</CardTitle>
          <CardDescription>
            Elige el destino y haz clic en Importar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <TargetOption
              selected={target === "pending"}
              onSelect={() => setTarget("pending")}
              icon={<Database className="h-5 w-5" />}
              title="Grupos (estado pendiente)"
              desc="Inserta directamente en la tabla groups con status=pending. Podrás publicarlos desde /admin/grupos."
              badge="Directo"
            />
            <TargetOption
              selected={target === "queue"}
              onSelect={() => setTarget("queue")}
              icon={<Clock className="h-5 w-5" />}
              title="Cola de drip-feed"
              desc="Inserta en groups_queue. El cron drip-feed los publicará 5 cada 15 min (natural para SEO)."
              badge="Recomendado"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <Button
              onClick={onImport}
              disabled={importing || rows.length === 0 || validCount === 0}
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {importing ? (
                <span>Importando…</span>
              ) : (
                <span>Importar {validCount} de {rows.length} grupo(s)</span>
              )}
            </Button>
            {rows.length > 0 && (
              <Button variant="ghost" onClick={resetAll} disabled={importing}>
                <Trash2 className="h-4 w-4" />
                <span>Limpiar todo</span>
              </Button>
            )}
            <div className="text-xs text-muted-foreground">
              Solo las filas válidas se enviarán al servidor. El servidor
              volverá a validar (categoría, país, slug único, enlace duplicado).
            </div>
          </div>

          {/* ============= Import result ============= */}
          {result && (
            <div
              className={`rounded-lg border p-4 ${
                result.imported > 0
                  ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                  : "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
              }`}
            >
              <div className="flex items-start gap-2">
                {result.skipped > 0 ? (
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
                )}
                <div className="flex-1">
                  <div className="text-sm font-semibold">
                    Importación completa
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Destino:{" "}
                    {result.target === "queue"
                      ? "groups_queue (drip-feed)"
                      : "groups (pending)"}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">
                      {result.imported} importados
                    </span>
                    <span className="font-medium text-rose-700 dark:text-rose-300">
                      {result.skipped} omitidos
                    </span>
                  </div>
                  {result.errors.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                        Ver {result.errors.length} errores detallados
                      </summary>
                      <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
                        {result.errors.map((e, i) => (
                          <li
                            key={i}
                            className="rounded border bg-card p-2"
                          >
                            <span className="font-mono text-muted-foreground">
                              fila {e.rowIndex}:
                            </span>{" "}
                            <span className="font-medium">{e.rowName}</span>
                            <div className="text-rose-600 dark:text-rose-400">
                              {e.reason}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ColumnGuide({
  name,
  alt,
  required,
  desc,
}: {
  name: string;
  alt?: string;
  required?: boolean;
  desc: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2">
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
          {name}
        </code>
        {required ? (
          <Badge
            variant="outline"
            className="px-1 py-0 text-[9px] text-rose-700 dark:text-rose-300"
          >
            OBLIGATORIO
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="px-1 py-0 text-[9px] text-muted-foreground"
          >
            OPCIONAL
          </Badge>
        )}
      </div>
      {alt && (
        <div className="mt-1 text-xs text-muted-foreground">
          alias: <code>{alt}</code>
        </div>
      )}
      <p className="mt-1.5 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function TargetOption({
  selected,
  onSelect,
  icon,
  title,
  desc,
  badge,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
        selected
          ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500/30 dark:bg-emerald-950/30"
          : "border-border bg-card hover:border-emerald-400/60 hover:bg-muted/40"
      }`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
          selected
            ? "bg-emerald-600 text-white"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
          {badge && (
            <Badge
              variant="outline"
              className="px-1 py-0 text-xs text-emerald-700 dark:text-emerald-300"
            >
              {badge}
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
      </div>
      <div
        className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
          selected
            ? "border-emerald-600 bg-emerald-600"
            : "border-muted-foreground/40"
        }`}
      />
    </button>
  );
}
