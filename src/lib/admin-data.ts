import { getD1 } from "./db";
import type { Profile, TimelineItem, WorkBlock, WorkItem } from "../types";
import type { z } from "zod";
import type { profileSchema, timelineSchema, workSchema } from "./validation";

type ProfileInput = z.infer<typeof profileSchema>;
type TimelineInput = z.infer<typeof timelineSchema>;
type WorkInput = z.infer<typeof workSchema>;

type AssetRow = {
  id: string;
  r2_key: string;
  alt: string;
  mime: string;
  width: number | null;
  height: number | null;
  size: number;
  created_at: string;
};

type ProfileRow = {
  headline: string;
  name: string;
  role: string;
  intro: string;
  bio: string;
  portrait_asset_id: string | null;
  links: string;
  portrait_key: string | null;
  portrait_alt: string | null;
  portrait_mime: string | null;
  portrait_width: number | null;
  portrait_height: number | null;
};

type TimelineRow = {
  id: string;
  period: string;
  title: string;
  organization: string;
  description: string;
  sort_order: number;
};

type WorkRow = {
  id: string;
  slug: string;
  title: string;
  category: WorkItem["category"];
  summary: string;
  client: string;
  year: string;
  role: string;
  thumbnail_asset_id: string | null;
  featured_thumbnail_asset_id: string | null;
  hero_asset_id: string | null;
  featured: number;
  published: number;
  sort_order: number;
  thumbnail_key: string | null;
  thumbnail_alt: string | null;
  featured_thumbnail_key: string | null;
  featured_thumbnail_alt: string | null;
  hero_key: string | null;
  hero_alt: string | null;
};

type BlockRow = {
  id: string;
  work_id: string;
  type: WorkBlock["type"];
  content: string;
  sort_order: number;
};

const mediaUrl = (key: string | null | undefined) => {
  if (!key) return null;
  return `/media/${key.split("/").map(encodeURIComponent).join("/")}`;
};

const parseJsonArray = <T>(value: string, fallback: T[]) => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
};

const parseContent = (value: string) => {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

const toProfile = (row: ProfileRow): Profile => ({
  headline: row.headline,
  name: row.name,
  role: row.role,
  intro: row.intro,
  bio: row.bio,
  portraitAssetId: row.portrait_asset_id,
  portrait: row.portrait_key
    ? {
        id: row.portrait_asset_id,
        url: mediaUrl(row.portrait_key),
        alt: row.portrait_alt,
        mime: row.portrait_mime,
        width: row.portrait_width,
        height: row.portrait_height
      }
    : null,
  links: parseJsonArray(row.links, [])
});

const toTimeline = (row: TimelineRow): TimelineItem => ({
  id: row.id,
  period: row.period,
  title: row.title,
  organization: row.organization,
  description: row.description,
  sortOrder: row.sort_order
});

const toWork = (row: WorkRow, blocks: WorkBlock[] = []): WorkItem => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  category: row.category,
  summary: row.summary,
  client: row.client,
  year: row.year,
  role: row.role,
  featured: Boolean(row.featured),
  published: Boolean(row.published),
  sortOrder: row.sort_order,
  thumbnailAssetId: row.thumbnail_asset_id,
  featuredThumbnailAssetId: row.featured_thumbnail_asset_id,
  heroAssetId: row.hero_asset_id,
  thumbnail: row.thumbnail_key
    ? {
        id: row.thumbnail_asset_id,
        url: mediaUrl(row.thumbnail_key),
        alt: row.thumbnail_alt
    }
    : null,
  featuredThumbnail: row.featured_thumbnail_key
    ? {
        id: row.featured_thumbnail_asset_id,
        url: mediaUrl(row.featured_thumbnail_key),
        alt: row.featured_thumbnail_alt
      }
    : null,
  hero: row.hero_key
    ? {
        id: row.hero_asset_id,
        url: mediaUrl(row.hero_key),
        alt: row.hero_alt
      }
    : null,
  blocks
});

