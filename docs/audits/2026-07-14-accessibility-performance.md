# 2026-07-14 Accessibility and Performance Audit

## Scope

- Local Astro/Cloudflare rendering at 1440x1000 and 390x844.
- Public home aliases, work detail markup, admin login surface, 404 behavior, reduced motion, image transfer strategy, and production operations.
- Production content and Cloudflare D1/R2 state at `dolbakggom.com`.

## Improvements

- Added self-hosted responsive image variants at 640/1280/1920/2560 widths with GIF fallback.
- Added `srcset` and layout-specific `sizes` for profile, featured, gallery, detail cover, image blocks, and gallery blocks.
- Deferred GSAP, ScrollTrigger, and Lenis behind a home-only dynamic import boundary. Detail pages no longer request these chunks.
- Added input/idle motion activation, loader failure visibility fallback, and reduced-motion static alias handling.
- Preserved existing semantic landmarks, skip links, tab roles, roving tab keyboard behavior, descriptive work links, and detail back-button names.

## Verification

- Desktop and mobile intro screenshots render without overlap or blank canvas.
- Production build chunks after deferral:
  - public bootstrap: about 1.4KB
  - home controller: about 18KB
  - Lenis, GSAP, and ScrollTrigger emitted as separate dynamic chunks
- Automated tests: 53 passing, 0 failing.
- Astro 7 check: 0 errors, 0 warnings, 0 hints.
- Astro 7 production build: complete.
- Local D1 command works while the dev server is active after Wrangler 4.110 alignment.
- In-app browser automation was unavailable because its runtime could not redefine the `process` global. Chrome headless screenshots and static HTML checks were used instead; full interactive keyboard traversal remains a manual browser check before release.

## Production Image Backfill

- Migration `0005_asset_variants.sql` applied to remote D1.
- 33 existing assets had missing dimensions; all 33 were recovered from R2 source metadata.
- 104 WebP variants were written to new `variants/...` keys.
- Actual added R2 bytes: 22,213,010.
- Existing `uploads/...` objects were not modified or deleted.
- Sample object verified as a valid 1280x1280 WebP.

## Operations

- Required Cloudflare secrets exist by name: `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `CLOUDFLARE_ZONE_ID`, and `CLOUDFLARE_CACHE_PURGE_TOKEN`.
- The currently deployed `/sitemap.xml` still returns 404. The route exists locally and requires the next deployment before Search Console submission.
- Administrator PBKDF2 credentials were not rotated because no new password was provided. Existing secret presence was verified without exposing its value.

## Follow-up

- Deploy the combined commit, verify production `srcset` HTML and transfer sizes, then submit `https://dolbakggom.com/sitemap.xml` in Google Search Console.
- Manually keyboard-traverse the production home, detail, and admin screens once after deployment.
