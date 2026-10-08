"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/**
 * G-prefix keyboard shortcuts: press G then another key within 800ms.
 * GH → #inicio, GG → #grupos, GE → #enviar, GC → #categorias, GP → #paises, GF → /favoritos.
 */
export function GPrefixShortcuts() {
  const pendingGRef = React.useRef(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if (inField) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // If we have a pending G, treat this key as the second in the sequence
      if (pendingGRef.current) {
        const isRoute = e.key === "f" || e.key === "F";
        const map: Record<string, string> = {
          h: "#inicio", H: "#inicio",
          g: "#grupos", G: "#grupos",
          e: "#enviar", E: "#enviar",
          c: "#categorias", C: "#categorias",
          p: "#paises", P: "#paises",
        };
        if (isRoute) {
          e.preventDefault();
          router.push("/favoritos");
        } else {
          const target = map[e.key];
          if (target) {
            e.preventDefault();
            document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
          }
        }
        pendingGRef.current = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        return;
      }

      // Otherwise, start a new G sequence
      if (e.key === "g" || e.key === "G") {
        pendingGRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          pendingGRef.current = false;
        }, 800);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return null;
}
