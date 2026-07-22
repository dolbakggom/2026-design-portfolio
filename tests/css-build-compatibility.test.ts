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
