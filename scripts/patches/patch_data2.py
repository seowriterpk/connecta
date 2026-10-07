#!/usr/bin/env python3
"""Remaining adult-mode patches: getCategories, getCountries, getStats."""
import re, sys

PATH = "/home/z/my-project/src/lib/data.ts"
src = open(PATH, encoding="utf-8").read()
orig = src

def replace_span(start_pat, end_pat, new_text, label):
    """Replace from start_pat to end_pat (inclusive) with new_text."""
    global src
    m = re.search(start_pat, src)
    if not m:
        print(f"FAIL start ({label})"); sys.exit(1)
    m2 = re.search(end_pat, src[m.end():])
    if not m2:
        print(f"FAIL end ({label})"); sys.exit(1)
    a, b = m.start(), m.end() + m2.end()
    src = src[:a] + new_text + src[b:]
    print(f"OK {label}")

# --- getCategories ---
replace_span(
    r"export async function getCategories\(\): Promise<CategoryDTO\[\]> \{",
    r"return rows\.map\(\(c: any\) => \(\{",
    """export async function getCategories(
  opts: { adult?: "exclude" | "only" } = {}
): Promise<CategoryDTO[]> {
  // Clean by default — adult categories never render on indexing pages.
  const only = (opts.adult ?? "exclude") === "only";
  const rows = await query<Row>(
    `SELECT c.*, (SELECT COUNT(*) FROM \\`groups\\` g WHERE g.\\`categoryId\\` = c.\\`id\\` AND g.\\`status\\` = 'live' AND g.\\`isAdult\\` = ${only ? 1 : 0}) AS \\`groupCount\\`
     FROM \\`categories\\` c
     ${only ? "WHERE c.`isAdult` = 1" : "WHERE c.`isAdult` = 0"}
     ORDER BY c.\\`sortOrder\\` ASC`
  );
  return rows.map((c: any) => (""",
    "getCategories",
)

# --- getCountries (clean groupCount + isActive) ---
replace_span(
    r"export async function getCountries\(\): Promise<CountryDTO\[\]> \{",
    r"return rows\.map\(\(c: any\) => \(\{",
    """export async function getCountries(): Promise<CountryDTO[]> {
  const rows = await query<Row>(
    `SELECT co.*, (SELECT COUNT(*) FROM \\`groups\\` g WHERE g.\\`countryId\\` = co.\\`id\\` AND g.\\`status\\` = 'live' AND g.\\`isAdult\\` = 0) AS \\`groupCount\\`
     FROM \\`countries\\` co
     WHERE co.\\`isActive\\` = 1
     ORDER BY co.\\`name\\` ASC`
  );
  return rows.map((c: any) => (""",
    "getCountries",
)

# --- getStats (clean-only counts) ---
replace_span(
    r"export async function getStats\(\): Promise<StatsDTO> \{",
    r"const r: any = row \?\? \{\};",
    """export async function getStats(): Promise<StatsDTO> {
  // Clean-only counts: global stats describe the clean, indexable directory.
  const row = await queryOne<Row>(
    `SELECT
       (SELECT COUNT(*) FROM \\`groups\\` WHERE \\`status\\` = 'live' AND \\`isAdult\\` = 0) AS \\`groups\\`,
       (SELECT COUNT(*) FROM \\`categories\\` WHERE \\`isAdult\\` = 0)                    AS \\`categories\\`,
       (SELECT COUNT(*) FROM \\`countries\\`)                     AS \\`countries\\`,
       (SELECT COALESCE(SUM(\\`clicks\\`), 0) FROM \\`groups\\` WHERE \\`status\\` = 'live' AND \\`isAdult\\` = 0) AS \\`members\\`,
       (SELECT COUNT(*) FROM \\`groups\\` WHERE \\`status\\` = 'live' AND \\`isAdult\\` = 0 AND \\`popularityBadge\\` = 'featured') AS \\`featured\\``
  );
  const r: any = row ?? {};""",
    "getStats",
)

open(PATH, "w", encoding="utf-8").write(src)
print(f"OK — {len(orig)} -> {len(src)} bytes")
