import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { analyticsEventSchema } from '../../lib/analytics';
import { isAdminRequest } from '../../lib/auth';
import { isAllowedAdminMutation } from '../../lib/request-security';
import { badRequest, forbidden, json, readJson, serverError } from '../../lib/http';

export const prerender = false;
const ignored = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });

export const POST: APIRoute = async ({ request, url }) => {
  if (!isAllowedAdminMutation(request)) return forbidden();
  if (import.meta.env.DEV || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return ignored();
  if (request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1' || /bot|crawler|spider|preview|headless/i.test(request.headers.get('user-agent') ?? '')) return ignored();
  try {
    if (await isAdminRequest(request)) return ignored();
    const limit = await env.ANALYTICS_RATE_LIMITER.limit({ key: request.headers.get('cf-connecting-ip') ?? 'unknown' });
    if (!limit.success) return json({ error: 'Rate limited' }, { status: 429 });
    const parsed = analyticsEventSchema.safeParse(await readJson(request, 2048));
    if (!parsed.success) return badRequest('Invalid analytics event');
    const event = parsed.data;
    if (event.path.startsWith('/work/')) {
      const work = await env.DB.prepare('SELECT id FROM works WHERE slug = ? AND published = 1').bind(event.path.slice(6)).first();
      if (!work) return badRequest('Unknown public page');
    }
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM analytics_views WHERE last_seen < ?').bind(now - 30 * 86400000),
      env.DB.prepare(`INSERT INTO analytics_views (id, session_id, path, referrer, device, first_seen, last_seen, active_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?, MIN(?, 15))
        ON CONFLICT(id) DO UPDATE SET last_seen = ?,
          active_seconds = MAX(analytics_views.active_seconds, MIN(?, CAST((? - analytics_views.first_seen) / 1000 AS INTEGER) + 15))
        WHERE analytics_views.session_id = excluded.session_id AND analytics_views.path = excluded.path`)
        .bind(event.id, event.sessionId, event.path, event.referrer, event.device, now, now, event.activeSeconds, now, event.activeSeconds, now)
    ]);
    return ignored();
  } catch {
    console.error(JSON.stringify({ event: 'portfolio.analytics.write_failed' }));
    return serverError('Unable to record visit');
  }
};
