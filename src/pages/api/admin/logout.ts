import type { APIRoute } from "astro";
import { createExpiredSessionCookie } from "../../../lib/auth";
import { json } from "../../../lib/http";

export const prerender = false;

export const POST: APIRoute = async () =>
  json(
    { ok: true },
    {
      headers: {
        "set-cookie": createExpiredSessionCookie()
      }
    }
  );
