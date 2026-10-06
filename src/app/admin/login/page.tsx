import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/admin-auth";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { AdminLoginForm } from "@/app/admin/login/admin-login-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Metadata } from "next";
import { Lock } from "lucide-react";

export const metadata: Metadata = {
  title: { absolute: "Acceso administrativo — ConectaGrupos" },
  description: "Inicio de sesión del panel de administración de ConectaGrupos.",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // Already logged in? Skip to dashboard.
  if (await isLoggedIn()) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50/40 to-background dark:from-emerald-950/20">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="overflow-hidden border-emerald-200/60 shadow-lg dark:border-emerald-900/40">
            <CardHeader className="space-y-3 border-b bg-gradient-to-br from-emerald-50 to-background pb-6 dark:from-emerald-950/30">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Lock className="h-5 w-5" />
                </span>
                <div>
                  <CardTitle className="text-xl">Acceso administrativo</CardTitle>
                  <CardDescription className="mt-1">
                    Panel de gestión de ConectaGrupos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <AdminLoginForm />
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Área restringida. Solo personal autorizado. Todas las acciones quedan registradas en la
            auditoría.
          </p>
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
