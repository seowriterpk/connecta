# Worklog 10-1 — Cluster 1: "Joining & finding groups"

## Task ID
10-1

## Agent
Content Agent (Cluster 1 — blog seeds). Read `/home/z/my-project/agent-ctx/content-brief.md` first and followed it exactly (voice, SEO structure, internal-link rules, seed-script pattern, verification). Other agents' records live in `/agent-ctx/` (parallel clusters 2/3 were already seeded when I started — their slugs were reused as verified cross-links where natural).

## Task
Write and seed CLUSTER 1 of the Grupos Hoy blog ("Joining & finding groups", 5 posts, `scripts/blog-seeds/cluster-1.mjs`), then verify with curl only. Never touch `src/` or `worklog.md`.

## Work Log

1. **Read the brief + inspected environment.** Confirmed MariaDB (`blog_posts` schema, 2 existing posts), dev server up on :3000, `mysql2` installed, ReactMarkdown + remark-gfm renders content links/tables/quotes.
2. **Pre-verified all candidate link targets with curl** (before writing): site pages (`/buscar`, `/categorias`, `/ciudades`, `/paises`, `/guias`, `/sobre-nosotros`, `/populares`), categories (`/categoria/humor`, `/categoria/amistad`), city (`/ciudad/ciudad-de-mexico`), countries, 6 sample group pages, both existing blog posts, and cluster-2 posts (found already live: 106–110, incl. `como-salir-de-un-grupo-de-whatsapp-sin-que-se-den-cuenta` and `que-nadie-te-anada-a-grupos-de-whatsapp-sin-permiso`). All 200.
3. **Wrote `scripts/blog-seeds/cluster-1.mjs`** with the 5 posts below, following the brief's insert conventions exactly (columns, `Antonio C.`, `published`, metaTitle NULL, views 0, `UTC_TIMESTAMP() - INTERVAL N DAY`, ON DUPLICATE KEY UPDATE idempotent). readingMinutes computed as `Math.max(1, Math.round(words/180))` with inline WARN validation for word count (1200–2000) and metaDescription length (140–155), matching the pattern used by the parallel cluster-2 script.
4. **First seed run** flagged 3 posts under 1,200 words → expanded them with substantive (non-filler) sections: post-102 (+comparison table of the 3 vías, "Lo que nunca funciona", community example, 2 FAQ/links), post-103 (+worked example applying the checklist, "¿Cuántos grupos conviene tener a la vez?", extra checklist signals, FAQ), post-105 (+community re-entry path, "no lo tomes personal" paragraph, FAQ about self-rejoin via saved link), post-104 (+small troubleshooting detail additions). Fixed one typo ("ahornan"→"ahorran").
5. **Re-ran seed** (idempotent): all 5 posts pass validation.
6. **Structural verification from the DB** (temp script, removed after): 5/5 rows, status published, author Antonio C., readingMinutes matches words/180, one coverEmoji each, tags JSON arrays (4 plain words each), word counts 1488/1312/1261/1348/1244, metaDescriptions 146/148/146/151/147 chars, definition paragraphs 49/52/50/53/48 words (40–55 ✓), first internal link at word #118/#85/#111/#99/#79 (within ~150 ✓), internal links per post 7/6/8/5/5 (4–8 ✓), external 2/1/1/1/1 (1–2 ✓), **zero duplicate URLs within any post**, `## Preguntas frecuentes` + 4–5 `###` questions in every post, publishedAt = 2026-08-25→29 (daysAgo 49/48/47/46/45 ✓).
7. **Paragraph uniqueness check:** no identical paragraph shared between any two of the 5 posts, nor with any of the 13 existing published posts (001/002/106–110 + cluster 3).
8. **curl page verification (no agent-browser):** all 5 `/blog/{slug}` pages → **200**, each contains `<title>`, the exact post title as `<h1>`, `Antonio C.`, and 30+ unique internal `href="/…"` (header/footer + content). Spot-checked rendered content: markdown anchors render with descriptive text (e.g. `buscador de grupos de WhatsApp` → `/buscar`), GFM tables render as `<table>` (101, 103, 104, 102), blockquote message templates render (105).
9. **Link-target sweep:** all 18 distinct internal targets → **200** (blog siblings, site pages, category, city, group ficha). External whitelist links: `https://faq.whatsapp.com/` → 200; `https://www.whatsapp.com/community` → 301 → 200 (`whatsapp.com/groups`, WhatsApp's current community page — both URLs are from the brief's official whitelist).
10. **Blog index + dev.log:** `/blog` lists all 5 new posts; dev.log shows only 200 renders, no errors.

## Posts seeded (all `published`, author `Antonio C.`)

