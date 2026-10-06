# GruposWhatsApp — Instructional Manual (Groupizo Blueprint)
> **SOURCE OF TRUTH. Read before coding anything.**
> Saved to memory on 2026-09-27. This is the reference manual from the lead engineer.

## GOLDEN RULES
1. Build one feature end-to-end, make it work, THEN move to the next.
2. No demo code, no placeholders, no TODO. If it's in a file it must work.
3. Features are suggestions — implement cleanly in Node.js, but must work + handle edge cases.
4. Test before moving on.
5. No hardcoded credentials — all secrets in .env.
6. Scalable, readable code.
7. Don't build what's not needed now. No blog, no user accounts beyond UGC contributors, no fancy analytics.
8. Admin = simple username+password, session-based, no OAuth/JWT. Public site = no login.

## STACK
- Node.js + Express (backend, SSR/template rendering)
- MySQL (mysql2, prepared statements ALWAYS, utf8mb4, InnoDB)
- EJS or Handlebars (pick one, don't mix)
- Vanilla CSS (no Tailwind unless told)
- Vanilla JS (no React/Vue)
- Frontend/SEO/URLs = Spanish. Backend code/comments = English.

## DATABASE (14 tables)
1. **groups** — main table. Fields: id, group_name, slug, join_link, description, category, country, city, keywords, tags, profile_image, language, status(live/pending/rejected/flagged/pruned), link_status(active/revoked), is_adult, submit_source(staff/ugc), clicks, join_count, avg_rating, rating_count, uploader_id, ugc_submission_id, ugc_contributor_id, last_validated_at, image_refreshed_at, popularity_badge, created_at, updated_at
2. **groups_queue** — staging before live
3. **ugc_submissions** — user submissions waiting review (with quality score, status pipeline)
4. **ugc_contributors** — public users (display_name, display_slug, passkey_hash, reputation_score, is_blocked)
5. **uploaders** — staff curators with public author pages
6. **category_bank** — master category list (gatekeeper)
7. **country_bank** — master country list (with iso2)
8. **group_reports** — reports (ip-limited)
9. **ugc_rate_limits** — anti-spam (rate_key + action, blocked_until)
10. **ugc_settings** — admin-configurable (max_per_device_day=10, max_per_ip_day=30, auto_publish_score=70, min_tags=3, min_keywords=3)
11. **seo_overrides** — per-page meta overrides
12. **entity_intros** — custom intro text per category/country/city/tag
13. **admin_activity_log** — audit trail
14. **group_reviews** — star ratings (ip_hash, 1 vote per IP per day)

## URL STRUCTURE (Spanish)
- Homepage: /
- Category: /categoria/musica
- Country: /pais/mexico
- City: /ciudad/guadalajara
- Tag: /etiqueta/reggaeton
- Group Detail: /:slug (NO /groups/ prefix — slug IS the URL)
- Verify/Join: /verificar/:slug (noindex, follow)
- Add Group: /agregar-grupo
- Search: /buscar?q=futbol
- Report: /reportar-grupo
- Author: /autor/:slug
- RSS: /rss
- Sitemap: /sitemap.xml
- Admin: /admin
- Pagination: /pagina/N (NOT ?page=N). /pagina/1 → 301 to base.

Slug rules: strip accents, lowercase, spaces→hyphens, remove special chars.

## FRONTEND PAGES
1. **Homepage** — SSR, hero + group count, category tabs, 120 latest groups grid, popular countries, trending tags (35+ occurrences), top contributors, footer. Cache-Control max-age=3600. JSON-LD WebSite+SearchAction.
2. **Category Page** — 301 if slug not normalized, 404 if empty, 48/page, client-side sort (data-latest/data-popular), entity_intros, related cats/countries. robots index only if 5+ groups.
3. **Country Page** — like category + top cities, top categories, related countries sidebar.
4. **City Page** — same structure.
5. **Tag Page** — index only if 10+ groups, else noindex.
6. **Group Detail Page** (MOST IMPORTANT) — slug IS the URL. Image 120x120 circular, h1 name, status badge, meta pills (category/country/city/language), description, tags→/etiqueta/, keywords chips, "Unirse en WhatsApp"→/verificar/:slug (NEVER direct), "Reportar", star rating (1 vote/IP/day), details (date/joins/language/last check), author/contributor section, 10 related groups (4 newest + 4 fewest clicks + 2 random, active+has image). JSON-LD @graph: BreadcrumbList+AggregateRating+Organization+Person. If is_adult: noindex,nofollow, no OG, no schema.
7. **Verify/Join Page** (/verificar/:slug) — noindex,follow. Image, name, 5-sec progress bar animation, 4-check verification checklist, button activates when complete, 10 related groups below, info box. On click: AJAX POST /ajax/contar-click, redirect to WhatsApp URL.
8. **Add Group** (/agregar-grupo) — 7-step UGC form:
   - Step 1: Paste WhatsApp link → /ajax/verificar-invitacion fetches og:title+og:image via proxy
   - Step 2: Select country (from country_bank) + city
   - Step 3: Select language
   - Step 4: Select category (from category_bank, adult only if explicitly enabled)
   - Step 5: Tags (min 3, max 6) + keywords (min 3, max 6), auto-suggest from DB, reject spam blocklist
   - Step 6: Contributor profile (anonymous OR create: display_name + passkey, bcrypt)
   - Step 7: Summary + honeypot (website_url) + CSRF + started_at timestamp + POST /ajax/enviar-grupo
   - Backend: validate CSRF, honeypot, time<3s=bot, re-fetch WhatsApp meta (never trust frontend), validate category+country exist, rate limit (10/device/day, 30/IP/day), duplicate check (invite_code LIKE), quality score 0-100 (image+20, 3+tags+15, 3+keywords+15, description+10, city+10, not-dup+30), auto-publish if score>=70 AND not adult, else submitted for review.
9. **Search** (/buscar?q=) — full-text AND logic, 48 results, noindex if <5 results. SearchResultsPage schema.
10. **Report Group** (/reportar-grupo) — search group (AJAX), reason dropdown, /ajax/procesar-reporte, IP-limit 1/group, FAQPage schema.
11. **Author Profile** (/autor/:slug) — staff curators. Name, photo, job_title, bio, social links, stats, groups grid. Person schema with sameAs.
12. **RSS** (/rss) — XML 2.0, 50 newest, application/rss+xml.
13. **Sitemap** — cached static XML in /public/sitemaps/, nightly cron. Index points to groups-N.xml (200/file), categories.xml, countries.xml, tags.xml, static.xml. NEVER include adult.

## ADMIN PANEL (/admin)
Session-based, CSRF on all POST. Credentials in .env (ADMIN_USER, ADMIN_PASS). crypto.timingSafeEqual for password compare.

### Pages:
1. **Dashboard** (/admin) — total live, pending, revoked, clicks today, contributors, recent activity log (20). Quick actions: link checker, image refresh, sitemaps.
2. **Groups Management** (/admin/grupos) — filters (status/category/country/source/adult/date/search), columns (checkbox/id/name/cat/country/status/link-status/clicks/date/actions), bulk actions (publish/needs-review/reject/spam/delete-soft/delete-hard/change-category/change-country/toggle-adult/check-links/refresh-images), individual edit modal (all fields + auto-generate slug), SEO bulk tools.
3. **UGC Submissions** (/admin/ugc) — status tabs, columns (uid/name-fetched-vs-edited/contributor/cat-country/status/score-colorcoded/flags/date), bulk (publish/reject/spam/delete), individual review modal (preview, score breakdown, flags, accept/reject with note, override fields).
4. **Contributors** (/admin/contribuidores) — table, block/remove/unblock, click→see submissions.
5. **SEO Manager** (/admin/seo) — seo_overrides CRUD, entity_intros CRUD.
6. **Reports Manager** (/admin/reportes) — groups with reports, mark reviewed/reject/remove.
7. **Category Manager** (/admin/categorias) — CRUD, rename, merge, toggle active/adult, sort order, bulk sort.
8. **Image Manager** (/admin/imagenes) — groups missing/stale images, manual+bulk refresh trigger.

## CRON JOBS
1. **Link Checker** (every 6h) — 150 groups, oldest first, fetch via rotating proxy, parse og:title, active if real name, revoked if generic, SKIP on 429/timeout (fail-safe, don't mark revoked). iPhone UA, first 8KB.
2. **Image Refresh** (every 10min) — 60 groups, image_refreshed_at < 2h ago or NULL, fetch og:image via proxy, download+compress sharp JPEG 300x300 80%, save locally, update profile_image + image_refreshed_at.
3. **Drip Feed** (every 15min) — top 5 from groups_queue, generate slug (non-adult: name+cat; adult: invite code only), insert live, delete from queue.
4. **Sitemap Generator** (nightly 2am) — write to /public/sitemaps/, lock file, never adult.

## AJAX ENDPOINTS
- POST /ajax/verificar-invitacion — fetch WhatsApp meta
- POST /ajax/enviar-grupo — full UGC pipeline
- POST /ajax/contar-click — increment clicks (fire-and-forget)
- POST /ajax/enviar-calificacion — star rating
- POST /ajax/procesar-reporte — group report
- GET /ajax/buscar-grupos-para-reporte — search for report
- POST /ajax/verificar-passkey — check name+passkey
- GET /ajax/verificar-nombre-usuario — name availability
- GET /ajax/obtener-ciudades — cities for country
- GET /ajax/obtener-etiquetas — popular tags for category
- POST /ajax/admin/lista-ugc — admin UGC queue
- POST /ajax/admin/acciones-ugc — admin UGC actions
- POST /ajax/admin/acciones-grupos — admin group actions

## SEO (NON-NEGOTIABLE)
- One h1 per page
- Unique title + meta description per page
- canonical link always
- Correct robots meta
- JSON-LD per page type
- OG tags
- Schema: Homepage=WebSite+SearchAction+Organization; Category=ItemList+BreadcrumbList; Group=BreadcrumbList+AggregateRating+Person; Author=Person; Report=FAQPage+BreadcrumbList; Search=SearchResultsPage
- noindex: verify pages, admin, search<5, category/tag<5, revoked groups, groups with no tags AND no keywords
- index: homepage, category/country 5+, group with active link+1 tag/keyword, author
- No trailing slashes (301), no uppercase (301), no ?page=1 (301)
- Never auto-generate thin pages
- Strip tag stopwords: whatsapp, grupo, enlace, gratis, activo, nuevo, ultimo, online, chat, unirse
- Bounce rate reduction: related groups everywhere, category pills, country cross-links, rating widget, 5-sec verify delay

## SECURITY
- Prepared statements ALWAYS
- Input validation + length limits
- Rate limit critical POSTs
- CSRF on all forms
- Honeypot field
- Reject <3s submissions
- Session-based admin
- bcrypt for passkeys
- File MIME validation
- HTML escape outputs
- Generic error messages

## DESIGN
- Mobile-first (70% mobile traffic)
- Fonts: Inter or Outfit
- Base 16px, never <14px readable
- clamp() for headings
- WhatsApp green #25D366, dark bg #121212, card #1e1e1e, border #2d2d2d, text #e0e0e0, muted #a0a0a0
- Grid: 2 col mobile, 3-4 tablet, 5-6 desktop
- Touch targets 44x44 min
- No horizontal scroll
- lazy+async images
- defer scripts
- translateY(-2px) hover

## CRITICAL NOTES
1. UGC quality scoring = backbone of spam prevention
2. Duplicate detection by invite_code (not name)
3. WhatsApp CDN images expire — save locally within 48h
4. Link checker MUST use proxy, skip on 429/timeout (don't mark revoked)
5. Drip feed prevents Google spam penalty (5 groups/15min = natural)
6. Verify page 5-sec delay = bounce reduction + ad impressions
7. Adult groups fully isolated (never in main/sitemap/search)
8. Author profiles = E-E-A-T signal
9. category_bank = gatekeeper (no garbage categories)
10. Country canonicalization (Mexico/México/MEX → same)
11. NEVER use WhatsApp member_count (not exposed) — use clicks/joins
12. Sitemap nightly, lastmod = updated_at
13. tags = comma-separated (consistent format)

## BUILD ORDER (Phase 1-5)
**Phase 1 — Core:** DB tables → db.js → routing → admin auth middleware → homepage → group detail → category → country → verify page → click tracking
**Phase 2 — UGC:** verificar-invitacion → add group page → UGC submission pipeline → admin UGC queue
**Phase 3 — Admin:** dashboard → groups mgmt → edit modal → contributors → SEO manager → reports
**Phase 4 — Automation:** link checker cron → image refresh cron → drip feed cron → sitemap cron
**Phase 5 — Extras:** search → tag pages → city pages → author pages → RSS → report page → star rating

## AVOID
- Raw stack traces to users
- eval()/Function() with user input
- SQL string concatenation
- Plain text passwords
- .env in version control
- Fake member counts
- Thin pages (<5 groups)
- Adult in clean listings/sitemaps
- Link checker without proxy
- Bulk publish (use drip feed)
- Half-implemented features (delete if not working)
- console.log in production (use winston)
