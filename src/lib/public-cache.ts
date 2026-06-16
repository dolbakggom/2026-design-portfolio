type WorkCacheTarget = {
  slug?: string | null;
};

const HOME_HTML_CACHE_PATHS = ["/", "/about", "/career", "/work"] as const;

const normalizeCachePath = (path: string) => {
  const trimmed = path.trim();
  if (!trimmed) return null;

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withLeadingSlash === "/") return withLeadingSlash;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
};

const getWorkHtmlCachePath = (slug: string | null | undefined) => {
  const normalizedSlug = slug?.trim().replace(/^\/+|\/+$/g, "");
  return normalizedSlug ? `/work/${normalizedSlug}` : null;
};

const uniquePaths = (paths: Array<string | null | undefined>) => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  paths.forEach((path) => {
    if (!path) return;
    const cachePath = normalizeCachePath(path);
    if (!cachePath || seen.has(cachePath)) return;
    seen.add(cachePath);
    normalized.push(cachePath);
  });

  return normalized;
};

export const getHomeHtmlCachePaths = () => [...HOME_HTML_CACHE_PATHS];

export const getPublicHtmlCachePathsForWorks = (works: WorkCacheTarget[], extraPaths: string[] = []) =>
  uniquePaths([...getHomeHtmlCachePaths(), ...works.map((work) => getWorkHtmlCachePath(work.slug)), ...extraPaths]);

export const createPublicHtmlCacheKeys = (originUrl: string | URL, paths: string[]) => {
  const origin = new URL(originUrl.toString()).origin;

  return uniquePaths(paths).map(
    (path) =>
      new Request(new URL(path, origin).toString(), {
        method: "GET",
        headers: {
          accept: "text/html"
        }
      })
  );
};

export const deletePublicHtmlCache = async (request: Request, paths: string[]) => {
  if (typeof caches === "undefined") return;

  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKeys = createPublicHtmlCacheKeys(request.url, paths);
  await Promise.allSettled(cacheKeys.map((cacheKey) => cache.delete(cacheKey)));
};
