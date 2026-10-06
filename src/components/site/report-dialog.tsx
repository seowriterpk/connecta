"use client";

import * as React from "react";
import { Flag, Loader2, CheckCircle2, AlertCircle, Send } from "lucide-react";
import type { GroupDTO } from "@/lib/types";
import { REPORT_REASONS } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

export function ReportDialog({
  group,
  trigger,
}: {
  group: GroupDTO | null;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const [reason, setReason] = React.useState<string>("");
  const [details, setDetails] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setReason("");
      setDetails("");
      setContact("");
      setDone(false);
      setError(null);
    }
  }, [open]);

  if (!group) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!reason) {
      setError("Selecciona un motivo.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/groups/report?XTransformPort=3000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: group!.id, reason, details, contact }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo enviar.");
      setDone(true);
      toast({
        title: "Reporte enviado",
        description: "Gracias por ayudarnos a mantener el directorio limpio.",
      });
    } catch (err: any) {
      setError(err.message || "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="cg-pop max-h-[92vh] overflow-y-auto cg-scroll p-0 sm:max-w-md">
        {done ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h3 className="text-lg font-bold">Reporte recibido</h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Gracias. Nuestro equipo revisará este grupo con prioridad y tomará las medidas
              oportunas. Si dejaste tu contacto, te avisaremos del resultado.
            </p>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <DialogHeader className="gap-2 border-b p-5 pb-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-destructive/10 text-destructive">
                  <Flag className="h-4 w-4" />
                </span>
                <DialogTitle className="text-base font-bold">Reportar grupo</DialogTitle>
              </div>
              <DialogDescription className="text-sm">
                Reportando: <span className="font-medium text-foreground">{group.title}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <Label>¿Cuál es el motivo? *</Label>
                <RadioGroup value={reason} onValueChange={setReason} className="gap-1.5">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.value}
                      htmlFor={`r-${r.value}`}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-sm transition hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem id={`r-${r.value}`} value={r.value} className="sr-only" />
                      <span
                        className={`grid h-4 w-4 place-items-center rounded-full border-2 ${
                          reason === r.value ? "border-primary" : "border-muted-foreground/40"
                        }`}
                      >
                        {reason === r.value && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </span>
                      {r.label}
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="details">Cuéntanos más (opcional)</Label>
                <Textarea
                  id="details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Detalles que ayuden a investigar…"
                  rows={3}
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
            </div>

            <div className="flex items-center justify-end gap-2 border-t p-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-4 w-4" /> Enviar reporte
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
