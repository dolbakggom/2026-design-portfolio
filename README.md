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
- Deploy with Cloudflare Workers, not Cloudflare Pages. Astro 6 + `@astrojs/cloudflare` v13 targets Workers.
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

## Routes

- `/` public one-page portfolio
- `/work/[slug]` project detail
- `/admin` built-in CMS
