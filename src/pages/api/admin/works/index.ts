import type { APIRoute } from "astro";
import { isAdminRequest } from "../../../../lib/auth";
import { createWork, listWorks } from "../../../../lib/admin-data";
import { purgePublicHtmlCache } from "../../../../lib/admin-cache";
import { badRequest, json, readJson, serverError, unauthorized } from "../../../../lib/http";
import { getPublicHtmlCachePathsForWorks } from "../../../../lib/public-cache";
import { workSchema } from "../../../../lib/validation";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();

  try {
    return json({ works: await listWorks() });
  } catch {
    return serverError("Unable to read works");
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();

  const parsed = workSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest("Invalid work payload", parsed.error.issues);

  try {
    const works = await createWork(parsed.data);
    await purgePublicHtmlCache(request, getPublicHtmlCachePathsForWorks(works));
    return json({ works }, { status: 201 });
  } catch {
    return serverError("Unable to create work");
  }
};
