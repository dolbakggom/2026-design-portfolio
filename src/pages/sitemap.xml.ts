import type { APIRoute } from "astro";
import { getHomeContentResult } from "../lib/content";
import { applyPublicContentStatus } from "../lib/content-response";
import { createSitemapXml } from "../lib/seo";

export const prerender = false;

export const GET: APIRoute = async () => {
  const contentResult = await getHomeContentResult();
  const { works } = contentResult.data;
  const paths = ["/", ...works.map((work) => `/work/${work.slug}`)];
  const headers = new Headers({
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=86400"
  });
  applyPublicContentStatus(headers, contentResult.source);

  return new Response(createSitemapXml(paths), {
    headers
  });
};
