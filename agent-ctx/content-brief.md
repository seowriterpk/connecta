# Grupos Hoy — Shared Content Brief (Wave 2, 2026-10-13)

READ THIS FULLY BEFORE WRITING. Site: Spanish WhatsApp-groups directory "Grupos Hoy",
https://gruposhoy.com, Next.js 16 App Router, MariaDB on 127.0.0.1:3306 (db `gruposwhatsapp`,
user `grupos`, EMPTY password, client binary `mysql-runtime/mariadb-11.8.6-linux-systemd-x86_64/bin/mariadb`).
Dev server: http://localhost:3000 (already running — do NOT restart it, do NOT use agent-browser,
verify with curl only; other agents run in parallel).

## Writing voice (CRITICAL — user demands "very very easy to understand Spanish, like a local writer from Argentina/Spain/Mexico")
- Short sentences (max ~18 words). Everyday words. Explain like a friend to a neighbor.
- Neutral Spanish with light natural regional warmth: at most 1-2 regional touches per post
  (a "vale", an "órale", a "che" — only where it reads natural, never forced).
- Second person "tú". Concrete local examples (María de Monterrey, un pibe de Rosario, la gente de Sevilla).
- NO robotic transitions ("En primer lugar", "Como conclusión"). NO filler. NO English. NO lorem.
- Honest: no invented WhatsApp features, no fake numbers. When behavior depends on version/app
  updates, hedge ("según la versión que tengas", "en la mayoría de las versiones actuales").
- Facts that are TRUE and usable: member limit 1.024; groups revocable links ("Restablecer enlace");
  QR to join groups; communities (announcement group + subgroups, admin-controlled); channels
  (one-way broadcast, unlimited followers); WhatsApp Business is a separate app; admins see
  "X salió del grupo" only among themselves in recent versions; anyone can report content.

## blog_posts insert conventions
Columns: id, slug, title, excerpt, content (MARKDOWN), coverEmoji (ONE emoji), tags
(JSON array string, e.g. `["whatsapp", "unirse"]`, 3-5 plain words — never links), authorName
('Antonio C.' ALWAYS — the owner signs every post), status ('published'), metaTitle (NULL — page
uses post.title automatically), metaDescription (140-155 chars, primary keyword natural),
readingMinutes (integer, words/180 rounded), views (0 — never fake), publishedAt
(`UTC_TIMESTAMP() - INTERVAL N DAY`, N given per post).

## Post SEO structure (every post)
1. H1 = post title (set in `title` column; page renders it as h1).
2. Intro 2-3 short paragraphs ending with a promise of what the reader will get.
3. A 40-55-word definition/direct-answer paragraph right after the intro (featured-snippet bait)
   answering the title's question plainly.
4. Body with ## H2 sections, ### H3 where useful; numbered steps for how-tos; bullet lists;
   markdown **bold** for key terms; tables (| col | col |) where comparing (render supported).
5. FAQ section at the end: "## Preguntas frecuentes" with 3-5 ### questions + direct answers.
6. 1.200-2.000 words. Long, detailed, ZERO generic filler — specifics, examples, real steps.
7. Markdown links: [texto descriptivo](/url) — internal RELATIVE (/buscar, /categoria/humor…),
   external FULL https URLs (whitelist below).

## Internal linking (user: "proper juice, no authority waste, natural")
- 4-8 internal links per post, spread naturally; at least ONE in the first ~150 words.
- Descriptive varied anchors ("unirse a grupos de WhatsApp", "grupos de fútbol en español",
  "directorio de grupos por país") — never "clic aquí"/"aquí".
- 2-3 links to SIBLING blog posts (use the master map below — cross-cluster links are valid).
- 1-2 external links, ONLY from this whitelist (official, stable):
  https://faq.whatsapp.com/ · https://www.whatsapp.com/ · https://www.whatsapp.com/community ·
  https://www.whatsapp.com/channel · https://www.whatsapp.com/business · https://blog.whatsapp.com/
- Never link the same URL twice in one post. Links must read as natural sentence parts.

## REAL link targets (query the DB for more; verify every URL you use with curl → 200)
- Categories (20, /categoria/{slug}): amistad arte cine cocina compraventa deportes educacion
  empleo entretenimiento humor idiomas mascotas musica negocios noticias religion salud
  tecnologia viajes videojuegos (query names: SELECT slug,name FROM categories WHERE isAdult=0)
- Countries (/pais/{code}): ar Argentina, bo Bolivia, cl Chile, co Colombia, cr Costa Rica,
  cu Cuba, ec Ecuador, sv El Salvador, es España, gt Guatemala, hn Honduras, mx México,
  ni Nicaragua, pa Panamá, py Paraguay, pe Perú, pr Puerto Rico, do República Dominicana,
  uy Uruguay, ve Venezuela
- Cities (/ciudad/{slug} — slug = lowercase, accents stripped, spaces→dash): asuncion barcelona
  bogota buenos-aires cali caracas ciudad-de-guatemala ciudad-de-mexico ciudad-de-panama cordoba
  guadalajara la-habana la-paz lima madrid managua medellin monterrey montevideo panama puebla
  quito san-jose san-juan san-salvador santiago santo-domingo sevilla tegucigalpa
- Site pages: / /buscar /categorias /paises /ciudades /populares /agregar-grupo /reportar-grupo
  /guias /sobre-nosotros
- Sample group slugs (/grupo/{slug}): futbol-argentino-la-mesa-de-debate, la-liga-mx-resultados-y-memes,
  laliga-espana-debates-y-fantasy, memes-argentinos-editorial-de-humor, ia-en-espanol-herramientas-y-prompts,
  dev-barcelona-programacion-y-cafe, emprendedores-mx-ideas-y-flujo-de-caja,
  freelance-ar-trabajar-en-dolares, e-commerce-y-dropshipping-colombia, beisbol-dominicano-pelota-invernal
  (more: SELECT slug,groupName FROM groups WHERE status='live' AND isAdult=0 — pick relevant ones)
