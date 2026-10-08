import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { analyticsEventSchema } from '../../lib/analytics';
import { boundedAnalyticsSeconds, createAnalyticsSessionCookie, verifyAnalyticsView } from '../../lib/analytics-security';
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
    const now = Date.now();
    const view = await verifyAnalyticsView(request, event.viewToken, env.SESSION_SECRET, now);
    if (!view || view.id !== event.id || view.sessionId !== event.sessionId || view.path !== event.path ||
        view.referrer !== event.referrer || view.device !== event.device) return forbidden();
    const sessionLimit = await env.ANALYTICS_RATE_LIMITER.limit({ key: `session:${view.sessionId}` });
    if (!sessionLimit.success) return json({ error: 'Rate limited' }, { status: 429 });
    if (event.path.startsWith('/work/')) {
      const work = await env.DB.prepare('SELECT id FROM works WHERE slug = ? AND published = 1').bind(event.path.slice(6)).first();
      if (!work) return badRequest('Unknown public page');
    }
    const activeSeconds = boundedAnalyticsSeconds(event.activeSeconds, view.startedAt, now);
    if (activeSeconds < 5) return ignored();
    const results = await env.DB.batch([
      env.DB.prepare('DELETE FROM analytics_views WHERE last_seen < ?').bind(now - 30 * 86400000),
      env.DB.prepare(`INSERT INTO analytics_views (id, session_id, path, referrer, device, first_seen, last_seen, active_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET last_seen = ?,
          active_seconds = excluded.active_seconds
        WHERE analytics_views.session_id = excluded.session_id AND analytics_views.path = excluded.path
          AND excluded.active_seconds > analytics_views.active_seconds`)
        .bind(view.id, view.sessionId, view.path, view.referrer, view.device, view.startedAt, now, activeSeconds, now)
    ]);
    if (results[1].meta.changes > 0) return new Response(null, { status: 204, headers: {
      'cache-control': 'no-store', 'set-cookie': await createAnalyticsSessionCookie(request, view.sessionId, env.SESSION_SECRET, now)
    } });
    return ignored();
  } catch {
    console.error(JSON.stringify({ event: 'portfolio.analytics.write_failed' }));
    return serverError('Unable to record visit');
  }
};
