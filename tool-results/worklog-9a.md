# Worklog — Task 9-a (Country intros for /pais/{code})

- **Task ID**: 9-a
- **Agent**: content-writer (country intros)
- **Task**: Write 20 unique long-form country intros, seed them into `entity_intros`, kill duplicate-content risk between /pais/{code} pages (user: "add more local elements to make them unique than each other").

## Work Log

1. **Read `/home/z/my-project/agent-ctx/content-brief.md`** (voice rules: easy Spanish, short sentences, tú, no fake stats; MariaDB on 127.0.0.1:3306, db `gruposwhatsapp`, user `grupos`, empty password; curl-only verification).
2. **Inspected the rendering path** (read-only, no src edits):
   - `src/app/pais/[code]/page.tsx` calls `getTaxonomyContent("country", country.name)` and renders `content.customIntro.split(/\n\s*\n/)` as `<p>` in the bottom long-form section (H2 "Grupos de WhatsApp en {name}:…"). Page is `force-dynamic` → DB changes show instantly.
   - `src/lib/taxonomy-intro.ts` reads `entity_intros` (customTitle/customHeroDesc/customIntro, NULL-safe).
   - Verified exact country names in DB (`SELECT code,name FROM countries`) — accents included (España, México, Panamá, Perú, República Dominicana…).
   - `entity_intros` was **empty** before this task (0 rows).
3. **Wrote `scripts/intro-seeds/countries.mjs`** (mysql2/promise, run from project root). Per country: `DELETE FROM entity_intros WHERE entityType='country' AND entityName=?` then `INSERT (entityType='country', entityName, customTitle=NULL, customHeroDesc=NULL, customIntro=TEXT)`.
   - Content spec per country: 4 paragraphs (blank-line separated), 250-350 words, 0 digits, no "mil/miles", no stats.
     - P1 = cómo vive WhatsApp ese país (sensory, local: mate+Superclásico+asado en AR; sobremesa+fiestas del pueblo+vale en ES; tandeo del agua+posadas+tamales en MX; wifi del parque+Paquete Semanal+Serie Nacional en CU…).
     - P2 = tipos de grupos abundantes + una mención de Grupos Hoy con **frase distinta por país** (20 different phrasings).
     - P3 = un consejo práctico **distinto** por país (AR cadenas "reenviá"; BO mirar antes de escribir + bajar auto-descarga de imágenes; CL verificar rumores de temblor/maremoto en canales oficiales; CO falsos premios/inversiones; CR cómo presentarse en un grupo; CU ahorrar datos; EC protocolo de audios; SV remesas/cambio de dólares; ES silencio 8h en fiestas patronales; GT horario matutino; HN empleos que cobran por adelantado; MX entrega en lugar público + no compartir ubicación en vivo; NI no mezclar política y familia; PA rifas falsas que piden depósito; PY jopara/guaraní; PE estafa del "paquete retenido"; PR grupo de vecinos listo antes de la temporada de huracanes (jun-nov); DO medir el tono en la rivalidad Licey/Águilas; UY encuestas para el asado; VE pagos por adelantado Zelle/pago móvil).
     - P4 = invitación a publicar en «Enviar un grupo», con cierre distinto en los 20.
   - Built-in **validators that throw before touching the DB**: word count 250-350, no digits, no mil/miles, 3-4 paragraphs (each ≥35 words), exactly one "Grupos Hoy" mention, unique first-sentence 3-gram per intro, unique closing 4-gram per intro, sentences ≤26 words, and a **pairwise 6-gram overlap check** across all 20 intros (kills duplicate-content risk; caught and fixed ~12 collisions during drafting, e.g. shared "grupos de la iglesia y de la universidad", "la lista se queda con puro", "en el filtro de Grupos Hoy,").
   - Each intro contains ≥3 country-only elements (lugares/comidas/dichos/equipos/celebraciones) — e.g. Bolivia: Mi Teleférico, salteñas, Carnaval de Oruro; Guatemala: atol de elote, tamales colorados, Quetzaltenango/Petén, chapín; RD: pelota invernal, Licey/Escogido/Águilas, la bandera (plato), Cibao, Malecón.
4. **Ran `node scripts/intro-seeds/countries.mjs`** from project root → clean run: 20 rows seeded (250-282 words each, ~1380-1615 chars). Read-back confirmed exactly 20 `entityType='country'` rows.

## Verification (curl only, no agent-browser)

1. `node scripts/intro-seeds/countries.mjs` runs clean (validate + seed + read-back: 20 rows).
2. All 20 `/pais/{code}` pages (ar bo cl co cr cu ec sv es gt hn mx ni pa py pe pr do uy ve) → **HTTP 200**.
3. Each page contains a **distinctive phrase from ITS OWN customIntro** (grep, 1 match each):
   - ar "la charla del Superclásico arranca el viernes" · bo "cuando llega el Carnaval de Oruro" · cl "la once no es solo té con pan" · co "villancicos, buñuelos y natilla por delante" · cr "el gallo pinto humeando en la mesa" · cu "los datos se cuidan como el arroz" · ec "el clásico del Astillero" · sv "Las pupusas del domingo saben mejor" · es "sigue viva en el grupo del pueblo" · gt "el atol de elote que trae doña" · hn "la baleada ya está en la foto del grupo" · mx "avisa del tandeo del agua" · ni "sube la foto del nacatamal" · pa "quién lleva la yuca, quién el ñame" · py "Tereré en una mano" · pe "la combi se sobrevive con el grupo abierto" · pr "apagón en la isla y el grupo de vecinos" · do "La pelota invernal manda en el chat dominicano" · uy "el chivito del viernes a la noche" · ve "las hallacas vuelven a unir a todos".
4. **Uniqueness matrix**: grepped each of the 20 phrases across ALL 20 pages → every phrase matches ONLY its own page (20 OK / 0 mismatches).
5. **Spot-check ar/es/mx**: each page contains its own phrase and NOT the other two; old generic fallback ("hemos recopilado…") no longer rendered on any of them.
6. Paragraph rendering check on /pais/ar: customIntro renders as exactly **4 `<p>`** in the SEO section (85w / 70w / 71w / 44w).
7. `bunx tsc --noEmit` NOT needed — **no src file touched** (git: only new untracked `scripts/intro-seeds/countries.mjs`; all `M src/…` entries pre-exist from parallel agents).
8. dev.log tail: all 20 `/pais/{code}` GETs → 200, no errors; `/` and `/paises` still 200.

## Stage Summary

**DONE.** 20 unique, hand-written country intros live in `entity_intros` (entityType='country', exact entity names incl. accents; customTitle/customHeroDesc NULL; customIntro 4 paragraphs, 250-282 words, \n\n-separated → rendered as `<p>` by the existing page). Every /pais/{code} page now serves country-only content (local habits, group types, one unique tip, varied invitation), zero shared 6-grams between intros, zero stats/counts, per the brief's easy-Spanish voice. Files touched: `scripts/intro-seeds/countries.mjs` (new) + this worklog. No src/, no worklog.md, no other agents' files.
