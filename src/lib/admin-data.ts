import { getD1 } from "./db";
import type { AssetVariant, Profile, TimelineItem, WorkBlock, WorkItem } from "../types";
import type { z } from "zod";
import { sanitizeProfileIntro } from "./content-sanitizer";
import type { profileSchema, timelineSchema, workSchema } from "./validation";
import { normalizeStoredWorkBlockContent } from "./work-block-content";
import { attachAssetVariants } from "./responsive-images";

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

type AssetVariantRecord = {
  width: number;
  height: number;
  r2_key: string;
  mime: string;
  size: number;
};

type AssetVariantRow = AssetVariantRecord & { asset_id: string };

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
  thumbnail_mime: string | null;
  thumbnail_width: number | null;
  thumbnail_height: number | null;
  featured_thumbnail_key: string | null;
  featured_thumbnail_alt: string | null;
  featured_thumbnail_mime: string | null;
  featured_thumbnail_width: number | null;
  featured_thumbnail_height: number | null;
  hero_key: string | null;
  hero_alt: string | null;
  hero_mime: string | null;
  hero_width: number | null;
  hero_height: number | null;
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

const loadAssetVariants = async (assetIds: Array<string | null | undefined>) => {
  const ids = [...new Set(assetIds.filter((id): id is string => Boolean(id)))];
  const variantsByAssetId = new Map<string, AssetVariant[]>();
  if (!ids.length) return variantsByAssetId;

  const result = await getD1()
    .prepare(
      `SELECT asset_id, r2_key, mime, width, height, size FROM asset_variants
      WHERE asset_id IN (${ids.map(() => "?").join(", ")})
      ORDER BY asset_id ASC, width ASC`
    )
    .bind(...ids)
    .all<AssetVariantRow>();

  for (const row of result.results as AssetVariantRow[]) {
    const variants = variantsByAssetId.get(row.asset_id) ?? [];
    variants.push({
      url: mediaUrl(row.r2_key) ?? "",
      mime: row.mime,
      width: row.width,
      height: row.height,
      size: row.size
    });
    variantsByAssetId.set(row.asset_id, variants);
  }

  return variantsByAssetId;
};

const enrichBlockAssets = (block: WorkBlock, variantsByAssetId: Map<string, AssetVariant[]>): WorkBlock => {
  if (block.type === "image" && typeof block.content.assetId === "string") {
    const variants = variantsByAssetId.get(block.content.assetId);
    return variants?.length ? { ...block, content: { ...block.content, variants } } : block;
  }
  if (block.type !== "gallery" || !Array.isArray(block.content.images)) return block;
  return {
    ...block,
    content: {
      ...block.content,
      images: block.content.images.map((image) => {
        if (!image || typeof image !== "object" || !("assetId" in image) || typeof image.assetId !== "string") return image;
        const variants = variantsByAssetId.get(image.assetId);
        return variants?.length ? { ...image, variants } : image;
      })
    }
  };
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
  intro: sanitizeProfileIntro(row.intro),
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
        alt: row.thumbnail_alt,
        mime: row.thumbnail_mime,
        width: row.thumbnail_width,
        height: row.thumbnail_height
    }
    : null,
  featuredThumbnail: row.featured_thumbnail_key
    ? {
        id: row.featured_thumbnail_asset_id,
        url: mediaUrl(row.featured_thumbnail_key),
        alt: row.featured_thumbnail_alt,
        mime: row.featured_thumbnail_mime,
        width: row.featured_thumbnail_width,
        height: row.featured_thumbnail_height
      }
    : null,
  hero: row.hero_key
    ? {
        id: row.hero_asset_id,
        url: mediaUrl(row.hero_key),
        alt: row.hero_alt,
        mime: row.hero_mime,
        width: row.hero_width,
        height: row.hero_height
      }
    : null,
  blocks
});

