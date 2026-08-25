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

test("website blocks accept public links and only portfolio-hosted preview images", () => {
  const parsed = workSchema.parse({
    ...validWork,
    blocks: [
      {
        type: "website",
        content: {
          url: "https://example.com/project",
          title: "Custom project title",
          description: "Custom project description",
          domain: "example.com",
          imageAssetId: "asset-website",
          imageUrl: "/media/website/2026/08/preview.webp",
          imageAlt: "Website preview"
        }
      }
    ]
  });

  assert.equal(parsed.blocks[0]?.type, "website");
  assert.equal(parsed.blocks[0]?.content.title, "Custom project title");
  assert.equal(
    workSchema.safeParse({
      ...validWork,
      blocks: [{ type: "website", content: { url: "javascript:alert(1)", imageUrl: "" } }]
    }).success,
    false
  );
  assert.equal(
    workSchema.safeParse({
      ...validWork,
      blocks: [{ type: "website", content: { url: "https://example.com", imageUrl: "https://example.com/og.jpg" } }]
    }).success,
    false
  );
});

test("divider blocks normalize to empty content", () => {
  const parsed = workSchema.parse({
    ...validWork,
    blocks: [{ type: "divider", content: { unexpected: "discarded" } }]
  });

  assert.equal(parsed.blocks[0]?.type, "divider");
  assert.deepEqual(parsed.blocks[0]?.content, {});
  assert.deepEqual(normalizeStoredWorkBlockContent("divider", { legacy: true }), {});
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
      blockWidth: "100%",
      align: "left"
    }
  );
});

test("new text block payloads default to full content width", () => {
  const parsed = workSchema.parse({
    ...validWork,
    blocks: [
      { type: "heading", content: { text: "Full heading" } },
      { type: "paragraph", content: { html: "<p>Full paragraph</p>" } },
      { type: "quote", content: { html: "<blockquote>Full quote</blockquote>" } }
    ]
  });

  assert.deepEqual(parsed.blocks.map((block) => block.content.blockWidth), ["100%", "100%", "100%"]);
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