const toBlock = (row: BlockRow): WorkBlock => ({
  id: row.id,
  type: row.type,
  content: parseContent(row.content),
  sortOrder: row.sort_order
});

export const readProfile = async () => {
  const row = await getD1()
    .prepare(
      `SELECT p.*, a.r2_key AS portrait_key, a.alt AS portrait_alt, a.mime AS portrait_mime,
        a.width AS portrait_width, a.height AS portrait_height
      FROM profile p
      LEFT JOIN assets a ON a.id = p.portrait_asset_id
      WHERE p.id = 'main'`
    )
    .first<ProfileRow>();

  return row ? toProfile(row) : null;
};

export const updateProfile = async (input: ProfileInput) => {
  await getD1()
    .prepare(
      `INSERT INTO profile (id, headline, name, role, intro, bio, portrait_asset_id, links, updated_at)
      VALUES ('main', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        headline = excluded.headline,
        name = excluded.name,
        role = excluded.role,
        intro = excluded.intro,
        bio = excluded.bio,
        portrait_asset_id = excluded.portrait_asset_id,
        links = excluded.links,
        updated_at = CURRENT_TIMESTAMP`
    )
    .bind(
      input.headline,
      input.name,
      input.role,
      input.intro,
      input.bio,
      input.portraitAssetId ?? null,
      JSON.stringify(input.links)
    )
    .run();

  return readProfile();
};

export const listTimeline = async () => {
  const result = await getD1()
    .prepare("SELECT * FROM timeline_items ORDER BY sort_order ASC, created_at ASC")
    .all<TimelineRow>();
  return (result.results as TimelineRow[]).map(toTimeline);
};

export const createTimeline = async (input: TimelineInput) => {
  const id = crypto.randomUUID();
  const max = await getD1()
    .prepare("SELECT COALESCE(MAX(sort_order), 0) AS value FROM timeline_items")
    .first<{ value: number }>();

  await getD1()
    .prepare(
      `INSERT INTO timeline_items (id, period, title, organization, description, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, input.period, input.title, input.organization, input.description, input.sortOrder ?? (max?.value ?? 0) + 1)
    .run();

  return listTimeline();
};

export const updateTimeline = async (id: string, input: TimelineInput) => {
  const result = await getD1()
    .prepare(
      `UPDATE timeline_items
      SET period = ?, title = ?, organization = ?, description = ?, sort_order = COALESCE(?, sort_order),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    )
    .bind(input.period, input.title, input.organization, input.description, input.sortOrder ?? null, id)
    .run();

  return result.meta.changes > 0 ? listTimeline() : null;
};

export const deleteTimeline = async (id: string) => {
  await getD1().prepare("DELETE FROM timeline_items WHERE id = ?").bind(id).run();
  return listTimeline();
};

export const listWorks = async () => {
  const worksResult = await getD1()
    .prepare(
      `SELECT w.*, thumb.r2_key AS thumbnail_key, thumb.alt AS thumbnail_alt,
        featured_thumb.r2_key AS featured_thumbnail_key, featured_thumb.alt AS featured_thumbnail_alt,
        hero.r2_key AS hero_key, hero.alt AS hero_alt
      FROM works w
      LEFT JOIN assets thumb ON thumb.id = w.thumbnail_asset_id
      LEFT JOIN assets featured_thumb ON featured_thumb.id = w.featured_thumbnail_asset_id
      LEFT JOIN assets hero ON hero.id = w.hero_asset_id
      ORDER BY w.sort_order ASC, w.created_at ASC`
    )
    .all<WorkRow>();

  const blocksResult = await getD1()
    .prepare("SELECT * FROM work_blocks ORDER BY sort_order ASC, created_at ASC")
    .all<BlockRow>();

  const blocksByWork = new Map<string, WorkBlock[]>();
  (blocksResult.results as BlockRow[]).forEach((row: BlockRow) => {
    const blocks = blocksByWork.get(row.work_id) ?? [];
    blocks.push(toBlock(row));
    blocksByWork.set(row.work_id, blocks);
  });

  return (worksResult.results as WorkRow[]).map((row: WorkRow) => toWork(row, blocksByWork.get(row.id) ?? []));
};

