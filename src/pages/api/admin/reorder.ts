import type { APIRoute } from "astro";
import { isAdminRequest } from "../../../lib/auth";
import { listTimeline, listWorks, reorderItems } from "../../../lib/admin-data";
import { purgePublicHtmlCache } from "../../../lib/admin-cache";
import { badRequest, json, readJson, serverError, unauthorized } from "../../../lib/http";
import { getHomeHtmlCachePaths, getPublicHtmlCachePathsForWorks } from "../../../lib/public-cache";
import { reorderSchema } from "../../../lib/validation";

export const prerender = false;

export const PATCH: APIRoute = async ({ request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();

  const parsed = reorderSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest("Invalid reorder payload", parsed.error.issues);

  try {
    await reorderItems(parsed.data.type, parsed.data.ids, parsed.data.workId);

    if (parsed.data.type === "timeline") {
      const timeline = await listTimeline();
      const publication = await purgePublicHtmlCache(request, getHomeHtmlCachePaths());
      return json({ timeline, publication });
    }

    const works = await listWorks();
    const publication = await purgePublicHtmlCache(request, getPublicHtmlCachePathsForWorks(works));
    return json({ works, publication });
  } catch {
    return serverError("Unable to reorder items");
  }
};
