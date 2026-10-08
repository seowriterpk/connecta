"use client";

import * as React from "react";
import { Loader2, CheckCircle2, AlertCircle, Send, Mail, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ContactForm() {
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Indica tu nombre.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("Introduce un correo válido.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Cuéntanos algo más (mínimo 10 caracteres).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contact?XTransformPort=3000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          message: message.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo enviar.");
      setDone(true);
      toast({
        title: "Mensaje enviado",
        description: json.message,
      });
    } catch (err: any) {
      setError(err.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-8 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="text-lg font-bold">¡Mensaje recibido!</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Gracias por escribirnos. Te responderemos a tu correo en menos de 48 horas
          laborables. Mientras tanto, puedes seguir explorando el directorio.
        </p>
        <Button variant="outline" onClick={() => {
          setDone(false);
          setName("");
          setEmail("");
          setMessage("");
        }}>
          Enviar otro mensaje
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="space-y-1.5">
        <Label htmlFor="name" className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-muted-foreground" /> Tu nombre
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="¿Cómo te llamas?"
          maxLength={120}
          autoComplete="name"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Correo electrónico
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          maxLength={160}
          autoComplete="email"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message" className="flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" /> Mensaje
        </Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Cuéntanos en qué podemos ayudarte…"
          rows={5}
          maxLength={4000}
          required
        />
        <p className="text-right text-xs text-muted-foreground">{message.length}/4000</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full gap-1.5 sm:w-auto">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" /> Enviar mensaje
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        Nunca compartimos tus datos con terceros. Consulta nuestra{" "}
        <a href="/politica-de-privacidad" className="underline hover:text-primary">política de privacidad</a>.
      </p>
    </form>
  );
}
