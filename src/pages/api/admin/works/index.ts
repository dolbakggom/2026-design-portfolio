import type { APIRoute } from "astro";
import { isAdminRequest } from "../../../../lib/auth";
import { createWork, listWorks } from "../../../../lib/admin-data";
import { badRequest, json, readJson, serverError, unauthorized } from "../../../../lib/http";
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
    return json({ works: await createWork(parsed.data) }, { status: 201 });
  } catch {
    return serverError("Unable to create work");
  }
};
