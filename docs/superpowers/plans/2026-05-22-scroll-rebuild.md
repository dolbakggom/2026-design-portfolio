# Home Scroll Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy forced home snap system with scrubbed, scroll-progress-driven sticky transitions that remain stable in Chrome, WebKit, and mobile.

**Architecture:** `HomePage.astro` should no longer intercept wheel/touch/key input or call GSAP `ScrollToPlugin` to force section jumps. Public home motion is driven by normal page scroll, sticky containers, and `ScrollTrigger` scrub callbacks that only update visual state. CSS provides section dwell time through natural document height and sticky panels.

**Tech Stack:** Astro, TypeScript-in-Astro client script, GSAP ScrollTrigger, Lenis, native CSS.

**Follow-up note:** The work detail scroll-effect task was superseded by the user's rollback request. Current active implementation keeps the previously deployed fixed cover/fade detail behavior and focuses the rebuild on public home scroll.

---

### Task 1: Remove Forced Home Snap Logic

**Files:**
- Modify: `src/components/HomePage.astro`

- [x] Remove `ScrollToPlugin` import and registration.
- [x] Remove `SnapTarget`, `snapToTarget`, `goToSnap`, `snapAcrossBoundaries`, `dispatchNativeSnapInput`, native `wheel`/`touchmove`/`keydown` interception, `ScrollTrigger.observe`, snap lock/gate variables, and cover clone helpers.
- [x] Keep cleanup for `ScrollTrigger` instances and top button registration.
- [x] Ensure route aliases `/about`, `/career`, and `/work` still set an initial native scroll position without creating a later forced snap loop.

### Task 2: Rebuild Home Motion As Scrubbed Scroll State

**Files:**
- Modify: `src/components/HomePage.astro`
- Modify: `src/styles/global.css`

- [x] Keep intro typewriter animation as an entrance-only effect.
- [x] Use `ScrollTrigger.create({ trigger: identity, start: "top top", end: "bottom bottom", scrub: true })` to drive about/career state from scroll progress.
- [x] Set identity progress thresholds for about copy, career heading, career list, and active timeline item.
- [x] Use normal sticky layout height to keep intro/about/career/work on screen long enough without JS snap.
- [x] Update route state with passive `ScrollTrigger` enter/back callbacks only.

### Task 3: Rebuild Featured And Gallery Progress

**Files:**
- Modify: `src/components/HomePage.astro`
- Modify: `src/styles/global.css`

- [x] Use the featured section document height to create one sticky featured stage plus one progress slice per featured work.
- [x] Use scrubbed progress to update active featured index and dots.
- [x] Keep dot clicks as direct non-animated scroll-to-position helpers only if needed; they must not reintroduce one-input snap.
- [x] Make gallery a normal section that visually covers featured through CSS/sticky positioning and a scroll-driven dark dissolve, without cloning cover layers.

### Task 4: Superseded Work Detail Scroll Effect

**Files:**
- Modify: `src/pages/work/[slug].astro`
- Modify: `src/styles/global.css`

- [x] Roll back the detail slide experiment to the deployed fixed cover/fade behavior.
- [x] Keep work detail out of the current home scroll rebuild scope.

### Task 5: Verify And Review

**Files:**
- Modify: `HISTORY.md`

- [x] Add a concise history entry covering the scroll rebuild.
- [x] Run `git diff --check`.
- [x] Run `npm run build`; if sandbox blocks Cloudflare Vite's inspector port, record the exact failure and rerun with approved escalation if available.
- [x] Use Superpowers requesting-code-review with an explorer/code-review subagent against the final diff.
