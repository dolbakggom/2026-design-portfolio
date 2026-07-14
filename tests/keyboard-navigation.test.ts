import assert from "node:assert/strict";
import { test } from "node:test";
import { getRovingTabIndex } from "../src/lib/keyboard-navigation.ts";

test("horizontal tab navigation wraps with arrow keys", () => {
  assert.equal(getRovingTabIndex(0, "ArrowLeft", 3), 2);
  assert.equal(getRovingTabIndex(2, "ArrowRight", 3), 0);
});

test("horizontal tab navigation supports Home and End", () => {
  assert.equal(getRovingTabIndex(1, "Home", 3), 0);
  assert.equal(getRovingTabIndex(1, "End", 3), 2);
});

test("horizontal tab navigation ignores unrelated keys and empty lists", () => {
  assert.equal(getRovingTabIndex(1, "Enter", 3), null);
  assert.equal(getRovingTabIndex(0, "ArrowRight", 0), null);
});
