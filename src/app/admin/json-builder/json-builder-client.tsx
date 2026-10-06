"use client";

import * as React from "react";
import { Loader2, CheckCircle2, AlertCircle, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";

export function JsonBuilderClient({ csrfToken }: { csrfToken: string }) {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function generate(target: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/build-json?XTransformPort=3000", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, csrf: csrfToken }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Error");
      setResult(json.message || "JSON generado correctamente.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const buttons = [
    { target: "all", label: "Generar todo", desc: "Crea todos los archivos JSON" },
    { target: "categories", label: "Categorías", desc: "categories.json" },
    { target: "countries", label: "Países", desc: "countries.json" },
    { target: "groups", label: "Grupos", desc: "groups.json (max 500)" },
    { target: "tags", label: "Etiquetas", desc: "tags.json" },
    { target: "cities", label: "Ciudades", desc: "cities.json" },
    { target: "homepage", label: "Homepage", desc: "homepage.json (stats)" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {buttons.map((btn) => (
          <div key={btn.target} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-semibold">{btn.label}</div>
                <div className="text-xs text-muted-foreground">{btn.desc}</div>
              </div>
            </div>
            <Button
              onClick={() => generate(btn.target)}
              disabled={loading}
              size="sm"
              className="mt-3 w-full gap-2"
            >
              <Loader2 className={`h-3.5 w-3.5 animate-spin ${loading ? "inline" : "hidden"}`} />
              <FileJson className={`h-3.5 w-3.5 ${loading ? "hidden" : "inline"}`} />
              Generar
            </Button>
          </div>
        ))}
      </div>

      {result && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{result}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
