import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createSessionCookie, verifyPassword } from "../../../lib/auth";
import { badRequest, json, readJson, serverError } from "../../../lib/http";
import { loginSchema } from "../../../lib/validation";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest("Invalid login payload", parsed.error.issues);

  try {
    const validUsername = parsed.data.username === env.ADMIN_USERNAME;
    const validPassword = await verifyPassword(parsed.data.password);

    if (!validUsername || !validPassword) {
      return json({ error: "Invalid credentials" }, { status: 401 });
    }

    return json(
      { ok: true },
      {
        headers: {
          "set-cookie": await createSessionCookie(request)
        }
      }
    );
  } catch {
    return serverError("Unable to verify login");
  }
};
