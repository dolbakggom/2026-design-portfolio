import type { APIRoute } from "astro";
import { isAdminRequest } from "../../../../lib/auth";
import { deleteWork, updateWork } from "../../../../lib/admin-data";
import { badRequest, json, notFound, readJson, serverError, unauthorized } from "../../../../lib/http";
import { workSchema } from "../../../../lib/validation";

export const prerender = false;

export const PUT: APIRoute = async ({ params, request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();
  if (!params.id) return notFound();

  const parsed = workSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest("Invalid work payload", parsed.error.issues);

  try {
    const works = await updateWork(params.id, parsed.data);
    return works ? json({ works }) : notFound();
  } catch {
    return serverError("Unable to update work");
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();
  if (!params.id) return notFound();

  try {
    return json({ works: await deleteWork(params.id) });
  } catch {
    return serverError("Unable to delete work");
  }
};
