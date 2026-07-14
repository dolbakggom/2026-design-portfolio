import assert from "node:assert/strict";
import { test } from "node:test";
import { linkSchema, loginSchema } from "../src/lib/validation.ts";

test("profile links allow public/contact URLs and reject executable schemes", () => {
  assert.equal(linkSchema.safeParse({ label: "Website", url: "https://example.com" }).success, true);
  assert.equal(linkSchema.safeParse({ label: "Email", url: "mailto:test@example.com" }).success, true);
  assert.equal(linkSchema.safeParse({ label: "Location", url: "#profile" }).success, true);
  assert.equal(linkSchema.safeParse({ label: "Unsafe", url: "javascript:alert(1)" }).success, false);
  assert.equal(linkSchema.safeParse({ label: "Unsafe", url: "data:text/html,test" }).success, false);
});

test("login payloads have resource-safe length limits", () => {
  assert.equal(loginSchema.safeParse({ username: "a".repeat(121), password: "valid" }).success, false);
  assert.equal(loginSchema.safeParse({ username: "admin", password: "a".repeat(1025) }).success, false);
});
