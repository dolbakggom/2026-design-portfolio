import type { APIRoute } from "astro";
import { isAdminRequest } from "../../../../lib/auth";
import { createTimeline, listTimeline } from "../../../../lib/admin-data";
import { purgePublicHtmlCache } from "../../../../lib/admin-cache";
import { badRequest, json, readJson, serverError, unauthorized } from "../../../../lib/http";
import { getHomeHtmlCachePaths } from "../../../../lib/public-cache";
import { timelineSchema } from "../../../../lib/validation";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();

  try {
    return json({ timeline: await listTimeline() });
  } catch {
    return serverError("Unable to read timeline");
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();

  const parsed = timelineSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest("Invalid timeline payload", parsed.error.issues);

  try {
    const timeline = await createTimeline(parsed.data);
    const publication = await purgePublicHtmlCache(request, getHomeHtmlCachePaths());
    return json({ timeline, publication }, { status: 201 });
  } catch {
    return serverError("Unable to create timeline item");
  }
};
