import { z } from "zod";
import { sanitizeProfileIntro } from "./content-sanitizer.ts";
import { workBlockSchema } from "./work-block-content.ts";

const workCategories = ["UI/UX", "BI/BX", "UI/UX, BI/BX"] as const;

const isAllowedLinkUrl = (value: string) => {
  if (/^#[a-z][a-z0-9_-]*$/i.test(value)) return true;

  try {
    return ["http:", "https:", "mailto:", "tel:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

export const linkSchema = z.object({
  label: z.string().min(1).max(80),
  url: z.string().min(1).max(500).refine(isAllowedLinkUrl, "Unsupported link URL")
});

export const profileSchema = z.object({
  headline: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  role: z.string().max(160).default(""),
  intro: z.string().min(1).max(500).transform(sanitizeProfileIntro),
  bio: z.string().min(1).max(1600),
  portraitAssetId: z.string().nullable().optional(),
  links: z.array(linkSchema).max(8).default([])
});

export const timelineSchema = z.object({
  period: z.string().min(1).max(80),
  title: z.string().min(1).max(160),
  organization: z.string().max(160).default(""),
  description: z.string().max(1200).default(""),
  sortOrder: z.number().int().min(0).optional()
});

export const workSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(180),
  category: z.enum(workCategories),
  summary: z.string().max(600).default(""),
  client: z.string().max(160).default(""),
  year: z.string().max(40).default(""),
  role: z.string().max(180).default(""),
  thumbnailAssetId: z.string().nullable().optional(),
  featuredThumbnailAssetId: z.string().nullable().optional(),
  heroAssetId: z.string().nullable().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  sortOrder: z.number().int().min(0).optional(),
  blocks: z.array(workBlockSchema).max(100).default([])
});

export const websiteMetadataSchema = z.object({
  url: z.string().min(1).max(2000).refine((value) => {
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "Only HTTP and HTTPS website URLs are supported")
});

export const loginSchema = z.object({
  username: z.string().min(1).max(120),
  password: z.string().min(1).max(1024)
});

export const reorderSchema = z.object({
  type: z.enum(["timeline", "works", "blocks"]),
  workId: z.string().optional(),
  ids: z.array(z.string()).min(1)
});
