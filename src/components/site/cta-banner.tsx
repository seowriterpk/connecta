import Link from "next/link";
import { Plus, MessageCircle } from "lucide-react";

export function CtaBanner() {
  return (
    <section id="enviar" className="border-t bg-gradient-to-br from-primary to-emerald-700 text-primary-foreground">
      <div className="container mx-auto px-4 py-14 sm:py-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center">
          <span className="cg-float inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <MessageCircle className="h-3.5 w-3.5" /> ¿Tienes un grupo?
          </span>
          <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Da visibilidad a tu comunidad de WhatsApp
          </h2>
          <p className="max-w-2xl text-pretty text-sm text-primary-foreground/90 sm:text-base">
            Publica tu grupo gratis y llega a miles de hispanohablantes que buscan justo lo que tú ofreces.
            Revisamos cada envío para mantener el directorio limpio y útil para todos.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/agregar-grupo"
              className="inline-flex items-center gap-2 rounded-xl bg-background px-5 py-3 text-sm font-semibold text-primary shadow-sm transition hover:bg-background/90 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" /> Enviar mi grupo ahora
            </Link>
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-white/10"
            >
              Ver grupos disponibles
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
