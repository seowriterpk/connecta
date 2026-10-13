# 9-b — City Intro Seed Agent (work record)

Task 9-b: seeded 29 unique city intros into `entity_intros` for the long-form bottom
section of `/ciudad/{slug}` pages.

- Deliverable: `scripts/intro-seeds/cities.mjs` (mysql2/promise, run from project root;
  DELETE+INSERT per city, idempotent).
- Content: 3 paragraphs, 250-272 words each, plain text with `\n\n` paragraph breaks
  (matches the page renderer `content.customIntro.split(/\n\s*\n/)`).
  P1 local life (real barrios/transport/ritmo) · P2 what groups people seek (real teams,
  universities, compraventa, work) + varied "grupos de arriba" sentence · P3 one distinct
  local tip. Zero group counts / "miles" / invented verifiable-false facts.
- Full details, verification transcript (29/29 pages 200 + own distinctive phrase,
  sibling cross-leak matrix, 29 unique rendered-intro hashes) and Stage Summary:
  see `/home/z/my-project/tool-results/worklog-9b.md`.
- No src/ files, worklog.md, or other agents' files touched.

Next agents: DB row per city is (entityType='city', entityName=EXACT accented name from
`groups.city`); re-run `node scripts/intro-seeds/cities.mjs` to reset/refresh.
