# Home Scroll Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve public home scroll stability/performance and fix career point click navigation without changing the visual direction.

**Architecture:** Keep the current Lenis + GSAP/ScrollTrigger architecture, but reduce scroll-frame DOM writes by caching active states and only mutating when values actually change. Make career point click targets derive from the live ScrollTrigger `start/end` values instead of a separate hand-calculated range. Move one-off gallery clone positioning from `top/left` placement to transform-based placement, and delay/throttle floating top button measurement to avoid initial forced reflow.

**Tech Stack:** Astro, TypeScript, native CSS, GSAP/ScrollTrigger, Lenis, Cloudflare Workers.

---

### Task 1: Cache Scroll State Mutations

**Files:**
- Modify: `src/components/HomePage.astro`

- [x] **Step 1: Add state caches near the home setup variables**

Add local state for the last identity mode, career list visibility, active timeline index, active featured index, and the identity progress ScrollTrigger.

- [x] **Step 2: Replace repeated timeline class toggles with a cached setter**

Create `setActiveTimeline(index)` and make `setIdentityMode()` call it only when the index changes.

- [x] **Step 3: Guard identity and career-list class/tween writes**

Only toggle `identity.is-career` and run `setCareerListStage()` animation when the target state changes, unless an explicit immediate reset is requested.

- [x] **Step 4: Guard featured panel/dot writes**

Make `setActiveFeatured()` return early when the requested index is already active.

### Task 2: Fix Career Point Click Targeting

**Files:**
- Modify: `src/components/HomePage.astro`

- [x] **Step 1: Store the identity progress ScrollTrigger**

Assign the main identity scrub trigger to `identityProgressTrigger` and push that trigger to `homeScrollTriggers`.

- [x] **Step 2: Calculate career point scroll positions from the trigger range**

Change `getCareerPointTop(index)` so it maps progress to `identityProgressTrigger.start + (identityProgressTrigger.end - identityProgressTrigger.start) * progress`.

- [x] **Step 3: Finish click navigation after Lenis completes**

Extend `scrollToPosition()` to accept an optional `onComplete` callback. On career point click, set immediate visual state, start the scroll, and re-apply the target state plus `ScrollTrigger.update()` when scrolling completes.

### Task 3: Reduce Layout/Repaint Pressure

**Files:**
- Modify: `src/components/HomePage.astro`
- Modify: `src/styles/global.css`
- Modify: `src/layouts/PublicLayout.astro`

- [x] **Step 1: Position gallery filter clones with transforms**

Set clone `left/top` to `0`, then use GSAP `x/y` transform for placement and movement.

- [x] **Step 2: Add focused compositor hints**

Add `will-change: transform, opacity` only to actively animated public elements where it is likely to help, avoiding broad page-wide hints.

- [x] **Step 3: Defer and throttle floating top button measurement**

Replace the immediate `syncButton()` call with a requestAnimationFrame-queued function, only toggle the visible class when the value changes, and do the first measurement after `load` or a later animation frame.

### Task 4: Record And Verify

**Files:**
- Modify: `HISTORY.md`

- [x] **Step 1: Add a history entry**

Record the root cause, implementation summary, verification commands, and remaining PageSpeed retest note.

- [x] **Step 2: Run static checks**

Run: `git diff --check`

Expected: no output, exit code 0.

- [x] **Step 3: Run build**

Run: `npm run build`

Expected: `astro check` reports 0 errors / 0 warnings / 0 hints and Astro build completes.

- [x] **Step 4: Smoke-test in Chrome**

Open local home in Chrome, click a non-first career point, and verify the active point after scroll matches the clicked point.
