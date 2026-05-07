import type { APIRoute } from "astro";
import { isAdminRequest } from "../../../lib/auth";
import { readProfile, updateProfile } from "../../../lib/admin-data";
import { badRequest, json, readJson, serverError, unauthorized } from "../../../lib/http";
import { profileSchema } from "../../../lib/validation";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();

  try {
    return json({ profile: await readProfile() });
  } catch {
    return serverError("Unable to read profile");
  }
};

export const PUT: APIRoute = async ({ request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();

  const parsed = profileSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest("Invalid profile payload", parsed.error.issues);

  try {
    return json({ profile: await updateProfile(parsed.data) });
  } catch {
    return serverError("Unable to update profile");
  }
};
