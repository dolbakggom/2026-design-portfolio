import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildUploadedImageKeys,
  detectImageMime,
  fitImageDimensions,
  MAX_IMAGE_DIMENSION,
  parseImageVariantManifest
} from "../src/lib/image-upload.ts";

test("large landscape images are reduced to the maximum dimension", () => {
  assert.deepEqual(fitImageDimensions(6000, 4000), { width: MAX_IMAGE_DIMENSION, height: 1707 });
});

test("large portrait images preserve their aspect ratio", () => {
  assert.deepEqual(fitImageDimensions(3000, 4500), { width: 1707, height: MAX_IMAGE_DIMENSION });
});

test("small images are not enlarged", () => {
  assert.deepEqual(fitImageDimensions(1200, 800), { width: 1200, height: 800 });
});

test("invalid image dimensions are rejected", () => {
  assert.throws(() => fitImageDimensions(0, 800), /Invalid image dimensions/);
});

test("image MIME detection uses file signatures instead of request metadata", () => {
  assert.equal(detectImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(detectImageMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  assert.equal(
    detectImageMime(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])),
    "image/webp"
  );
  assert.equal(detectImageMime(new TextEncoder().encode("GIF89a")), "image/gif");
  assert.equal(detectImageMime(new TextEncoder().encode("<script>")), null);
});

test("variant manifests are validated and sorted by width", () => {
  assert.deepEqual(
    parseImageVariantManifest(
      JSON.stringify([
        { field: "file", width: 1920, height: 1080, mime: "image/webp" },
        { field: "variant-0", width: 640, height: 360, mime: "image/webp" },
        { field: "variant-1", width: 1280, height: 720, mime: "image/webp" }
      ])
    ),
    [
      { field: "variant-0", width: 640, height: 360, mime: "image/webp" },
      { field: "variant-1", width: 1280, height: 720, mime: "image/webp" },
      { field: "file", width: 1920, height: 1080, mime: "image/webp" }
    ]
  );
});

test("variant manifests reject duplicate widths", () => {
  assert.throws(
    () =>
      parseImageVariantManifest(
        JSON.stringify([
          { field: "variant-0", width: 640, height: 360, mime: "image/webp" },
          { field: "file", width: 640, height: 360, mime: "image/webp" }
        ])
      ),
    /unique/
  );
});

test("variant manifests reject more than four entries", () => {
  assert.throws(
    () =>
      parseImageVariantManifest(
        JSON.stringify(
          Array.from({ length: 5 }, (_, index) => ({
            field: index === 4 ? "file" : `variant-${index}`,
            width: (index + 1) * 320,
            height: (index + 1) * 180,
            mime: "image/webp"
          }))
        )
      ),
    /at most 4/
  );
});

test("rollback key construction includes every uploaded object once", () => {
  assert.deepEqual(
    buildUploadedImageKeys("uploads/2026/07/asset.webp", [
      "variants/2026/07/asset-640w.webp",
      "uploads/2026/07/asset.webp",
      "variants/2026/07/asset-1280w.webp"
    ]),
    [
      "uploads/2026/07/asset.webp",
      "variants/2026/07/asset-640w.webp",
      "variants/2026/07/asset-1280w.webp"
    ]
  );
});
