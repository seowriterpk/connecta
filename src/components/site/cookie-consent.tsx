"use client";

import * as React from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cg-cookie-consent";
type Consent = "accepted" | "rejected";

export function CookieConsent() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (!v) setVisible(true);
    } catch {
      /* ignore */
    }
  }, []);

  function decide(value: Consent) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border bg-card/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Cookie className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Usamos cookies esenciales</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Solo guardamos tus preferencias (tema, favoritos, grupos vistos) en tu navegador.
            No usamos cookies de publicidad ni vendemos tus datos. Puedes seguir navegando tal cual.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => decide("rejected")}>
            Solo esenciales
          </Button>
          <Button size="sm" onClick={() => decide("accepted")}>
            Entendido
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cerrar"
            className="h-8 w-8"
            onClick={() => decide("rejected")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
