import { env } from "cloudflare:workers";
import type { HomeContent, LinkItem, Profile, TimelineItem, WorkBlock, WorkItem } from "../types";
import { sanitizeProfileIntro } from "./content-sanitizer";
import { fallbackContent, fallbackWorks } from "./fallback";
import { getWorkFallback } from "./public-resilience";
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

const mediaUrl = (key: string | null | undefined) => {
  if (!key) return null;
  return `/media/${key.split("/").map(encodeURIComponent).join("/")}`;
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

    const works = (worksResult.results as WorkRow[]).map(toWork);

    return {
      profile: profileRow ? toProfile(profileRow) : fallbackContent.profile,
      timeline: (timelineResult.results as TimelineRow[]).map(toTimeline),
      featuredWorks: works.filter((work: WorkItem) => work.featured).slice(0, 5),
      works
    };
  } catch {
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

    return {
      ...toWork(row),
      blocks: (blockResult.results as BlockRow[]).map(toBlock)
    };
  } catch {
    return getWorkFallback(slug, fallbackWorks, true);
  }
};
