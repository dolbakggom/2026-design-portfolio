import assert from "node:assert/strict";
import { test } from "node:test";
import { buildBackfillPlan, parseBackfillArgs, resolveAssetDimensions } from "../scripts/backfill-image-variants.mjs";

test("backfill arguments require one mode and select the target environment", () => {
  assert.deepEqual(parseBackfillArgs(["--dry-run", "--remote"]), { apply: false, remote: true });
  assert.deepEqual(parseBackfillArgs(["--apply", "--local"]), { apply: true, remote: false });
  assert.throws(() => parseBackfillArgs(["--remote"]), /dry-run.*apply/i);
});

test("backfill planning skips GIFs and existing variant widths", () => {
  assert.deepEqual(
    buildBackfillPlan(
      { id: "asset-1", r2_key: "uploads/original.jpg", mime: "image/jpeg", width: 2400, height: 1600, size: 9000 },
      new Set([640, 1920])
    ).map((variant) => variant.width),
    [1280, 2400]
  );
  assert.deepEqual(
    buildBackfillPlan(
      { id: "asset-2", r2_key: "uploads/animated.gif", mime: "image/gif", width: 1200, height: 800, size: 9000 },
      new Set()
    ),
    []
  );
});

test("missing stored dimensions are recovered from inspected image metadata", () => {
  assert.deepEqual(
    resolveAssetDimensions(
      { id: "asset-3", width: null, height: null, size: 1000 },
      { width: 3000, height: 2000 }
    ),
    { id: "asset-3", width: 3000, height: 2000, size: 1000 }
  );
  assert.throws(() => resolveAssetDimensions({ id: "asset-4", width: null, height: null }, {}), /dimensions/i);
});
