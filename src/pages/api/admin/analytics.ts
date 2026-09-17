import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { z } from 'zod';
import { analyticsCutoff, type AnalyticsReport } from '../../../lib/analytics';
import { isAdminRequest } from '../../../lib/auth';
import { badRequest, json, serverError, unauthorized } from '../../../lib/http';

export const prerender = false;
export const GET: APIRoute = async ({ request, url }) => {
  if (!(await isAdminRequest(request))) return unauthorized();
  const days = z.enum(['1', '7', '30']).safeParse(url.searchParams.get('days') ?? '7');
  if (!days.success) return badRequest('Invalid period');
  const cutoff = analyticsCutoff(Number(days.data));
  try {
    await env.DB.prepare('DELETE FROM analytics_views WHERE last_seen < ?').bind(Date.now() - 30 * 86400000).run();
    const results = await env.DB.batch([
      env.DB.prepare('SELECT COUNT(DISTINCT session_id) AS sessions, COUNT(*) AS views, COALESCE(SUM(active_seconds), 0) AS seconds FROM analytics_views WHERE first_seen >= ?').bind(cutoff),
      env.DB.prepare("SELECT date(first_seen / 1000, 'unixepoch', '+9 hours') AS day, COUNT(DISTINCT session_id) AS sessions FROM analytics_views WHERE first_seen >= ? GROUP BY day ORDER BY day").bind(cutoff),
      env.DB.prepare(`SELECT a.path, COALESCE(w.title, a.path) AS title, COUNT(*) AS views, COUNT(DISTINCT a.session_id) AS sessions, SUM(a.active_seconds) AS seconds
        FROM analytics_views a LEFT JOIN works w ON a.path = '/work/' || w.slug
        WHERE a.first_seen >= ? AND a.path LIKE '/work/%' GROUP BY a.path ORDER BY views DESC LIMIT 20`).bind(cutoff),
      env.DB.prepare(`SELECT session_id AS sessionId, MIN(first_seen) AS firstSeen, MAX(last_seen) AS lastSeen,
        SUM(active_seconds) AS seconds, COUNT(*) AS views, MAX(device) AS device, MAX(referrer) AS referrer,
        GROUP_CONCAT(DISTINCT path) AS paths FROM analytics_views WHERE first_seen >= ? GROUP BY session_id ORDER BY lastSeen DESC LIMIT 100`).bind(cutoff)
    ]);
    const dayCounts = new Map((results[1].results as AnalyticsReport['daily']).map(row => [row.day, row.sessions]));
    const daily = Array.from({ length: Number(days.data) }, (_, index) => {
      const day = new Date(cutoff + index * 86400000 + 9 * 3600000).toISOString().slice(0, 10);
      return { day, sessions: dayCounts.get(day) ?? 0 };
    });
    return json({ summary: results[0].results[0], daily, projects: results[2].results, recent: results[3].results } as AnalyticsReport);
  } catch {
    return serverError('방문 통계를 불러오지 못했습니다. D1 마이그레이션 적용 여부를 확인해주세요.');
  }
};
