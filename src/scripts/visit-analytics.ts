const SESSION_KEY = 'portfolio-visit-session';
const OPT_OUT_KEY = 'portfolio-analytics-off';
const TIMEOUT = 30 * 60 * 1000;

// Never let unavailable storage or telemetry interrupt the public experience.
export function initVisitAnalytics() {
  if (import.meta.env.DEV || !['dolbakggom.com', 'www.dolbakggom.com'].includes(location.hostname)) return;
  if (navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
  const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
  const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* Memory-only session. */ } };
  let session = { id: crypto.randomUUID() as string, last: Date.now() };
  try {
    const saved = JSON.parse(read(SESSION_KEY) ?? 'null');
    if (saved && typeof saved.id === 'string' && /^[\da-f-]{36}$/.test(saved.id) && typeof saved.last === 'number' && saved.last <= Date.now() && Date.now() - saved.last < TIMEOUT) session = saved;
  } catch { /* Start a fresh session. */ }
  let referrer = '';
  try {
    const source = new URL(document.referrer);
    if (source.origin !== location.origin) referrer = source.hostname;
  } catch { /* Direct or unavailable referral. */ }
  let path = location.pathname.replace(/\/$/, '') || '/';
  let viewId = crypto.randomUUID();
  let seconds = 0;
  let sentSeconds = -1;
  let lastInput = Date.now();
  let lastTick = Date.now();
  let stopped = false;
  let lastStored = 0;
  const flush = () => {
    if (stopped || read(OPT_OUT_KEY) === '1' || seconds < 5 || Math.floor(seconds) === sentSeconds) return;
    if (!/^\/(?:about|career|work(?:\/[a-zA-Z0-9_-]+)?)?$/.test(path)) return;
    sentSeconds = Math.floor(seconds);
    void fetch('/api/analytics', {
      method: 'POST', credentials: 'same-origin', keepalive: true,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: viewId, sessionId: session.id, path, referrer,
        device: matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop', activeSeconds: sentSeconds })
    }).then(response => { if (response.status === 429) stopped = true; }).catch(() => {});
  };
  const resetView = () => { viewId = crypto.randomUUID(); seconds = 0; sentSeconds = -1; };
  const activity = () => {
    const now = Date.now();
    if (now - session.last >= TIMEOUT) {
      flush();
      session = { id: crypto.randomUUID(), last: now };
      resetView();
    }
    lastInput = now;
    session.last = now;
    if (now - lastStored >= 1000 && read(OPT_OUT_KEY) !== '1') {
      write(SESSION_KEY, JSON.stringify(session));
      lastStored = now;
    }
  };
  const controller = new AbortController();
  for (const name of ['pointerdown', 'keydown', 'scroll']) window.addEventListener(name, activity, { passive: true, signal: controller.signal });
  const timer = window.setInterval(() => {
    const now = Date.now();
    const nextPath = location.pathname.replace(/\/$/, '') || '/';
    if (nextPath !== path) { flush(); path = nextPath; resetView(); }
    if (document.visibilityState === 'visible' && now - lastInput < 60000 && now - session.last < TIMEOUT) {
      seconds += Math.min((now - lastTick) / 1000, 2);
      if (seconds >= 5 && (sentSeconds < 0 || seconds - sentSeconds >= 15)) flush();
    }
    lastTick = now;
  }, 1000);
  document.addEventListener('visibilitychange', () => { flush(); lastTick = Date.now(); }, { signal: controller.signal });
  window.addEventListener('pagehide', flush, { signal: controller.signal });
  document.addEventListener('astro:before-swap', () => { flush(); clearInterval(timer); controller.abort(); }, { once: true, signal: controller.signal });
  activity();
}
