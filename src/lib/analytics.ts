import { z } from 'zod';

export const analyticsEventSchema = z.object({
  id: z.uuid(),
  sessionId: z.uuid(),
  path: z.string().max(240).regex(/^\/(?:about|career|work(?:\/[a-zA-Z0-9_-]+)?)?$/),
  referrer: z.string().max(253).refine(value => value === '' || /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/.test(value)),
  device: z.enum(['mobile', 'desktop']),
  activeSeconds: z.number().int().min(0).max(86400)
}).strict();

export const analyticsCutoff = (days: number, now = Date.now()) =>
  Math.floor((now + 9 * 3600000) / 86400000) * 86400000 - 9 * 3600000 - (days - 1) * 86400000;

export type AnalyticsReport = {
  summary: { sessions: number; views: number; seconds: number };
  daily: { day: string; sessions: number }[];
  projects: { path: string; title: string; views: number; sessions: number; seconds: number }[];
  recent: { sessionId: string; firstSeen: number; lastSeen: number; seconds: number; views: number; device: string; referrer: string; paths: string }[];
};
