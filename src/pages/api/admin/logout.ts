import type { APIRoute } from "astro";
import { createExpiredSessionCookie, isAdminRequest } from "../../../lib/auth";
import { json, unauthorized } from "../../../lib/http";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();
  return json(
    { ok: true },
    {
      headers: {
        "set-cookie": createExpiredSessionCookie()
      }
    }
  );
};
