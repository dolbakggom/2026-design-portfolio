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
- Rate limiting binding: `ADMIN_LOGIN_RATE_LIMITER` (10 attempts per minute per Cloudflare location)
- Required secrets: `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`
- Deploy with Cloudflare Workers, not Cloudflare Pages. Astro 7 + `@astrojs/cloudflare` v14 targets Workers.
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

Regenerate Cloudflare binding/runtime types after changing `wrangler.toml`:

```bash
npm run cf:types
```

Public routes keep rendering starter content when D1 is unavailable. These fallback events are recorded as `portfolio.content.read_failed` with `home` or `work` scope. Inspect production failures in Workers Logs or stream only matching entries:

```bash
npx wrangler tail --search portfolio.content.read_failed
```

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