| id | slug | daysAgo | words | rm | internal / external links | angle delivered |
|---|---|---|---|---|---|---|
| post-101 | como-unirse-a-un-grupo-de-whatsapp-guia-completa | 49 | 1,488 | 8 | 7 / 2 | ALL 4 real methods (enlace, QR, comunidad, admin te añade) with numbered steps per method + Android/iPhone notes + "enlace caducado/restablecido" recovery; methods overview table; snippet-bait definition + FAQ. Links: /buscar (intro, word #118), /categorias, 102, 104, /grupo/la-liga-mx-resultados-y-memes, /guias, cluster-2 salir post; faq.whatsapp.com + whatsapp.com/community |
| post-102 | como-unirse-a-un-grupo-de-whatsapp-sin-enlace | 48 | 1,312 | 7 | 6 / 1 | Honest "no magic trick" answer + the 3 legitimate vías (admin, QR, comunidad), scam-myth busting with detection list, comparison table, ask-permission etiquette + message templates. Links: 101 (intro, word #85), /sobre-nosotros (why we don't list fake links), 108, 104, /categorias, /buscar; whatsapp.com/community |
| post-103 | como-encontrar-grupos-de-whatsapp-que-valgan-la-pena | 47 | 1,261 | 7 | 8 / 1 | Quality checklist (actividad, comportamiento, reglas, descripción) with summary table + worked example; where-to-search funnel to directory taxonomy. Links: /categorias (intro, word #111), /paises, /ciudades, /categoria/humor, /ciudad/ciudad-de-mexico, seguros-2026 (quality ≠ seguridad, no duplication), moderar post, 101; whatsapp.com/community |
| post-104 | por-que-no-puedo-unirme-a-un-grupo-de-whatsapp | 46 | 1,348 | 7 | 5 / 1 | Troubleshooting: 7-cause diagnostic table (grupo lleno 1.024, enlace restablecido, te sacaron, app vieja, red/país, link mal copiado, invitación de comunidad) + cause→solution numbered steps per cause. Links: 101 (intro, word #99), /buscar, 102, 105, /guias; faq.whatsapp.com |
| post-105 | como-saber-si-me-eliminaron-de-un-grupo-de-whatsapp | 45 | 1,244 | 7 | 5 / 1 | Signals vs myths (no official notification, group vanishes from list, what admins/members see incl. "X salió del grupo" admins-only in recent versions), 4 signals + 5 false positives, re-entry only via re-invite, 2 polite re-entry message scripts (blockquote). Links: 104 (intro, word #79), 101, /categoria/amistad, /ciudades, /guias; faq.whatsapp.com |

Voice: short sentences (≤ ~18 words), neutral Spanish + 1–2 light regional touches per post (pibe/canchita Rosario in 101, che+voseo template in 102, la gente de Sevilla in 103, vale in 104, che template in 105), concrete local characters (María de Monterrey, Ana del 3ºB), honest hedges ("según la versión…") on version-dependent behavior. Facts kept to brief-true list: 1.024 limit, Restablecer enlace (kills link + QR), admin-controlled communities, privacy setting Ajustes→Privacidad→Grupos, admins-only system notices in recent versions.

## Stage Summary

- **Delivered:** `scripts/blog-seeds/cluster-1.mjs` (idempotent seed script, runs clean) + 5 published posts in `blog_posts` (post-101…post-105, daysAgo 49→45, Antonio C.).
- **SEO structure per brief:** H1 = title, 2–3 paragraph intro with promise, 40–55-word definition paragraph right after intro (49/52/50/53/48 words), H2/H3 body with numbered steps + tables + bold key terms, final "## Preguntas frecuentes" (4–5 questions), 1,200–2,000 words each, metaDescriptions 146–151 chars with natural primary keyword.
- **Linking rules honored:** 4–8 internal links/post (one in first ~150 words of every post), 2–3 sibling blog links per post (cluster-1 siblings + existing/cluster-2 posts), 1–2 external whitelist links, descriptive varied anchors, zero repeated URLs within a post, 100% of linked targets curl-verified 200 (external: 200, and 301→200 redirect to WhatsApp's live community page).
- **Uniqueness:** no paragraph shared between any two posts (checked programmatically vs all 5 + 13 existing posts).
- **Untouched:** `src/`, `worklog.md` — only `scripts/blog-seeds/cluster-1.mjs` and this worklog were created.
- **Notes for next agents:** cluster-1 slugs are live and safe to cross-link; posts render at `/blog/{slug}` with server-rendered crawlable markdown (ReactMarkdown + remark-gfm); blog index and sitemap cron pick them up automatically.
