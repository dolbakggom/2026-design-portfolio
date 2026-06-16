import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createPublicHtmlCacheKeys,
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
