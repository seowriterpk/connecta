import Link from "next/link";
import {
  Home,
  AlertCircle,
  Flame,
  LayoutGrid,
  Globe2,
  Search,
  Heart,
  Plus,
} from "lucide-react";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";

export default function NotFound() {
  const escapes = [
    {
      href: "/populares",
      icon: Flame,
      label: "Grupos populares",
      hint: "Lo más activo ahora",
    },
    {
      href: "/categorias",
      icon: LayoutGrid,
      label: "Categorías",
      hint: "22 temáticas para explorar",
    },
    {
      href: "/paises",
      icon: Globe2,
      label: "Países",
      hint: "Comunidades de tu región",
    },
    {
      href: "/buscar",
      icon: Search,
      label: "Buscar",
      hint: "Encuentra tu comunidad",
    },
    {
      href: "/favoritos",
      icon: Heart,
      label: "Mis favoritos",
      hint: "Tus grupos guardados",
    },
    {
      href: "/agregar-grupo",
      icon: Plus,
      label: "Enviar grupo",
      hint: "Publica tu comunidad",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl text-center">
          <span className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
            <AlertCircle className="h-10 w-10" />
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Página no encontrada
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
            El enlace que buscas no existe, cambió de dirección o el grupo ya
            no está disponible en el directorio.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
          >
            <Home className="h-4 w-4" />
            Volver al inicio
          </Link>

          {/* Escape routes — turn the dead-end into discovery */}
          <div className="mt-12 border-t pt-8 text-left">
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sigue explorando
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {escapes.map((e) => (
                <Link
                  key={e.href}
                  href={e.href}
                  className="group flex items-center gap-3 rounded-xl border bg-card p-3.5 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary/15">
                    <e.icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold transition-colors group-hover:text-primary">
                      {e.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {e.hint}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
