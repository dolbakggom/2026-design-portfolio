export type WorkCategory = "UI/UX" | "BI/BX";
export type WorkBlockType = "heading" | "paragraph" | "image" | "gallery" | "quote";

export interface LinkItem {
  label: string;
  url: string;
}

export interface AssetRef {
  id?: string | null;
  url?: string | null;
  alt?: string | null;
  mime?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface Profile {
  headline: string;
  name: string;
  role: string;
  intro: string;
  bio: string;
  portraitAssetId?: string | null;
  portrait?: AssetRef | null;
  links: LinkItem[];
}

export interface TimelineItem {
  id: string;
  period: string;
  title: string;
  organization: string;
  description: string;
  sortOrder: number;
}

export interface WorkBlock {
  id: string;
  type: WorkBlockType;
  content: Record<string, unknown>;
  sortOrder: number;
}

export interface WorkItem {
  id: string;
  slug: string;
  title: string;
  category: WorkCategory;
  summary: string;
  client: string;
  year: string;
  role: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  thumbnailAssetId?: string | null;
  featuredThumbnailAssetId?: string | null;
  heroAssetId?: string | null;
  thumbnail?: AssetRef | null;
  featuredThumbnail?: AssetRef | null;
  hero?: AssetRef | null;
  blocks?: WorkBlock[];
}

export interface HomeContent {
  profile: Profile;
  timeline: TimelineItem[];
  featuredWorks: WorkItem[];
  works: WorkItem[];
}
