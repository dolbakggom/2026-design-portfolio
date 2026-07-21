import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyPublicContentStatus,
  CONTENT_SOURCE_HEADER,
  isFallbackContentResponse
} from "../src/lib/content-response.ts";

test("database content exposes its source without overriding cache policy", () => {
  const headers = new Headers({ "cache-control": "public, max-age=60" });

  applyPublicContentStatus(headers, "database");

  assert.equal(headers.get(CONTENT_SOURCE_HEADER), "database");
  assert.equal(headers.get("cache-control"), "public, max-age=60");
  assert.equal(isFallbackContentResponse(new Response(null, { headers })), false);
});

test("fallback content is observable and cannot enter browser or edge caches", () => {
  const headers = new Headers({ "cache-control": "public, max-age=60" });

  applyPublicContentStatus(headers, "fallback");

  assert.equal(headers.get(CONTENT_SOURCE_HEADER), "fallback");
  assert.equal(headers.get("cache-control"), "no-store");
  assert.equal(headers.get("cdn-cache-control"), "no-store");
  assert.equal(headers.get("cloudflare-cdn-cache-control"), "no-store");
  assert.equal(isFallbackContentResponse(new Response(null, { headers })), true);
});
