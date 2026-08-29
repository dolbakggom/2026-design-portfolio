import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const backdropFilterStylesheets = [
  "src/styles/work-detail.css",
  "src/styles/home-work.css",
  "src/styles/responsive.css",
  "src/styles/admin/shell.css",
  "src/styles/admin/responsive.css"
];

test("prefixed backdrop filters precede standard declarations for production CSS optimization", async () => {
  for (const path of backdropFilterStylesheets) {
    const css = await readFile(path, "utf8");
    const standardBeforePrefix = /(^|\n)\s*backdrop-filter:[^;]+;\s*\n\s*-webkit-backdrop-filter:/;

    assert.doesNotMatch(css, standardBeforePrefix, `${path} can lose the standard backdrop-filter during minification`);
  }
});

test("work detail backdrop transition avoids identity values collapsed into empty filter functions", async () => {
  const css = await readFile("src/styles/work-detail.css", "utf8");

  assert.doesNotMatch(css, /backdrop-filter:\s*blur\(0(?:px)?\)/);
  assert.doesNotMatch(css, /backdrop-filter:[^;]*saturate\(100%\)/);
});

test("work detail glass layer keeps blur visually separate from topbar content", async () => {
  const css = await readFile("src/styles/work-detail.css", "utf8");

  assert.match(css, /\.work-detail-topbar::before\s*\{[^}]*backdrop-filter:/s);
  assert.match(css, /data-title-hidden="true"\]\s*\+\s*\.work-detail-topbar::before\s*\{[^}]*background:\s*rgba\(244,\s*244,\s*244,\s*0\.38\)[^}]*blur\(36px\)/s);
});

test("profile media caption remains visible at responsive widths", async () => {
  const css = await readFile("src/styles/responsive.css", "utf8");

  assert.doesNotMatch(css, /\.profile-media figcaption\s*\{[^}]*display:\s*none/s);
  assert.match(css, /\.profile-media figcaption\s*\{[^}]*right:\s*24px[^}]*bottom:\s*24px/s);
});

test("profile media effects are isolated from the caption", async () => {
  const markup = await readFile("src/components/HomePage.astro", "utf8");
  const css = await readFile("src/styles/home-identity.css", "utf8");

  assert.match(markup, /<div class="profile-media-visual" data-image-frame>[\s\S]*?<\/div>\s*<figcaption>/);
  assert.match(css, /\.profile-media-visual\s*\{[^}]*filter:/s);
  assert.match(css, /\.profile-media figcaption\s*\{[^}]*text-shadow:/s);
});

test("profile media caption fades during the career transition", async () => {
  const css = await readFile(new URL("../src/styles/home-identity.css", import.meta.url), "utf8");
  const script = await readFile(new URL("../src/scripts/home/home-identity.ts", import.meta.url), "utf8");

  assert.match(css, /\.profile-media figcaption\s*\{[^}]*transition:\s*opacity 720ms cubic-bezier\(0\.4, 0, 0\.6, 1\)/s);
  assert.match(css, /\.identity-section\.is-career \.profile-media figcaption\s*\{[^}]*opacity:\s*0/s);
  assert.match(script, /\.fromTo\(profileCaption, \{ autoAlpha: 1 \}, \{ autoAlpha: 0, duration: 0\.72 \}, 0\)/);
});

