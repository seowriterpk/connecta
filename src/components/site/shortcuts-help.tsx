"use client";

import * as React from "react";
import { Keyboard, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const SHORTCUTS = [
  { keys: ["⌘", "K"], label: "Abrir búsqueda rápida" },
  { keys: ["/"], label: "Enfocar el buscador" },
  { keys: ["Esc"], label: "Cerrar diálogos o paneles" },
  { keys: ["?"], label: "Mostrar esta ayuda" },
  { keys: ["G", "H"], label: "Ir al inicio (arriba)" },
  { keys: ["G", "G"], label: "Ir a todos los grupos" },
  { keys: ["G", "F"], label: "Ir a mis favoritos" },
  { keys: ["G", "E"], label: "Enviar un grupo nuevo" },
];

export function ShortcutsHelp() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Open on "?"
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        setOpen((v) => !v);
      }
      // Close on Esc is handled by Dialog
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="cg-pop p-0 sm:max-w-md">
        <DialogHeader className="gap-2 border-b p-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Keyboard className="h-4 w-4" />
              </span>
              <DialogTitle className="text-base font-bold">Atajos de teclado</DialogTitle>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-accent"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <DialogDescription className="text-sm">
            Navega más rápido con el teclado. Pulsa <kbd className="rounded border bg-muted px-1 font-mono text-xs">?</kbd> para abrir/cerrar esta ayuda.
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-2.5 text-sm">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <kbd
                    key={j}
                    className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
