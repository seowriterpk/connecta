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
import { Loader2, Save, Pencil, Trash2, Plus, Check } from "lucide-react";
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

const PAGE_TYPES = ["home", "category", "country", "city", "tag", "group", "search", "static"];
const ENTITY_TYPES = ["category", "country", "city", "tag"];

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
              <Input
                id="ov-id"
                value={form.entityId}
                onChange={(e) => update("entityId", e.target.value)}
                placeholder="slug o id"
                disabled={mode === "edit"}
              />
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
              <Input
                id="in-name"
                value={form.entityName}
                onChange={(e) => update("entityName", e.target.value)}
                placeholder="slug"
                disabled={mode === "edit"}
              />
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
