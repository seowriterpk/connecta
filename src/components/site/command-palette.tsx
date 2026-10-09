"use client";

import * as React from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Search, Users, Globe2, Home, Send, BookOpen, Heart, History, Flame, Scale } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import type { CategoryDTO, CountryDTO, GroupDTO } from "@/lib/types";
import { useGroupsFilter } from "@/lib/store";
import { useRecent } from "@/lib/recent";
import { useCompare, MAX_COMPARE } from "@/lib/compare";
import { CountryFlag } from "@/components/site/country-flag";

interface Props {
  categories: CategoryDTO[];
  countries: CountryDTO[];
  groups: GroupDTO[];
}

export function CommandPalette({ categories, countries, groups }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAdmin = pathname.startsWith("/admin");
  const [open, setOpen] = React.useState(false);
  const setSearch = useGroupsFilter((s) => s.setSearch);
  const setFavoritesOnly = useGroupsFilter((s) => s.setFavoritesOnly);
  const recentItems = useRecent((s) => s.items);
  const compareCount = useCompare((s) => s.slugs.length);

  React.useEffect(() => {
    if (isAdmin) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAdmin]);

  function goAndClose(fn: () => void) {
    fn();
    setOpen(false);
    setTimeout(() => {
      document.getElementById("grupos")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  function pickGroup(g: GroupDTO) {
    setOpen(false);
    setTimeout(() => router.push(`/grupo/${g.slug}`), 60);
  }

  function scrollOrGo(anchorId: string, fallbackPath: string) {
    setOpen(false);
    setTimeout(() => {
      if (isHome) {
        document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        router.push(fallbackPath);
      }
    }, 60);
  }

  if (isAdmin) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir búsqueda rápida (Cmd+K)"
        className="fixed bottom-5 left-5 z-40 hidden items-center gap-2 rounded-full border bg-background/90 px-3.5 py-2 text-xs font-medium text-muted-foreground shadow-md backdrop-blur transition hover:border-teal-500/40 hover:bg-teal-500/5 hover:text-teal-700 dark:hover:text-teal-300 sm:inline-flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Búsqueda rápida</span>
        <kbd className="ml-1 rounded border bg-muted px-1.5 py-0.5 text-xs font-semibold">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Busca grupos, categorías, países…" />
        <CommandList>
          <CommandEmpty>No encontramos resultados.</CommandEmpty>

          <CommandGroup heading="Acciones">
            <CommandItem onSelect={() => scrollOrGo("grupos", "/#grupos")}>
              <Home className="h-4 w-4" />
              Ver todos los grupos
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); setTimeout(() => router.push("/favoritos"), 60); }}>
              <Heart className="h-4 w-4 text-rose-500" />
              Ir a mis favoritos
            </CommandItem>
            {isHome && (
              <CommandItem onSelect={() => goAndClose(() => { setSearch(""); setFavoritesOnly(true); })}>
                <Users className="h-4 w-4" />
                Filtrar solo favoritos aquí
              </CommandItem>
            )}
            {compareCount > 0 && (
              <CommandItem onSelect={() => { setOpen(false); setTimeout(() => router.push("/comparar"), 60); }}>
                <Scale className="h-4 w-4 text-teal-500" />
                Continuar comparación
                <span className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-teal-500/15 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-teal-700 dark:text-teal-300">
                  {compareCount}/{MAX_COMPARE}
                </span>
              </CommandItem>
            )}
            <CommandItem onSelect={() => scrollOrGo("enviar", "/agregar-grupo")}>
              <Send className="h-4 w-4" />
              Enviar un grupo
            </CommandItem>
            <CommandItem onSelect={() => scrollOrGo("guias", "/guias")}>
              <BookOpen className="h-4 w-4" />
              Ver guías prácticas
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); setTimeout(() => router.push("/populares"), 60); }}>
              <Flame className="h-4 w-4 text-orange-500" />
              Ver grupos populares
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); setTimeout(() => router.push("/comparar"), 60); }}>
              <Scale className="h-4 w-4 text-teal-500" />
              Comparar grupos
            </CommandItem>
          </CommandGroup>

          {recentItems.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Vistos recientemente">
                {recentItems.slice(0, 4).map((g) => (
                  <CommandItem
                    key={`recent-${g.id}`}
                    value={`recent ${g.title} ${g.description} ${g.category?.name ?? ""}`}
                    onSelect={() => pickGroup(g)}
                  >
                    <History className="h-4 w-4 text-teal-500" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{g.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {g.country && <CountryFlag code={g.country.code} name={g.country.name} />} {g.category?.name ?? "Grupo"}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {groups.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Grupos populares">
                {groups.slice(0, 6).map((g) => (
                  <CommandItem
                    key={g.id}
                    value={`${g.title} ${g.description} ${g.category?.name} ${g.country?.name}`}
                    onSelect={() => pickGroup(g)}
                  >
                    <span className="text-base">{g.category?.icon ?? "💬"}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{g.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {g.country && (<><CountryFlag code={g.country.code} name={g.country.name} /> {g.country.name}</>)} · {g.members.toLocaleString("es-ES")} miembros
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {categories.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Categorías">
                {categories.slice(0, 10).map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`cat ${c.name}`}
                    onSelect={() => { setOpen(false); setTimeout(() => router.push(`/categoria/${c.slug}`), 60); }}
                  >
                    <span className="text-base">{c.icon}</span>
                    <span className="text-sm">{c.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{c.groupCount}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {countries.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Países">
                {countries.slice(0, 10).map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`pais ${c.name}`}
                    onSelect={() => { setOpen(false); setTimeout(() => router.push(`/pais/${c.code}`), 60); }}
                  >
                    <Globe2 className="h-4 w-4" />
                    <CountryFlag code={c.code} name={c.name} />
                    <span className="text-sm">{c.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{c.groupCount}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
