# Worklog — Task 9-b

## Task ID
9-b

## Agent
Content agent — city intro seeder (long-form /ciudad/{slug} bottom sections)

## Task
Write 29 UNIQUE city intros (anti-duplicate-content goal: "local elements so city pages
are unique from each other"), seeded into `entity_intros` as
(entityType='city', entityName=EXACT name, customTitle=NULL, customHeroDesc=NULL,
customIntro=TEXT). Script: `scripts/intro-seeds/cities.mjs` (mysql2/promise, run from
project root). For each city: DELETE then INSERT (idempotent re-runs).

## Work Log

1. **Read `/home/z/my-project/agent-ctx/content-brief.md`** (voice rules: easy Spanish,
   short sentences, tú, 1-2 regional touches max; no invented verifiable-false facts).
2. **Inspected rendering pipeline** (read-only): `src/app/ciudad/[slug]/page.tsx` calls
   `getTaxonomyContent("city", city.city)`; `content.customIntro.split(/\n\s*\n/)` renders
   one `<p>` per blank-line-separated paragraph (plain text, NO markdown).
   `src/lib/taxonomy-intro.ts` reads `entity_intros` by (entityType, entityName).
3. **Confirmed exact entityNames** against the live DB
   (`SELECT DISTINCT city FROM groups WHERE status='live'`) — all 29 task names match
   exactly, incl. accents: Asunción, Barcelona, Bogotá, Buenos Aires, Cali, Caracas,
   Ciudad de Guatemala, Ciudad de México, Ciudad de Panamá, Córdoba, Guadalajara,
   La Habana, La Paz, Lima, Madrid, Managua, Medellín, Monterrey, Montevideo, Panamá,
   Puebla, Quito, San José, San Juan, San Salvador, Santiago, Santo Domingo, Sevilla,
   Tegucigalpa. Slugs derive via `citySlug()` (accents stripped) → match task slug list.
   (CRITICAL slug note honored: San Salvador → **san-salvador**.)
4. **Wrote `scripts/intro-seeds/cities.mjs`**: 29 intro objects (3 paragraphs each,
   joined with `\n\n`), plus fail-fast self-checks BEFORE any DB write:
   - 250-350 words per intro (word count printed per city),
   - exactly 3 paragraphs,
   - no "miles/millones/1024/integrantes" (zero group counts),
   - first-3-words opening pattern must be UNIQUE across all 29 (enforced by code),
   - entityName must exist in live `groups` table (guard against typos).
   Then per city: `DELETE FROM entity_intros WHERE entityType='city' AND entityName=?`
   followed by INSERT with customTitle/customHeroDesc = NULL.
5. **Content spec per city**: P1 = local life written like a local (real barrios, real
   transport, real ritmo: e.g. Madrid→Malasaña y Vallecas + Rastro + derbi; CDMX→Roma y
   Coyoacán + tianguis; Buenos Aires→Palermo y La Boca + subte D + Mitre; Bogotá→
   Chapinero + TransMilenio + ciclovía dominical). P2 = groups people look for (real
   teams: Millonarios/Santa Fe, Chivas/Atlas, Rayados/Tigres, Tauro/Plaza Amador,
   Licey/Escogido, Bóer…; real universities: UNAM, UBA, Complutense, UNC, Tec de
   Monterrey, Udelar, UASD, San Marcos…; compraventa, trabajo, planes) + varied
   "arriba están los grupos de esta ciudad" sentence (each city uses a different
   phrasing, several with a light local interjection: vale, órale, che via pibe/bo,
   parce, mae, maje, illo, po, causa, asere, boricua, qué lo qué, de una). P3 = one
   distinct local practical tip, never repeated between cities (TransMilenio rush
   hour; siesta 13:30-16:30 reply gap in Córdoba; ETECSA data auto-download off in
   La Habana; salteñas de mañana technique; cebiche al mediodía in Lima; Feria de Abril
   private casetas in Sevilla; Panama-hat-is-Ecuadorian in Panamá; hurricane-season
   neighbor groups in San Juan; Managua reference-point live-location pin; talavera
   workshop seal in Puebla; preemergencia smog days in Santiago; feria Pocitos Wed/Sat
   cash in Montevideo; Bitcoin-transfer irreversibility in San Salvador…).
   - Sibling separation enforced: España (Madrid vs Barcelona vs Sevilla), Colombia
     (Bogotá vs Cali vs Medellín), México (CDMX vs Guadalajara vs Monterrey vs Puebla),
     Argentina (Buenos Aires vs Córdoba), and the TWO Panamá rows kept clearly distinct:
     `/ciudad/panama` centers the Casco Antiguo/canal/Miraflores/Amador/mariscos,
     `/ciudad/ciudad-de-panama` centers the zona bancaria/Vía España/Paitilla/
     Cinta Costera/Metro L1/malls + moda. Different opening sentences, different
     structure, different advice — no shared first-sentence patterns anywhere.
6. **Ran script**: `node scripts/intro-seeds/cities.mjs` →
   `cities.mjs: seeded 29 city intros` (word counts 250-272 per city, all in range).
   Word-count misses on first run (Bogotá 244, Cd. de Panamá 246, Guadalajara 249,
   San Juan 244) were fixed by small additions and re-run clean.
7. **DB verification**: `SELECT COUNT(*)` → 29 city rows; customTitle IS NULL ×29,
   customHeroDesc IS NULL ×29, customIntro filled ×29 (LENGTH 1335-1502 bytes).
8. **Curl verification (all 29 pages)** — for each `/ciudad/{slug}`: HTTP 200 + page
   contains a distinctive phrase from ITS OWN intro + default fallback text
   ("reúnen a personas que viven") GONE. Result: **29 passed / 0 failed**:
   asuncion, barcelona, bogota, buenos-aires, cali, caracas, ciudad-de-guatemala,
   ciudad-de-mexico, ciudad-de-panama, cordoba, guadalajara, la-habana, la-paz, lima,
   madrid, managua, medellin, monterrey, montevideo, panama, puebla, quito, san-jose,
   san-juan, san-salvador, santiago, santo-domingo, sevilla, tegucigalpa.
   Distinctive phrases used (one per city): "cuando el río se pone naranja",
   "los castellers bajan a las plazas", "la Séptima es de los ciclistas",
   "el tren Mitre te lleva a Tigre", "el cholado con fruta es la moneda de la siesta",
   "los Rojos del Ávila", "las camionetas multicolores siguen cargando la historia",
   "con su mantel de fruta", "una ciudad de vidrio plantada al mar",
   "el Matador de Barrio Jardín", "huele a torta ahogada por la mañana y a mariachi
   por la noche", "la fila de Coppelia tiene sus propias reglas", "el aire es fino y
   la salteña es comida de mañana", "no es exageración, es calendario",
   "la Ribera de los Curtidores", "dos cuadras al lago y una arriba",
   "se anda en camisa todo el año", "silueta de montura que los regios miran",
   "termo bajo el brazo como si fuera parte del cuerpo", "Nació en Ecuador y se hizo
   famoso", "se pinta a mano y se cuece dos veces", "dos mil ochocientos cincuenta
   metros", "le dicen Chepe", "adoquines azulados que brillan con la lluvia",
   "las pupusas se piden por docena", "el imperio de lo de segunda", "la caja vacía
   también pesa", "mirando los farolillos desde afuera", "el Ciclón Azul contra los albos".
9. **Sibling spot-checks**:
   - /ciudad/madrid vs /ciudad/barcelona vs /ciudad/sevilla: rendered openings
     "Malasaña despierta tarde y Vallecas no duerme…" vs "Vivir en Barcelona es
     aprenderse la ciudad por barrios…" vs "Triana queda al otro lado del puente…"
     — clearly different; cross-phrase leak test clean each way.
   - /ciudad/bogota vs /ciudad/medellin: "El clima de Bogotá cambia de opinión…"
     vs "La eterna primavera no es cuento…" — different; leak test clean
     (bogota/calí/medellin mutual).
   - Extended leak matrix also clean for: México quartet, Argentina pair, and the
     two Panamá pages (casco/canal vs zona bancaria).
   - Rendered intro blocks of all 29 pages hashed (md5 after tag-strip): 29 unique
     hashes, zero duplicates.
   - Paragraph splitting confirmed: `\n\n` renders as separate `<p>` (e.g.
     `naranja.</p><p>¿Qué` on asuncion).
10. **No src/ files touched**; dev server not restarted (curl-only verification;
    dev.log clean, all /ciudad/ requests 200).

## Stage Summary
- Deliverables: `scripts/intro-seeds/cities.mjs` (29 city intros + fail-fast
  self-checks) and this worklog. NOTHING else written (no src/, no worklog.md,
  no other agents' files touched).
- DB state: `entity_intros` now has 29 city rows, all with
  customTitle=NULL/customHeroDesc=NULL and a unique 250-272-word customIntro.
- Verified: all 29 /ciudad/{slug} pages return 200 and render their own unique
  long-form intro; default fallback text removed; sibling pages confirmed different
  (España trio, Colombia trio, México quartet, Argentina pair, Panamá pair).
- Script is idempotent (DELETE+INSERT) and safe to re-run.
