import type { APIRoute } from "astro";
import { isAdminRequest } from "../../../../lib/auth";
import { deleteTimeline, updateTimeline } from "../../../../lib/admin-data";
import { purgePublicHtmlCache } from "../../../../lib/admin-cache";
import { badRequest, json, notFound, readJson, serverError, unauthorized } from "../../../../lib/http";
import { getHomeHtmlCachePaths } from "../../../../lib/public-cache";
import { timelineSchema } from "../../../../lib/validation";

export const prerender = false;

export const PUT: APIRoute = async ({ params, request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();
  if (!params.id) return notFound();

  const parsed = timelineSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest("Invalid timeline payload", parsed.error.issues);

  try {
    const timeline = await updateTimeline(params.id, parsed.data);
    if (!timeline) return notFound();
    const publication = await purgePublicHtmlCache(request, getHomeHtmlCachePaths());
    return json({ timeline, publication });
  } catch {
    return serverError("Unable to update timeline item");
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();
  if (!params.id) return notFound();

  try {
    const timeline = await deleteTimeline(params.id);
    const publication = await purgePublicHtmlCache(request, getHomeHtmlCachePaths());
    return json({ timeline, publication });
  } catch {
    return serverError("Unable to delete timeline item");
  }
};