test("mobile career cards use expanded vertical spacing", async () => {
  const css = await readFile(new URL("../src/styles/responsive.css", import.meta.url), "utf8");

  assert.match(css, /@media \(max-width: 1180px\)[\s\S]*?\.timeline-track\s*\{[^}]*gap:\s*clamp\(64px, 10svh, 108px\);/s);
  assert.match(css, /@media \(max-width: 1180px\)[\s\S]*?\.timeline-track\s*\{[^}]*padding:\s*var\(--timeline-start-padding,[^}]*var\(--timeline-end-padding,/s);
});

test("mobile work content uses a quieter text scale", async () => {
  const css = await readFile(new URL("../src/styles/responsive.css", import.meta.url), "utf8");

  assert.match(css, /@media \(max-width: 1180px\)[\s\S]*?\.work-block-heading\s*\{[^}]*font-size:\s*36px;/s);
  assert.match(css, /@media \(max-width: 1180px\)[\s\S]*?\.work-block-copy\s*\{[^}]*font-size:\s*18px;/s);
  assert.match(css, /@media \(max-width: 1180px\)[\s\S]*?\.work-block-quote\s*\{[^}]*font-size:\s*24px;/s);
});

test("admin work cards render thumbnail URLs as image elements", async () => {
  const component = await readFile(new URL("../src/components/admin/AdminPanels.tsx", import.meta.url), "utf8");
  const adminCss = await readFile(new URL("../src/styles/admin/works-editor.css", import.meta.url), "utf8");

  assert.match(component, /className={`work-tile-media[\s\S]*?<img[\s\S]*?src={work\.thumbnail\.url}/);
  assert.doesNotMatch(component, /--tile-image/);
  assert.match(adminCss, /\.admin-work-card \.work-tile-media\.is-image-unavailable img\s*\{[^}]*display:\s*none;/s);
});

test("code blocks share editor, preview, and public rendering styles", async () => {
  const editor = await readFile(new URL("../src/components/admin/BlockEditor.tsx", import.meta.url), "utf8");
  const preview = await readFile(new URL("../src/components/admin/AdminSupport.tsx", import.meta.url), "utf8");
  const publicBlocks = await readFile(new URL("../src/components/WorkBlocks.astro", import.meta.url), "utf8");
  const publicCss = await readFile(new URL("../src/styles/work-detail.css", import.meta.url), "utf8");

  assert.match(editor, /toggleCode\(\)/);
  assert.match(editor, /addBlock\("code"\)/);
  assert.match(editor, /enableTabIndentation:\s*true/);
  assert.match(preview, /className="preview-block-code"/);
  assert.match(publicBlocks, /class="work-block-code"/);
  assert.match(publicBlocks, /data-code-copy/);
  assert.match(publicBlocks, /<Prism class="work-code-source"/);
  assert.match(preview, /highlightCode\(code, language\)/);
  assert.match(publicCss, /\.work-block-copy :not\(pre\) > code/);
  assert.match(publicCss, /\.work-code-shell\s*\{[^}]*border-radius:\s*20px;[^}]*background:\s*#242424;/s);
  assert.match(publicCss, /\.work-block-code\s*\{[^}]*min-width:\s*0;[^}]*max-width:\s*100%;/s);
  assert.match(publicCss, /\.work-block-code pre\s*\{[^}]*max-width:\s*100%;[^}]*overflow:\s*auto;/s);
  assert.match(publicCss, /\.work-block-code code\s*\{[^}]*width:\s*max-content;[^}]*min-width:\s*100%;/s);
  assert.match(publicCss, /\.work-block-code \.token\.keyword[\s\S]*?color:\s*#f28dad;/s);
  assert.match(publicBlocks, /class="work-code-caption"/);
  const previewCss = await readFile(new URL("../src/styles/admin/preview.css", import.meta.url), "utf8");
  assert.match(publicCss, /\.work-code-caption,\s*\.work-block-image figcaption\s*\{[^}]*font-size:\s*14px;/s);
  assert.match(previewCss, /\.preview-block-code > figcaption,\s*\.preview-block-image figcaption\s*\{[^}]*font-size:\s*0\.82rem;/s);
});

test("every work heading receives additional top spacing in public and live preview layouts", async () => {
  const publicCss = await readFile("src/styles/work-detail.css", "utf8");
  const previewCss = await readFile("src/styles/admin/preview.css", "utf8");

  assert.match(publicCss, /\.work-block-heading\s*\{[^}]*margin:\s*48px 0 0;/s);
  assert.match(previewCss, /\.preview-block-heading\s*\{[^}]*margin:\s*24px 0 0;/s);
  assert.doesNotMatch(publicCss, /\.work-block-heading:(?:first-child|first-of-type)/);
});

test("work project navigation keeps its full-width circular acid reveal", async () => {
  const css = await readFile("src/styles/work-detail.css", "utf8");
  const component = await readFile("src/components/WorkProjectNavigation.astro", "utf8");

  assert.match(css, /\.work-project-navigation\s*\{[^}]*width:\s*100vw;[^}]*height:\s*320px;/s);
  assert.match(css, /\.work-project-navigation-tint\s*\{[^}]*background:\s*var\(--color-acid\);[^}]*clip-path:\s*circle\(0 at var\(--project-reveal-x\) var\(--project-reveal-y\)\);/s);
  assert.doesNotMatch(css, /\.work-project-navigation-tint\s*\{[^}]*mix-blend-mode:/s);
  assert.match(css, /\.work-project-navigation-copy\.is-reveal-copy\s*\{[^}]*color:\s*var\(--color-ink\);[^}]*clip-path:\s*circle\(0 at var\(--project-reveal-x\) var\(--project-reveal-y\)\);/s);
  assert.match(component, /class="work-project-navigation-copy is-reveal-copy" aria-hidden="true"/);
  assert.match(css, /\.work-project-navigation-link:hover \.work-project-navigation-tint[^}]*clip-path:\s*circle\(150% at var\(--project-reveal-x\) var\(--project-reveal-y\)\);/s);
  assert.match(css, /\.work-project-navigation-link:first-child \.work-project-navigation-copy\s*\{[^}]*left:\s*calc\(var\(--project-navigation-inline\) \* 2\);/s);
  assert.match(css, /\.work-project-navigation-link:last-child \.work-project-navigation-copy\s*\{[^}]*right:\s*calc\(var\(--project-navigation-inline\) \* 2\);/s);
  assert.match(component, /addEventListener\("pointermove"[\s\S]*--project-reveal-x[\s\S]*--project-reveal-y/);
});