const toBlock = (row: BlockRow): WorkBlock => ({
  id: row.id,
  type: row.type,
  content: normalizeStoredWorkBlockContent(row.type, parseContent(row.content)),
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

  if (!row) return null;
  const profile = toProfile(row);
  const variantsByAssetId = await loadAssetVariants([profile.portraitAssetId]);
  return { ...profile, portrait: attachAssetVariants(profile.portrait, variantsByAssetId) };
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
      `SELECT w.*, thumb.r2_key AS thumbnail_key, thumb.alt AS thumbnail_alt, thumb.mime AS thumbnail_mime,
        thumb.width AS thumbnail_width, thumb.height AS thumbnail_height,
        featured_thumb.r2_key AS featured_thumbnail_key, featured_thumb.alt AS featured_thumbnail_alt,
        featured_thumb.mime AS featured_thumbnail_mime, featured_thumb.width AS featured_thumbnail_width,
        featured_thumb.height AS featured_thumbnail_height,
        hero.r2_key AS hero_key, hero.alt AS hero_alt, hero.mime AS hero_mime,
        hero.width AS hero_width, hero.height AS hero_height
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

  const works = (worksResult.results as WorkRow[]).map((row: WorkRow) => toWork(row, blocksByWork.get(row.id) ?? []));
  const blockIds = works.flatMap((work) =>
    (work.blocks ?? []).flatMap((block) => {
      if (block.type === "image") return typeof block.content.assetId === "string" ? [block.content.assetId] : [];
      if (block.type !== "gallery" || !Array.isArray(block.content.images)) return [];
      return block.content.images.flatMap((image) =>
        image && typeof image === "object" && "assetId" in image && typeof image.assetId === "string" ? [image.assetId] : []
      );
    })
  );
  const variantsByAssetId = await loadAssetVariants([
    ...works.flatMap((work) => [work.thumbnailAssetId, work.featuredThumbnailAssetId, work.heroAssetId]),
    ...blockIds
  ]);

  return works.map((work) => ({
    ...work,
    thumbnail: attachAssetVariants(work.thumbnail, variantsByAssetId),
    featuredThumbnail: attachAssetVariants(work.featuredThumbnail, variantsByAssetId),
    hero: attachAssetVariants(work.hero, variantsByAssetId),
    blocks: (work.blocks ?? []).map((block) => enrichBlockAssets(block, variantsByAssetId))
  }));
};

export const createWork = async (input: WorkInput) => {
  const db = getD1();
  const id = crypto.randomUUID();
  const max = await db.prepare("SELECT COALESCE(MAX(sort_order), 0) AS value FROM works").first<{ value: number }>();

  const statements = [
    db.prepare(
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
    ),
    ...input.blocks.map((block, index) =>
      db
        .prepare("INSERT INTO work_blocks (id, work_id, type, content, sort_order) VALUES (?, ?, ?, ?, ?)")
        .bind(
          block.id ?? crypto.randomUUID(),
          id,
          block.type,
          JSON.stringify(block.content),
          block.sortOrder ?? index + 1
        )
    )
  ];

  await db.batch(statements);

  return listWorks();
};

export const updateWork = async (id: string, input: WorkInput) => {
  const db = getD1();
  const statements = [
    db.prepare(
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
    ),
    db.prepare("DELETE FROM work_blocks WHERE work_id = ?").bind(id),
    ...input.blocks.map((block, index) =>
      db
        .prepare("INSERT INTO work_blocks (id, work_id, type, content, sort_order) VALUES (?, ?, ?, ?, ?)")
        .bind(
          block.id ?? crypto.randomUUID(),
          id,
          block.type,
          JSON.stringify(block.content),
          block.sortOrder ?? index + 1
        )
    )
  ];

  const [result] = await db.batch(statements);

  if (result.meta.changes === 0) return null;

  return listWorks();
};

export const deleteWork = async (id: string) => {
  await getD1().prepare("DELETE FROM works WHERE id = ?").bind(id).run();
  return listWorks();
};

export const createAssetRecord = async (
  asset: Omit<AssetRow, "created_at">,
  variants: AssetVariantRecord[] = []
) => {
  const db = getD1();
  const statements = [
    db
      .prepare("INSERT INTO assets (id, r2_key, alt, mime, width, height, size) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(asset.id, asset.r2_key, asset.alt, asset.mime, asset.width, asset.height, asset.size),
    ...variants.map((variant) =>
      db
        .prepare(
          "INSERT INTO asset_variants (asset_id, width, height, r2_key, mime, size) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(asset.id, variant.width, variant.height, variant.r2_key, variant.mime, variant.size)
    )
  ];

  await db.batch(statements);

  return {
    id: asset.id,
    url: mediaUrl(asset.r2_key),
    alt: asset.alt,
    mime: asset.mime,
    width: asset.width,
    height: asset.height,
    size: asset.size,
    variants: variants
      .map((variant) => ({
        url: mediaUrl(variant.r2_key) ?? "",
        mime: variant.mime,
        width: variant.width,
        height: variant.height,
        size: variant.size
      }))
      .sort((left, right) => left.width - right.width)
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
