import assert from "node:assert/strict";
import { test } from "node:test";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { isAdminPath, verifyCloudflareAccess } from "../src/lib/cloudflare-access.ts";

test("Access protection covers admin pages and APIs without covering public paths", () => {
  for (const path of ["/admin", "/admin/", "/admin/edit", "/api/admin", "/api/admin/works", "/api/admin/login"]) {
    assert.equal(isAdminPath(path), true);
  }
  for (const path of ["/", "/work/example", "/api/analytics", "/api/health", "/administrator", "/api/admin-other"]) {
    assert.equal(isAdminPath(path), false);
  }
});

test("Access verifies signature, issuer, audience, expiry and required identity claims", async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const keys = createLocalJWKSet({ keys: [await exportJWK(publicKey)] });
  const configuration = { teamDomain: "portfolio.cloudflareaccess.com", audience: "portfolio-admin-audience" };
  const sign = (issuer = "https://portfolio.cloudflareaccess.com", audience = configuration.audience, expiry = "1h", subject = true) => {
    let jwt = new SignJWT({}).setProtectedHeader({ alg: "RS256" }).setIssuer(issuer).setAudience(audience)
      .setIssuedAt().setExpirationTime(expiry);
    if (subject) jwt = jwt.setSubject("test-owner");
    return jwt.sign(privateKey);
  };
  const verify = (token: string, config = configuration) => verifyCloudflareAccess(new Request("https://portfolio.test/admin", {
    headers: { "cf-access-jwt-assertion": token }
  }), config, keys);
  assert.equal(await verify(await sign()), true);
  assert.equal(await verify(await sign("https://other.cloudflareaccess.com")), false);
  assert.equal(await verify(await sign(undefined, "another-app")), false);
  assert.equal(await verify(await sign(undefined, undefined, "-1h")), false);
  assert.equal(await verify(await sign(undefined, undefined, "1h", false)), false);
  const token = await sign();
  const [header, payload] = token.split(".");
  assert.equal(await verify(`${header}.${payload}.invalid`), false);
  assert.equal(await verify(token, { ...configuration, teamDomain: "localhost" }), false);
  assert.equal(await verify(token, { ...configuration, audience: "" }), false);
  assert.equal(await verifyCloudflareAccess(new Request("https://portfolio.test/admin"), configuration, keys), false);
});
