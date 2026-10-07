"use client";

/**
 * AdultModeToggle — the global 18+ switch (homepage hero + explorer bar).
 *
 * - First enable → AlertDialog age gate ("¿Tienes 18 años o más?").
 * - Persists via the adult-mode store (localStorage "cg-adult-18").
 * - Hydration-safe: renders the OFF state on server/first paint, then syncs.
 * - When enabled, client sections re-fetch content including adult groups.
 */

import * as React from "react";
import { Eye, EyeOff, ShieldAlert, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdultMode, useAdultModeHydrated } from "@/lib/adult-store";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Compact pill toggle — used in the hero and the explorer filter bar. */
export function AdultModeToggle({ variant = "hero" }: { variant?: "hero" | "compact" }) {
  const { enabled } = useAdultModeHydrated();
  const ageConfirmed = useAdultMode((s) => s.ageConfirmed);
  const enable = useAdultMode((s) => s.enable);
  const disable = useAdultMode((s) => s.disable);
  const confirmAge = useAdultMode((s) => s.confirmAge);

  const [gateOpen, setGateOpen] = React.useState(false);
  const [pendingOff, setPendingOff] = React.useState(false);

  function onSwitchClick() {
    if (enabled) {
      disable();
    } else if (ageConfirmed) {
      enable();
    } else {
      setGateOpen(true); // first time → age gate
    }
  }

  const isOn = enabled;

  return (
    <>
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-label="Modo contenido 18+"
        onClick={onSwitchClick}
        className={cn(
          "group relative inline-flex select-none items-center gap-2 rounded-full border transition-all duration-300",
          "min-h-[44px] px-1.5 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          variant === "hero"
            ? "w-full max-w-xs justify-between bg-card/80 pl-4"
            : "bg-card",
          isOn
            ? "border-rose-500/60 bg-rose-500/[0.08] shadow-[0_0_20px_-6px_rgba(244,63,94,0.45)]"
            : "border-border hover:border-rose-400/40"
        )}
      >
        {/* Label block */}
        <span
          className={cn(
            "flex items-center gap-1.5 text-xs font-semibold transition-colors",
            isOn ? "text-rose-600 dark:text-rose-300" : "text-muted-foreground"
          )}
        >
          {isOn ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          <span>
            {isOn ? "Modo 18+ activo" : "Contenido 18+"}
            {variant === "hero" && (
              <span className="ml-1 hidden font-normal text-[10px] text-muted-foreground sm:inline">
                {isOn ? "· ver todo" : "· desactivado"}
              </span>
            )}
          </span>
        </span>

        {/* The switch */}
        <span
          className={cn(
            "relative flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300",
            isOn ? "bg-rose-500" : "bg-muted-foreground/25"
          )}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={cn(
              "grid h-5.5 w-5.5 place-items-center rounded-full bg-white text-[9px] font-black shadow-sm",
              isOn ? "ml-auto mr-1 text-rose-500" : "ml-1 text-muted-foreground/60"
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isOn ? (
                <motion.span key="on" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} className="leading-none">
                  18+
                </motion.span>
              ) : (
                <motion.span key="off" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="leading-none">
                  ·
                </motion.span>
              )}
            </AnimatePresence>
          </motion.span>
        </span>
      </button>

      {/* Age gate — first activation only */}
      <AlertDialog open={gateOpen} onOpenChange={setGateOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/10">
              <ShieldAlert className="h-7 w-7 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Confirmación de edad
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm leading-relaxed">
              Estás a punto de activar el <strong className="text-foreground">modo 18+</strong>.
              Se mostrará contenido para adultos que está separado del resto del directorio.
              Esta preferencia se guarda en tu navegador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={() => {
                confirmAge();
                setGateOpen(false);
              }}
              className="h-11 w-full rounded-xl bg-rose-500 text-white hover:bg-rose-600"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Sí, tengo 18 años o más</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setGateOpen(false);
                setPendingOff(true);
                window.setTimeout(() => setPendingOff(false), 1600);
              }}
              className="h-11 w-full rounded-xl"
            >
              <span>Cancelar</span>
            </Button>
          </AlertDialogFooter>
          <p className="text-center text-[11px] leading-snug text-muted-foreground">
            El contenido adulto nunca se carga en la página hasta que activas esta opción.
          </p>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transient "desactivado" toast-ish feedback */}
      <AnimatePresence>
        {pendingOff && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background shadow-lg"
          >
            Modo 18+ desactivado
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
