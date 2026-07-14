import { z } from "zod";
import type { WorkBlockType } from "../types";
import { sanitizeRichTextHtml } from "./content-sanitizer.ts";

const lineHeightSchema = z.enum(["1.3", "1.5", "1.7", "1.9"]);
const paragraphGapSchema = z.enum(["0px", "10px", "18px", "28px"]);
const blockWidthSchema = z.enum(["680px", "880px", "1080px", "100%"]);
const alignSchema = z.enum(["left", "center"]);

const isSafeMediaUrl = (value: string) => {
  if (value === "") return true;

  try {
    const url = new URL(value, "https://dolbakggom.com");
    if (url.origin !== "https://dolbakggom.com" || !url.pathname.startsWith("/media/") || url.search || url.hash) {
      return false;
    }

    return url.pathname
      .slice("/media/".length)
      .split("/")
      .every((segment) => {
        try {
          const decoded = decodeURIComponent(segment);
          return decoded !== "" && decoded !== "." && decoded !== ".." && !decoded.includes("/") && !decoded.includes("\\");
        } catch {
          return false;
        }
      });
  } catch {
    return false;
  }
};

const textStyleShape = {
  lineHeight: lineHeightSchema,
  blockWidth: blockWidthSchema,
  align: alignSchema
};

const dimensionSchema = z.number().int().min(1).max(50_000).nullable().optional();

const mediaItemSchema = z.object({
  assetId: z.string().max(160).nullable().optional(),
  url: z.string().max(1200).refine(isSafeMediaUrl, "Unsupported media URL").default(""),
  alt: z.string().max(500).default(""),
  width: dimensionSchema,
  height: dimensionSchema
});

const headingContentSchema = z.object({
  text: z.string().max(500).default(""),
  lineHeight: textStyleShape.lineHeight.default("1.3"),
  blockWidth: textStyleShape.blockWidth.default("880px"),
  align: textStyleShape.align.default("left")
});

const paragraphContentSchema = z.object({
  html: z.string().max(100_000).transform(sanitizeRichTextHtml).default("<p></p>"),
  lineHeight: textStyleShape.lineHeight.default("1.7"),
  paragraphGap: paragraphGapSchema.default("18px"),
  blockWidth: textStyleShape.blockWidth.default("880px"),
  align: textStyleShape.align.default("left")
});

const quoteContentSchema = z.object({
  html: z.string().max(100_000).transform(sanitizeRichTextHtml).default("<blockquote></blockquote>"),
  lineHeight: textStyleShape.lineHeight.default("1.5"),
  paragraphGap: paragraphGapSchema.default("18px"),
  blockWidth: textStyleShape.blockWidth.default("880px"),
  align: textStyleShape.align.default("left")
});

const imageContentSchema = mediaItemSchema.extend({
  caption: z.string().max(1200).default("")
});

const galleryContentSchema = z.object({
  images: z.array(mediaItemSchema).max(24).default([])
});

const blockBaseShape = {
  id: z.string().max(160).optional(),
  sortOrder: z.number().int().min(0).optional()
};

const fallbackContent = {
  heading: { text: "", lineHeight: "1.3", blockWidth: "880px", align: "left" },
  paragraph: { html: "<p></p>", lineHeight: "1.7", paragraphGap: "18px", blockWidth: "880px", align: "left" },
  image: { url: "", alt: "", caption: "" },
  gallery: { images: [] },
  quote: { html: "<blockquote></blockquote>", lineHeight: "1.5", paragraphGap: "18px", blockWidth: "880px", align: "left" }
} as const satisfies Record<WorkBlockType, Record<string, unknown>>;

export const workBlockSchema = z.discriminatedUnion("type", [
  z.object({ ...blockBaseShape, type: z.literal("heading"), content: headingContentSchema.default(fallbackContent.heading) }),
  z.object({ ...blockBaseShape, type: z.literal("paragraph"), content: paragraphContentSchema.default(fallbackContent.paragraph) }),
  z.object({ ...blockBaseShape, type: z.literal("image"), content: imageContentSchema.default(fallbackContent.image) }),
  z.object({ ...blockBaseShape, type: z.literal("gallery"), content: galleryContentSchema.default(() => ({ images: [] })) }),
  z.object({ ...blockBaseShape, type: z.literal("quote"), content: quoteContentSchema.default(fallbackContent.quote) })
]);

const contentSchemas = {
  heading: headingContentSchema,
  paragraph: paragraphContentSchema,
  image: imageContentSchema,
  gallery: galleryContentSchema,
  quote: quoteContentSchema
} satisfies Record<WorkBlockType, z.ZodType>;

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const safeString = (value: unknown, maxLength: number, fallback = "") =>
  typeof value === "string" ? value.slice(0, maxLength) : fallback;

const safeOption = <T extends string>(schema: z.ZodType<T>, value: unknown, fallback: T) => {
  const parsed = schema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
};

const safeDimension = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 50_000 ? value : undefined;

const normalizeStoredMediaItem = (value: unknown) => {
  const item = asRecord(value);
  const assetId = item.assetId === null ? null : safeString(item.assetId, 160) || undefined;
  const candidateUrl = safeString(item.url, 1200);

  return {
    ...(assetId !== undefined ? { assetId } : {}),
    url: isSafeMediaUrl(candidateUrl) ? candidateUrl : "",
    alt: safeString(item.alt, 500),
    ...(safeDimension(item.width) ? { width: safeDimension(item.width) } : {}),
    ...(safeDimension(item.height) ? { height: safeDimension(item.height) } : {})
  };
};

export const normalizeStoredWorkBlockContent = (type: WorkBlockType, content: unknown): Record<string, unknown> => {
  const parsed = contentSchemas[type].safeParse(content);
  if (parsed.success) return parsed.data as Record<string, unknown>;

  const value = asRecord(content);

  if (type === "heading") {
    return {
      text: safeString(value.text, 500),
      lineHeight: safeOption(lineHeightSchema, value.lineHeight, "1.3"),
      blockWidth: safeOption(blockWidthSchema, value.blockWidth, "880px"),
      align: safeOption(alignSchema, value.align, "left")
    };
  }

  if (type === "paragraph" || type === "quote") {
    const isQuote = type === "quote";
    const fallbackHtml = isQuote ? "<blockquote></blockquote>" : "<p></p>";
    const rawHtml = safeString(value.html, 100_000, fallbackHtml);

    return {
      html: sanitizeRichTextHtml(rawHtml),
      lineHeight: safeOption(lineHeightSchema, value.lineHeight, isQuote ? "1.5" : "1.7"),
      paragraphGap: safeOption(paragraphGapSchema, value.paragraphGap, "18px"),
      blockWidth: safeOption(blockWidthSchema, value.blockWidth, "880px"),
      align: safeOption(alignSchema, value.align, "left")
    };
  }

  if (type === "image") {
    return {
      ...normalizeStoredMediaItem(value),
      caption: safeString(value.caption, 1200)
    };
  }

  const images = Array.isArray(value.images)
    ? value.images
        .slice(0, 24)
        .map(normalizeStoredMediaItem)
        .filter((image) => image.url !== "")
    : [];

  return { images };
};
