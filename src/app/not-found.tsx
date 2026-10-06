import Link from "next/link";
import { Home, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <span className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-muted">
          <AlertCircle className="h-10 w-10 text-muted-foreground" />
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          404
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          <Home className="h-4 w-4" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
