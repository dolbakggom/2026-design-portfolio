import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { createSessionCookie, verifyPassword } from "../../../lib/auth";
import { badRequest, json, readJson, serverError, tooManyRequests } from "../../../lib/http";
import { loginSchema } from "../../../lib/validation";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const rateLimit = await env.ADMIN_LOGIN_RATE_LIMITER.limit({ key: "portfolio-admin-login" });
    if (!rateLimit.success) return tooManyRequests();

    const parsed = loginSchema.safeParse(await readJson(request));
    if (!parsed.success) return badRequest("로그인 입력값을 확인해주세요.");

    const validUsername = parsed.data.username === env.ADMIN_USERNAME;
    const validPassword = await verifyPassword(parsed.data.password);

    if (!validUsername || !validPassword) {
      return json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
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
