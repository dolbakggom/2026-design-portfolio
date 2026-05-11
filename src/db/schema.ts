import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  r2Key: text("r2_key").notNull().unique(),
  alt: text("alt").notNull().default(""),
  mime: text("mime").notNull(),
  width: integer("width"),
  height: integer("height"),
  size: integer("size").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const profile = sqliteTable("profile", {
  id: text("id").primaryKey(),
  headline: text("headline").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  intro: text("intro").notNull(),
  bio: text("bio").notNull(),
  portraitAssetId: text("portrait_asset_id"),
  links: text("links").notNull().default("[]"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const timelineItems = sqliteTable("timeline_items", {
  id: text("id").primaryKey(),
  period: text("period").notNull(),
  title: text("title").notNull(),
  organization: text("organization").notNull().default(""),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const works = sqliteTable("works", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category", { enum: ["UI/UX", "BI/BX"] }).notNull(),
  summary: text("summary").notNull().default(""),
  client: text("client").notNull().default(""),
  year: text("year").notNull().default(""),
  role: text("role").notNull().default(""),
  thumbnailAssetId: text("thumbnail_asset_id"),
  featuredThumbnailAssetId: text("featured_thumbnail_asset_id"),
  heroAssetId: text("hero_asset_id"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const workBlocks = sqliteTable("work_blocks", {
  id: text("id").primaryKey(),
  workId: text("work_id").notNull(),
  type: text("type", { enum: ["heading", "paragraph", "image", "gallery", "quote"] }).notNull(),
  content: text("content").notNull().default("{}"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`)
});
