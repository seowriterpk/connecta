"use client";

import * as React from "react";
import { Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { CategoryDTO, CountryDTO } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SubmitDialog({
  categories,
  countries,
  trigger,
}: {
  categories: CategoryDTO[];
  countries: CountryDTO[];
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    inviteLink: "",
    categoryId: "",
    countryId: "",
    contactName: "",
    tags: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title || !form.description || !form.inviteLink || !form.categoryId || !form.countryId) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setLoading(true);
    try {
      const tags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 8);
      const res = await fetch("/api/groups/submit?XTransformPort=3000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tags }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "No se pudo enviar.");
      }
      setDone(true);
      setForm({
        title: "",
        description: "",
        inviteLink: "",
        categoryId: "",
        countryId: "",
        contactName: "",
        tags: "",
      });
    } catch (err: any) {
      setError(err.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setDone(false);
    setError(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="cg-pop max-h-[92vh] overflow-y-auto cg-scroll p-0 sm:max-w-lg">
        {done ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h3 className="text-lg font-bold">¡Grupo enviado con éxito!</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Gracias por compartir tu comunidad con ConectaGrupos. Nuestro equipo la
              revisará y, si cumple las normas, se publicará en breve. Puedes enviar
              otro grupo si quieres.
            </p>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" onClick={reset}>
                Enviar otro
              </Button>
              <DialogClose asChild>
                <Button>Cerrar</Button>
              </DialogClose>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <DialogHeader className="gap-2 border-b p-5 pb-4">
              <DialogTitle className="text-lg font-bold">Envía tu grupo de WhatsApp</DialogTitle>
              <DialogDescription className="text-sm">
                Comparte tu comunidad con miles de hispanohablantes. Tras el envío, el grupo
                queda pendiente de revisión antes de publicarse.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label htmlFor="title">Nombre del grupo *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="Ej: Amigos del Café ☕ Mañanas sin prisa"
                  maxLength={80}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="desc">Descripción *</Label>
                <Textarea
                  id="desc"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Cuenta de qué va el grupo, normas, horarios… (20-600 caracteres)"
                  rows={4}
                  maxLength={600}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {form.description.length}/600
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="link">Enlace de invitación *</Label>
                <Input
                  id="link"
                  value={form.inviteLink}
                  onChange={(e) => update("inviteLink", e.target.value)}
                  placeholder="https://chat.whatsapp.com/…"
                  type="url"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Categoría *</Label>
                  <Select value={form.categoryId} onValueChange={(v) => update("categoryId", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elige…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>País *</Label>
                  <Select value={form.countryId} onValueChange={(v) => update("countryId", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Elige…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {countries.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.flag} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="contact">Tu nombre (opcional)</Label>
                  <Input
                    id="contact"
                    value={form.contactName}
                    onChange={(e) => update("contactName", e.target.value)}
                    placeholder="Cómo te llamas"
                    maxLength={40}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tags">Etiquetas (opcional)</Label>
                  <Input
                    id="tags"
                    value={form.tags}
                    onChange={(e) => update("tags", e.target.value)}
                    placeholder="fútbol, madrid, peña"
                  />
                  <p className="text-xs text-muted-foreground">Separadas por comas.</p>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t p-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-4 w-4" /> Enviar grupo
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
