"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <span className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Algo salió mal
        </h1>
        <p className="mt-3 max-w-md text-base text-muted-foreground">
          Ha ocurrido un error inesperado. Puedes intentar de nuevo o volver al inicio.
        </p>

        {/* Dev diagnostics — Next.js masks server errors by default; surface
            message + stack during development so bugs are debuggable. */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 max-w-2xl text-left" open>
            <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
              Detalles técnicos (solo desarrollo)
            </summary>
            <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-muted p-4 text-left text-xs leading-relaxed text-foreground/80">
              {error.message}
              {error.digest ? `\n\ndigest: ${error.digest}` : ""}
              {error.stack ? `\n\n${error.stack}` : ""}
            </pre>
          </details>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border bg-background px-5 py-3 text-sm font-semibold transition hover:bg-accent"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
