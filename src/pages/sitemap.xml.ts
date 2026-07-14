import type { APIRoute } from "astro";
import { getHomeContent } from "../lib/content";
import { createSitemapXml } from "../lib/seo";

export const prerender = false;

export const GET: APIRoute = async () => {
  const { works } = await getHomeContent();
  const paths = ["/", ...works.map((work) => `/work/${work.slug}`)];

  return new Response(createSitemapXml(paths), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=86400"
    }
  });
};
