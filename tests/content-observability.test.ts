import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDatabaseHealthFailureEvent,
  createContentReadFailureEvent,
  reportContentReadFailure,
  reportDatabaseHealthFailure
} from "../src/lib/content-observability.ts";

test("content read failures include a stable event name and route context", () => {
  assert.deepEqual(createContentReadFailureEvent({ scope: "home" }, new Error("D1 unavailable")), {
    event: "portfolio.content.read_failed",
    scope: "home",
    errorName: "Error",
    errorMessage: "D1 unavailable"
  });

  assert.deepEqual(createContentReadFailureEvent({ scope: "work", slug: "roii-hmi" }, "binding missing"), {
    event: "portfolio.content.read_failed",
    scope: "work",
    slug: "roii-hmi",
    errorName: "UnknownError",
    errorMessage: "binding missing"
  });
});

test("content failure reporting emits one sanitized structured event", () => {
  const secretPayload = { message: "query failed", password: "must-not-be-logged" };
  const calls: unknown[][] = [];

  reportContentReadFailure(
    { scope: "work", slug: "sample" },
    secretPayload,
    (...args: unknown[]) => calls.push(args)
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.[0], "[portfolio.content.read_failed]");
  assert.deepEqual(calls[0]?.[1], {
    event: "portfolio.content.read_failed",
    scope: "work",
    slug: "sample",
    errorName: "UnknownError",
    errorMessage: "query failed"
  });
  assert.equal(JSON.stringify(calls).includes("must-not-be-logged"), false);
});

test("database health failures use a stable dependency event", () => {
  assert.deepEqual(createDatabaseHealthFailureEvent(new Error("binding unavailable")), {
    event: "portfolio.health.database_unavailable",
    dependency: "D1",
    errorName: "Error",
    errorMessage: "binding unavailable"
  });

  const calls: unknown[][] = [];
  reportDatabaseHealthFailure({ message: "schema missing", token: "do-not-log" }, (...args) => calls.push(args));

  assert.equal(calls[0]?.[0], "[portfolio.health.database_unavailable]");
  assert.equal(JSON.stringify(calls).includes("do-not-log"), false);
});
