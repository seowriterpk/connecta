"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Flag,
  Send,
  MessageCircle,
  Users,
  Eye,
  ChevronRight,
} from "lucide-react";
import type { GroupDTO } from "@/lib/types";
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
import { useToast } from "@/hooks/use-toast";
import { GroupImage } from "@/components/site/group-image";

const REPORT_OPTIONS = [
  { value: "enlace_roto", label: "Enlace roto" },
  { value: "contenido_inapropiado", label: "Contenido inapropiado" },
  { value: "spam", label: "Spam" },
  { value: "estafa", label: "Estafa" },
  { value: "otro", label: "Otro" },
];

export function ReportGroupClient() {
  const { toast } = useToast();
  const [query, setQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [results, setResults] = React.useState<GroupDTO[]>([]);
  const [searched, setSearched] = React.useState(false);
  const [selected, setSelected] = React.useState<GroupDTO | null>(null);

  const [reason, setReason] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (query.trim().length < 2) {
      setError("Escribe al menos 2 caracteres para buscar.");
      return;
    }
    setSearching(true);
    setSearched(false);
    try {
      const res = await fetch(
        `/api/groups?XTransformPort=3000&q=${encodeURIComponent(query.trim())}&limite=10`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo buscar.");
      setResults(json.data ?? []);
      setSearched(true);
    } catch (err: any) {
      setError(err.message || "Error inesperado.");
    } finally {
      setSearching(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selected) {
      setError("Primero busca y selecciona un grupo.");
      return;
    }
    if (!reason) {
      setError("Selecciona un motivo.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/groups/report?XTransformPort=3000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selected!.id,
          reason,
          details,
          contact,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo enviar.");
      setDone(true);
      toast({
        title: "Reporte enviado",
        description: json.message,
      });
    } catch (err: any) {
      setError(err.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setDone(false);
    setSelected(null);
    setReason("");
    setDetails("");
    setContact("");
    setQuery("");
    setResults([]);
    setSearched(false);
    setError(null);
  }

  return (
    <div className="space-y-8">
      {/* Step 1: search */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">1</span>
          <h2 className="text-base font-bold sm:text-lg">Busca el grupo</h2>
        </div>
        <form onSubmit={runSearch} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre del grupo o palabra clave…"
              className="h-11 pl-10"
              aria-label="Buscar grupo"
            />
          </div>
          <Button type="submit" disabled={searching} className="h-11 gap-1.5">
            {searching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Buscando…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" /> Buscar
              </>
            )}
          </Button>
        </form>
        {error && (
          <div className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search results */}
        {searched && results.length === 0 && !searching && (
          <p className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            No encontramos grupos con ese criterio. Prueba con otro nombre o{" "}
            <Link href="/contacto" className="font-medium text-primary hover:underline">
              escríbenos directamente
            </Link>
            .
          </p>
        )}

        {results.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs text-muted-foreground">
              {results.length} resultado{results.length === 1 ? "" : "s"}. Toca para seleccionar.
            </p>
            <ul className="max-h-80 space-y-2 overflow-y-auto cg-scroll pr-1">
              {results.map((g) => {
                const isSelected = selected?.id === g.id;
                return (
                  <li key={g.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(g);
                        setDone(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition hover:bg-accent ${
                        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-background"
                      }`}
                    >
                      <GroupImage
                        src={g.imageUrl}
                        alt={g.title}
                        size={44}
                        className="shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{g.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {g.category?.name ?? "Sin categoría"} · {g.country?.name ?? ""}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" /> {g.members.toLocaleString("es-ES")}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {g.views.toLocaleString("es-ES")}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Step 2: form */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">2</span>
          <h2 className="text-base font-bold sm:text-lg">Cuéntanos qué pasa</h2>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h3 className="text-lg font-bold">Reporte recibido</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Gracias. Nuestro equipo revisará este grupo con prioridad y tomará las medidas
              oportunas. Si dejaste tu contacto, te avisaremos del resultado.
            </p>
            <Button variant="outline" onClick={reset}>
              Reportar otro grupo
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {selected && (
              <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                <GroupImage src={selected.imageUrl} alt={selected.title} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{selected.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {selected.category?.name} · {selected.country?.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Cambiar
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="reason">Motivo del reporte *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger id="reason" className="h-11 w-full">
                  <SelectValue placeholder="Selecciona un motivo…" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="details">Cuéntanos más (opcional)</Label>
              <Textarea
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Detalles que ayuden a investigar…"
                rows={4}
                maxLength={500}
              />
              <p className="text-right text-xs text-muted-foreground">{details.length}/500</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact">Tu contacto (opcional)</Label>
              <Input
                id="contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Email o @usuario"
                maxLength={120}
              />
              <p className="text-xs text-muted-foreground">
                Solo si quieres que te avisemos del resultado.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" disabled={loading || !selected} className="w-full gap-1.5 sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Enviar reporte
                </>
              )}
            </Button>

            {!selected && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Flag className="h-3 w-3" /> Busca y selecciona un grupo arriba para activar el envío.
              </p>
            )}
          </form>
        )}
      </section>

      {/* FAQ */}
      <section className="rounded-2xl border bg-muted/30 p-5 sm:p-6">
        <h2 className="text-base font-bold sm:text-lg">Preguntas frecuentes sobre reportes</h2>
        <div className="mt-4 space-y-4 text-sm">
          <div>
            <h3 className="font-semibold">¿Qué pasa después de enviar un reporte?</h3>
            <p className="mt-1 text-muted-foreground">
              Nuestro equipo de moderación revisa el grupo reportado. Si se confirma la
              infracción, retiramos el grupo del directorio, lo marcamos como inactivo o, en
              casos graves, lo bloqueamos. Si dejaste contacto, te avisamos del resultado.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">¿Pueden saber quién ha reportado un grupo?</h3>
            <p className="mt-1 text-muted-foreground">
              No. Tu identidad no se comparte con el administrador del grupo. El contacto que
              dejas (opcional) solo se usa para avisarte del resultado, no se hace público.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">¿Puedo reportar el mismo grupo varias veces?</h3>
            <p className="mt-1 text-muted-foreground">
              Limitamos a un reporte por grupo e IP para evitar abusos. Si el grupo ya fue
              reportado, sigue estando visible mientras lo revisamos; cuando se resuelva, lo
              retiramos o lo dejamos según corresponda.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3 border-t pt-4">
          <Link
            href="/agregar-grupo"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <MessageCircle className="h-4 w-4" /> Enviar tu propio grupo
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
          >
            ¿Otro motivo? Escríbenos
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
