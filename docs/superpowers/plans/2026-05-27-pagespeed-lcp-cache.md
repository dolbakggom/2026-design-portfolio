# PageSpeed LCP and HTML Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the mobile PageSpeed bottlenecks caused by large initial font downloads, logo image discovery, and uncached public HTML responses.

**Architecture:** Keep the current Astro SSR + D1/R2 architecture, but make public page delivery cheaper. Fonts switch to Pretendard dynamic subset loading, decorative logos become inline SVGs, and Astro middleware caches only public GET HTML routes at Cloudflare edge while leaving admin/API/media routes untouched.

**Tech Stack:** Astro 6, TypeScript, native CSS, Cloudflare Workers Cache API, Pretendard dynamic subset.

---

### Task 1: Replace Full Pretendard Files With Dynamic Subsets

**Files:**
- Create: `src/styles/pretendard-dynamic-subset.css`
- Modify: `src/styles/global.css`
- Modify: `astro.config.mjs`
- Modify: `src/layouts/BaseLayout.astro`

- [x] Replace the three full static Pretendard font files with the official variable dynamic subset CSS rewritten to absolute jsDelivr font URLs.
- [x] Import the generated subset CSS at the top of `global.css`.
- [x] Keep authored CSS font weights limited to 400, 500, and 700.
- [x] Raise the Vite inline asset threshold so the bundled public CSS remains inline instead of becoming a render-blocking stylesheet.
- [x] Add a `preconnect` hint for `https://cdn.jsdelivr.net`.

### Task 2: Remove Decorative Logo Image Requests From Home

**Files:**
- Modify: `src/components/HomePage.astro`
- Modify: `src/styles/global.css`

- [x] Replace repeated decorative logo `<img>` tags with inline SVG markup.
- [x] Remove the network-only `fetchpriority` optimization because the logo is no longer an external image.
- [x] Keep the intro logo blur animation while avoiding the prior hidden-to-visible opacity delay.

### Task 3: Add Public HTML Edge Cache

**Files:**
- Create: `src/middleware.ts`

- [x] Add Astro middleware that targets only public `GET` HTML routes: `/`, `/about`, `/career`, `/work`, and `/work/:slug`.
- [x] Bypass query-string requests, admin, API, and R2 media routes.
- [x] Use Cloudflare Cache API when available.
- [x] Attach browser-safe and CDN-specific cache headers with a 10-minute edge TTL and 24-hour stale-while-revalidate window.

### Task 4: Verify and Document

**Files:**
- Modify: `HISTORY.md`

- [x] Run `npm run build`.
- [x] Run `git diff --check`.
- [x] Confirm no generated CSS asset is emitted after the new font CSS is bundled.
- [x] Record verification results and caveats in `HISTORY.md`.
