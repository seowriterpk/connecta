# Task 2-c — fullstack-developer

## Task
Group detail page (/grupo/[slug]) + verify page (/verificar/[slug]): (1) always-on SEO-friendly analytics card, (2) split related-groups logic between the two pages (popular+old on group page, newest-in-category on verify page, max 2 indexed queries), (3) expired-link red badge + sidebar row while keeping join buttons functional.

## Files touched
- `src/components/site/group-activity.tsx` — zero-state support, always renders (server component, no client JS).
- `src/lib/related-groups.ts` — rewrote `getRelatedGroups` (max 2 queries, deterministic clicks DESC/createdAt ASC), added `getRecentRelatedGroups`.
- `src/app/grupo/[slug]/page.tsx` — new getRelatedGroups signature (category/country ids), activity zero fallback, revoked badge + info row (Link2Off).
- `src/app/verificar/[slug]/page.tsx` — switched to getRecentRelatedGroups(…, 9), breadcrumb fixed /${slug} → /grupo/${slug}, section retitled "Grupos nuevos de la misma categoría".

## Notes for other agents
- `LinkOff` does NOT exist in lucide-react 0.525 — used `Link2Off`.
- `members.ts` changed under me (2nd param now joinCount) — my toDTO aligned to `computeDisplayedMembers(g.clicks ?? 0, g.joinCount ?? 0, g.id)`.
- JoinButton/VerifyClient untouched: they already always route via /verificar/[slug] and enable the WhatsApp redirect after the 5s checks, even for revoked links — exactly what the user asked for.
- Live-verified (dev server, MariaDB restored by another agent): zero-state card, deterministic ordering, dedupe, silo, revoked badge (temporarily flipped a row then reverted), breadcrumb fix.
