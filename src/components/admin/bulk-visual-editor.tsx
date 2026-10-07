"use client";

/**
 * BulkVisualEditor — 2026 admin UX: add groups through a smart visual form
 * with auto-suggest dropdowns (categories, countries, tags). No CSV, no JSON,
 * no manual IDs — if you can fill a form, you can bulk-add groups.
 *
 * Rows sync with the parent import pipeline (rows: RawRow[]), so preview +
 * import + server validation all work unchanged.
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SmartSuggest, TagSuggest, type SuggestOption, type TagOption } from "@/components/admin/smart-suggest";

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

interface Props {
  categories: { id: string; name: string; icon: string; isAdult: boolean }[];
  countries: { id: string; name: string; flag: string }[];
  tagSuggestions: TagOption[];
  rows: RawRow[];
  onChange: (rows: RawRow[]) => void;
}

const CATEGORY_KEYS = new Set([""]);

export function BulkVisualEditor({ categories, countries, tagSuggestions, rows, onChange }: Props) {
  const categoryOptions: SuggestOption[] = React.useMemo(
    () =>
      categories.map((c) => ({
        value: c.name,
        label: c.name,
        icon: c.icon || undefined,
        badge: c.isAdult ? "18+" : undefined,
      })),
    [categories]
  );
  const countryOptions: SuggestOption[] = React.useMemo(
    () => countries.map((c) => ({ value: c.name, label: c.name, icon: c.flag || undefined })),
    [countries]
  );

  function updateRow(i: number, patch: Partial<RawRow>) {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(next);
  }

  function addRow() {
    onChange([...rows, { group_name: "", join_link: "", description: "", category: "", country: "", city: "", tags: "", keywords: "", profile_image: "", is_adult: "0" }]);
  }

  function removeRow(i: number) {
    onChange(rows.filter((_, idx) => idx !== i));
  }

  function duplicateRow(i: number) {
    const copy = { ...rows[i], group_name: `${rows[i].group_name || ""} (copia)`.trim() };
    const next = [...rows];
    next.splice(i + 1, 0, copy);
    onChange(next);
  }

  const completed = rows.filter(
    (r) => r.group_name && r.join_link && r.description && r.category && r.country
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-emerald-600" />
          Editor visual de grupos
        </CardTitle>
        <CardDescription>
          Rellena los campos con autocompletado inteligente — cero IDs, cero CSV.
          Selecciona categoría y país escribiendo su nombre.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed p-8 text-center">
            <p className="text-sm font-medium">Aún no hay filas</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Añade tu primer grupo con el botón de abajo.
            </p>
            <Button type="button" onClick={addRow} className="mt-4">
              <Plus className="h-4 w-4" />
              <span>Añadir grupo</span>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {rows.length} {rows.length === 1 ? "fila" : "filas"}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {completed} completas
                </Badge>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addRow}>
                <Plus className="h-3.5 w-3.5" />
                <span>Añadir otra</span>
              </Button>
            </div>

            <div className="space-y-3">
              {rows.map((row, i) => {
                const ok = Boolean(row.group_name && row.join_link && row.description && row.category && row.country);
                return (
                  <div
                    key={i}
                    className={`rounded-xl border p-4 transition-colors ${
                      ok ? "border-emerald-300/70 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-border bg-card"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Grupo #{i + 1}
                        {ok && <span className="ml-1.5 text-emerald-600 dark:text-emerald-400">· listo</span>}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateRow(i)}
                          title="Duplicar fila"
                          className="h-7 px-2 text-muted-foreground"
                        >
                          <span aria-hidden>⧉</span>
                          <span className="sr-only">Duplicar fila {i + 1}</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(i)}
                          className="h-7 px-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                          title="Eliminar fila"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Eliminar fila {i + 1}</span>
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor={`ve-name-${i}`}>Nombre *</Label>
                        <Input
                          id={`ve-name-${i}`}
                          value={row.group_name ?? ""}
                          onChange={(e) => updateRow(i, { group_name: e.target.value })}
                          placeholder="Ej. Amigos del café"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`ve-link-${i}`}>Enlace de WhatsApp *</Label>
                        <Input
                          id={`ve-link-${i}`}
                          type="url"
                          value={row.join_link ?? ""}
                          onChange={(e) => updateRow(i, { join_link: e.target.value })}
                          placeholder="https://chat.whatsapp.com/…"
                        />
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <Label htmlFor={`ve-desc-${i}`}>Descripción * (mín. 20 caracteres)</Label>
                      <Textarea
                        id={`ve-desc-${i}`}
                        rows={2}
                        value={row.description ?? ""}
                        onChange={(e) => updateRow(i, { description: e.target.value })}
                        placeholder="De qué trata el grupo, quién debería unirse…"
                        maxLength={1200}
                      />
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor={`ve-cat-${i}`}>Categoría *</Label>
                        <SmartSuggest
                          id={`ve-cat-${i}`}
                          options={categoryOptions}
                          value={row.category || null}
                          onChange={(v) => updateRow(i, { category: v })}
                          placeholder="Escribe para buscar…"
                          allowClear
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`ve-pais-${i}`}>País *</Label>
                        <SmartSuggest
                          id={`ve-pais-${i}`}
                          options={countryOptions}
                          value={row.country || null}
                          onChange={(v) => updateRow(i, { country: v })}
                          placeholder="Escribe para buscar…"
                          allowClear
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`ve-city-${i}`}>Ciudad</Label>
                        <Input
                          id={`ve-city-${i}`}
                          value={row.city ?? ""}
                          onChange={(e) => updateRow(i, { city: e.target.value })}
                          placeholder="Opcional"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Tags</Label>
                        <TagSuggest
                          suggestions={tagSuggestions}
                          value={(row.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean)}
                          onChange={(t) => updateRow(i, { tags: t.join(",") })}
                          placeholder="Añade etiquetas…"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`ve-kw-${i}`}>Palabras clave</Label>
                        <Input
                          id={`ve-kw-${i}`}
                          value={row.keywords ?? ""}
                          onChange={(e) => updateRow(i, { keywords: e.target.value })}
                          placeholder="Separadas por coma"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                      <Label htmlFor={`ve-adult-${i}`} className="cursor-pointer text-xs">
                        Contenido adulto (+18)
                      </Label>
                      <Switch
                        id={`ve-adult-${i}`}
                        checked={String(row.is_adult ?? "0") === "1"}
                        onCheckedChange={(v) => updateRow(i, { is_adult: v ? "1" : "0" })}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <Button type="button" variant="outline" onClick={addRow} className="w-full border-dashed">
              <Plus className="h-4 w-4" />
              <span>Añadir otro grupo</span>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
