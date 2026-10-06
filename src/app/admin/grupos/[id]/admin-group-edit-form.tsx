"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Wand2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { generateSlugClient } from "@/lib/slug-client";
import { SmartSuggest, TagSuggest, type SuggestOption, type TagOption } from "@/components/admin/smart-suggest";

type GroupData = {
  id: string;
  groupName: string;
  slug: string;
  joinLink: string;
  description: string;
  category: string;
  categoryId: string;
  country: string;
  countryId: string;
  city: string | null;
  keywords: string;
  tags: string;
  profileImage: string | null;
  language: string;
  status: string;
  linkStatus: string;
  isAdult: boolean;
};

type CategoryOpt = { id: string; name: string; icon: string; isAdult: boolean; groupCount: number };
type CountryOpt = { id: string; name: string; flag: string; code: string };

interface Props {
  group: GroupData;
  categories: CategoryOpt[];
  countries: CountryOpt[];
  tagSuggestions: TagOption[];
  csrfToken: string;
}

const STATUS_OPTS = ["live", "pending", "rejected", "flagged", "pruned"];
const LINK_STATUS_OPTS = ["active", "revoked", "unknown"];
const LANG_OPTS = ["Espanol", "English", "Portugues", "Frances", "Italiano"];

function parseArrayField(s: string): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    if (Array.isArray(v)) return v.map(String);
  } catch {
    // not JSON, try comma-separated
  }
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

export function AdminGroupEditForm({ group, categories, countries, tagSuggestions, csrfToken }: Props) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    groupName: group.groupName,
    slug: group.slug,
    joinLink: group.joinLink,
    description: group.description,
    categoryId: group.categoryId,
    countryId: group.countryId,
    city: group.city || "",
    keywords: parseArrayField(group.keywords).join(", "),
    tags: parseArrayField(group.tags),
    profileImage: group.profileImage || "",
    language: group.language,
    status: group.status,
    linkStatus: group.linkStatus,
    isAdult: group.isAdult,
  });

  // SmartSuggest option banks — pick by NAME, never by raw ID.
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

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function autoSlug() {
    update("slug", generateSlugClient(form.groupName));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        keywords: form.keywords
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        tags: form.tags,
        csrf: csrfToken,
      };
      const res = await fetch(`/api/admin/grupos/${group.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo guardar.");
        setSaving(false);
        return;
      }
      toast.success("Grupo actualizado.");
      router.refresh();
    } catch (err) {
      toast.error("Error de red.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("¿Eliminar este grupo (soft-delete → rechazado)? Esta acción queda en auditoría.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/grupos/${group.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrf: csrfToken }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo eliminar.");
        setSaving(false);
        return;
      }
      toast.success("Grupo eliminado.");
      router.push("/admin/grupos");
      router.refresh();
    } catch (err) {
      toast.error("Error de red.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="groupName">Nombre del grupo *</Label>
          <Input
            id="groupName"
            required
            value={form.groupName}
            onChange={(e) => update("groupName", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug (URL)</Label>
          <div className="flex gap-2">
            <Input
              id="slug"
              required
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              className="font-mono"
            />
            <Button type="button" variant="outline" onClick={autoSlug} title="Generar slug">
              <Wand2 className="h-3.5 w-3.5" />
              Auto
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            URL final: /grupo/{form.slug || "slug"}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="joinLink">Enlace de WhatsApp *</Label>
        <Input
          id="joinLink"
          required
          type="url"
          value={form.joinLink}
          onChange={(e) => update("joinLink", e.target.value)}
          placeholder="https://chat.whatsapp.com/…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          rows={4}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          maxLength={1200}
        />
        <p className="text-xs text-muted-foreground">{form.description.length}/1200 caracteres.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="categoryId-input">Categoría</Label>
          {/* Smart auto-suggest — search by name, no manual IDs */}
          <SmartSuggest
            id="categoryId"
            options={categoryOptions}
            value={form.categoryId || null}
            onChange={(v) => update("categoryId", v)}
            placeholder="Ej. Tecnología, Humor…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="countryId-input">País</Label>
          <SmartSuggest
            id="countryId"
            options={countryOptions}
            value={form.countryId || null}
            onChange={(v) => update("countryId", v)}
            placeholder="Ej. España, México…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tags">Etiquetas (mín. 3)</Label>
          <TagSuggest
            id="tags"
            suggestions={tagSuggestions}
            value={form.tags}
            onChange={(t) => update("tags", t)}
            placeholder="futbol, amigos…"
          />
          <p className="text-xs text-muted-foreground">Escribe y pulsa Enter — se sugieren las etiquetas más usadas.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="keywords">Palabras clave (separadas por coma, mín. 3)</Label>
          <Input
            id="keywords"
            value={form.keywords}
            onChange={(e) => update("keywords", e.target.value)}
            placeholder="champions, liga, real madrid"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profileImage">URL de imagen de perfil</Label>
        <Input
          id="profileImage"
          type="url"
          value={form.profileImage}
          onChange={(e) => update("profileImage", e.target.value)}
          placeholder="https://…"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="status">Estado</Label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => update("status", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
          >
            {STATUS_OPTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="linkStatus">Estado del enlace</Label>
          <select
            id="linkStatus"
            value={form.linkStatus}
            onChange={(e) => update("linkStatus", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
          >
            {LINK_STATUS_OPTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="language">Idioma</Label>
          <select
            id="language"
            value={form.language}
            onChange={(e) => update("language", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
          >
            {LANG_OPTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
        <div>
          <Label htmlFor="isAdult" className="cursor-pointer">
            Contenido adulto (+18)
          </Label>
          <p className="text-xs text-muted-foreground">
            Si se activa, el grupo queda aislado (noindex, sin sitemap, sin listados públicos).
          </p>
        </div>
        <Switch
          id="isAdult"
          checked={form.isAdult}
          onCheckedChange={(v) => update("isAdult", v)}
        />
      </div>

      {form.isAdult && (
        <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          <AlertTriangle className="h-4 w-4" />
          Contenido adulto: queda excluido del sitemap y de las listas públicas.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
          onClick={onDelete}
          disabled={saving}
        >
          Eliminar
        </Button>
        <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Guardando…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar cambios
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
