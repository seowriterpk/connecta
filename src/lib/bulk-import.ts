/**
 * Bulk Import Library
 * -----------------------------------------------------------------------------
 * CSV parser + group validator + bulk insert helper for the admin bulk-upload
 * feature. Used by both the client (parsing/validation preview) and the API
 * route (final insertion with DB-side dedup).
 *
 * All functions are pure & side-effect-free (except importGroups, which writes
 * to the DB). Safe to call from server-side code.
 */

import { query, exec, tx, newId, type Row } from "@/lib/db";
import { generateSlug, makeUniqueSlug } from "@/lib/slug";
import { extractInviteCode, isValidWhatsAppInvite } from "@/lib/whatsapp-validator";
import {
  downloadGroupImage,
  isWhatsappCdnUrl,
} from "@/lib/image-downloader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Raw row as produced by the CSV parser or JSON builder. */
export interface RawGroupRow {
  group_name?: string;
  join_link?: string;
  description?: string;
  category?: string;
  country?: string;
  city?: string;
  tags?: string;
  keywords?: string;
  profile_image?: string;
  is_adult?: string | number | boolean;
  /** Row index (1-based, matching spreadsheet rows). Set by the caller. */
  _rowIndex?: number;
}

/** Validation result for a single row. */
export interface ValidatedGroupRow {
  rowIndex: number;
  ok: boolean;
  errors: string[];
  /** Normalized data, ready for insertion (only when ok=true). */
  data?: NormalizedGroup;
  /** Echoes the raw input for the preview table. */
  raw: RawGroupRow;
}

/** Normalized form of a row, ready to insert into the DB. */
export interface NormalizedGroup {
  groupName: string;
  slug: string;
  joinLink: string;
  inviteCode: string;
  description: string;
  category: string;
  country: string;
  city: string | null;
  tags: string[];
  keywords: string[];
  profileImage: string | null;
  isAdult: boolean;
}

/** Result of importGroups(). */
export interface ImportResult {
  imported: number;
  skipped: number;
  /** WhatsApp CDN images persisted to /media/group_images during import. */
  imagesLocalized: number;
  /** CDN images NOT localized because the soft deadline hit — the
   *  image-refresh cron localizes them later (they keep the CDN URL). */
  imagesDeferred: number;
  errors: { rowIndex: number; rowName: string; reason: string }[];
}

export type ImportTarget = "queue" | "pending";

// ---------------------------------------------------------------------------
// CSV Parser
// ---------------------------------------------------------------------------

/**
 * Parse CSV text into an array of objects keyed by the header row.
 *
 * Handles:
 *  - Quoted fields (with embedded commas, newlines, escaped "" quotes)
 *  - CRLF and LF line endings
 *  - BOM at the start of the file
 *  - Empty trailing lines
 *
 * Returns { headers, rows } where rows is an array of string-keyed objects.
 * Missing cells are filled with empty strings; extra cells are dropped.
 */
export function parseCSV(
  text: string
): { headers: string[]; rows: Record<string, string>[] } {
  const cleaned = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  if (!cleaned.trim()) return { headers: [], rows: [] };

  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];

    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote "" → literal "
        if (cleaned[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    // Not in quotes
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += ch;
  }

  // Flush the last field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully empty trailing rows (e.g. final blank line)
  const filtered = rows.filter((r) => r.some((c) => c.trim() !== ""));

  if (filtered.length === 0) return { headers: [], rows: [] };

  const headers = filtered[0].map((h) => h.trim());
  const out: Record<string, string>[] = [];

  for (let i = 1; i < filtered.length; i++) {
    const r = filtered[i];
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = (r[c] ?? "").trim();
    }
    out.push(obj);
  }

  return { headers, rows: out };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Split a comma- or semicolon-separated string into a clean string array.
 * Trims, lowercases for tags, drops empty / duplicates.
 */
