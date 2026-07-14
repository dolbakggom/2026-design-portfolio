import { env } from "cloudflare:workers";
import type { AssetVariant, HomeContent, LinkItem, Profile, TimelineItem, WorkBlock, WorkItem } from "../types";
import { sanitizeProfileIntro } from "./content-sanitizer";
import { reportContentReadFailure } from "./content-observability";
import { fallbackContent, fallbackWorks } from "./fallback";
import { getWorkFallback } from "./public-resilience";
import { attachAssetVariants } from "./responsive-images";
import { normalizeStoredWorkBlockContent } from "./work-block-content";

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
  featured: number;
  published: number;
  sort_order: number;
  thumbnail_asset_id: string | null;
  featured_thumbnail_asset_id: string | null;
  hero_asset_id: string | null;
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
  type: WorkBlock["type"];
  content: string;
  sort_order: number;
};

type AssetVariantRow = {
  asset_id: string;
  r2_key: string;
  mime: string;
  width: number;
  height: number;
  size: number;
};

const mediaUrl = (key: string | null | undefined) => {
  if (!key) return null;
  return `/media/${key.split("/").map(encodeURIComponent).join("/")}`;
};

const loadAssetVariants = async (db: D1Database, assetIds: Array<string | null | undefined>) => {
  const ids = [...new Set(assetIds.filter((id): id is string => Boolean(id)))];
  const variantsByAssetId = new Map<string, AssetVariant[]>();
  if (!ids.length) return variantsByAssetId;

  const placeholders = ids.map(() => "?").join(", ");
  const result = await db
    .prepare(
      `SELECT asset_id, r2_key, mime, width, height, size
      FROM asset_variants
      WHERE asset_id IN (${placeholders})
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

const enrichWorkAssets = (work: WorkItem, variantsByAssetId: Map<string, AssetVariant[]>): WorkItem => ({
  ...work,
  thumbnail: attachAssetVariants(work.thumbnail, variantsByAssetId),
  featuredThumbnail: attachAssetVariants(work.featuredThumbnail, variantsByAssetId),
  hero: attachAssetVariants(work.hero, variantsByAssetId)
});

const blockAssetIds = (blocks: WorkBlock[]) =>
  blocks.flatMap((block) => {
    if (block.type === "image") {
      return typeof block.content.assetId === "string" ? [block.content.assetId] : [];
    }
    if (block.type !== "gallery" || !Array.isArray(block.content.images)) return [];
    return block.content.images.flatMap((image) =>
      image && typeof image === "object" && "assetId" in image && typeof image.assetId === "string"
        ? [image.assetId]
        : []
    );
  });

const enrichWorkBlockAssets = (block: WorkBlock, variantsByAssetId: Map<string, AssetVariant[]>): WorkBlock => {
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
        if (!image || typeof image !== "object" || !("assetId" in image) || typeof image.assetId !== "string") {
          return image;
        }
        const variants = variantsByAssetId.get(image.assetId);
        return variants?.length ? { ...image, variants } : image;
      })
    }
  };
};

const parseLinks = (links: string): LinkItem[] => {
  try {
    const parsed = JSON.parse(links);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseBlockContent = (content: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === "object" ? parsed : {};
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
  links: parseLinks(row.links)
});

const toTimeline = (row: TimelineRow): TimelineItem => ({
  id: row.id,
  period: row.period,
  title: row.title,
  organization: row.organization,
  description: row.description,
  sortOrder: row.sort_order
});

const toWork = (row: WorkRow): WorkItem => ({
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
    : null
});

const toBlock = (row: BlockRow): WorkBlock => ({
  id: row.id,
  type: row.type,
  content: normalizeStoredWorkBlockContent(row.type, parseBlockContent(row.content)),
  sortOrder: row.sort_order
});

export const getHomeContent = async (): Promise<HomeContent> => {
  try {
    const db = env.DB;
    const profileRow = await db
      .prepare(
        `SELECT p.*, a.r2_key AS portrait_key, a.alt AS portrait_alt, a.mime AS portrait_mime,
          a.width AS portrait_width, a.height AS portrait_height
        FROM profile p
        LEFT JOIN assets a ON a.id = p.portrait_asset_id
        WHERE p.id = 'main'`
      )
      .first<ProfileRow>();

    const timelineResult = await db
      .prepare("SELECT * FROM timeline_items ORDER BY sort_order ASC, created_at ASC")
      .all<TimelineRow>();

    const worksResult = await db
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
        WHERE w.published = 1
        ORDER BY w.sort_order ASC, w.created_at ASC`
      )
      .all<WorkRow>();

    const profile = profileRow ? toProfile(profileRow) : fallbackContent.profile;
    const rawWorks = (worksResult.results as WorkRow[]).map(toWork);
    const variantsByAssetId = await loadAssetVariants(db, [
      profile.portraitAssetId,
      ...rawWorks.flatMap((work) => [work.thumbnailAssetId, work.featuredThumbnailAssetId, work.heroAssetId])
    ]);
    const works = rawWorks.map((work) => enrichWorkAssets(work, variantsByAssetId));

    return {
      profile: { ...profile, portrait: attachAssetVariants(profile.portrait, variantsByAssetId) },
      timeline: (timelineResult.results as TimelineRow[]).map(toTimeline),
      featuredWorks: works.filter((work: WorkItem) => work.featured).slice(0, 5),
      works
    };
  } catch (error) {
    reportContentReadFailure({ scope: "home" }, error);
    return fallbackContent;
  }
};

export const getWorkBySlug = async (slug: string): Promise<WorkItem | null> => {
  try {
    const db = env.DB;
    const row = await db
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
        WHERE w.slug = ? AND w.published = 1`
      )
      .bind(slug)
      .first<WorkRow>();

    if (!row) return getWorkFallback(slug, fallbackWorks, false);

    const blockResult = await db
      .prepare("SELECT * FROM work_blocks WHERE work_id = ? ORDER BY sort_order ASC, created_at ASC")
      .bind(row.id)
      .all<BlockRow>();

    const work = toWork(row);
    const blocks = (blockResult.results as BlockRow[]).map(toBlock);
    const variantsByAssetId = await loadAssetVariants(db, [
      work.thumbnailAssetId,
      work.featuredThumbnailAssetId,
      work.heroAssetId,
      ...blockAssetIds(blocks)
    ]);

    return {
      ...enrichWorkAssets(work, variantsByAssetId),
      blocks: blocks.map((block) => enrichWorkBlockAssets(block, variantsByAssetId))
    };
  } catch (error) {
    reportContentReadFailure({ scope: "work", slug }, error);
    return getWorkFallback(slug, fallbackWorks, true);
  }
};
