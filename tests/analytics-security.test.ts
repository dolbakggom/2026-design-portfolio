import assert from 'node:assert/strict';
import test from 'node:test';
import { boundedAnalyticsSeconds, issueAnalyticsView, verifyAnalyticsView } from '../src/lib/analytics-security.ts';

const secret = 'test-only-analytics-secret-with-at-least-32-bytes';
const now = Date.now();
const metadata = { path: '/work/example', referrer: 'google.com', device: 'desktop' as const };
const request = (cookie = '', origin = 'https://portfolio.test') => new Request(`${origin}/api/analytics`, { headers: { cookie } });

test('analytics tickets require the signed matching session and origin', async () => {
  const issued = await issueAnalyticsView(request(), metadata, secret, false, now);
  const cookie = issued.cookie.split(';')[0];
  assert.match(issued.cookie, /HttpOnly; SameSite=Strict/);
  assert.match(issued.cookie, /; Secure$/);
  assert.deepEqual(await verifyAnalyticsView(request(cookie), issued.viewToken, secret, now), issued.view);
  assert.equal(await verifyAnalyticsView(request(), issued.viewToken, secret, now), null);
  assert.equal(await verifyAnalyticsView(request(cookie, 'https://other.test'), issued.viewToken, secret, now), null);
  assert.equal(await verifyAnalyticsView(request(cookie), `x${issued.viewToken}`, secret, now), null);
  assert.equal(await verifyAnalyticsView(request(cookie), issued.viewToken, secret, now + 1800000), null);
  const other = await issueAnalyticsView(request(), metadata, secret, false, now);
  assert.equal(await verifyAnalyticsView(request(other.cookie.split(';')[0]), issued.viewToken, secret, now), null);
  assert.equal(await verifyAnalyticsView(request(cookie), cookie.split('=')[1], secret, now), null);
});

test('analytics session is reused across pages but reset only creates a new server ID', async () => {
  const first = await issueAnalyticsView(request(), metadata, secret, false, now);
  const next = await issueAnalyticsView(request(first.cookie.split(';')[0]), { ...metadata, path: '/about' }, secret, false, now);
  assert.equal(first.view.sessionId, next.view.sessionId);
  assert.notEqual(first.view.id, next.view.id);
  const reset = await issueAnalyticsView(request(first.cookie.split(';')[0]), metadata, secret, true, now);
  assert.notEqual(first.view.sessionId, reset.view.sessionId);
});

test('reported duration cannot exceed server elapsed time', () => {
  assert.equal(boundedAnalyticsSeconds(99999, now, now + 6500), 6);
  assert.equal(boundedAnalyticsSeconds(5, now, now + 6500), 5);
  assert.equal(boundedAnalyticsSeconds(5, now, now - 1000), 0);
});
