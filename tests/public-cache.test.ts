import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  createPublicHtmlCacheKeys,
  createPublicHtmlPurgeUrls,
  deletePublicHtmlCache,
  getHomeHtmlCachePaths,
  getPublicHtmlCachePathsForWorks
} from "../src/lib/public-cache.ts";

test("home mutations purge every home route alias", () => {
  assert.deepEqual(getHomeHtmlCachePaths(), ["/", "/about", "/career", "/work"]);
});

test("work mutations purge home routes, current detail pages, and stale slug paths", () => {
  const paths = getPublicHtmlCachePathsForWorks(
    [{ slug: "identity-system" }, { slug: "mobile-app" }, { slug: "identity-system" }],
    ["/work/old-slug", " /work/trailing/ "]
  );

  assert.deepEqual(paths, [
    "/",
    "/about",
    "/career",
    "/work",
    "/sitemap.xml",
    "/work/identity-system",
    "/work/mobile-app",
    "/work/old-slug",
    "/work/trailing"
  ]);
});

test("cache delete keys match the middleware HTML cache key shape", () => {
  const keys = createPublicHtmlCacheKeys("https://dolbakggom.com/admin", ["/work/test"]);

  assert.equal(keys.length, 1);
  assert.equal(keys[0].method, "GET");
  assert.equal(keys[0].url, "https://dolbakggom.com/work/test");
  assert.equal(keys[0].headers.get("accept"), "text/html");
});

test("global purge urls are absolute and de-duplicated", () => {
  const urls = createPublicHtmlPurgeUrls("https://dolbakggom.com/api/admin/works/1", [
    "/",
    "/work/test",
    "work/test",
    " /about/ "
  ]);

  assert.deepEqual(urls, ["https://dolbakggom.com/", "https://dolbakggom.com/work/test", "https://dolbakggom.com/about"]);
});

test("cache deletion reports skipped outside the Cloudflare cache runtime", async () => {
  const result = await deletePublicHtmlCache(new Request("https://dolbakggom.com/admin"), ["/"]);

  assert.deepEqual(result, { ok: false, skipped: true });
});

test("development middleware bypasses the public HTML cache", async () => {
  const middleware = await readFile("src/middleware.ts", "utf8");

  assert.match(middleware, /const isPublicCacheCandidate\s*=\s*import\.meta\.env\.PROD\s*&&/s);
});
