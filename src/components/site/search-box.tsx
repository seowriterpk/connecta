"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface SearchBoxProps {
  defaultValue?: string;
  autoFocus?: boolean;
  placeholder?: string;
}

/**
 * Client-side search box used on the /buscar page.
 * Submits to /buscar?q=... on Enter or click.
 */
export function SearchBox({
  defaultValue = "",
  autoFocus = false,
  placeholder = "Busca grupos: fútbol, programación, café, Madrid…",
}: SearchBoxProps) {
  const router = useRouter();
  const [value, setValue] = React.useState(defaultValue);

  // Keep input in sync if the URL `q` changes (e.g. user clicks a related tag).
  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const q = value.trim();
    if (!q) {
      router.push("/buscar");
      return;
    }
    router.push(`/buscar?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label="Buscar grupos de WhatsApp"
      className="relative mx-auto flex w-full max-w-2xl items-center"
    >
      <div className="relative flex w-full items-center">
        <Search className="pointer-events-none absolute left-4 h-5 w-5 text-muted-foreground" aria-hidden />
        <input
          autoFocus={autoFocus}
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar grupos"
          autoComplete="off"
          className="h-14 w-full rounded-2xl border bg-card pl-12 pr-28 text-base shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:text-base"
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="absolute right-24 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
            aria-label="Borrar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Buscar</span>
        </button>
      </div>
    </form>
  );
}
