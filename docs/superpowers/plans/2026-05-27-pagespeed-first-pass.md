# PageSpeed First Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the clearest PageSpeed mobile blockers without changing the public visual design or home scroll mechanics.

**Architecture:** Remove the external render-blocking Pretendard stylesheet request and define only the required 400/500/700 faces in the first-party CSS with `font-display: swap`. Fix Lighthouse accessibility findings by using valid tab semantics for the gallery filter, using native buttons for career timeline controls, and treating duplicate gallery thumbnail images as decorative.

**Tech Stack:** Astro, TypeScript, native CSS, GSAP/ScrollTrigger, Cloudflare Workers.

---

### Task 1: Replace Render-Blocking Pretendard CSS Import

**Files:**
- Modify: `src/styles/global.css`

- [x] **Step 1: Remove the external `@import`**

Delete:

```css
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
```

- [x] **Step 2: Add first-party font-face declarations**

Add `@font-face` blocks for only these weights: 400, 500, 700. Use direct WOFF2 URLs from the same Pretendard release and set `font-display: swap`.

```css
@font-face {
  font-family: "Pretendard";
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  src: url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff2/Pretendard-Regular.woff2") format("woff2");
}
```

Repeat for `Pretendard-Medium.woff2` weight 500 and `Pretendard-Bold.woff2` weight 700.

- [x] **Step 3: Verify CSS syntax**

Run: `git diff --check`

Expected: no output, exit code 0.

### Task 2: Fix Gallery Filter ARIA Semantics

**Files:**
- Modify: `src/components/HomePage.astro`

- [x] **Step 1: Add tab roles to filter buttons**

Change category filter buttons so each button has `role="tab"`, stable `id`, `aria-selected`, and `aria-controls="work-gallery-grid"`.

```astro
<button
  type="button"
  role="tab"
  id={`work-filter-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
  class:list={[category === "ALL" && "is-active"]}
  data-filter={category}
  aria-selected={category === "ALL" ? "true" : "false"}
  aria-controls="work-gallery-grid"
>
  {category}
</button>
```

- [x] **Step 2: Make the grid the tab panel**

Add `id="work-gallery-grid"`, `role="tabpanel"`, and `aria-labelledby="work-filter-all"` to `.work-grid`.

- [x] **Step 3: Update click handler state**

When a filter button is clicked, update both `is-active` and `aria-selected`.

```ts
filterButtons.forEach((item) => {
  const isSelected = item === button;
  item.classList.toggle("is-active", isSelected);
  item.setAttribute("aria-selected", isSelected ? "true" : "false");
});
```

### Task 3: Fix Timeline Card Button Semantics

**Files:**
- Modify: `src/components/HomePage.astro`
- Modify: `src/styles/global.css`

- [x] **Step 1: Use native buttons instead of article role button**

Replace each `article.timeline-card` with `button.timeline-card type="button"`. Preserve `data-timeline-card`, `data-timeline-index`, and `aria-label`.

- [x] **Step 2: Remove unnecessary keyboard handler**

Delete the custom Enter/Space keydown handler for `timelineCards`; native buttons already provide keyboard activation.

- [x] **Step 3: Reset button styling**

Add CSS declarations to `.timeline-card` to preserve current visuals:

```css
border: 0;
background: transparent;
padding: 0;
text-align: left;
appearance: none;
```

### Task 4: Remove Duplicate Gallery Thumbnail Alt Text

**Files:**
- Modify: `src/components/HomePage.astro`

- [x] **Step 1: Treat gallery card thumbnails as decorative**

Change gallery thumbnail images to `alt=""` because the adjacent card title and link label already provide the accessible name.

```astro
{work.thumbnail?.url ? <img src={work.thumbnail.url} alt="" loading="lazy" decoding="async" /> : null}
```

### Task 5: Verify And Record

**Files:**
- Modify: `HISTORY.md`

- [x] **Step 1: Run build**

Run: `npm run build`

Expected: `astro check` reports 0 errors, 0 warnings, 0 hints, and `astro build` completes.

- [x] **Step 2: Update history**

Add a `2026-05-27 PageSpeed First Pass` entry covering font CSS import removal, ARIA fixes, verification, and remaining follow-up for PageSpeed retest.

- [x] **Step 3: Final diff review**

Run: `git diff --check` and inspect `git diff --stat`.

Expected: only `HISTORY.md`, the plan file, `src/components/HomePage.astro`, and `src/styles/global.css` are changed for this pass.
