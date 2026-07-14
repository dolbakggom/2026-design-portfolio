import assert from "node:assert/strict";
import { test } from "node:test";
import {
  attachAssetVariants,
  buildResponsiveImageSource,
  selectVariantWidths,
  variantDimensions
} from "../src/lib/responsive-images.ts";

test("responsive variant widths include useful breakpoints and the fitted source width", () => {
  assert.deepEqual(selectVariantWidths(2400), [640, 1280, 1920, 2400]);
  assert.deepEqual(selectVariantWidths(1100), [640, 1100]);
  assert.deepEqual(selectVariantWidths(500), [500]);
});

test("variant dimensions preserve portrait aspect ratio", () => {
  assert.deepEqual(variantDimensions(1920, 2560, 640), { width: 640, height: 853 });
  assert.deepEqual(variantDimensions(1600, 900, 1280), { width: 1280, height: 720 });
});

test("responsive sources sort and deduplicate width descriptors and prefer the largest variant fallback", () => {
  const source = buildResponsiveImageSource({
    id: "asset-1",
    url: "/media/uploads/original.png",
    mime: "image/png",
    width: 3200,
    height: 1800,
    variants: [
      { url: "/media/variants/asset-1-1280.webp", mime: "image/webp", width: 1280, height: 720, size: 100 },
      { url: "/media/variants/asset-1-640.webp", mime: "image/webp", width: 640, height: 360, size: 50 },
      { url: "/media/variants/asset-1-1280-duplicate.webp", mime: "image/webp", width: 1280, height: 720, size: 110 },
      { url: "/media/variants/asset-1-2560.webp", mime: "image/webp", width: 2560, height: 1440, size: 220 }
    ]
  });

  assert.deepEqual(source, {
    src: "/media/variants/asset-1-2560.webp",
    srcset: "/media/variants/asset-1-640.webp 640w, /media/variants/asset-1-1280.webp 1280w, /media/variants/asset-1-2560.webp 2560w"
  });
});

test("GIF and empty assets keep a single safe fallback", () => {
  assert.deepEqual(
    buildResponsiveImageSource({
      url: "/media/uploads/animated.gif",
      mime: "image/gif",
      variants: [{ url: "/media/variants/animated-640.webp", mime: "image/webp", width: 640, height: 360, size: 50 }]
    }),
    { src: "/media/uploads/animated.gif" }
  );
  assert.deepEqual(buildResponsiveImageSource(null), { src: "" });
});

test("asset enrichment prefers attached variants while preserving canonical fallback", () => {
  const canonical = {
    id: "asset-1",
    url: "/media/uploads/original.jpg",
    mime: "image/jpeg",
    width: 1920,
    height: 1080
  };
  const variants = new Map([
    [
      "asset-1",
      [{ url: "/media/variants/asset-1-1280.webp", mime: "image/webp", width: 1280, height: 720, size: 100 }]
    ]
  ]);

  assert.equal(buildResponsiveImageSource(attachAssetVariants(canonical, variants)).src, "/media/variants/asset-1-1280.webp");
  assert.deepEqual(attachAssetVariants({ ...canonical, id: "asset-2" }, variants), { ...canonical, id: "asset-2" });
});