- EXISTING blog posts: /guias/como-encontrar-grupos-de-whatsapp-seguros-2026,
  /guias/como-moderar-un-grupo-de-whatsapp-exitoso

## MASTER BLOG SLUG MAP (38 posts — your cross-links may target ANY of these /guias/{slug} URLs)
Cluster 1: como-unirse-a-un-grupo-de-whatsapp-guia-completa · como-unirse-a-un-grupo-de-whatsapp-sin-enlace · como-encontrar-grupos-de-whatsapp-que-valgan-la-pena · por-que-no-puedo-unirme-a-un-grupo-de-whatsapp · como-saber-si-me-eliminaron-de-un-grupo-de-whatsapp
Cluster 2: estafas-en-grupos-de-whatsapp-9-senales · es-seguro-unirse-a-grupos-de-whatsapp-publicos · que-nadie-te-anada-a-grupos-de-whatsapp-sin-permiso · como-denunciar-un-grupo-de-whatsapp · como-salir-de-un-grupo-de-whatsapp-sin-que-se-den-cuenta
Cluster 3: como-crear-un-grupo-de-whatsapp-guia-completa · crear-grupo-de-whatsapp-sin-agregar-contactos · crear-grupo-de-whatsapp-desde-excel · grupo-de-whatsapp-solo-lectura · crear-grupo-de-whatsapp-contigo-mismo · crear-grupo-de-whatsapp-en-iphone
Cluster 4: como-administrar-un-grupo-de-whatsapp · como-revivir-un-grupo-de-whatsapp-muerto · como-ser-administrador-de-un-grupo-de-whatsapp · como-eliminar-un-grupo-de-whatsapp-siendo-administrador · bots-para-administrar-grupos-de-whatsapp · como-recuperar-un-grupo-de-whatsapp-eliminado
Cluster 5: reglas-para-grupos-de-whatsapp-copiar-y-pegar · reglas-grupo-de-whatsapp-padres-de-familia · reglas-grupo-de-whatsapp-vecinos · reglas-grupos-de-whatsapp-trabajo-y-ventas · nombres-para-grupos-de-whatsapp-graciosos · descripciones-para-grupos-de-whatsapp
Cluster 6: comunidad-de-whatsapp-que-es-y-para-que-sirve · grupo-vs-comunidad-vs-canal-de-whatsapp · como-crear-una-comunidad-en-whatsapp · comunidad-de-whatsapp-business-mito-resuelto · como-crear-un-canal-de-whatsapp
Cluster 7: como-organizar-un-grupo-de-estudio-en-whatsapp · grupos-de-whatsapp-para-hacer-amigos · etiqueta-en-grupos-de-whatsapp-2026 · limites-de-whatsapp-2026-tabla-completa · como-usar-grupos-de-whatsapp-para-vender-sin-spam

## Seed script pattern (per cluster) — scripts/blog-seeds/cluster-N.mjs
```js
import mysql from "mysql2/promise";
const posts = [ { id:"post-101", slug:"…", title:"…", excerpt:"…", content:`…markdown…`,
  coverEmoji:"🔗", tags:JSON.stringify(["whatsapp","unirse"]), metaDescription:"…",
  readingMinutes:7, daysAgo:49 }, /* … */ ];
const pool = mysql.createPool({ host:"127.0.0.1", port:3306, user:"grupos",
  password:"", database:"gruposwhatsapp", connectionLimit:2 });
for (const p of posts) {
  await pool.execute(
    `INSERT INTO blog_posts (id,slug,title,excerpt,content,coverEmoji,tags,authorName,status,metaTitle,metaDescription,readingMinutes,views,publishedAt)
     VALUES (?,?,?,?,?,?,?,?, 'published', NULL, ?, ?, 0, UTC_TIMESTAMP() - INTERVAL ? DAY)
     ON DUPLICATE KEY UPDATE title=VALUES(title), excerpt=VALUES(excerpt), content=VALUES(content),
     coverEmoji=VALUES(coverEmoji), tags=VALUES(tags), authorName=VALUES(authorName),
     metaDescription=VALUES(metaDescription), readingMinutes=VALUES(readingMinutes)`,
    [p.id, p.slug, p.title, p.excerpt, p.content, p.coverEmoji, p.tags,
     "Antonio C.", p.metaDescription, p.readingMinutes, p.daysAgo]);
}
await pool.end(); console.log(`cluster-N: ${posts.length} posts seeded`);
```
Run: `node scripts/blog-seeds/cluster-N.mjs` (from project root).

## Verification (mandatory, curl only — NO agent-browser)
1. `node scripts/blog-seeds/cluster-N.mjs` runs clean.
2. For EVERY post: `curl -s http://localhost:3000/guias/{slug}` → 200, contains the <title>,
   the h1 text, `Antonio C.`, and at least 4 internal `href="/…"` links; word count sanity.
3. For EVERY distinct internal URL you linked: `curl -s -o /dev/null -w "%{http_code}"` → 200
   (404 links are unacceptable — fix anchors/slugs if any).
4. Confirm no two posts share more than ~1 identical paragraph (uniqueness).
5. Write your worklog section to /home/z/my-project/tool-results/worklog-{YOUR-TASK-ID}.md
   (Task ID / Agent / Task / Work Log / Stage Summary). NEVER edit worklog.md or any src/ file —
   content agents own ONLY their seed script + their worklog file.