export const createWork = async (input: WorkInput) => {
  const id = crypto.randomUUID();
  const max = await getD1().prepare("SELECT COALESCE(MAX(sort_order), 0) AS value FROM works").first<{ value: number }>();

  await getD1()
    .prepare(
      `INSERT INTO works (
        id, slug, title, category, summary, client, year, role,
        thumbnail_asset_id, featured_thumbnail_asset_id, hero_asset_id, featured, published, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.slug,
      input.title,
      input.category,
      input.summary,
      input.client,
      input.year,
      input.role,
      input.thumbnailAssetId ?? null,
      input.featuredThumbnailAssetId ?? null,
      input.heroAssetId ?? null,
      input.featured ? 1 : 0,
      input.published ? 1 : 0,
      input.sortOrder ?? (max?.value ?? 0) + 1
    )
    .run();

  if (input.blocks.length) {
    await replaceWorkBlocks(id, input.blocks);
  }

  return listWorks();
};

export const replaceWorkBlocks = async (workId: string, blocks: WorkInput["blocks"]) => {
  const db = getD1();
  const statements = [
    db.prepare("DELETE FROM work_blocks WHERE work_id = ?").bind(workId),
    ...blocks.map((block, index) =>
      db
        .prepare("INSERT INTO work_blocks (id, work_id, type, content, sort_order) VALUES (?, ?, ?, ?, ?)")
        .bind(
          block.id ?? crypto.randomUUID(),
          workId,
          block.type,
          JSON.stringify(block.content),
          block.sortOrder ?? index + 1
        )
    )
  ];

  await db.batch(statements);
};

export const updateWork = async (id: string, input: WorkInput) => {
  const db = getD1();
  const result = await db
    .prepare(
      `UPDATE works SET
        slug = ?, title = ?, category = ?, summary = ?, client = ?, year = ?, role = ?,
        thumbnail_asset_id = ?, featured_thumbnail_asset_id = ?, hero_asset_id = ?, featured = ?, published = ?,
        sort_order = COALESCE(?, sort_order), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    )
    .bind(
      input.slug,
      input.title,
      input.category,
      input.summary,
      input.client,
      input.year,
      input.role,
      input.thumbnailAssetId ?? null,
      input.featuredThumbnailAssetId ?? null,
      input.heroAssetId ?? null,
      input.featured ? 1 : 0,
      input.published ? 1 : 0,
      input.sortOrder ?? null,
      id
    )
    .run();

  if (result.meta.changes === 0) return null;

  await replaceWorkBlocks(id, input.blocks);
  return listWorks();
};

export const deleteWork = async (id: string) => {
  await getD1().prepare("DELETE FROM works WHERE id = ?").bind(id).run();
  return listWorks();
};

export const createAssetRecord = async (asset: Omit<AssetRow, "created_at">) => {
  await getD1()
    .prepare("INSERT INTO assets (id, r2_key, alt, mime, width, height, size) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(asset.id, asset.r2_key, asset.alt, asset.mime, asset.width, asset.height, asset.size)
    .run();

  return {
    id: asset.id,
    url: mediaUrl(asset.r2_key),
    alt: asset.alt,
    mime: asset.mime,
    width: asset.width,
    height: asset.height,
    size: asset.size
  };
};

export const reorderItems = async (type: "timeline" | "works" | "blocks", ids: string[], workId?: string) => {
  const db = getD1();
  const table = type === "timeline" ? "timeline_items" : type === "works" ? "works" : "work_blocks";

  if (type === "blocks" && !workId) {
    throw new Error("workId is required when reordering blocks.");
  }

  const statements = ids.map((id, index) => {
    if (type === "blocks") {
      return db
        .prepare("UPDATE work_blocks SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND work_id = ?")
        .bind(index + 1, id, workId ?? "");
    }

    return db.prepare(`UPDATE ${table} SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(index + 1, id);
  });

  await db.batch(statements);
};
