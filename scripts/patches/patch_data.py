#!/usr/bin/env python3
"""Apply adult-mode data layer patches to src/lib/data.ts reliably."""
import re, sys

PATH = "/home/z/my-project/src/lib/data.ts"
src = open(PATH, encoding="utf-8").read()
orig = src
B = "\\"  # single backslash

def sub_once(pattern, repl, flags=0):
    global src
    new, n = re.subn(pattern, repl, src, count=1, flags=flags)
    if n != 1:
        print(f"FAIL: pattern did not match: {pattern[:80]}...")
        sys.exit(1)
    src = new

# 1) Add AdultFilter type after imports
sub_once(
    r'import type \{\n  CategoryDTO,\n  CountryDTO,\n  GroupDTO,\n  GroupStatus,\n  GroupsQuery,\n  StatsDTO,\n\} from "@/lib/types";',
    'import type {\n  CategoryDTO,\n  CountryDTO,\n  GroupDTO,\n  GroupStatus,\n  GroupsQuery,\n  StatsDTO,\n} from "@/lib/types";\n\n/** Adult content policy for list queries (see GroupsQuery.adult). */\ntype AdultFilter = "exclude" | "include" | "only";\n\nconst DEFAULT_ADULT: AdultFilter = "exclude";',
)

# 2) buildGroupWhere — replace isAdult param handling with adult tri-state
sub_once(
    r"  featured\?: boolean;\n  status\?: string;\n  isAdult\?: boolean;\n\}\): BuiltWhere \{",
    "  featured?: boolean;\n  status?: string;\n  adult?: AdultFilter;\n}): BuiltWhere {",
)
sub_once(
    r"  if \(q\.isAdult === false\) \{\n    clauses\.push\(\"g\.`isAdult` = 0\"\);\n  \}",
    "  // Adult policy — default: 100% clean (indexing pages / SSR).\n"
    "  switch (q.adult ?? DEFAULT_ADULT) {\n"
    "    case \"exclude\":\n"
    "      clauses.push(\"g.`isAdult` = 0\");\n"
    "      break;\n"
    "    case \"only\":\n"
    "      clauses.push(\"g.`isAdult` = 1\");\n"
    "      break;\n"
    "    case \"include\":\n"
    "    default:\n"
    "      break; // no filter — both clean and adult\n"
    "  }",
)

# 3) getCategories — add opts param + clean WHERE + clean groupCount
sub_once(
    r"export async function getCategories\(\): Promise<CategoryDTO\[\]> \{\n  const rows = await query<Row>\(\n    `SELECT c\.\*, \(SELECT COUNT\(\*\) FROM " + B + "`groups" + B + "` g WHERE g." + B + "`categoryId" + B + "` = c." + B + "`id" + B + "` AND g." + B + "`status" + B + "` = 'live'\) AS " + B + "`groupCount" + B + "`\n     FROM " + B + "`categories" + B + "` c\n     ORDER BY c." + B + "`sortOrder" + B + "` ASC`\n  \);",
    "export async function getCategories(\n"
    "  opts: { adult?: \"exclude\" | \"only\" } = {}\n"
    "): Promise<CategoryDTO[]> {\n"
    "  // Clean by default — adult categories never render on indexing pages.\n"
    "  const adultPolicy = opts.adult ?? \"exclude\";\n"
    "  const adultWhere = adultPolicy === \"only\" ? \"WHERE c.`isAdult` = 1\" : \"WHERE c.`isAdult` = 0\";\n"
    "  const adultCount = adultPolicy === \"only\" ? 1 : 0;\n"
    "  const rows = await query<Row>(\n"
    "    `SELECT c.*, (SELECT COUNT(*) FROM \\`groups\\` g WHERE g.\\`categoryId\\` = c.\\`id\\` AND g.\\`status\\` = 'live' AND g.\\`isAdult\\` = ${adultCount}) AS \\`groupCount\\`\n"
    "     FROM \\`categories\\` c\n"
    "     ${adultWhere}\n"
    "     ORDER BY c.\\`sortOrder\\` ASC`\n"
    "  );",
)

# 4) getCountries — clean groupCount + active filter
sub_once(
    r"export async function getCountries\(\): Promise<CountryDTO\[\]> \{\n  const rows = await query<Row>\(\n    `SELECT co\.\*, \(SELECT COUNT\(\*\) FROM " + B + "`groups" + B + "` g WHERE g." + B + "`countryId" + B + "` = co." + B + "`id" + B + "` AND g." + B + "`status" + B + "` = 'live'\) AS " + B + "`groupCount" + B + "`",
    "export async function getCountries(): Promise<CountryDTO[]> {\n"
    "  const rows = await query<Row>(\n"
    "    `SELECT co.*, (SELECT COUNT(*) FROM \\`groups\\` g WHERE g.\\`countryId\\` = co.\\`id\\` AND g.\\`status\\` = 'live' AND g.\\`isAdult\\` = 0) AS \\`groupCount\\`",
)
sub_once(
    r"     FROM " + B + "`countries" + B + "` co\n     ORDER BY co." + B + "`name" + B + "` ASC`\n  \);\n  return rows\.map\(\(c: any\) => \(\{\n    id: c\.id,\n    name: c\.name,\n    code: c\.code,",
    "     FROM \\`countries\\` co\n     WHERE co.\\`isActive\\` = 1\n     ORDER BY co.\\`name\\` ASC`\n  );\n  return rows.map((c: any) => ({\n    id: c.id,\n    name: c.name,\n    code: c.code,",
)

# 5) getStats — clean-only counts
stats_old = re.search(r"export async function getStats\(\): Promise<StatsDTO> \{.*?\n  \);", src, re.S)
if not stats_old:
    print("FAIL: getStats block not found")
    sys.exit(1)
src = src.replace(stats_old.group(0), """export async function getStats(): Promise<StatsDTO> {
  // Clean-only counts: global stats describe the clean, indexable directory.
  const row = await queryOne<Row>(
    `SELECT
       (SELECT COUNT(*) FROM \\`groups\\` WHERE \\`status\\` = 'live' AND \\`isAdult\\` = 0) AS \\`groups\\`,
       (SELECT COUNT(*) FROM \\`categories\\` WHERE \\`isAdult\\` = 0)                    AS \\`categories\\`,
       (SELECT COUNT(*) FROM \\`countries\\`)                     AS \\`countries\\`,
       (SELECT COALESCE(SUM(\\`clicks\\`), 0) FROM \\`groups\\` WHERE \\`status\\` = 'live' AND \\`isAdult\\` = 0) AS \\`members\\`,
       (SELECT COUNT(*) FROM \\`groups\\` WHERE \\`status\\` = 'live' AND \\`isAdult\\` = 0 AND \\`popularityBadge\\` = 'featured') AS \\`featured\\``
  );""", 1)

open(PATH, "w", encoding="utf-8").write(src)
print(f"OK — {len(orig)} -> {len(src)} bytes")
