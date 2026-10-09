# Task 2-d — full-stack-developer

**Task:** (1) /paises no mostraba todos los países → agrupación por región robusta + getCountries sin filtro isActive + SQL de migración. (2) Fórmula de miembros invertida (0.2 miembros/clic) + banda 900–1010 determinista (límite WhatsApp 1.024).

## Contexto para otros agentes

- **ENTORNO RE-PROVISIONADO al iniciar la tarea** (3.ª vez): `mysql-runtime/` borrado, dev server caído, `.env` reseteado (solo DATABASE_URL del scaffold). Restauré el stack completo: descargué el tarball de MariaDB 11.8.6 (URL correcta: `https://archive.mariadb.org/mariadb-11.8.6/bintar-linux-systemd-x86_64/mariadb-11.8.6-linux-systemd-x86_64.tar.gz`, 434MB) → `scripts/patches/setup-mariadb.sh` → esquema vía db.ts (bun) → `scripts/patches/seed.sql` → `scripts/patches/stagger-dates.py`. Estado final: 20 países / 22 categorías / 38 grupos / 168 stats. Nota: la primera URL sin `/bintar-...` da 404.
- **Archivos que toqué (mi scope):** `src/app/paises/page.tsx`, `src/lib/data.ts` (solo getCountries), `src/lib/members.ts`, `sql.md` (nuevo), `worklog.md`, `agent-ctx/`. **NO toqué** `related-groups.ts`, `countries-section.tsx`, seeds.
- **DB local YA MIGRADA** a regiones canónicas (América del Sur / América Central / América del Norte / Caribe / Europa). La migración idempotente está en `sql.md` § "MIGRACIÓN PAÍSES (2026-10-08)".
- `getCountries()` ya NO filtra `isActive` — todos los consumidores (header layout, /paises, /buscar, /agregar-grupo, /populares, api/countries, etc.) reciben los 20 países siempre.

## Qué se arregló y por qué

1. **/paises (bug de regiones):** la página agrupaba con `REGIONS.map(r => countries.filter(c => c.region === r))` y REGIONS usa "América del Sur / América Central / América del Norte", pero la BD sembraba "Sudamérica / Centroamérica / Norteamérica" → **16 de 20 países no se renderizaban** (solo España, Cuba, Rep. Dominicana y Puerto Rico; verificado con SELECT en vivo). Fix: `groupCountriesByRegion()` deriva las regiones de los DATOS (únicas en la respuesta), ordena con REGIONS como preferencia y añade desconocidas al final (alfabético es). Cero descartes posibles.
2. **isActive:** todos los países tenían isActive=1 (el filtro no era el causante aquí), pero lo eliminé de getCountries() por robustez (banco curado de 20 países; un flag derivado escondería países de TODAS las páginas).
3. **members.ts:** ratio invertido + banda: `estimate = max(clicks, joinCount) * 0.2`; si `estimate >= 900` → `900 + floor(seededRandom(seed) * 111)` (determinista, sin desajuste de hidratación); si no → jitter ±10% determinista, mínimo 1. Misma firma exportada. Header documenta el razonamiento (20% tasa de unión + tope 1.024). La fórmula vieja mostraba 1.055 "miembros" para el grupo top (¡por encima del tope de WhatsApp!).

## Verificación (todo en vivo, dev server puerto 3000)

- SQL de la tarea ejecutado: 20 países, todos isActive=1; regiones BD = Sudamérica(9)/Centroamérica(6)/Norteamérica(1)/Caribe(3)/Europa(1) → 16 ocultos por mismatch.
- `/paises` HTML: 5 secciones (América del Sur 9, América Central 6, América del Norte 1, Caribe 3, Europa 1), **20/20 enlaces a país**, claim "20 países hispanohablantes disponibles" ✓.
- Homepage: 20 enlaces únicos a países + tabs de región ahora coinciden con BD (mismo SQL aplicado) ✓. `/api/countries` → 20 ✓.
- members (500 seeds cada caso): 1000 clics → [180, 220] (±10% de 200) ✓; 10000 clics → siempre dentro de [900, 1010] ✓; 50 clics → [9, 11] (~10) ✓; 0 → 0 ✓; determinismo estable en re-llamadas ✓. Grupo top real (320 clics): 63 miembros (antes 965); página de detalle renderiza 63 ✓.
- dev.log: sin errores; /paises, /api/countries, /grupo/* todo 200.

## Mismatches reportados (solo lectura, no los toqué)

- Homepage `CountriesSection` (pre-migración) renderizaba los 20 países por defecto, pero sus 3 tabs "América del Sur/Central/Norte" filtraban por literal REGIONS → vacíos ("Sin países en esta región todavía") con las regiones viejas de BD. Tras aplicar la migración SQL ya coinciden. Si re-seedean la BD con `scripts/patches/patch seed.sql` SIN aplicar la migración, los tabs vuelven a quedar vacíos (los literales del seed siguen siendo "Sudamérica" etc.) — aplicar `sql.md` tras cada reseed, o canonicalizar gen_seed.py/seed.sql (no lo hice: fuera de mi scope).
- FAQ (faq-section.tsx + layout.tsx) menciona regiones con el naming de BD "(Sudamérica, Centroamérica, Caribe y Europa)" — copia inconsistente con los tabs (menor, cosmético).

## Riesgos

- reseed sin sql.md → tabs del homepage vacíos de nuevo (ver arriba). /paises es inmune (data-driven).
- `getStats().members` sigue siendo SUM(clicks) (métrica distinta, preexistente — no confundir con members.ts).
