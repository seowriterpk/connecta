import Link from "next/link";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BackToTop } from "@/components/site/back-to-top";
import { checkAdmin } from "@/lib/admin-guard";
import { query, queryOne, type Row } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FolderTree,
  ArrowLeft,
  Search,
  Filter,
  Eye,
  ExternalLink,
  Trash2,
  CheckCircle2,
  XCircle,
  Link as LinkIcon,
} from "lucide-react";
import { AdminGroupsTable } from "./admin-groups-table";
import { AdminPagination } from "@/components/admin/admin-pagination";

export const dynamic = "force-dynamic";
export const metadata = {
  title: { absolute: "Gestión de grupos — Admin ConectaGrupos" },
  description: "Administra todos los grupos del directorio.",
  robots: { index: false, follow: false },
};

const PER_PAGE = 48;

/** LIKE pattern with % _ \ escaped (same semantics as Prisma `contains`). */
function like(v: string): string {
  return `%${v.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
}

const STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  { value: "live", label: "Publicados (live)" },
  { value: "pending", label: "Pendientes" },
  { value: "rejected", label: "Rechazados" },
  { value: "flagged", label: "Marcados (flagged)" },
  { value: "revoked", label: "Enlaces revocados" },
] as const;

export default async function AdminGroupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { csrfToken, adminUser } = await checkAdmin();

  const sp = await searchParams;
  const status = String(sp.status || "all");
  const category = String(sp.category || "all");
  const country = String(sp.country || "all");
  const q = String(sp.q || "").trim();
  const pageRaw = Number(sp.page || "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  // Build where clause
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (status === "revoked") {
    clauses.push("`linkStatus` = ?");
    params.push("revoked");
  } else if (status !== "all") {
    clauses.push("`status` = ?");
    params.push(status);
  }

  if (category !== "all") {
    clauses.push("`categoryId` = ?");
    params.push(category);
  }
  if (country !== "all") {
    clauses.push("`countryId` = ?");
    params.push(country);
  }

  if (q) {
    clauses.push("(`groupName` LIKE ? OR `slug` LIKE ? OR `joinLink` LIKE ?)");
    const l = like(q);
    params.push(l, l, l);
  }
  const whereSql = clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "";

  const [categories, countries] = await Promise.all([
    query<{ id: string; name: string }>(
      "SELECT `id`, `name` FROM `categories` ORDER BY `sortOrder` ASC"
    ),
    query<{ id: string; name: string }>(
      "SELECT `id`, `name` FROM `countries` ORDER BY `name` ASC"
    ),
  ]);

  const [totalRow, groupRows] = await Promise.all([
    queryOne<Row & { c: number }>(
      `SELECT COUNT(*) AS \`c\` FROM \`groups\`${whereSql}`,
      params
    ),
    query<Row & Record<string, unknown>>(
      `SELECT \`id\`, \`groupName\`, \`slug\`, \`category\`, \`country\`, \`city\`, \`status\`, \`linkStatus\`, \`clicks\`, \`createdAt\`, \`profileImage\`, \`isAdult\`
       FROM \`groups\`${whereSql}
       ORDER BY \`createdAt\` DESC
       LIMIT ? OFFSET ?`,
      [...params, PER_PAGE, (page - 1) * PER_PAGE]
    ),
  ]);

  const total = Number((totalRow as { c?: number } | null)?.c ?? 0);
  const groups = groupRows.map((g) => ({
    id: String(g.id),
    groupName: String(g.groupName ?? ""),
    slug: String(g.slug ?? ""),
    category: String(g.category ?? ""),
    country: String(g.country ?? ""),
    city: (g.city as string | null) ?? null,
    status: String(g.status ?? "pending"),
    linkStatus: String(g.linkStatus ?? "active"),
    clicks: Number(g.clicks ?? 0),
    createdAt: (g.createdAt as Date | string) ?? new Date(0),
    profileImage: (g.profileImage as string | null) ?? null,
    isAdult: !!g.isAdult,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  // Build query string for filters preservation in pagination
  const qs = new URLSearchParams();
  if (status !== "all") qs.set("status", status);
  if (category !== "all") qs.set("category", category);
  if (country !== "all") qs.set("country", country);
  if (q) qs.set("q", q);
  const qsStr = qs.toString();
  const pageHref = (n: number) =>
    `/admin/grupos${n === 1 ? (qsStr ? `?${qsStr}` : "") : `?${qsStr ? `${qsStr}&` : ""}page=${n}`}`;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                <Link href="/admin">
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Link>
              </Button>
              <div>
                <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
                  <FolderTree className="h-5 w-5 text-emerald-600" />
                  Gestión de grupos
                </h1>
                <p className="text-sm text-muted-foreground">
                  {total.toLocaleString("es-ES")} grupos · página {page} de {totalPages}
                </p>
              </div>
            </div>
          </div>

          {/* Filters card */}
          <Card className="mt-4">
            <CardContent className="py-4">
              <form method="get" action="/admin/grupos" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      name="q"
                      defaultValue={q}
                      placeholder="Nombre, slug o URL…"
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Estado
                  </label>
                  <select
                    name="status"
                    defaultValue={status}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Categoría
                  </label>
                  <select
                    name="category"
                    defaultValue={category}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                  >
                    <option value="all">Todas</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    País
                  </label>
                  <select
                    name="country"
                    defaultValue={country}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                  >
                    <option value="all">Todos</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2 lg:col-span-5">
                  <Button type="submit" variant="default" size="sm">
                    <Filter className="h-3.5 w-3.5" />
                    Aplicar filtros
                  </Button>
                  {(status !== "all" || category !== "all" || country !== "all" || q) && (
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/admin/grupos">Limpiar</Link>
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Bulk actions + table */}
          <Card className="mt-4">
            <CardContent className="px-0 py-0">
              <AdminGroupsTable
                groups={groups}
                csrfToken={csrfToken}
                adminUser={adminUser}
              />
              {groups.length === 0 && (
                <div className="border-t px-6 py-16 text-center">
                  <p className="text-sm text-muted-foreground">
                    No se encontraron grupos con estos filtros.
                  </p>
                  <Button asChild variant="link" size="sm" className="mt-2">
                    <Link href="/admin/grupos">Limpiar filtros</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <AdminPagination page={page} totalPages={totalPages} hrefFn={pageHref} />
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
      <BackToTop />
    </div>
  );
}
