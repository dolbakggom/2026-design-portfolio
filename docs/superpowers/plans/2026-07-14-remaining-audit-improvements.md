# Remaining Audit Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete every remaining portfolio audit item with a self-hosted responsive image pipeline, lower initial public JavaScript work, verified accessibility/operations, and a safe Astro 7 migration.

**Architecture:** R2 originals remain immutable and D1 stores additive image variants. Public motion dependencies are loaded only when the home experience needs them. Operational and framework changes occur after the application behavior has stronger automated and browser verification.

**Tech Stack:** Astro, TypeScript, React, D1, R2, native CSS, GSAP, Lenis, Sharp, Node test runner, Cloudflare Wrangler.

## Global Constraints

- Keep original R2 objects and existing asset IDs unchanged.
- Do not require Cloudflare Images or Image Resizing.
- Use only Pretendard weights 400, 500, and 700.
- Preserve `node_modules -> node_modules.nosync` and ignore `node_modules.nosync` in Vite/TypeScript watchers.
- Do not commit until the user requests the final combined commit.
- Write tests before production behavior changes.

---

### Task 1: Responsive Image Domain Model

**Files:**
- Create: `migrations/0005_asset_variants.sql`
- Create: `src/lib/responsive-images.ts`
- Modify: `src/types.ts`
- Test: `tests/responsive-images.test.ts`

**Interfaces:**
- Produces `AssetVariant`, `buildResponsiveImageSource(asset)`, `selectVariantWidths(width, height)`, and `variantDimensions(width, height, targetWidth)`.

- [ ] Write failing tests for width selection, portrait ratio preservation, sorted/deduplicated `srcset`, GIF fallback, and safe empty assets.
- [ ] Run `node --test tests/responsive-images.test.ts` and confirm the missing module failure.
- [ ] Add the migration and minimal pure helper implementation.
- [ ] Rerun the focused test and then `node --test tests/*.test.ts`.

### Task 2: Atomic Multi-Variant Upload

**Files:**
- Modify: `src/lib/image-upload.ts`
- Modify: `src/components/admin/AdminApp.tsx`
- Modify: `src/pages/api/admin/assets.ts`
- Modify: `src/lib/admin-data.ts`
- Test: `tests/image-upload.test.ts`

**Interfaces:**
- Consumes responsive width helpers from Task 1.
- Produces an upload response whose `asset.variants` is a sorted `AssetVariant[]`.

- [ ] Add failing tests for manifest validation, unique widths, maximum variant count, and rollback key construction.
- [ ] Generate browser WebP variants at the selected widths while keeping GIF single-file behavior.
- [ ] Validate every uploaded file signature and metadata server-side.
- [ ] Insert the asset and variants in one D1 batch and delete all uploaded keys after a metadata failure.
- [ ] Verify profile, work thumbnail, featured thumbnail, and block uploads still update live preview state.

### Task 3: Variant-Aware Public Data And Markup

**Files:**
- Modify: `src/lib/content.ts`
- Modify: `src/lib/admin-data.ts`
- Modify: `src/components/HomePage.astro`
- Modify: `src/pages/work/[slug].astro`
- Modify: `src/components/WorkBlocks.astro`
- Test: `tests/responsive-images.test.ts`

**Interfaces:**
- Consumes `AssetVariant[]` and produces `src`, `srcset`, and `sizes` for every public still-image context.

- [ ] Add a failing test that verifies canonical fallback and variant preference.
- [ ] Fetch all variants for the page asset IDs in a single D1 query and attach them to asset refs.
- [ ] Enrich image/gallery blocks from their `assetId` values.
- [ ] Add context-specific `sizes` to profile, featured, gallery, detail hero, image block, and gallery block markup.
- [ ] Verify local HTML contains sorted width descriptors and no `srcset` for GIF.

### Task 4: Existing R2 Variant Backfill

**Files:**
- Create: `scripts/backfill-image-variants.mjs`
- Modify: `package.json`
- Test: `tests/responsive-images.test.ts`

**Interfaces:**
- CLI: `node scripts/backfill-image-variants.mjs --dry-run --remote` and `--apply --remote`.

- [ ] Add direct development dependency `sharp` without breaking the nosync symlink.
- [ ] Implement argument parsing, D1 asset listing, idempotent variant detection, Sharp conversion, Wrangler get/put, and D1 insert.
- [ ] Apply migration locally and run dry-run against local data.
- [ ] Run remote dry-run, record counts and projected bytes, then apply only after confirming originals are untouched.
- [ ] Re-query D1 and sample R2 headers to verify variant metadata and content types.

### Task 5: Deferred Home Motion Runtime

**Files:**
- Create: `src/lib/motion-loader.ts`
- Modify: `src/layouts/PublicLayout.astro`
- Modify: `src/components/HomePage.astro`
- Test: `tests/motion-loader.test.ts`

**Interfaces:**
- Produces `shouldLoadMotion({ route, reducedMotion, intent })` and a one-shot home motion initializer.

- [ ] Write failing policy tests for detail pages, reduced motion, direct `/about` entry, idle, and input intent.
- [ ] Move GSAP/ScrollTrigger/Lenis initialization behind a home-only dynamic import boundary.
- [ ] Keep native scrolling usable before initialization and on loader failure.
- [ ] Compare built public entry chunks and confirm detail pages do not reference the home motion chunk.
- [ ] Re-run desktop/mobile scroll screenshots and interaction checks.

### Task 6: Accessibility And Performance Verification

**Files:**
- Create: `docs/audits/2026-07-14-accessibility-performance.md`
- Modify tests only if a concrete regression is found.

- [ ] Record current production PageSpeed/Lighthouse metrics and major transfer sizes.
- [ ] Run keyboard traversal across home filters, featured works, career points, detail back control, and admin login.
- [ ] Verify reduced-motion rendering and screen-reader names/landmarks.
- [ ] Capture 1440x1000 and 390x844 screenshots for home, detail, admin, and 404.
- [ ] Fix concrete regressions using a failing test first, then repeat the affected checks.

### Task 7: External Operations

**Files:**
- Modify: `README.md` only when an operational instruction changes.

- [ ] Verify production sitemap returns 200 and contains published works.
- [ ] Submit the sitemap through an authenticated Google Search Console session, or record the exact login blocker.
- [ ] Verify Cloudflare secret/variable names for session and global purge without exposing values.
- [ ] Generate and set a PBKDF2 administrator hash only after the user securely provides or enters the intended password.

### Task 8: Astro 7 Compatibility Upgrade

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `astro.config.mjs`
- Modify: framework integration files identified by official migration diagnostics.
- Modify: `src/env.d.ts` after type regeneration.

- [ ] Read the official Astro 7 and adapter migration guides and record required changes.
- [ ] Upgrade Astro, Cloudflare adapter, React adapter, TypeScript, Wrangler, and Workers types as a tested set.
- [ ] Run `npm run cf:types`, focused tests, full tests, and `npm run build`.
- [ ] Start the dev server and verify `/`, `/about`, `/career`, `/work`, a real detail route, `/admin`, and a missing route.
- [ ] Run `npm audit --audit-level=moderate` and document any intentionally retained low advisory.

### Task 9: Final Verification And History

**Files:**
- Modify: `HISTORY.md`
- Update: `docs/audits/2026-07-14-accessibility-performance.md`

- [ ] Run `node --test tests/*.test.ts`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check` and inspect the full diff for accidental generated or secret files.
- [ ] Confirm the dev server remains healthy and provide its URL.
- [ ] Record completed work, production-only follow-up, and any user credential blocker in `HISTORY.md`.

