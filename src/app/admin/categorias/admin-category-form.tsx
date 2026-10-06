"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Save, Pencil, Trash2, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { generateSlugClient } from "@/lib/slug-client";

type CategoryData = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  isAdult: boolean;
  isActive: boolean;
  sortOrder: number;
  source: string;
};

interface Props {
  csrfToken: string;
  mode: "create" | "edit";
  category?: CategoryData;
}

const EMOJI_OPTIONS = ["💬", "🎮", "🎬", "🎵", "⚽", "📚", "💻", "🍳", "✈️", "💼", "💖", "🙏", "📰", "🎨", "🔧", "🌍", "📱", "🎓", "💰", "🤝"];

export function AdminCategoryForm({ csrfToken, mode, category }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [form, setForm] = React.useState({
    name: category?.name || "",
    slug: category?.slug || "",
    icon: category?.icon || "💬",
    color: category?.color || "emerald",
    description: category?.description || "",
    isAdult: category?.isAdult ?? false,
    isActive: category?.isActive ?? true,
    sortOrder: category?.sortOrder ?? 1000,
  });

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    setSaving(true);
    try {
      const slug = form.slug.trim() || generateSlugClient(form.name);
      const payload = { ...form, slug, csrf: csrfToken };
      const url =
        mode === "create"
          ? "/api/admin/categorias"
          : `/api/admin/categorias/${category!.id}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo guardar.");
        return;
      }
      toast.success(mode === "create" ? "Categoría creada." : "Categoría actualizada.");
      setOpen(false);
      // Reset form if create
      if (mode === "create") {
        setForm({
          name: "",
          slug: "",
          icon: "💬",
          color: "emerald",
          description: "",
          isAdult: false,
          isActive: true,
          sortOrder: 1000,
        });
      }
      router.refresh();
    } catch (err) {
      toast.error("Error de red.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!category) return;
    if (!confirm(`¿Eliminar la categoría "${category.name}"? Los grupos existentes conservan su nombre de categoría, pero el ID quedará sin categoría asociada.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categorias/${category.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csrf: csrfToken }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      if (!res.ok || !data.ok) {
        toast.error(data?.error || "No se pudo eliminar.");
        return;
      }
      toast.success("Categoría eliminada.");
      router.refresh();
    } catch (err) {
      toast.error("Error de red.");
    } finally {
      setDeleting(false);
    }
  }

  if (mode === "create") {
    return (
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="cat-name">Nombre *</Label>
          <Input
            id="cat-name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Ej. Tecnología"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-slug">Slug (auto si vacío)</Label>
          <Input
            id="cat-slug"
            value={form.slug}
            onChange={(e) => update("slug", e.target.value)}
            placeholder="tecnologia"
            className="font-mono"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cat-icon">Icono</Label>
            <select
              id="cat-icon"
              value={form.icon}
              onChange={(e) => update("icon", e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
            >
              {EMOJI_OPTIONS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-sort">Orden</Label>
            <Input
              id="cat-sort"
              type="number"
              value={form.sortOrder}
              onChange={(e) => update("sortOrder", Number(e.target.value) || 1000)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-desc">Descripción</Label>
          <Textarea
            id="cat-desc"
            rows={2}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            maxLength={300}
          />
        </div>
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <Label htmlFor="cat-adult" className="cursor-pointer text-sm">
            Contenido adulto (+18)
          </Label>
          <Switch
            id="cat-adult"
            checked={form.isAdult}
            onCheckedChange={(v) => update("isAdult", v)}
          />
        </div>
        <Button type="submit" disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creando…
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Crear categoría
            </>
          )}
        </Button>
      </form>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar categoría</DialogTitle>
          <DialogDescription>{category!.name} — /categoria/{category!.slug}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`ed-name-${category!.id}`}>Nombre *</Label>
            <Input
              id={`ed-name-${category!.id}`}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`ed-slug-${category!.id}`}>Slug</Label>
            <Input
              id={`ed-slug-${category!.id}`}
              value={form.slug}
              onChange={(e) => update("slug", e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`ed-icon-${category!.id}`}>Icono</Label>
              <select
                id={`ed-icon-${category!.id}`}
                value={form.icon}
                onChange={(e) => update("icon", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
              >
                {EMOJI_OPTIONS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`ed-sort-${category!.id}`}>Orden</Label>
              <Input
                id={`ed-sort-${category!.id}`}
                type="number"
                value={form.sortOrder}
                onChange={(e) => update("sortOrder", Number(e.target.value) || 1000)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`ed-desc-${category!.id}`}>Descripción</Label>
            <Textarea
              id={`ed-desc-${category!.id}`}
              rows={2}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              maxLength={300}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label htmlFor={`ed-active-${category!.id}`} className="cursor-pointer text-sm">
              Activa (visible en el sitio)
            </Label>
            <Switch
              id={`ed-active-${category!.id}`}
              checked={form.isActive}
              onCheckedChange={(v) => update("isActive", v)}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <Label htmlFor={`ed-adult-${category!.id}`} className="cursor-pointer text-sm">
              Contenido adulto (+18)
            </Label>
            <Switch
              id={`ed-adult-${category!.id}`}
              checked={form.isAdult}
              onCheckedChange={(v) => update("isAdult", v)}
            />
          </div>
          <DialogFooter className="gap-2">
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