function splitList(input: string, lowercase = true): string[] {
  if (!input) return [];
  const parts = input
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const v = lowercase ? p.toLowerCase() : p;
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

/** Strip tags stopwords per Groupizo manual. */
const TAG_STOPWORDS = new Set([
  "whatsapp",
  "grupo",
  "enlace",
  "gratis",
  "activo",
  "nuevo",
  "ultimo",
  "último",
  "online",
  "chat",
  "unirse",
]);

function cleanTags(tags: string[]): string[] {
  return tags.filter((t) => !TAG_STOPWORDS.has(t.toLowerCase()));
}

function parseBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v !== "string") return false;
  const s = v.trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "si" || s === "sí";
}

/**
 * Normalize a single raw row into the shape we insert into the DB.
 * Throws an Error with a Spanish message if validation fails.
 */
export function normalizeRow(raw: RawGroupRow): NormalizedGroup {
  const groupName = String(raw.group_name || "").trim();
  if (!groupName) throw new Error("Falta el nombre del grupo (group_name).");
  if (groupName.length < 3)
    throw new Error("El nombre del grupo debe tener al menos 3 caracteres.");
  if (groupName.length > 120)
    throw new Error("El nombre del grupo no puede exceder 120 caracteres.");

  const joinLink = String(raw.join_link || "").trim();
  if (!joinLink) throw new Error("Falta el enlace de WhatsApp (join_link).");
  if (!isValidWhatsAppInvite(joinLink))
    throw new Error("El enlace no es válido (debe ser chat.whatsapp.com/...).");

  const inviteCode = extractInviteCode(joinLink) || "";

  const description = String(raw.description || "").trim();
  if (!description)
    throw new Error("Falta la descripción (description).");
  if (description.length < 20)
    throw new Error("La descripción debe tener al menos 20 caracteres.");
  if (description.length > 8000)
    throw new Error(
      "La descripción no puede exceder 8000 caracteres (≈1000 palabras)."
    );

  const categoryName = String(raw.category || "").trim();
  if (!categoryName) throw new Error("Falta la categoría (category).");

  const countryName = String(raw.country || "").trim();
  if (!countryName) throw new Error("Falta el país (country).");

  const city = String(raw.city || "").trim() || null;

  let tags = cleanTags(splitList(String(raw.tags || ""), true));
  let keywords = splitList(String(raw.keywords || ""), true);

  if (tags.length > 10) tags = tags.slice(0, 10);
  if (keywords.length > 10) keywords = keywords.slice(0, 10);

  let profileImage: string | null = null;
  const imgRaw = String(raw.profile_image || "").trim();
  if (imgRaw) {
    if (!/^https?:\/\//i.test(imgRaw))
      throw new Error("La URL de la imagen debe comenzar con http(s)://");
    profileImage = imgRaw;
  }

  const isAdult = parseBool(raw.is_adult);

  // Slug — generated from name. Uniqueness is checked at insert time.
  const slug = generateSlug(groupName);

  return {
    groupName,
    slug,
    joinLink,
    inviteCode,
    description,
    category: categoryName,
    country: countryName,
    city,
    tags,
    keywords,
    profileImage,
    isAdult,
  };
}

// ---------------------------------------------------------------------------
// Validation (against DB)
// ---------------------------------------------------------------------------

/** Max rows accepted per import request (matches the admin API route cap). */
const MAX_IMPORT_ROWS = 3000;
/** Soft deadline for the proxied image pass inside an import. */
const IMAGE_PASS_BUDGET_MS = 200_000;
/** Image download workers inside an import (saturates the proxy nicely). */
const IMAGE_PASS_CONCURRENCY = 6;
/** Rows per insert transaction — cuts per-statement fsyncs ~100×. */
const INSERT_TX_CHUNK = 100;
/** Chunk size for dedup candidate lookups (IN (...)). */
const DEDUP_CHUNK = 500;

/** All live-table slugs (one narrow indexed column — the full set is needed
 *  for makeUniqueSlug's -1, -2 … suffix resolution without per-row queries). */
async function fetchAllSlugs(): Promise<Set<string>> {
  const rows = await query<Row & { slug: string }>("SELECT `slug` FROM `groups`");
  return new Set(rows.map((r) => r.slug));
}

/** Existing join links for a candidate batch — chunked IN() lookups against
 *  the idx_groups_joinLink prefix index (no full-column pull at 3k+ scale). */
async function fetchExistingLinks(links: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  const candidates = Array.from(
    new Set(links.map((l) => l.trim()).filter(Boolean))
  );
  for (let i = 0; i < candidates.length; i += DEDUP_CHUNK) {
    const chunk = candidates.slice(i, i + DEDUP_CHUNK);
    const rows = await query<Row & { joinLink: string }>(
      `SELECT \`joinLink\` FROM \`groups\` WHERE \`joinLink\` IN (${chunk
        .map(() => "?")
        .join(", ")})`,
      chunk
    );
    for (const r of rows) out.add(r.joinLink);
  }
  return out;
}

/**
 * Validate a list of raw rows. Each row is checked for:
 *  - Required fields + URL format (via normalizeRow)
 *  - Category exists in category_bank
 *  - Country exists in country_bank
 *  - Slug uniqueness within the batch
 *  - Slug uniqueness against existing DB rows
 *  - Duplicate join_link against existing DB rows
 *
 * Returns the same list with ok/error info attached.
 *
 * NOTE: this does 2 findMany calls (categories + countries) + 1 findMany for
 * existing slugs/links. Caller should reuse the result for the preview UI.
 */
export async function validateGroupRows(
  rows: RawGroupRow[]
): Promise<ValidatedGroupRow[]> {
  // Load category + country banks up-front for cheap lookup.
  // A single groups query returns both slug + joinLink for dedup checks.
  const [categories, countries, existingSlugSet, existingLinkSet] = await Promise.all([
    query<Row & { name: string; isAdult: number; isActive: number }>(
      "SELECT `name`, `isAdult`, `isActive` FROM `categories`"
    ),
    query<Row & { name: string; nameEs: string | null }>(
      "SELECT `name`, `nameEs` FROM `countries`"
    ),
    // 3k+ scale: the old path pulled slug+joinLink for EVERY group row on
    // every validation pass. Slugs are one narrow indexed column; join
    // links are looked up per candidate with chunked IN() queries.
    fetchAllSlugs(),
    fetchExistingLinks(
      rows.map((r) => String(r.join_link || "").trim()).filter(Boolean)
    ),
  ]);

  const catNames = new Set(categories.map((c) => c.name.toLowerCase()));
  const catActiveByName = new Map(
    categories.map((c) =>
      [c.name.toLowerCase(), { isAdult: !!c.isAdult, isActive: !!c.isActive }] as const
    )
  );
  const countryNames = new Set(
    countries.flatMap((c) => [c.name.toLowerCase(), (c.nameEs || "").toLowerCase()].filter(Boolean))
  );

  // Intra-batch slug/links dedup tracking
  const batchSlugSeen = new Map<string, number>(); // slug → first rowIndex
  const batchLinkSeen = new Map<string, number>();

  return rows.map((raw) => {
    const rowIndex = Number(raw._rowIndex ?? 0);
    const errors: string[] = [];
    let normalized: NormalizedGroup | undefined;

    try {
      normalized = normalizeRow(raw);
    } catch (e: any) {
      errors.push(e?.message || "Fila inválida.");
      return { rowIndex, ok: false, errors, raw };
    }

    // Category check
    const catKey = normalized.category.toLowerCase();
    if (!catNames.has(catKey)) {
      errors.push(`La categoría «${normalized.category}» no existe en el banco.`);
    } else {
      const cat = catActiveByName.get(catKey);
      if (cat && !cat.isActive) {
        errors.push(`La categoría «${normalized.category}» está inactiva.`);
      }
      // Sync isAdult with category isAdult (manual override allowed)
      if (cat && cat.isAdult && !normalized.isAdult) {
        normalized.isAdult = true;
      }
    }

    // Country check
    if (!countryNames.has(normalized.country.toLowerCase())) {
      errors.push(`El país «${normalized.country}» no existe en el banco.`);
    }

    // Slug uniqueness — first against DB, then against batch
    if (existingSlugSet.has(normalized.slug)) {
      errors.push(`El slug «${normalized.slug}» ya existe en la BD.`);
    } else if (batchSlugSeen.has(normalized.slug)) {
      errors.push(
        `Slug duplicado dentro del lote (fila ${batchSlugSeen.get(normalized.slug)}).`
      );
    } else {
      batchSlugSeen.set(normalized.slug, rowIndex);
    }

    // Join link dedup — DB + batch
    if (existingLinkSet.has(normalized.joinLink)) {
      errors.push("Ya existe un grupo con este enlace (join_link duplicado).");
    } else if (batchLinkSeen.has(normalized.joinLink)) {
      errors.push(
        `Enlace duplicado dentro del lote (fila ${batchLinkSeen.get(normalized.joinLink)}).`
      );
    } else {
      batchLinkSeen.set(normalized.joinLink, rowIndex);
    }

    return {
      rowIndex,
      ok: errors.length === 0,
      errors,
      data: normalized,
      raw,
    };
  });
}

/**
 * Convenience: validate a single row without DB checks (just shape + URL).
 * Useful for the live JSON preview before the user clicks Importar.
 */
export function validateGroupRowSync(raw: RawGroupRow): {
  ok: boolean;
  error?: string;
  data?: NormalizedGroup;
} {
  try {
    const data = normalizeRow(raw);
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Fila inválida." };
  }
}

// ---------------------------------------------------------------------------
// Bulk Insert
// ---------------------------------------------------------------------------

/**
 * Insert a list of validated groups into the DB.
 *
 * If target === "queue", rows go into groups_queue (for drip-feed cron).
 * If target === "pending", rows go directly into groups with status="pending".
 *
 * Performs a final DB-side dedup (defensive — also checked during validation)
 * by looking up join_link before each insert. Failed inserts are collected
 * into `errors` and the function continues to the next row.
 *
 * Returns a summary { imported, skipped, errors }.
 */
export async function importGroups(
  rows: NormalizedGroup[],
  options: { target: ImportTarget }
): Promise<ImportResult> {
  const result: ImportResult = {
    imported: 0,
    skipped: 0,
    imagesLocalized: 0,
    imagesDeferred: 0,
    errors: [],
  };

  if (rows.length === 0) return result;
  if (rows.length > MAX_IMPORT_ROWS) {
    // Defensive cap — 3.000 rows per request is already a large paste/JSON.
    return {
      imported: 0,
      skipped: rows.length,
      imagesLocalized: 0,
      imagesDeferred: 0,
      errors: [
        {
          rowIndex: 0,
          rowName: "",
          reason: `Demasiadas filas (máximo ${MAX_IMPORT_ROWS} por lote). Divide el archivo en lotes más pequeños.`,
        },
      ],
    };
  }

  // --- DB-side dedup lookup BEFORE the image pass (DOWNLOAD-ONCE policy) ---
  // Rows whose invite link already exists in the DB are skipped at insert
  // time (below) — fetching their images first would waste residential-proxy
  // bandwidth on groups we already have (and whose image we already store).
  // One chunked lookup, reused later by the insert path.
  const existingLinks = await fetchExistingLinks(rows.map((r) => r.joinLink));

  // --- Persist WhatsApp images on OUR server (user directive) ---
  // Every NEW row whose profile_image points at the WhatsApp CDN is
  // downloaded to media/group_images through the residential proxy BEFORE
  // inserting, so the DB stores a local /media/group_images URL. Failures
  // silently fall back to the CDN URL — an image problem must never block
  // an import. Concurrency 6 keeps the proxy busy without hammering it; the
  // soft deadline guarantees the HTTP request finishes — leftover rows keep
  // the CDN URL and the image-refresh cron localizes them later (it processes
  // every live group whose profileImage is not a /media/... URL yet).
  const rowsWithCdn = rows.filter(
    (r) => isWhatsappCdnUrl(r.profileImage) && !existingLinks.has(r.joinLink)
  );
  if (rowsWithCdn.length > 0) {
    let cursor = 0;
    let processed = 0;
    const startedAt = Date.now();
    const worker = async () => {
      while (cursor < rowsWithCdn.length) {
        if (Date.now() - startedAt > IMAGE_PASS_BUDGET_MS) return;
        const row = rowsWithCdn[cursor++];
        processed++;
        const dl = await downloadGroupImage(row.profileImage as string, row.groupName);
        if (dl.localUrl) {
          row.profileImage = dl.localUrl;
          result.imagesLocalized++;
        }
      }
    };
    await Promise.all(
      Array.from({ length: IMAGE_PASS_CONCURRENCY }, () => worker())
    );
    result.imagesDeferred = Math.max(0, rowsWithCdn.length - processed);
  }

  // Look up all category + country IDs up-front
  const [cats, countries] = await Promise.all([
    query<Row & { id: string; name: string }>(
      "SELECT `id`, `name` FROM `categories`"
    ),
    query<Row & { id: string; name: string }>(
      "SELECT `id`, `name` FROM `countries`"
    ),
  ]);
  const catIdByName = new Map(cats.map((c) => [c.name.toLowerCase(), c.id]));
  const countryIdByName = new Map(countries.map((c) => [c.name.toLowerCase(), c.id]));

  // Final DB-side dedup (defensive — also checked during validation):
  // existingLinks was prefetched BEFORE the image pass (see above).
  const existingSlugs = await fetchAllSlugs();

  // Track slugs we've already used in this run
  const usedSlugs = new Set<string>();

  interface PreparedRow {
    rowIndex: number;
    g: NormalizedGroup;
    categoryId: string;
    countryId: string;
    slug: string;
    tagsJson: string;
    keywordsJson: string;
  }

  const prepared: PreparedRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const g = rows[i];
    const rowIndex = i + 1;

    const categoryId = catIdByName.get(g.category.toLowerCase());
    if (!categoryId) {
      result.skipped++;
      result.errors.push({
        rowIndex,
        rowName: g.groupName,
        reason: `Categoría «${g.category}» no encontrada.`,
      });
      continue;
    }

    const countryId = countryIdByName.get(g.country.toLowerCase());
    if (!countryId) {
      result.skipped++;
      result.errors.push({
        rowIndex,
        rowName: g.groupName,
        reason: `País «${g.country}» no encontrado.`,
      });
      continue;
    }

    if (existingLinks.has(g.joinLink)) {
      result.skipped++;
      result.errors.push({
        rowIndex,
        rowName: g.groupName,
        reason: "Enlace ya existe en la BD (join_link duplicado).",
      });
      continue;
    }

    // Make slug unique within this run AND against the live table (the full
    // slug set was prefetched in ONE query — no per-row lookups).
    const finalSlug = makeUniqueSlug(
      g.slug,
      (s) => usedSlugs.has(s) || existingSlugs.has(s)
    );
    usedSlugs.add(finalSlug);

    prepared.push({
      rowIndex,
      g,
      categoryId,
      countryId,
      slug: finalSlug,
      tagsJson: JSON.stringify(g.tags),
      keywordsJson: JSON.stringify(g.keywords),
    });
  }

  const QUEUE_SQL =
    "INSERT INTO `groups_queue` (`groupName`, `joinLink`, `description`, `category`, `country`, `city`, `keywords`, `tags`, `profileImage`, `isAdult`, `language`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const GROUPS_SQL =
    "INSERT INTO `groups` (`id`, `groupName`, `slug`, `joinLink`, `description`, `category`, `categoryId`, `country`, `countryId`, `city`, `keywords`, `tags`, `profileImage`, `language`, `status`, `linkStatus`, `isAdult`, `submitSource`, `lastValidatedAt`, `imageRefreshedAt`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

  const sql = options.target === "queue" ? QUEUE_SQL : GROUPS_SQL;
  const paramsFor = (p: PreparedRow): unknown[] =>
    options.target === "queue"
      ? [
          p.g.groupName,
          p.g.joinLink,
          p.g.description,
          p.g.category,
          p.g.country,
          p.g.city,
          p.keywordsJson,
          p.tagsJson,
          p.g.profileImage,
          p.g.isAdult,
          "Espanol",
        ]
      : [
          newId(),
          p.g.groupName,
          p.slug,
          p.g.joinLink,
          p.g.description,
          p.g.category,
          p.categoryId,
          p.g.country,
          p.countryId,
          p.g.city,
          p.keywordsJson,
          p.tagsJson,
          p.g.profileImage,
          "Espanol",
          "pending",
          "active",
          p.g.isAdult,
          "staff",
          new Date(),
          p.g.profileImage ? new Date() : null,
        ];

  // Chunked inserts: one transaction per INSERT_TX_CHUNK rows keeps the
  // undo log small while cutting per-statement fsyncs ~100×. On chunk
  // failure (one bad row / transient error) we retry its rows individually
  // so the good ones import and the bad ones get an exact error report.
  for (let i = 0; i < prepared.length; i += INSERT_TX_CHUNK) {
    const chunk = prepared.slice(i, i + INSERT_TX_CHUNK);
    try {
      await tx(async (conn) => {
        for (const p of chunk) {
          await conn.query(sql, paramsFor(p));
        }
      });
      result.imported += chunk.length;
    } catch {
      for (const p of chunk) {
        try {
          await exec(sql, paramsFor(p));
          result.imported++;
        } catch (err: any) {
          result.skipped++;
          result.errors.push({
            rowIndex: p.rowIndex,
            rowName: p.g.groupName,
            reason: err?.message || "Error al insertar la fila.",
          });
          // Log to server console for diagnostics
          console.error("[bulk-import] insert failed:", err);
        }
      }
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// CSV Template
// ---------------------------------------------------------------------------

/**
 * Returns a CSV template string with header + 2 example rows that the admin
 * can download and fill in. Used by the "Descargar plantilla CSV" button.
 */
export function csvTemplate(): string {
  const headers = [
    "group_name",
    "join_link",
    "description",
    "category",
    "country",
    "city",
    "tags",
    "keywords",
    "profile_image",
    "is_adult",
  ];
  const example1 = [
    "Cocina Mexicana Tradicional",
    "https://chat.whatsapp.com/AbCdEfGhIjKlMnOp",
    "Comunidad para compartir recetas tradicionales mexicanas, tips de cocina y lugares para comprar ingredientes.",
    "Gastronomía",
    "México",
    "Ciudad de México",
    "recetas,cocina,mexicana,comida",
    "cocina mexicana,recetas tradicionales,antojitos",
    "",
    "0",
  ];
  const example2 = [
    "Programadores Latam",
    "https://chat.whatsapp.com/ZyXwVuTsRqPoNmLk",
    "Grupo de desarrolladores de Latinoamérica para compartir oportunidades laborales, recursos y proyectos open source.",
    "Tecnología",
    "Argentina",
    "Buenos Aires",
    "programacion,desarrollo,latam,javascript",
    "desarrollo web,programadores latam,open source",
    "",
    "0",
  ];

  const esc = (v: string) =>
    v.includes(",") || v.includes('"') || v.includes("\n")
      ? `"${v.replace(/"/g, '""')}"`
      : v;

  return [headers, example1, example2]
    .map((r) => r.map(esc).join(","))
    .join("\n");
}
