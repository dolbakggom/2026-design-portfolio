import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createCloudflarePurgeBatches,
  getCloudflarePurgeCredentials,
  purgeCloudflareFiles
} from "../src/lib/cloudflare-purge.ts";

test("cloudflare purge credentials accept explicit zone and purge token names", () => {
  assert.deepEqual(
    getCloudflarePurgeCredentials({
      CLOUDFLARE_ZONE_ID: "zone-123",
      CLOUDFLARE_CACHE_PURGE_TOKEN: "token-123"
    }),
    { zoneId: "zone-123", token: "token-123" }
  );
});

test("cloudflare purge credentials are skipped when missing", () => {
  assert.equal(getCloudflarePurgeCredentials({ CLOUDFLARE_ZONE_ID: "zone-123" }), null);
});

test("cloudflare purge urls are chunked for file purge requests", () => {
  const urls = Array.from({ length: 31 }, (_, index) => `https://dolbakggom.com/work/${index}`);
  const batches = createCloudflarePurgeBatches(urls);

  assert.equal(batches.length, 2);
  assert.equal(batches[0].length, 30);
  assert.equal(batches[1].length, 1);
});

test("cloudflare purge sends every batch and reports success", async () => {
  const requests: Array<{ url: string; init: RequestInit }> = [];
  const result = await purgeCloudflareFiles({
    credentials: { zoneId: "zone-123", token: "token-123" },
    urls: ["https://dolbakggom.com/", "https://dolbakggom.com/work/test"],
    fetcher: async (url, init) => {
      requests.push({ url: String(url), init: init ?? {} });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
  });

  assert.equal(result.ok, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://api.cloudflare.com/client/v4/zones/zone-123/purge_cache");
  assert.equal((requests[0].init.headers as Record<string, string>).authorization, "Bearer token-123");
  assert.deepEqual(JSON.parse(String(requests[0].init.body)), {
    files: ["https://dolbakggom.com/", "https://dolbakggom.com/work/test"]
  });
});
