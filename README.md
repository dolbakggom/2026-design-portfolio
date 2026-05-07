# Answer Beyond Portfolio

Astro + Cloudflare portfolio with a built-in admin CMS, D1 content storage, and R2 media uploads.

## Setup

```bash
npm install
cp .dev.vars.example .dev.vars
```

Create a local password hash:

```bash
node -e "const { createHash } = require('crypto'); console.log('sha256:' + createHash('sha256').update('your-password').digest('hex'))"
```

Paste that value into `.dev.vars` as `ADMIN_PASSWORD_HASH`, then run:

```bash
npm run db:migrate:local
npm run dev
```

## Cloudflare

- D1 binding: `DB`
- R2 binding: `MEDIA_BUCKET`
- Required secrets: `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`
- Update `database_id` in `wrangler.toml` after creating the Cloudflare D1 database.

## Routes

- `/` public one-page portfolio
- `/work/[slug]` project detail
- `/admin` built-in CMS
