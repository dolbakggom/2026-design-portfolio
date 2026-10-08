import assert from "node:assert/strict";
import { test } from "node:test";
import {
  adminLoginRateLimitKey,
  isAdminLoginAllowed,
  reportAdminLoginSecurityEvent
} from "../src/lib/admin-login-security.ts";

const request = (ip?: string) => new Request("https://dolbakggom.com/api/admin/login", {
  method: "POST",
  headers: ip ? { "cf-connecting-ip": ip } : {}
});

test("login limits use Cloudflare client IP, not spoofable forwarding headers or usernames", () => {
  const forwarded = new Request(request("192.0.2.1"), {
    headers: { "cf-connecting-ip": "192.0.2.1", "x-forwarded-for": "198.51.100.1", "x-real-ip": "203.0.113.1" }
  });
  assert.equal(adminLoginRateLimitKey(forwarded), "portfolio-admin-login:ip:192.0.2.1");
  assert.notEqual(adminLoginRateLimitKey(request("192.0.2.1")), adminLoginRateLimitKey(request("192.0.2.2")));
  assert.equal(adminLoginRateLimitKey(request("2001:db8::1")), "portfolio-admin-login:ip:2001:db8::1");
  assert.equal(adminLoginRateLimitKey(request()), "portfolio-admin-login:ip:unknown");
});

test("one client exhausting its login budget does not exhaust another client's budget", async () => {
  const counts = new Map<string, number>();
  const limiter = { limit: async ({ key }: { key: string }) => {
    const count = (counts.get(key) ?? 0) + 1;
    counts.set(key, count);
    return { success: count <= 10 };
  } };
  for (let attempt = 0; attempt < 10; attempt++) {
    assert.equal(await isAdminLoginAllowed(request("192.0.2.1"), limiter), true);
  }
  assert.equal(await isAdminLoginAllowed(request("192.0.2.1"), limiter), false);
  assert.equal(await isAdminLoginAllowed(request("192.0.2.2"), limiter), true);
});

test("limiter failures reject instead of silently allowing password verification", async () => {
  await assert.rejects(isAdminLoginAllowed(request(), {
    limit: async () => { throw new Error("Unavailable"); }
  }), /Unavailable/);
});

test("security logs contain correlation metadata but no IP, credentials, cookies or request body", () => {
  const calls: unknown[][] = [];
  const sensitiveRequest = new Request("https://dolbakggom.com/api/admin/login", {
    method: "POST",
    headers: { "cf-connecting-ip": "192.0.2.1", "cf-ray": "a4757ccaef9225ef-NRT", cookie: "portfolio_admin=secret-cookie" },
    body: JSON.stringify({ username: "private-user", password: "private-password" })
  });
  reportAdminLoginSecurityEvent(sensitiveRequest, "invalid_credentials", (...args) => calls.push(args));
  assert.deepEqual(calls[0], ["[portfolio.admin.login_security]", {
    event: "portfolio.admin.login_security", reason: "invalid_credentials", ray: "a4757ccaef9225ef-NRT"
  }]);
  assert.doesNotMatch(JSON.stringify(calls), /192\.0\.2\.1|private-user|private-password|secret-cookie/);
});

test("malformed ray headers are not reflected in security logs", () => {
  const calls: unknown[][] = [];
  reportAdminLoginSecurityEvent(new Request("https://dolbakggom.com/api/admin/login", {
    headers: { "cf-ray": "untrusted metadata" }
  }), "rate_limited", (...args) => calls.push(args));
  assert.deepEqual(calls[0]?.[1], { event: "portfolio.admin.login_security", reason: "rate_limited" });
});
