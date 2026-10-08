"use client";

import * as React from "react";
import { Mail, Loader2, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function NewsletterSection({ source = "footer" }: { source?: string }) {
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email)) {
      setError("Introduce un correo válido.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter?XTransformPort=3000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), source }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo suscribir.");
      setDone(true);
      toast({ title: "¡Suscripción confirmada!", description: json.message });
    } catch (err: any) {
      setError(err.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-center">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          ¡Listo! Estás suscrito.
        </p>
        <p className="text-xs text-muted-foreground">
          Te avisaremos cuando publiquemos grupos destacados. Sin spam, lo prometido.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            className="h-11 pl-10"
            aria-label="Correo electrónico"
          />
        </div>
        <Button type="submit" disabled={loading} className="h-11 gap-1.5">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Suscribiendo…
            </>
            ) : (
            <>
              <Send className="h-4 w-4" /> Suscribirme
            </>
            )}
        </Button>
      </div>
      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Solo te escribiremos con grupos nuevos y destacados. Cancela cuando quieras.
      </p>
    </form>
  );
}
