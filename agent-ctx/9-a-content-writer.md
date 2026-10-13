# Agent record — Task 9-a (country intros)

- **Task ID**: 9-a
- **Agent name**: content-writer (country intros)
- **Date**: 2026-10-13

## Task
Write 20 UNIQUE country intros for the bottom long-form section of /pais/{code} pages and seed them into `entity_intros` (kills duplicate-content risk between country pages). Brief + conventions: read `agent-ctx/content-brief.md` first.

## What I did
- Read the brief, `src/app/pais/[code]/page.tsx` (customIntro → split by blank lines → `<p>`; `force-dynamic`), `src/lib/taxonomy-intro.ts`, and the DB (`countries` names, `entity_intros` structure, was empty).
- Wrote `scripts/intro-seeds/countries.mjs` (mysql2/promise, from project root). Per country: DELETE then INSERT `entityType='country'`, exact `entityName` (accents!), `customTitle=NULL`, `customHeroDesc=NULL`, `customIntro=TEXT`.
- 20 intros × 4 paragraphs (250-282 words): P1 vida local de WhatsApp; P2 tipos de grupos + mención de Grupos Hoy (frase distinta en cada país); P3 consejo práctico único por país; P4 invitación a publicar (cierre distinto). Sin cifras, sin "miles", sin stats.
- Script includes hard validators: word counts, no digits/mil(es), 3-4 párrafos, 1 sola mención de "Grupos Hoy", aperturas y cierres únicos, frases ≤26 palabras y **check de solapamiento de 6-gramas entre los 20 textos** (duplicados imposibles).

## Verification
- Script runs clean; 20 rows in `entity_intros`.
- curl: los 20 `/pais/{code}` → 200, cada uno contiene una frase distintiva de SU intro (grep 1 match).
- Matriz de unicidad: cada frase aparece SOLO en su página (20/20).
- Spot-check ar/es/mx: intros distintas entre sí; fallback genérico ya no se renderiza.
- /pais/ar renderiza el customIntro como 4 `<p>`.
- Sin cambios en src/ (solo `scripts/intro-seeds/countries.mjs` + `tool-results/worklog-9a.md`).
- Full log: `tool-results/worklog-9a.md`.

## Notes for later agents
- `entity_intros` tiene UNIQUE KEY (entityType, entityName); mis filas son `entityType='country'`. Si trabajas categorías/ciudades usa tu propio entityType y NO toques las filas de country.
- Hay otro agente en paralelo con `scripts/intro-seeds/cities.mjs` (su archivo, no lo toqué).
- `src/app/pais/[code]/page.tsx` divide el texto por líneas en blanco (`\n\s*\n`); respeta ese formato.
- El H2 de la sección larga ("Grupos de WhatsApp en {name}: comunidades en español listas para unirte") vive en src/ y es igual para todos los países — la unicidad de contenido la aportan estos customIntro.
