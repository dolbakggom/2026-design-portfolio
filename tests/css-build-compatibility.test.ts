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
