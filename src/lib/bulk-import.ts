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

import { query, queryOne, exec, newId, type Row } from "@/lib/db";
import { generateSlug, makeUniqueSlug } from "@/lib/slug";
import { extractInviteCode, isValidWhatsAppInvite } from "@/lib/whatsapp-validator";

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
  if (description.length > 2000)
    throw new Error("La descripción no puede exceder 2000 caracteres.");

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
  const [categories, countries, existingGroups] = await Promise.all([
    query<Row & { name: string; isAdult: number; isActive: number }>(
      "SELECT `name`, `isAdult`, `isActive` FROM `categories`"
    ),
    query<Row & { name: string; nameEs: string | null }>(
      "SELECT `name`, `nameEs` FROM `countries`"
    ),
    query<Row & { slug: string; joinLink: string }>(
      "SELECT `slug`, `joinLink` FROM `groups`"
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

  const existingSlugSet = new Set(existingGroups.map((s) => s.slug));
  const existingLinkSet = new Set(existingGroups.map((s) => s.joinLink));

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
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

  if (rows.length === 0) return result;
  if (rows.length > 500) {
    // Defensive cap
    return {
      imported: 0,
      skipped: rows.length,
      errors: [
        {
          rowIndex: 0,
          rowName: "",
          reason: "Demasiadas filas (máximo 500 por lote).",
        },
      ],
    };
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

  // Final DB-side dedup: check which join_links already exist
  const linksToCheck = rows.map((r) => r.joinLink);
  const linkPlaceholders = linksToCheck.map(() => "?").join(", ");
  const existing = await query<Row & { joinLink: string }>(
    `SELECT \`joinLink\` FROM \`groups\` WHERE \`joinLink\` IN (${linkPlaceholders})`,
    linksToCheck
  );
  const existingLinks = new Set(existing.map((e) => e.joinLink));

  // Track slugs we've already used in this run
  const usedSlugs = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const g = rows[i];
    const rowIndex = i + 1;

    try {
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

      // Make slug unique within this run + against DB
      const finalSlug = makeUniqueSlug(g.slug, (s) =>
        usedSlugs.has(s) ? true : false
      );
      usedSlugs.add(finalSlug);

      const tagsJson = JSON.stringify(g.tags);
      const keywordsJson = JSON.stringify(g.keywords);

      if (options.target === "queue") {
        await exec(
          `INSERT INTO \`groups_queue\`
            (\`groupName\`, \`joinLink\`, \`description\`, \`category\`, \`country\`, \`city\`,
             \`keywords\`, \`tags\`, \`profileImage\`, \`isAdult\`, \`language\`)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            g.groupName,
            g.joinLink,
            g.description,
            g.category,
            g.country,
            g.city,
            keywordsJson,
            tagsJson,
            g.profileImage,
            g.isAdult,
            "Espanol",
          ]
        );
      } else {
        // target === "pending" → insert into groups table with status=pending
        // Ensure the slug is unique across the live table.
        const liveSlug = await ensureUniqueDbSlug(finalSlug);
        usedSlugs.add(liveSlug);

        await exec(
          `INSERT INTO \`groups\`
            (\`id\`, \`groupName\`, \`slug\`, \`joinLink\`, \`description\`, \`category\`, \`categoryId\`,
             \`country\`, \`countryId\`, \`city\`, \`keywords\`, \`tags\`, \`profileImage\`, \`language\`,
             \`status\`, \`linkStatus\`, \`isAdult\`, \`submitSource\`, \`lastValidatedAt\`, \`imageRefreshedAt\`)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId(),
            g.groupName,
            liveSlug,
            g.joinLink,
            g.description,
            g.category,
            categoryId,
            g.country,
            countryId,
            g.city,
            keywordsJson,
            tagsJson,
            g.profileImage,
            "Espanol",
            "pending",
            "active",
            g.isAdult,
            "staff",
            new Date(),
            g.profileImage ? new Date() : null,
          ]
        );
      }

      result.imported++;
    } catch (err: any) {
      result.skipped++;
      result.errors.push({
        rowIndex,
        rowName: g.groupName,
        reason: err?.message || "Error al insertar la fila.",
      });
      // Log to server console for diagnostics
      console.error("[bulk-import] insert failed:", err);
    }
  }

  return result;
}

/**
 * Ensure a slug is unique against the live groups table.
 * If taken, appends -2, -3, … or a short timestamp fallback.
 */
async function ensureUniqueDbSlug(baseSlug: string): Promise<string> {
  const exists = await queryOne<Row & { id: string }>(
    "SELECT `id` FROM `groups` WHERE `slug` = ?",
    [baseSlug]
  );
  if (!exists) return baseSlug;

  for (let i = 2; i <= 50; i++) {
    const candidate = `${baseSlug}-${i}`;
    const taken = await queryOne<Row & { id: string }>(
      "SELECT `id` FROM `groups` WHERE `slug` = ?",
      [candidate]
    );
    if (!taken) return candidate;
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
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
