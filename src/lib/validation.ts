import { z } from "zod";

export const linkSchema = z.object({
  label: z.string().min(1).max(80),
  url: z.string().min(1).max(500)
});

export const profileSchema = z.object({
  headline: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  role: z.string().min(1).max(160),
  intro: z.string().min(1).max(500),
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

export const workBlockSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["heading", "paragraph", "image", "gallery", "quote"]),
  content: z.record(z.string(), z.unknown()).default({}),
  sortOrder: z.number().int().min(0).optional()
});

export const workSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(180),
  category: z.enum(["UI/UX", "BI/BX"]),
  summary: z.string().max(600).default(""),
  client: z.string().max(160).default(""),
  year: z.string().max(40).default(""),
  role: z.string().max(180).default(""),
  thumbnailAssetId: z.string().nullable().optional(),
  heroAssetId: z.string().nullable().optional(),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  sortOrder: z.number().int().min(0).optional(),
  blocks: z.array(workBlockSchema).default([])
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

export const reorderSchema = z.object({
  type: z.enum(["timeline", "works", "blocks"]),
  workId: z.string().optional(),
  ids: z.array(z.string()).min(1)
});
