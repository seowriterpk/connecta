"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Scale, Check, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCompare, MAX_COMPARE } from "@/lib/compare";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

/**
 * Shared toggle logic for "add to comparison" affordances.
 * Shows a toast with a direct action so users can jump to /comparar.
 */
function useCompareToggle(slug: string, title: string) {
  const add = useCompare((s) => s.add);
  const remove = useCompare((s) => s.remove);
  const slugs = useCompare((s) => s.slugs);
  const { toast } = useToast();
  const router = useRouter();

  const active = slugs.includes(slug);
  const full = slugs.length >= MAX_COMPARE && !active;

  const toggle = React.useCallback(() => {
    if (active) {
      remove(slug);
      return;
    }
    if (slugs.length >= MAX_COMPARE) return;
    add(slug);
    toast({
      title: "Añadido a la comparación",
      description: `${title} · ${slugs.length + 1} de ${MAX_COMPARE} grupos seleccionados`,
      action: (
        <ToastAction
          altText="Comparar ahora"
          onClick={() => router.push("/comparar")}
          className="gap-1 bg-teal-600 text-white hover:bg-teal-700"
        >
          Comparar <ArrowRight className="h-3 w-3" />
        </ToastAction>
      ),
    });
  }, [active, add, remove, router, slug, slugs.length, title, toast]);

  return { active, full, toggle };
}

/** Compact circular icon button for cards and directory rows. */
export function CompareIconButton({ slug, title }: { slug: string; title: string }) {
  const { active, full, toggle } = useCompareToggle(slug, title);

  return (
    <motion.button
      aria-label={active ? `Quitar ${title} de la comparación` : `Añadir ${title} a la comparación`}
      aria-pressed={active}
      title={full ? `Comparación llena (máx. ${MAX_COMPARE})` : active ? "Quitar de la comparación" : "Añadir a la comparación"}
      aria-disabled={full}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!full) toggle();
      }}
      whileTap={full ? undefined : { scale: 0.8 }}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition duration-200 ${
        active
          ? "bg-teal-500/15 text-teal-600 ring-1 ring-teal-500/40 dark:text-teal-300"
          : full
          ? "cursor-not-allowed text-muted-foreground/40"
          : "text-muted-foreground hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-300"
      }`}
    >
      {active ? <Check className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
    </motion.button>
  );
}

/** Labeled pill button for the group detail sticky bar. */
export function ComparePillButton({ slug, title }: { slug: string; title: string }) {
  const { active, full, toggle } = useCompareToggle(slug, title);
  const count = useCompare((s) => s.slugs.length);

  return (
    <motion.button
      aria-label={active ? "Quitar este grupo de la comparación" : "Añadir este grupo a la comparación"}
      aria-pressed={active}
      aria-disabled={full}
      onClick={() => {
        if (!full) toggle();
      }}
      whileTap={full ? undefined : { scale: 0.96 }}
      className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold shadow-sm transition-all duration-200 sm:min-h-9 sm:px-3.5 ${
        active
          ? "border-teal-500/40 bg-teal-500/10 text-teal-700 ring-1 ring-teal-500/30 hover:bg-teal-500/15 dark:text-teal-300"
          : full
          ? "cursor-not-allowed border-border bg-muted/50 text-muted-foreground/50"
          : "border-border bg-background text-foreground hover:border-teal-500/50 hover:bg-teal-500/5 hover:text-teal-700 dark:hover:text-teal-300"
      }`}
    >
      {active ? <Check className="h-3.5 w-3.5" /> : <Scale className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{active ? "En comparación" : "Comparar"}</span>
      {active && count > 1 && (
        <span className="rounded-full bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-teal-700 dark:text-teal-300">
          {count}/{MAX_COMPARE}
        </span>
      )}
    </motion.button>
  );
}
