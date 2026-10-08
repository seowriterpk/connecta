"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  // While the banner is on screen, reserve space at the bottom of the page
  // so it never covers real content (footer, CTAs, search bar on mobile).
  React.useEffect(() => {
    if (!visible) return;
    document.body.classList.add("cg-cookie-banner-open");
    return () => {
      document.body.classList.remove("cg-cookie-banner-open");
    };
  }, [visible]);

  function decide(value: Consent) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-4"
          role="dialog"
          aria-label="Aviso de cookies"
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border bg-card/95 p-4 text-left shadow-xl shadow-black/10 backdrop-blur sm:flex-row sm:items-center sm:p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Cookie className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Usamos cookies esenciales</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Solo guardamos tus preferencias (tema, favoritos, grupos vistos) en tu navegador.
                No usamos cookies de publicidad ni vendemos tus datos. Puedes seguir navegando tal cual.
              </p>
              <a
                href="/politica-de-cookies"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Ver política de cookies
              </a>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {/* 44px touch targets on mobile (min touch size); sm on desktop */}
              <Button
                variant="outline"
                onClick={() => decide("rejected")}
                className="h-11 px-4 text-xs sm:h-9 sm:px-3"
              >
                Solo esenciales
              </Button>
              <Button
                onClick={() => decide("accepted")}
                className="h-11 px-4 text-xs shadow-sm sm:h-9 sm:px-4"
              >
                Entendido
              </Button>
              <Button
                variant="ghost"
                aria-label="Cerrar"
                className="h-11 w-11 sm:h-8 sm:w-8"
                onClick={() => decide("rejected")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
