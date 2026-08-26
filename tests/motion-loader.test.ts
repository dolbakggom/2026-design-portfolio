import assert from "node:assert/strict";
import { test } from "node:test";
import { getReducedMotionTarget, shouldLoadMotion } from "../src/lib/motion-loader.ts";

test("motion runtime stays off detail pages and reduced-motion home pages", () => {
  assert.equal(shouldLoadMotion({ route: "/work/roii-hmi", reducedMotion: false, intent: "wheel" }), false);
  assert.equal(shouldLoadMotion({ route: "/", reducedMotion: true, intent: "idle" }), false);
});

test("direct home aliases initialize immediately", () => {
  assert.equal(shouldLoadMotion({ route: "/about", reducedMotion: false, intent: "initial" }), true);
  assert.equal(shouldLoadMotion({ route: "/career", reducedMotion: false, intent: "initial" }), true);
  assert.equal(shouldLoadMotion({ route: "/work", reducedMotion: false, intent: "initial" }), true);
});

test("root intro initializes immediately so the loader can hand off to motion", () => {
  assert.equal(shouldLoadMotion({ route: "/", reducedMotion: false, intent: "initial" }), true);
  assert.equal(shouldLoadMotion({ route: "/", reducedMotion: false, intent: "wheel" }), true);
  assert.equal(shouldLoadMotion({ route: "/", reducedMotion: false, intent: "touch" }), true);
  assert.equal(shouldLoadMotion({ route: "/", reducedMotion: false, intent: "keyboard" }), true);
  assert.equal(shouldLoadMotion({ route: "/", reducedMotion: false, intent: "idle" }), true);
});

test("reduced-motion aliases resolve to a static section and state", () => {
  assert.deepEqual(getReducedMotionTarget("/about"), { selector: "#about", career: false });
  assert.deepEqual(getReducedMotionTarget("/career"), { selector: "#about", career: true });
  assert.deepEqual(getReducedMotionTarget("/work"), { selector: "#work", career: false });
  assert.equal(getReducedMotionTarget("/"), null);
});
