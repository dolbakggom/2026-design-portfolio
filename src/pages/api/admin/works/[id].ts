import type { APIRoute } from "astro";
import { isAdminRequest } from "../../../../lib/auth";
import { deleteWork, listWorks, updateWork } from "../../../../lib/admin-data";
import { purgePublicHtmlCache } from "../../../../lib/admin-cache";
import { badRequest, json, notFound, readJson, serverError, unauthorized } from "../../../../lib/http";
import { getPublicHtmlCachePathsForWorks } from "../../../../lib/public-cache";
import { workSchema } from "../../../../lib/validation";

export const prerender = false;

export const PUT: APIRoute = async ({ params, request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();
  if (!params.id) return notFound();

  const parsed = workSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest("Invalid work payload", parsed.error.issues);

  try {
    const previousWork = (await listWorks()).find((work) => work.id === params.id);
    const works = await updateWork(params.id, parsed.data);
    if (works) {
      await purgePublicHtmlCache(
        request,
        getPublicHtmlCachePathsForWorks(works, previousWork ? [`/work/${previousWork.slug}`] : [])
      );
    }
    return works ? json({ works }) : notFound();
  } catch {
    return serverError("Unable to update work");
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();
  if (!params.id) return notFound();

  try {
    const deletedWork = (await listWorks()).find((work) => work.id === params.id);
    const works = await deleteWork(params.id);
    await purgePublicHtmlCache(
      request,
      getPublicHtmlCachePathsForWorks(works, deletedWork ? [`/work/${deletedWork.slug}`] : [])
    );
    return json({ works });
  } catch {
    return serverError("Unable to delete work");
  }
};
