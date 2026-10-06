# ConectaGrupos — Hostinger Deployment Guide (v3.0 · mysql2 edition)

**Stack:** Next.js 16 (App Router) · mysql2/promise connection pool · local MySQL · no Prisma.

> v3.0 removed Prisma completely. The app now talks to MySQL the standard,
> fast way: `mysql2/promise` + `createPool` + a **Schema Guard** that creates
> and patches tables automatically on the first request. No terminal access,
> no `prisma migrate`, no provider swapping, no remote MySQL connections.

---

## 1. What changed (v3.0)

| Before (v2.x) | Now (v3.0) |
|---|---|
| Prisma ORM (native engine binaries) | `mysql2/promise` (pure JS, shared-hosting safe) |
| Remote MySQL via `srv939.hstgr.io:3306` / public IP | **`localhost`** — app + MySQL on the same Hostinger server |
| `prisma generate` + sed provider swap in build | Plain `next build` — nothing DB-related at build time |
| Migrations via `prisma db push` (needs terminal) | **Schema Guard**: `CREATE TABLE IF NOT EXISTS` + `ALTER` guards run automatically on boot |
| Build crashed when DB unreachable | Build never touches the DB (all DB pages are `force-dynamic`) |
| bcrypt (native) | bcryptjs (pure JS) |

---

## 2. Environment variables (hPanel → Node.js → Environment Variables)

Set these EXACTLY (the app reads them at runtime via `process.env`):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=u824913874_spanish
DB_PASSWORD=<your MySQL password from hPanel — same one you use in phpMyAdmin>
DB_NAME=u824913874_spanishs

SESSION_SECRET=<any random 32+ char string>
ADMIN_USER=admin
ADMIN_PASS=<your admin panel password>

BASE_URL=https://yourdomain.com
NODE_ENV=production
```

> ⚠️ **`DB_HOST=localhost` is the critical fix.** Your MySQL server
> (`srv939.hstgr.io`) runs on the same hosting node as the Node app.
> Connecting through the public hostname/IP (`31.97.208.160:3306`) routes
> every query through external network — slow, rate-limited, and the cause of
> the lag and 503s. `localhost` connects through the internal socket — fast.

> Do NOT upload a `.env` file to production. It's dev-only.

---

## 3. hPanel Node.js app settings

| Field | Value |
|---|---|
| Framework preset | **Next.js** |
| Node version | 22.x |
| Root directory | `./` |
| Build command | `npm run build` |
| Start command | `npm run start` |
| Environment variables | See §2 |

`package.json` already contains:

```json
{
  "scripts": {
    "build": "bash scripts/build.sh",
    "start": "NODE_ENV=production node .next/standalone/server.js"
  },
  "engines": { "node": ">=20.9.0" }
}
```

`scripts/build.sh` does: `next build --webpack` (avoids the Turbopack CSS
crash) → copies `static/` + `public/` into the standalone output. It never
touches the database.

---

## 4. Database — zero manual setup

On the **first request** after deployment, the Schema Guard
(`src/lib/db.ts`) automatically:

1. Creates any missing table (`CREATE TABLE IF NOT EXISTS`) — all 15 tables
   with utf8mb4 + proper indexes.
2. Patches older tables (`ALTER TABLE ... ADD COLUMN` wrapped in try/catch) —
   duplicate-column errors are swallowed, so it's safe on every boot.

Your existing production tables (`groups`, `categories`, `countries`, …)
keep their data — the guard only adds what's missing.

**Verify:** after deploy, open `https://yourdomain.com/api/health` —
you should get:

```json
{"ok":true,"db":{"ok":true,"serverInfo":"10.x.x-MariaDB"},"version":"3.0.0-mysql2"}
```

If `db.ok` is `false`, the env vars in §2 are wrong (host/user/password/name).

---

## 5. Cron jobs (hPanel → Advanced → Cron Jobs)

The cron scripts are plain `.mjs` (Node runs them directly, no build step).
Set the DB env vars inline in the command:

| Schedule | Command |
|---|---|
| Every 15 min | `cd /home/uXXXX/domains/yourdomain/nodejs && DB_HOST=localhost DB_USER=u824913874_spanish DB_PASSWORD=xxx DB_NAME=u824913874_spanishs node scripts/crons/drip-feed.mjs` |
| Every 6 hours | `... node scripts/crons/link-checker.mjs` |
| Every 10 min | `... node scripts/crons/image-refresh.mjs` |
| Daily 2:00 AM | `... BASE_URL=https://yourdomain.com node scripts/crons/sitemap-generator.mjs` |

(Replace `uXXXX` / domain with your real path — it's shown in hPanel's
Node.js app details. Each script writes logs to `logs/*.log` and uses a lock
file so runs never overlap.)

---

## 6. ZIP deployment checklist

**Include:** `src/`, `public/`, `scripts/`, `package.json`, `package-lock.json`,
`next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `components.json`,
`eslint.config.mjs`, `db/` (optional).

**Exclude:** `node_modules/` (hPanel runs `npm install`), `.env`,
`.next/` (rebuilt on server), `mysql-runtime/` (sandbox-only local DB),
`db/legacy-sqlite.db` (already migrated), `logs/`.

---

## 7. Debug map

| Symptom | Meaning | Fix |
|---|---|---|
| 503 | App process not starting | Node logs → find first crash line. Usually: wrong start command, missing env var, or ESM/CJS mismatch (this app is ESM and consistent). |
| 404 | App up, route missing | Check URL spelling; SPA/Next routes are filesystem-based. |
| 500 | App up, code threw | Node logs → stack trace. Check `/api/health` → `db.ok`. |
| Slow pages | Remote DB or missing pool | Confirm `DB_HOST=localhost`. The pool (`connectionLimit: 10`) is in `src/lib/db.ts`. |
| Empty homepage | DB connected but no live groups | Check `groups` table has `status='live'` rows (phpMyAdmin or admin panel). |
| 403 after redeploy | `.htaccess` regeneration glitch | Redeploy again — hPanel regenerates it. |

**Fast debug loop:** hPanel Node logs → fix first error → redeploy →
`curl https://yourdomain.com/api/health`.

---

## 8. Local development (sandbox)

```bash
./start-mariadb.sh     # local MariaDB on 127.0.0.1:3306 (same code path as prod)
./start-dev.sh         # next dev on :3000 (webpack mode — Turbopack OOMs on 4GB sandboxes)
```

`.env` (dev only) points at the local DB with user `grupos` /
password `grupos_dev_pw` / database `gruposwhatsapp`. Data was migrated
from the old SQLite file (`db/legacy-sqlite.db`, 33 groups) via
`bun scripts/migrate-sqlite-to-mysql.mjs`.

---

## 9. Architecture notes

- **One port, one process.** Next.js standalone server binds `process.env.PORT`
  (Hostinger assigns it). Never hardcoded.
- **API + pages in one app.** API routes live under `/api/*`; pages render
  server-side with `force-dynamic` (no build-time DB access).
- **Connection pool.** `mysql2/promise` `createPool` — 10 connections,
  keep-alive, 10s connect timeout, utf8mb4. One pool per process,
  global-cached to survive Next.js HMR.
- **bcryptjs, not bcrypt.** Pure JS — no native compilation on shared hosting.
- **Schema Guard, not migrations.** Idempotent, self-healing, runs once per
  process before the first query; retries on next request if the DB was
  briefly down.
- **Crons are plain Node scripts** (`.mjs`) — hPanel runs them directly.
