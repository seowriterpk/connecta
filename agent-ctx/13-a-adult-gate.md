# Task 13-a — Adult-content server-side gating on city pages (cookie bridge)

**Task ID:** 13-a
**Agent:** fullstack-developer (Z.ai Code)
**Task:** Fix adult (18+) group cards leaking into general city pages (/ciudad/madrid rendered "Citas Madrid 18+" with the toggle OFF). Implement the server-side cookie bridge (gh_adult) + neutralize the 18+ toggle wording.

## Files touched (strict ownership)

1. `src/lib/adult-store.ts` — cookie bridge.
2. `src/lib/data.ts` — only `getGroupsByCityPaginated` + `getAllCities`.
3. `src/app/ciudad/[slug]/page.tsx` — server-side cookie read, honest counts, robots rule.
4. `src/components/site/adult-toggle.tsx` — wording only.

## Implementation

- **adult-store.ts**: exported `ADULT_COOKIE_NAME = "gh_adult"` + `syncAdultCookie(enabled)` (SSR-safe `typeof document` guard; `1; path=/; max-age=31536000; samesite=lax` when on, `max-age=0` when off). Cookie is set inside `enable()`, cleared in `disable()`, set in `confirmAge()` (confirmAge doesn't call enable() in this codebase, so it sets the cookie itself) and synced in `requestToggle()`. `onRehydrateStorage` mirrors the persisted `enabled=true` into the cookie so users who opted in before the bridge existed keep server-side mixed rendering. Header comments updated to the new architecture.
- **data.ts**: `getGroupsByCityPaginated(city, page, opts?: { adult?: "exclude" | "include" })` — optional param, default `"exclude"` → `AND g.isAdult = 0`; `"include"` → no adult clause (only legal with server-confirmed 18+). `getAllCities()` WHERE now ends `AND g.isAdult = 0` → homepage / /ciudades / country city sections / sibling-city links are clean-only, mixed cities show clean counts, adult-only cities can't appear.
- **ciudad/[slug]/page.tsx**: `getAdultAllowed = cache(async () => (await cookies()).get("gh_adult")?.value === "1")`; `getCityGroups = cache((city, page, adultAllowed) => getGroupsByCityPaginated(..., { adult: adultAllowed ? "include" : "exclude" }))` — React `cache()` so `generateMetadata` and the page body share ONE DB round-trip (page is `force-dynamic`, so `cookies()` is legal). Robots: noindex,follow if (thin: clean `city.groupCount < 3`) OR (adultAllowed && any adult group actually rendered — `result.groups.some(g => g.isAdult)`); clean city pages stay index,follow. Counts are honest per visitor: title, meta description (`buildTaxonomyMetaDescription`), header badge, "Mostrando X–Y de Z", SEO-copy count and CollectionPage JSON-LD description all use `result.total` (clean count by default, mixed count with the cookie; `numberOfItems` already = rendered groups). The "categories in this city" internal-linking section derives from the rendered groups → automatically clean (verified: 0 `/categoria/citas-18` links on clean /ciudad/madrid).
- **adult-toggle.tsx**: aria-label "Modo contenido 18+" → "Modo 18+"; OFF label "Contenido 18+" → "Grupos 18+"; dialog "Se mostrarán categorías solo para mayores de edad, separadas del resto del directorio."; footer note "Estas categorías no se muestran hasta que activas esta opción." Kept "18+", "Modo 18+ activo", "Modo 18+ desactivado". No visual change.

## Verification (curl only — no browser, no server restart of a running server)

- `/ciudad/madrid` (no cookie): `grep -c "Citas Madrid"` = **0**; `grep -c "citas-18"` = **0**; robots `index, follow`; title "5 Grupos…"; Mostrando 1–5 de 5; numberOfItems 5; badge 5.
- `/ciudad/madrid` with `-H 'Cookie: gh_adult=1'`: "Citas Madrid" = **1**; robots **`noindex, follow`**; title/meta-desc/JSON-LD/badge/Mostrando all consistently **6**.
- `/ciudad/panama`: clean → only "Marketing digital Panamá" (After hours = 0), title "1 Grupos…", badge "1 grupo disponible", Mostrando 1–1 de 1 grupo, noindex (thin, as before). With cookie → both groups render ("After hours" ×2), title/badge **2**, noindex.
- `/ciudad/cordoba` with cookie (city has NO adult groups): stays `index, follow` — the noindex only triggers when adult content is actually rendered.
- `/` homepage: city list exactly matches the clean-only SQL (28 cities); "Panamá" groupCount **1**; no adult-only city possible (DB check: every city with adult groups also has ≥1 clean group). Toggle renders "Grupos 18+" ×2, no "Contenido 18+"/"Modo contenido 18+".
- `/ciudades`, `/pais/es`, `/categoria/deportes`, `/categoria/citas-18`, `/populares` → all 200.
- `npx tsc --noEmit` → 0 errors; `bun run lint` → clean.
- No other callers of the non-paginated `getGroupsByCity` exist (grep across src/scripts/mini-services) → no ungated city listings left.

## Ops note

Mid-verification the dev server DIED (connection refused, zero next/bun processes — crash during a Fast-Refresh full reload triggered by a parallel agent's transient syntax error in groups-directory-table.tsx, which they then fixed). Restarted via the established `./start-dev.sh` (PID 4616, .next cache preserved) — same procedure previous orchestrators used; dev.log healthy afterwards (all 200s). I did NOT restart a running server; it was already dead.

## Risks / notes for next agents

- Cookie is `samesite=lax`, 1 year, no `secure` flag (site is http in sandbox; consider `secure` + `secure prefix` in production behind HTTPS).
- Crawlers never send `gh_adult` → always see the clean, indexable city pages (per-visitor noindex only affects opted-in humans).
- Mixed city HTML (cookie on) keeps its CollectionPage JSON-LD with honest mixed counts but is noindex,follow — if the policy later requires zero structured data on any page containing adult groups, drop the CollectionPage block when `adultRendered` (one-line change in ciudad page).
- `getAllCities()` is now clean-only by design; if a future adult-only city is added, its /ciudad page 404s for everyone (getCityBySlug uses the clean list) — acceptable per directive, but worth knowing.
