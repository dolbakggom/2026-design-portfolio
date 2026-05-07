import type { APIRoute } from "astro";
import { isAdminRequest } from "../../../lib/auth";
import { listTimeline, listWorks, reorderItems } from "../../../lib/admin-data";
import { badRequest, json, readJson, serverError, unauthorized } from "../../../lib/http";
import { reorderSchema } from "../../../lib/validation";

export const prerender = false;

export const PATCH: APIRoute = async ({ request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();

  const parsed = reorderSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest("Invalid reorder payload", parsed.error.issues);

  try {
    await reorderItems(parsed.data.type, parsed.data.ids, parsed.data.workId);

    if (parsed.data.type === "timeline") return json({ timeline: await listTimeline() });
    return json({ works: await listWorks() });
  } catch {
    return serverError("Unable to reorder items");
  }
};
