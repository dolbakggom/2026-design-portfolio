import assert from "node:assert/strict";
import { test } from "node:test";
import { createSitemapXml, serializeJsonLd } from "../src/lib/seo.ts";

test("sitemap contains canonical URLs once and escapes XML characters", () => {
  const xml = createSitemapXml(["/", "/work/a&b", "/work/a&b"], "https://example.com");

  assert.match(xml, /<loc>https:\/\/example\.com\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/example\.com\/work\/a&amp;b<\/loc>/);
  assert.equal(xml.match(/\/work\/a&amp;b/g)?.length, 1);
});

test("JSON-LD serialization neutralizes HTML-closing input", () => {
  const serialized = serializeJsonLd({ name: "</script><script>alert(1)</script>" });

  assert.equal(serialized.includes("<"), false);
  assert.match(serialized, /\\u003c\/script>/);
});
