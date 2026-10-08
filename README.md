# 2026 Design Portfolio

Astro + Cloudflare portfolio with a built-in admin CMS, D1 content storage, and R2 media uploads.

## Setup

```bash
npm install
cp .dev.vars.example .dev.vars
```

Create a salted local password hash without putting the password in shell history:

```bash
read -s ADMIN_PASSWORD
ADMIN_PASSWORD="$ADMIN_PASSWORD" node -e 'const { randomBytes, pbkdf2Sync } = require("crypto"); const salt = randomBytes(16); const hash = pbkdf2Sync(process.env.ADMIN_PASSWORD, salt, 310000, 32, "sha256"); console.log(`pbkdf2:310000:${salt.toString("base64url")}:${hash.toString("base64url")}`)'
unset ADMIN_PASSWORD
```

Paste that value into `.dev.vars` as `ADMIN_PASSWORD_HASH`, then run:

```bash
npm run db:migrate:local
npm run dev
```

## Cloudflare Workers

- D1 binding: `DB`
- R2 binding: `MEDIA_BUCKET`
- KV binding: `SESSION`
- Rate limiting binding: `ADMIN_LOGIN_RATE_LIMITER` (10 attempts per client IP per minute per Cloudflare location; eventually consistent)
- Production administrator access: Cloudflare Access email verification, then the existing CMS login. The Access session lasts 8 hours; the CMS session is separate.
- Protect `/admin`, `/admin/*`, `/api/admin`, and `/api/admin/*` only. Never apply the administrator policy to the entire public Worker.
- Access configuration: `CLOUDFLARE_ACCESS_ENABLED`, `CLOUDFLARE_ACCESS_TEAM_DOMAIN`, `CLOUDFLARE_ACCESS_AUD`. These are not credentials. Production middleware verifies the signed assertion, issuer, audience, and expiry; missing or invalid assertions are rejected.
- Local `astro dev` does not require Access. Isolated integration fixtures explicitly disable Access except the dedicated perimeter test. Do not disable it on production to make tests pass.
- Keep `workers_dev = false` and `preview_urls = false` so deployment does not expose alternative administrator hostnames.
- Login security events use `portfolio.admin.login_security` without request bodies, passwords, cookies, usernames, or raw client IPs. These logs are not automatic email alerts.
- Required secrets: `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`
- Deploy with Cloudflare Workers, not Cloudflare Pages. Astro 7 + `@astrojs/cloudflare` v14 targets Workers.
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

### Deployment Checklist

Run production releases in this order so code, D1 block types, and public rendering stay compatible:

1. Back up the production D1 and R2 content.
2. Run `npm test` and confirm the build and integration suite pass.
3. Run `npm run db:migrate:remote` and confirm every pending migration succeeds. This currently includes the Website and Divider block migrations (`0006`, `0007`) on environments where they have not yet been applied.
4. Run `npx wrangler deploy`.
5. Confirm `https://dolbakggom.com/api/health` returns HTTP 200 with `{"status":"ok"}`. Failed required-schema checks return HTTP 503 with only `{"status":"degraded"}`; database details stay in sanitized server logs.
6. In production `/admin`, open an existing work and verify Website/Divider blocks can be added and saved, then confirm the corresponding public `/work/[slug]` page.

Do not deploy the editor code before its pending D1 migrations. Git deployment updates application code only; local D1/R2 content is promoted separately as described below.

Regenerate Cloudflare binding/runtime types after changing `wrangler.toml`:

```bash
npm run cf:types
```

### Endpoint Security

- Every administrator data operation, including logout, requires the existing signed CMS session in addition to the production Access perimeter. Mutations require a matching Origin. Missing, oversized, malformed or altered session cookies are treated as unauthenticated, not server errors.
- Logout clears the current browser's CMS cookie. It does not revoke previously copied stateless cookies or sign out the separate Cloudflare Access session.
- Public health reports only the overall status and never caches it; the real D1 schema probe and sanitized failure logs remain active. HTTP 200/503 intentionally remains observable by uptime monitors.
- The unused Astro `/_image` endpoint always returns the same non-cacheable 404, including encoded/trailing-slash variants, without inspecting the supplied image path. The site uses R2 media and stored responsive variants, not this optimizer. Review this guard before introducing `astro:assets` runtime image transformations.

Public routes keep rendering starter content when D1 is unavailable. These fallback events are recorded as `portfolio.content.read_failed` with `home` or `work` scope. Inspect production failures in Workers Logs or stream only matching entries:

```bash
npx wrangler tail --search portfolio.content.read_failed
```

