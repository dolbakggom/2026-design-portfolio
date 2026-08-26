import assert from "node:assert/strict";
import test from "node:test";
import { createCubicBezierEasing, remapProgressWithDwell } from "../src/lib/scroll-dwell.ts";

const careerEase = createCubicBezierEasing(0.4, 0, 0.6, 1);
const anchors = [0, 0.25, 0.5, 0.75, 1];

test("career progress holds briefly around every card without changing its anchor", () => {
  assert.equal(remapProgressWithDwell(0.02, anchors, 0.12, careerEase), 0);
  assert.equal(remapProgressWithDwell(0.23, anchors, 0.12, careerEase), 0.25);
  assert.equal(remapProgressWithDwell(0.25, anchors, 0.12, careerEase), 0.25);
  assert.equal(remapProgressWithDwell(0.27, anchors, 0.12, careerEase), 0.25);
  assert.equal(remapProgressWithDwell(0.98, anchors, 0.12, careerEase), 1);
});

test("career progress uses the symmetric cubic bezier through each transition", () => {
  const midpoint = remapProgressWithDwell(0.375, anchors, 0.12, careerEase);
  assert.ok(Math.abs(midpoint - 0.375) < 0.0002);
});

test("career dwell remapping remains monotonic across the full scroll range", () => {
  const values = Array.from({ length: 201 }, (_, index) => (
    remapProgressWithDwell(index / 200, anchors, 0.12, careerEase)
  ));

  values.slice(1).forEach((value, index) => {
    assert.ok(value >= values[index], `progress moved backward at sample ${index + 1}`);
  });
});
