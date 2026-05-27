import { defineMiddleware } from "astro:middleware";

const EDGE_TTL_SECONDS = 600;
const STALE_WHILE_REVALIDATE_SECONDS = 86_400;
const PUBLIC_HOME_ROUTES = new Set(["/", "/about", "/career", "/work"]);

type CloudflareLocals = {
  cfContext?: ExecutionContext;
};

const normalizePathname = (pathname: string) => {
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
};

const isPublicHtmlRoute = (url: URL) => {
  const pathname = normalizePathname(url.pathname);
  if (PUBLIC_HOME_ROUTES.has(pathname)) return true;
  return /^\/work\/[^/]+$/.test(pathname);
};

const isCacheableHtmlResponse = (response: Response) => {
  if (response.status !== 200) return false;
  if (response.headers.has("set-cookie")) return false;
  return response.headers.get("content-type")?.includes("text/html") ?? false;
};

const withPublicCacheHeaders = (response: Response, cacheState: "MISS" | "BYPASS") => {
  const headers = new Headers(response.headers);
  const edgeCacheValue = `public, max-age=${EDGE_TTL_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`;

  headers.set(
    "cache-control",
    `public, max-age=0, s-maxage=${EDGE_TTL_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`
  );
  headers.set("cdn-cache-control", edgeCacheValue);
  headers.set("cloudflare-cdn-cache-control", edgeCacheValue);
  headers.set("x-portfolio-cache", cacheState);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

export const onRequest = defineMiddleware(async (context, next) => {
  const requestUrl = new URL(context.request.url);
  const isPublicCacheCandidate =
    context.request.method === "GET" &&
    !requestUrl.search &&
    isPublicHtmlRoute(requestUrl);

  if (!isPublicCacheCandidate) {
    return next();
  }

  if (typeof caches === "undefined") {
    const response = await next();
    return isCacheableHtmlResponse(response) ? withPublicCacheHeaders(response, "BYPASS") : response;
  }

  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(requestUrl.toString(), {
    method: "GET",
    headers: {
      accept: "text/html"
    }
  });

  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    const headers = new Headers(cachedResponse.headers);
    headers.set("x-portfolio-cache", "HIT");
    return new Response(cachedResponse.body, {
      status: cachedResponse.status,
      statusText: cachedResponse.statusText,
      headers
    });
  }

  const response = await next();
  if (!isCacheableHtmlResponse(response)) return response;

  const cacheableResponse = withPublicCacheHeaders(response, "MISS");
  const cfContext = (context.locals as CloudflareLocals).cfContext;
  const cacheWrite = cache.put(cacheKey, cacheableResponse.clone()).catch(() => undefined);

  if (cfContext) {
    cfContext.waitUntil(cacheWrite);
  } else {
    void cacheWrite;
  }

  return cacheableResponse;
});
