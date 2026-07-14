import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_JSON_BODY_BYTES, readJson } from "../src/lib/http.ts";
import { isAllowedAdminMutation, isStrongSessionSecret } from "../src/lib/request-security.ts";

test("admin mutations require an exact same-origin Origin header", () => {
  const sameOrigin = new Request("https://dolbakggom.com/api/admin/profile", {
    method: "PUT",
    headers: { origin: "https://dolbakggom.com" }
  });
  const crossOrigin = new Request("https://dolbakggom.com/api/admin/profile", {
    method: "PUT",
    headers: { origin: "https://example.com" }
  });
  const missingOrigin = new Request("https://dolbakggom.com/api/admin/profile", { method: "PUT" });

  assert.equal(isAllowedAdminMutation(sameOrigin), true);
  assert.equal(isAllowedAdminMutation(crossOrigin), false);
  assert.equal(isAllowedAdminMutation(missingOrigin), false);
});

test("safe read methods do not require an Origin header", () => {
  assert.equal(isAllowedAdminMutation(new Request("https://dolbakggom.com/api/admin/profile")), true);
});

test("JSON bodies over the configured limit are rejected before parsing", async () => {
  const request = new Request("https://dolbakggom.com/api/admin/works", {
    method: "POST",
    headers: { "content-length": String(MAX_JSON_BODY_BYTES + 1) },
    body: "{}"
  });

  assert.equal(await readJson(request), null);
});

test("session secrets require at least 32 bytes", () => {
  assert.equal(isStrongSessionSecret("a".repeat(31)), false);
  assert.equal(isStrongSessionSecret("a".repeat(32)), true);
});
