import { Badge } from "@/components/ui/badge";

/**
 * admin-badges.tsx — one coherent badge color language for every admin page
 * (Task 29-b). Hook-free on purpose so both server components and client
 * explorers share the exact same semantics:
 *
 *   emerald = publicado / activo / resuelto
 *   amber   = pendiente / desconocido / abierto
 *   rose    = rechazado / revocado
 *   orange  = marcado (flagged)
 */

export function AdminGroupStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "live":
      return <Badge className="bg-emerald-600 hover:bg-emerald-700">Publicado</Badge>;
    case "pending":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/50 dark:text-amber-300"
        >
          Pendiente
        </Badge>
      );
    case "rejected":
      return (
        <Badge
          variant="secondary"
          className="bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/50 dark:text-rose-300"
        >
          Rechazado
        </Badge>
      );
    case "flagged":
      return (
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-950/50 dark:text-orange-300"
        >
          Marcado
        </Badge>
      );
    case "pruned":
      return <Badge variant="outline">Purgado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function AdminLinkStatusBadge({ linkStatus }: { linkStatus: string }) {
  if (linkStatus === "revoked") {
    return (
      <Badge
        variant="secondary"
        className="bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"
      >
        Revocado
      </Badge>
    );
  }
  if (linkStatus === "unknown") {
    return (
      <Badge
        variant="secondary"
        className="border border-amber-300/60 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
      >
        Desconocido
      </Badge>
    );
  }
  return (
    <Badge
      variant="secondary"
      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
    >
      Activo
    </Badge>
  );
}

export function AdminReportStatusBadge({ status }: { status: string }) {
  if (status === "OPEN")
    return (
      <Badge className="bg-amber-600 hover:bg-amber-700">Abierto</Badge>
    );
  if (status === "RESOLVED")
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-700">Resuelto</Badge>
    );
  return <Badge variant="outline">Descartado</Badge>;
}

/** UGC pipeline status (same wording as /admin/ugc). */
export function AdminUgcStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "submitted":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        >
          Enviado
        </Badge>
      );
    case "needs_review":
      return (
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-amber-300"
        >
          Revisión
        </Badge>
      );
    case "approved":
    case "published":
    case "auto_published":
      return <Badge className="bg-emerald-600 hover:bg-emerald-700">Publicado</Badge>;
    case "rejected":
      return (
        <Badge
          variant="secondary"
          className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
        >
          Rechazado
        </Badge>
      );
    case "spam":
      return <Badge variant="destructive">Spam</Badge>;
    case "duplicate":
      return <Badge variant="outline">Duplicado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
