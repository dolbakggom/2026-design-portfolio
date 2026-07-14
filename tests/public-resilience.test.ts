import assert from "node:assert/strict";
import { test } from "node:test";
import { getWorkFallback, hasImageLoadFailed } from "../src/lib/public-resilience.ts";

const fallbackWorks = [
  { slug: "sample", title: "Sample" },
  { slug: "another", title: "Another" }
];

test("a successful database miss does not resurrect starter work", () => {
  assert.equal(getWorkFallback("sample", fallbackWorks, false), null);
});

test("starter work remains available when the database itself is unavailable", () => {
  assert.deepEqual(getWorkFallback("sample", fallbackWorks, true), fallbackWorks[0]);
  assert.equal(getWorkFallback("missing", fallbackWorks, true), null);
});

test("only completed images without intrinsic width are treated as failed", () => {
  assert.equal(hasImageLoadFailed(false, 0), false);
  assert.equal(hasImageLoadFailed(true, 1200), false);
  assert.equal(hasImageLoadFailed(true, 0), true);
});
