# AGENTS.md

## Project Direction
- Build the portfolio with Astro, TypeScript, Cloudflare Workers, D1, R2, and native CSS.
- Keep CSS framework-free unless the design becomes materially faster or better with one.
- Use GSAP/ScrollTrigger only for public-facing scroll and intro interactions that benefit from timeline control.
- Treat Figma as the visual source of truth once a frame URL or selected Figma frame is provided.
- Keep only the WORK gallery section capped at a centered 1920px canvas; do not cap the whole public site.
- Keep home route aliases `/about`, `/career`, and `/work` backed by the shared `HomePage.astro` experience with different initial scroll positions.
- Use only Pretendard weights 400, 500, and 700 in CSS.
- Map rich-text semantics consistently: body text is 400, `em`/subtle emphasis is 500, and `strong` is 700. The Figma-led profile intro may use 50% fill for its emphasis span while inheriting heading weight.
- Preserve the main public accent color for site interactions. Use the admin pastel accent for dashboard hover/active button states.

## Figma Workflow
1. Fetch Figma design context and screenshot before changing visual implementation.
2. Map Figma colors, typography, spacing, and radii into CSS custom properties.
3. Keep public pages closest to Figma; extend admin screens with the same design language.
4. Document deliberate deviations in `DESIGN.md`.

## Code Rules
- Prefer server-side data access in Astro pages and API routes.
- Keep client islands focused on interactivity: admin CMS, rich editor, and scroll effects.
- Keep home snap scrolling scoped to `html.home-scroll` so detail and admin pages are not affected.
- Home section travel should be controlled with GSAP Observer + ScrollTo rather than native CSS scroll snap; preserve the one-input-one-section lockout behavior.
- Preserve the shared sticky about/career stage: about copy types first, then career replaces the copy while the right-side timeline appears.
- Keep the WORK admin editor paired with a live preview that reflects unsaved local edits.
- Preserve the draggable WORK editor/preview split so admins can resize the editing and preview columns.
- Render featured work cards as full-bleed image cards with overlay text and automatic black/white text contrast.
- Do not store binary media in D1. Upload media to R2 and store metadata in D1.
- Validate all admin API payloads with Zod.
- Keep public routes resilient: if D1 is unavailable locally, render starter content instead of crashing.
- This workspace lives inside iCloud Drive. Keep dependencies out of sync conflicts by preserving `node_modules -> node_modules.nosync`; if build/check becomes extremely slow, inspect `node_modules.nosync` for `* 2` conflict folders before changing app code.
- Keep Astro/TypeScript checks scoped to source files. Do not let `node_modules.nosync`, `tests`, `.wrangler`, D1 backups, or R2 backups enter the main `tsconfig.json` program.

## History Workflow
- Keep `HISTORY.md` updated so work can continue across separate Codex projects on different Macs.
- Before committing or pushing, add a concise entry to `HISTORY.md` when the work changes behavior, deployment configuration, schema, scroll mechanics, visual structure, or future-agent assumptions.
- Each history entry should include the user request, implementation summary, important files, verification commands/results, and any remaining follow-up or caution.
- If the user asks to commit/push, include the relevant `HISTORY.md` update in the same commit unless they explicitly ask not to.

## Cloudflare Bindings
- D1 binding: `DB`
- R2 binding: `MEDIA_BUCKET`
- Login rate limiting binding: `ADMIN_LOGIN_RATE_LIMITER`
- Required secrets: `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`
- `SESSION_SECRET` must contain at least 32 random bytes. Prefer salted PBKDF2 password hashes; legacy `sha256:` hashes remain temporarily supported for existing deployments.
- Optional cache purge vars/secrets: `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_CACHE_PURGE_TOKEN`. When present, admin saves purge public HTML through Cloudflare's global purge API in addition to the Worker Cache API.
- Non-secret admin username may live in Wrangler vars as `ADMIN_USERNAME`.
