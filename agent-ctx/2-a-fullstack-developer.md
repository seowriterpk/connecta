# Task 2-a — fullstack-developer

Task: Remove SubmitDialog popup — link all add-group triggers to /agregar-grupo; remove "Enviar grupo" header nav item while keeping the corner CTA.

Work Log:
- Read worklog context; located SubmitDialog component and all 15 usages across 8 files (cta-banner + 7 route pages).
- src/components/site/cta-banner.tsx: replaced the SubmitDialog trigger with a plain `<Link href="/agregar-grupo">` keeping the exact button classes/label/icons ("Enviar mi grupo ahora", Plus icon); dropped now-unused categories/countries props, React import and "use client" (component is server-safe now).
- src/app/page.tsx: updated the single CtaBanner call site to `<CtaBanner />` (categories/countries still used by Hero/CategoriesSection/CountriesSection in the same file — untouched).
- src/app/pais/[code]/page.tsx (3 usages), ciudad/[slug]/page.tsx (3), etiqueta/[slug]/page.tsx (3), categoria/[slug]/page.tsx (3), autor/[slug]/page.tsx (1), autores/page.tsx (1), buscar/page.tsx (2): every `<SubmitDialog …>` replaced with `<Link href="/agregar-grupo" className="…same classes…">` preserving Plus/Send icons and Spanish labels ("Enviar un grupo" / "Enviar mi grupo" / "Enviar mi grupo ahora").
- Removed now-dead plumbing: getCategories/getCountries imports and Promise.all fetches dropped in pais, ciudad, etiqueta (relatedTags kept), autor (categoriesCovered kept), autores, categoria, and buscar's results view (BuscarLanding keeps its fetch — still used for category/country counts).
- DELETED src/components/site/submit-dialog.tsx after grep confirmed zero remaining imports anywhere in src/.
- src/lib/constants.ts: removed `{ href: "/agregar-grupo", label: "Enviar grupo" }` from NAV_LINKS → item disappears from desktop nav AND mobile sheet menu (both map over NAV_LINKS; header.tsx menu logic untouched). Mobile sheet bottom full-width "Enviar un grupo" CTA kept.
- src/components/site/header.tsx: CSS-only tweak to the desktop corner CTA — className `hidden rounded-full px-4 shadow-sm shadow-primary/25 sm:inline-flex` (was `hidden sm:inline-flex`) so it reads as the primary corner button. No logic touched.
- Verification: `rg "SubmitDialog|submit-dialog"` over src/ → 0 matches; no dangling categories/countries refs in edited files; TypeScript parse check (ts.createSourceFile) passed on all 11 changed files. Dev server not reachable during this task (orchestrator manages lifecycle; a full `tsc --noEmit` run was in progress) — live HTTP smoke test deferred to orchestrator.

Stage Summary:
- All 9 files' add-group triggers now navigate directly to the dedicated /agregar-grupo page instead of opening the link-paste dialog; the dialog component is fully removed.
- Header menu no longer shows a redundant "Enviar grupo" entry; the prominent corner button (desktop, now pill-shaped with subtle shadow) and the mobile sheet bottom CTA remain the single header entry points.
- Spanish UI text and all original styling classes preserved; no new dependencies; no unrelated refactors.