The 10-minute public HTML cache runs only in production builds. `npm run dev` bypasses it so local content and UI changes appear immediately without cache-busting query parameters.

The event contains only the route scope, optional work slug, and a normalized error name/message. It does not include D1 rows, request bodies, or secret values.

## Responsive Image Backfill

New admin uploads generate self-hosted WebP variants automatically. For legacy R2 assets, inspect the remote plan before applying it:

```bash
npm run images:backfill:dry:remote
npm run images:backfill:apply:remote
```

The apply command adds `variants/...` objects and D1 metadata. It does not replace or delete existing `uploads/...` originals and can be run again safely.

## Backups

Repository snapshots are kept outside Git in the parent project folder:

```text
../backups/d1/
../backups/r2/
```

Do not restore binary R2 snapshots into this repository. `d1-backups/` and `r2-backups/` are ignored to prevent accidental reintroduction.

## Content Workflow

Portfolio content is stored in D1 and R2, not in Git. A code commit or `git push` does not publish content edited in the local admin.

Use this workflow for substantial content editing:

1. Back up the local D1 database.
2. Pull production D1 and every referenced R2 original/variant into the local Wrangler state.
3. Edit and review through the local `/admin` and public routes.
4. Before publishing, back up production again and explicitly promote the reviewed local D1/R2 state.
5. Commit and push only source-code or documentation changes.

`scripts/export-d1-via-execute.mjs` exports all content tables, including `asset_variants`. `scripts/sync-r2-assets.mjs` reads that dump and copies both original and responsive variant objects from remote R2 to local R2. Treat local-to-production promotion as a separate, deliberate operation; do not couple it to every Git deployment.

## Tests

Run fast source-level regression tests:

```bash
npm run test:unit
```

Run the production build followed by the local Cloudflare integration suite:

```bash
npm run test:integration
```

The integration suite uses Wrangler's isolated Worker runtime with temporary D1, R2, and KV storage. It covers admin login, work save/update through public block rendering, image upload/media delivery, and mobile `/about`/`/career` scrolling in the installed system Chrome. `playwright-core` does not download a separate browser.

## Routes

- `/` public one-page portfolio
- `/work/[slug]` project detail
- `/admin` built-in CMS

## Visitor Analytics

The admin Dashboard shows sessions, engaged page views, approximate active reading time, popular projects, and recent sessions for today, 7 days, or 30 days (Asia/Seoul). A session is not a unique person and cannot identify a recruiter or company.

- Collection starts after 5 seconds of foreground reading; subsequent updates are batched at 15-second intervals and on leaving the page. Time stops after 60 seconds without interaction. Very short visits are not counted.
- Server-issued anonymous sessions use a signed HttpOnly/SameSite cookie scoped to `/api/analytics`, expiring after 30 minutes without renewal. `/api/analytics/session` issues a signed page ticket binding the server-generated IDs, page, referrer domain, device class, and start time. No IP, raw user agent, full referrer URL, query string, or search keyword is stored in the analytics table. IP is used transiently by Cloudflare's rate limiter, separate from stored analytics.
- Page tickets require the matching session cookie; altered identifiers/metadata are rejected. Duration is capped at server elapsed time, and duplicate or older updates do not increase totals or refresh `last_seen`. Anonymous issuance does not prove a visitor is human: automation can still request genuine tickets within the issuance limit (10/minute/IP/Cloudflare location).
- Local development, authenticated admins, known bots, DNT/GPC, and previously stored browser opt-out preferences are excluded. Collection is enabled only on `dolbakggom.com` and `www.dolbakggom.com`. There is no public analytics notice page or opt-out UI.
- Records older than 30 days since last activity are deleted on the next ingestion or admin report request. This is lazy cleanup, not a scheduled deletion job.
- Statistics are best-effort and may miss blocked requests. They are neither an identity system nor an audit log. Previous visits cannot be reconstructed.

Initial analytics installation requires `0009_visit_analytics.sql`. The signed-ticket upgrade requires no new D1 migration or secret: it uses domain-separated signing derived from `SESSION_SECRET`. Deploy both client and Worker with `ANALYTICS_RATE_LIMITER` and `ANALYTICS_SESSION_RATE_LIMITER` bindings. Already-open old clients without tickets are rejected until reloaded; public viewing is unaffected. Do not copy local analytics into production when promoting portfolio content.

After deployment, use a signed-out browser without DNT/GPC to open a project for at least 5 seconds, then refresh Dashboard in an authenticated browser. Confirm that the session appears and that administrator browsing does not add visits. Local `/admin` can display the dashboard, but local public browsing intentionally produces no data.
