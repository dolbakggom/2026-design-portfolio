const OPT_OUT_KEY = 'portfolio-analytics-off';
const TIMEOUT = 30 * 60 * 1000;

// Never let unavailable storage or telemetry interrupt the public experience.
export function initVisitAnalytics() {
  if (import.meta.env.DEV || !['dolbakggom.com', 'www.dolbakggom.com'].includes(location.hostname)) return;
  if (navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
  const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
  if (read(OPT_OUT_KEY) === '1') return;
  let referrer = '';
  try {
    const source = new URL(document.referrer);
    if (source.origin !== location.origin) referrer = source.hostname;
  } catch { /* Direct or unavailable referral. */ }
  let path = location.pathname.replace(/\/$/, '') || '/';
  let ticket: { id: string; sessionId: string; viewToken: string } | null = null;
  let generation = 0;
  let bootstrapQueue = Promise.resolve();
  let seconds = 0;
  let sentSeconds = -1;
  let lastInput = Date.now();
  let lastTick = Date.now();
  let stopped = false;
  const device = matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop';
  const flush = () => {
    if (stopped || !ticket || read(OPT_OUT_KEY) === '1' || seconds < 5 || Math.floor(seconds) === sentSeconds) return;
    if (!/^\/(?:about|career|work(?:\/[a-zA-Z0-9_-]+)?)?$/.test(path)) return;
    const current = generation;
    sentSeconds = Math.floor(seconds);
    void fetch('/api/analytics', {
      method: 'POST', credentials: 'same-origin', keepalive: true,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...ticket, path, referrer, device, activeSeconds: sentSeconds })
    }).then(response => {
      if (current !== generation) return;
      if (response.status === 429 || response.status === 403) stopped = true;
      else if (!response.ok) sentSeconds = -1;
    }).catch(() => { if (current === generation) sentSeconds = -1; });
  };
  // Bind each page to a server-issued ticket; stale route responses cannot replace it.
  const resetView = (resetSession = false) => {
    ticket = null; seconds = 0; sentSeconds = -1;
    const current = ++generation;
    if (stopped || read(OPT_OUT_KEY) === '1') return;
    bootstrapQueue = bootstrapQueue.then(async () => {
      if (current !== generation) return;
      const response = await fetch('/api/analytics/session', {
        method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path, referrer, device, resetSession })
      });
      if (current !== generation) return;
      if (!response.ok || response.status === 204) { stopped = true; return; }
      const value = await response.json();
      if (current === generation && value && typeof value === 'object' &&
          'id' in value && typeof value.id === 'string' &&
          'sessionId' in value && typeof value.sessionId === 'string' &&
          'viewToken' in value && typeof value.viewToken === 'string') {
        ticket = { id: value.id, sessionId: value.sessionId, viewToken: value.viewToken };
      }
    }).catch(() => { /* Telemetry failure must not interrupt navigation. */ });
  };
  const activity = () => {
    const now = Date.now();
    if (now - lastInput >= TIMEOUT) {
      flush();
      resetView(true);
    }
    lastInput = now;
  };
  const controller = new AbortController();
  for (const name of ['pointerdown', 'keydown', 'scroll']) window.addEventListener(name, activity, { passive: true, signal: controller.signal });
  const timer = window.setInterval(() => {
    const now = Date.now();
    const nextPath = location.pathname.replace(/\/$/, '') || '/';
    if (nextPath !== path) { flush(); path = nextPath; resetView(); }
    if (document.visibilityState === 'visible' && now - lastInput < 60000) {
      seconds += Math.min((now - lastTick) / 1000, 2);
      if (seconds >= 5 && (sentSeconds < 0 || seconds - sentSeconds >= 15)) flush();
    }
    lastTick = now;
  }, 1000);
  document.addEventListener('visibilitychange', () => { flush(); lastTick = Date.now(); }, { signal: controller.signal });
  window.addEventListener('pagehide', flush, { signal: controller.signal });
  document.addEventListener('astro:before-swap', () => { flush(); clearInterval(timer); controller.abort(); }, { once: true, signal: controller.signal });
  resetView();
}
