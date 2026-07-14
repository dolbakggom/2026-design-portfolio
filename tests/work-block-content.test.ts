import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeStoredWorkBlockContent } from "../src/lib/work-block-content.ts";
import { profileSchema, workSchema } from "../src/lib/validation.ts";

const validWork = {
  slug: "sample-work",
  title: "Sample work",
  category: "UI/UX" as const,
  summary: "",
  client: "",
  year: "2026",
  role: "Design",
  featured: false,
  published: true
};

test("profile intro is sanitized before it reaches storage", () => {
  const parsed = profileSchema.parse({
    headline: "Beyond the Answer.",
    name: "SiHyeon",
    role: "Designer",
    intro: '<p onclick="alert(1)">Hello <strong>there</strong><script>alert(1)</script></p>',
    bio: "Bio",
    links: []
  });

  assert.equal(parsed.intro, "<p>Hello <strong>there</strong></p>");
});

test("work text blocks sanitize HTML and discard unknown content fields", () => {
  const parsed = workSchema.parse({
    ...validWork,
    blocks: [
      {
        id: "block-1",
        type: "paragraph",
        content: {
          html: '<p style="color:red">Hello <em>world</em><img src=x onerror=alert(1)></p>',
          lineHeight: "1.7",
          paragraphGap: "18px",
          blockWidth: "880px",
          align: "left",
          injected: "discard me"
        }
      }
    ]
  });

  assert.deepEqual(parsed.blocks[0]?.content, {
    html: "<p>Hello <em>world</em></p>",
    lineHeight: "1.7",
    paragraphGap: "18px",
    blockWidth: "880px",
    align: "left"
  });
});

test("work media blocks reject executable or off-site image URLs", () => {
  for (const url of ["javascript:alert(1)", "data:image/svg+xml,<svg></svg>", "https://example.com/image.jpg", "/media/../admin"]) {
    const parsed = workSchema.safeParse({
      ...validWork,
      blocks: [{ type: "image", content: { url, alt: "Unsafe" } }]
    });

    assert.equal(parsed.success, false, url);
  }

  assert.equal(
    workSchema.safeParse({
      ...validWork,
      blocks: [{ type: "image", content: { assetId: "asset-1", url: "/media/uploads/work/image.webp", alt: "Safe" } }]
    }).success,
    true
  );
});

test("stored block normalization preserves safe legacy copy while repairing malformed options", () => {
  assert.deepEqual(
    normalizeStoredWorkBlockContent("paragraph", {
      html: '<p onfocus="alert(1)">Legacy <strong>copy</strong><script>alert(1)</script></p>',
      lineHeight: "999",
      unknown: true
    }),
    {
      html: "<p>Legacy <strong>copy</strong></p>",
      lineHeight: "1.7",
      paragraphGap: "18px",
      blockWidth: "880px",
      align: "left"
    }
  );
});

test("work payloads cap block and gallery collection sizes", () => {
  const tooManyImages = Array.from({ length: 25 }, (_, index) => ({
    assetId: `asset-${index}`,
    url: `/media/uploads/work/${index}.webp`,
    alt: `Image ${index}`
  }));
  const tooManyBlocks = Array.from({ length: 101 }, (_, index) => ({
    id: `block-${index}`,
    type: "heading" as const,
    content: { text: `Heading ${index}` }
  }));

  assert.equal(
    workSchema.safeParse({ ...validWork, blocks: [{ type: "gallery", content: { images: tooManyImages } }] }).success,
    false
  );
  assert.equal(workSchema.safeParse({ ...validWork, blocks: tooManyBlocks }).success, false);
});
