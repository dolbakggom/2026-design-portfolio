export type PublicContentSource = "database" | "fallback";

export type PublicContentResult<T> = {
  data: T;
  source: PublicContentSource;
};

export const CONTENT_SOURCE_HEADER = "x-portfolio-content-source";

export const applyPublicContentStatus = (headers: Headers, source: PublicContentSource) => {
  headers.set(CONTENT_SOURCE_HEADER, source);

  if (source !== "fallback") return;

  headers.set("cache-control", "no-store");
  headers.set("cdn-cache-control", "no-store");
  headers.set("cloudflare-cdn-cache-control", "no-store");
};

export const isFallbackContentResponse = (response: Response) =>
  response.headers.get(CONTENT_SOURCE_HEADER) === "fallback";
