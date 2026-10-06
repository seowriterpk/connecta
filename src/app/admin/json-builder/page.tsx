import type { Metadata } from "next";
import { FileCode, CheckCircle2 } from "lucide-react";
import { checkAdmin } from "@/lib/admin-guard";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { JsonBuilderClient } from "./json-builder-client";

export const metadata: Metadata = {
  title: { absolute: "Generar JSON — Admin · ConectaGrupos" },
  robots: "noindex, nofollow",
};

export default async function JsonBuilderPage() {
  const { csrfToken } = await checkAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <FileCode className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">Generar archivos JSON</h1>
              <p className="text-sm text-muted-foreground">
                Crea archivos JSON estáticos para servir datos sin consultar la base de datos.
              </p>
            </div>
          </div>

          <JsonBuilderClient csrfToken={csrfToken} />
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
