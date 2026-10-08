"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Moon, Sun, MessageCircle, Search, Heart } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { useScrollSpy } from "@/hooks/use-scroll-spy";
import { useFavorites } from "@/lib/favorites";
import { motion } from "framer-motion";

const SECTION_IDS = NAV_LINKS.map((l) => l.href.replace("#", ""));

export function SiteHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const activeId = useScrollSpy(SECTION_IDS);
  const favCount = useFavorites((s) => s.ids.length);

  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2.5 font-bold" suppressHydrationWarning>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <MessageCircle className="h-5 w-5" />
          </span>
          <span className="text-lg tracking-tight text-primary" suppressHydrationWarning>{"ConectaGrupos"}</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex" suppressHydrationWarning>
          {NAV_LINKS.map((l) => {
            const isActive = mounted && activeId === l.href.replace("#", "");
            return (
              <Link
                key={l.href}
                href={l.href}
                suppressHydrationWarning
                className={`group relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <span suppressHydrationWarning>{l.label}</span>
                <span
                  aria-hidden
                  className={`absolute inset-x-3 -bottom-px h-0.5 origin-left rounded-full bg-primary transition-transform duration-300 ease-out ${
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Quick search trigger (desktop) */}
        <button
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "k", metaKey: true });
            window.dispatchEvent(e);
          }}
          className="ml-2 hidden items-center gap-2 rounded-lg border bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground transition hover:bg-accent lg:inline-flex"
          aria-label="Búsqueda rápida"
          suppressHydrationWarning
        >
          <Search className="h-3.5 w-3.5" />
          <span suppressHydrationWarning>{"Buscar…"}</span>
          <kbd className="rounded border bg-background px-1 py-0.5 text-xs font-semibold">⌘K</kbd>
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Favorites with live count badge */}
          {mounted && (
            <Link
              href="/favoritos"
              aria-label={`Mis favoritos${favCount > 0 ? ` (${favCount})` : ""}`}
              className="relative grid h-11 w-11 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-rose-500 sm:h-9 sm:w-9"
            >
              <Heart className="h-[18px] w-[18px] transition-transform duration-200 hover:scale-110" />
              {favCount > 0 && (
                <motion.span
                  key={favCount}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm"
                >
                  {favCount > 99 ? "99+" : favCount}
                </motion.span>
              )}
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
            onClick={toggleTheme}
            className="h-11 w-11 sm:h-9 sm:w-9"
            suppressHydrationWarning
          >
            <Sun className={`h-5 w-5 ${isDark ? "inline" : "hidden"}`} />
            <Moon className={`h-5 w-5 ${isDark ? "hidden" : "inline"}`} />
          </Button>
          <Button asChild className="hidden sm:inline-flex" size="sm">
            <Link href="/agregar-grupo">Enviar un grupo</Link>
          </Button>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-9 sm:w-9 lg:hidden" aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2.5 border-b px-5 py-4 font-bold" suppressHydrationWarning>
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <span className="text-primary" suppressHydrationWarning>{"ConectaGrupos"}</span>
                </div>
                <nav className="flex flex-col gap-1 p-3" suppressHydrationWarning>
                  {NAV_LINKS.map((l) => (
                    <SheetClose asChild key={l.href}>
                      <Link
                        href={l.href}
                        suppressHydrationWarning
                        className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <span suppressHydrationWarning>{l.label}</span>
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link
                      href="/favoritos"
                      className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Heart className="h-4 w-4 text-rose-500" /> Mis favoritos
                      </span>
                      {mounted && favCount > 0 && (
                        <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                          {favCount}
                        </span>
                      )}
                    </Link>
                  </SheetClose>
                </nav>
                <div className="mt-auto p-3">
                  <SheetClose asChild>
                    <Button asChild className="w-full">
                      <Link href="/agregar-grupo">Enviar un grupo</Link>
                    </Button>
                  </SheetClose>
                  <p className="mt-3 px-1 text-center text-xs text-muted-foreground" suppressHydrationWarning>
                    {SITE.tagline}
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
