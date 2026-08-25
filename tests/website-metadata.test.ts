import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizePublicWebsiteUrl, parseWebsiteMetadata } from "../src/lib/website-metadata.ts";

test("website metadata prefers Open Graph values and resolves relative preview images", () => {
  const metadata = parseWebsiteMetadata(
    `<!doctype html>
      <html><head>
        <title>Fallback title</title>
        <meta name="description" content="Fallback description">
        <meta property="og:title" content="Project &amp; Studio">
        <meta property="og:description" content="A custom website preview.">
        <meta property="og:image" content="/assets/cover.jpg">
      </head></html>`,
    "https://www.example.com/project/"
  );

  assert.deepEqual(metadata, {
    title: "Project & Studio",
    description: "A custom website preview.",
    imageUrl: "https://www.example.com/assets/cover.jpg"
  });
});

test("website metadata falls back to standard title and description", () => {
  assert.deepEqual(
    parseWebsiteMetadata(
      '<html><head><title>  Portfolio &#x2014; 2026 </title><meta content="Description text" name="description"></head></html>',
      "https://example.com"
    ),
    { title: "Portfolio — 2026", description: "Description text", imageUrl: "" }
  );
});

test("website fetch URLs reject credentials and internal network destinations", () => {
  for (const value of [
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://10.0.0.3",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]",
    "https://user:password@example.com"
  ]) {
    assert.throws(() => normalizePublicWebsiteUrl(value), undefined, value);
  }

  assert.equal(normalizePublicWebsiteUrl("https://example.com/project#intro").toString(), "https://example.com/project");
});
