import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { analyticsViewSchema } from "../../../lib/analytics";
import { issueAnalyticsView } from "../../../lib/analytics-security";
import { isAdminRequest } from "../../../lib/auth";
import { isAllowedAdminMutation } from "../../../lib/request-security";
import { badRequest, forbidden, json, readJson, serverError } from "../../../lib/http";

export const prerender = false;
export const POST: APIRoute = async ({ request, url }) => {
  if (!isAllowedAdminMutation(request)) return forbidden();
  if (import.meta.env.DEV || ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1" ||
      /bot|crawler|spider|preview|headless/i.test(request.headers.get("user-agent") ?? "")) {
    return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  }
  try {
    if (await isAdminRequest(request)) return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
    const limit = await env.ANALYTICS_SESSION_RATE_LIMITER.limit({ key: request.headers.get("cf-connecting-ip") ?? "unknown" });
    if (!limit.success) return json({ error: "Rate limited" }, { status: 429, headers: { "retry-after": "60" } });
    const parsed = analyticsViewSchema.safeParse(await readJson(request, 2048));
    if (!parsed.success) return badRequest("Invalid analytics page");
    const { path, referrer, device, resetSession } = parsed.data;
    if (path.startsWith("/work/")) {
      const work = await env.DB.prepare("SELECT id FROM works WHERE slug = ? AND published = 1").bind(path.slice(6)).first();
      if (!work) return badRequest("Unknown public page");
    }
    const issued = await issueAnalyticsView(request, { path, referrer, device }, env.SESSION_SECRET, resetSession);
    return json({ id: issued.view.id, sessionId: issued.view.sessionId, viewToken: issued.viewToken }, {
      headers: { "set-cookie": issued.cookie }
    });
  } catch {
    console.error(JSON.stringify({ event: "portfolio.analytics.session_failed" }));
    return serverError("Unable to initialize visit");
  }
};
