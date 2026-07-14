import type { Profile, WorkItem } from "../types";

export const SITE_ORIGIN = "https://dolbakggom.com";

export type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

export const absoluteSiteUrl = (path: string, origin = SITE_ORIGIN) => new URL(path, origin).toString();

export const serializeJsonLd = (value: JsonLd) => JSON.stringify(value).replace(/</g, "\\u003c");

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const createSitemapXml = (paths: string[], origin = SITE_ORIGIN) => {
  const urls = [...new Set(paths.map((path) => absoluteSiteUrl(path, origin)))];
  const entries = urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
};

export const createHomeStructuredData = (profile: Profile, origin = SITE_ORIGIN): JsonLd => {
  const personUrl = absoluteSiteUrl("/#person", origin);
  const sameAs = profile.links
    .map((link) => link.url)
    .filter((url) => /^https?:\/\//i.test(url));
  const portraitUrl = profile.portrait?.url ? absoluteSiteUrl(profile.portrait.url, origin) : undefined;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personUrl,
        name: profile.name,
        url: absoluteSiteUrl("/", origin),
        jobTitle: profile.role,
        description: profile.bio,
        ...(portraitUrl ? { image: portraitUrl } : {}),
        ...(sameAs.length ? { sameAs } : {})
      },
      {
        "@type": "WebSite",
        "@id": absoluteSiteUrl("/#website", origin),
        url: absoluteSiteUrl("/", origin),
        name: "Beyond the Answer.",
        description: profile.bio,
        inLanguage: "ko-KR",
        author: { "@id": personUrl }
      }
    ]
  };
};

export const createWorkStructuredData = (work: WorkItem, origin = SITE_ORIGIN): JsonLd => {
  const image = work.featuredThumbnail?.url ?? work.thumbnail?.url ?? work.hero?.url;
  const year = work.year.match(/\d{4}/)?.[0];

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": absoluteSiteUrl(`/work/${work.slug}#work`, origin),
    url: absoluteSiteUrl(`/work/${work.slug}`, origin),
    name: work.title,
    description: work.summary,
    genre: work.category,
    inLanguage: "ko-KR",
    creator: {
      "@type": "Person",
      "@id": absoluteSiteUrl("/#person", origin),
      name: "함시현",
      url: absoluteSiteUrl("/", origin)
    },
    ...(image ? { image: absoluteSiteUrl(image, origin) } : {}),
    ...(year ? { dateCreated: year } : {})
  };
};
