# Remaining Audit Improvements Design

## Goal

Finish the remaining portfolio audit work without depending on paid Cloudflare image products: responsive R2 images, legacy image backfill, public JavaScript performance, accessibility and production checks, operational security verification, and the Astro 7 toolchain upgrade.

## Delivery Order

1. Build and locally verify the responsive image pipeline.
2. Backfill existing assets additively; never overwrite or delete the original R2 object.
3. Reduce initial public JavaScript work while preserving intro and scroll behavior.
4. Run automated and manual accessibility/performance checks.
5. Complete external operations that can be performed with the available authenticated browser/Cloudflare session.
6. Upgrade Astro and adapters last, after behavioral tests exist.

No intermediate Git commit is created. The user will request the final commit after all locally executable work is complete.

## Responsive Image Architecture

### Storage

Add an `asset_variants` D1 table keyed by `(asset_id, width)`. Each row stores the variant R2 key, MIME, width, height, and byte size. The existing `assets` row and original R2 object remain the canonical source and fallback.

For still images, the admin browser creates WebP files at useful widths from `640`, `1280`, `1920`, and `2560`, capped by the fitted source width and deduplicated. GIF keeps one original file to preserve animation.

The upload API accepts the canonical file plus a JSON manifest and variant files. It validates count, MIME signatures, dimensions, sizes, and unique widths. R2 objects are uploaded first, then asset and variant metadata are inserted in one D1 batch. Any database failure removes every object uploaded by that request.

### Delivery

`AssetRef` gains a sorted `variants` collection. Public data loaders fetch variants in one extra query per page dataset, attach them to profile/work assets, and enrich image/gallery work blocks by `assetId`.

A shared image helper returns a safe fallback `src`, width-descriptor `srcset`, and context-specific `sizes`. Profile, featured work, gallery tiles, detail cover, body images, and body galleries use it. Browsers without `srcset` continue using the canonical asset.

### Existing Assets

An additive Node script uses Sharp and Wrangler to read D1 asset rows, download each remote R2 image, create missing widths, upload variant objects, and insert metadata. It supports `--dry-run`, `--local`, and `--remote`. It skips GIF, already-complete variants, corrupt images, and images too small for an additional width. Original objects are never replaced.

## Public JavaScript Performance

Keep the lightweight intro typing and static page HTML immediately available. Load Lenis, GSAP, and ScrollTrigger only on home routes and initialize them after the first of: browser idle, an intent event (`wheel`, `touchstart`, navigation key), or direct entry into a non-intro route. Detail and 404 pages must not download the home motion bundle.

The first intent event is remembered and the initialized scroll controller receives the latest scroll position, so deferral does not swallow navigation. Reduced-motion users keep native scrolling and do not load GSAP.

## Accessibility And Production Verification

Automated checks cover keyboard tab calculations, HTML landmarks, labels, image alternatives, reduced motion, and 404 status. Browser checks cover desktop/mobile layout, keyboard traversal, scroll transitions, and admin login form behavior. A production PageSpeed/Lighthouse baseline is recorded before deployment; the post-deployment comparison remains a release verification step.

## Operations

- Submit `https://dolbakggom.com/sitemap.xml` in Google Search Console when an authenticated session is available.
- Verify Cloudflare has the cache purge variables and required admin secrets by name.
- Rotate `ADMIN_PASSWORD_HASH` to PBKDF2 only after the user supplies or enters the intended administrator password; secret values are never read back or written to the repository.
- Keep the remaining Windows-only esbuild advisory documented until the Astro 7 upgrade is verified.

## Astro 7 Upgrade

Upgrade Astro, `@astrojs/cloudflare`, `@astrojs/react`, TypeScript, Wrangler, and generated Cloudflare types as one compatibility set. Follow official migration guidance, update removed APIs/configuration, regenerate types, then rerun unit, build, local route, accessibility, and motion checks. Do not use `npm audit fix --force` as the migration mechanism.

## Failure Handling

- Variant upload failures leave no new D1 row and roll back newly uploaded R2 objects.
- Backfill is resumable and idempotent; one asset failure is reported and does not delete source data.
- If deferred motion loading fails, native scrolling remains usable.
- External operational steps that require unavailable login state or a plaintext password are reported as blocked, without weakening authentication.

## Success Criteria

- Public still images expose valid `srcset` and `sizes` with no broken fallback.
- New uploads and legacy production assets have responsive variants.
- Home behavior remains visually equivalent at desktop/mobile sizes and under reduced motion.
- Unit tests, Astro check, Cloudflare build, local route checks, and npm audit at moderate level pass.
- Operational tasks have either direct evidence of completion or a precise user-only action with no hidden prerequisite.

