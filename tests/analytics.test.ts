import assert from 'node:assert/strict';
import test from 'node:test';
import { analyticsCutoff, analyticsEventSchema } from '../src/lib/analytics.ts';

test('analytics input excludes query strings, identifiers in referrers and invalid paths', () => {
  const event = { id: crypto.randomUUID(), sessionId: crypto.randomUUID(), path: '/work/example', referrer: 'google.com', device: 'desktop', activeSeconds: 15 };
  assert.equal(analyticsEventSchema.safeParse(event).success, true);
  for (const patch of [{ path: '/admin' }, { path: '/work/a?email=someone' }, { referrer: 'https://google.com/?q=private' }, { activeSeconds: -1 }, { activeSeconds: 100000 }, { ip: '1.2.3.4' }]) {
    assert.equal(analyticsEventSchema.safeParse({ ...event, ...patch }).success, false);
  }
});

test('analytics period begins at Korean midnight including the selected day', () => {
  const now = Date.parse('2026-09-17T01:00:00+09:00');
  assert.equal(analyticsCutoff(1, now), Date.parse('2026-09-17T00:00:00+09:00'));
  assert.equal(analyticsCutoff(7, now), Date.parse('2026-09-11T00:00:00+09:00'));
});
