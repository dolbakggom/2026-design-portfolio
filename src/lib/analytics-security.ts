import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

export const ANALYTICS_SESSION_SECONDS = 30 * 60;
const COOKIE_NAME = "portfolio_visit";
const claims = z.object({
  sessionId: z.uuid(),
  id: z.uuid(),
  path: z.string(),
  referrer: z.string(),
  device: z.enum(["mobile", "desktop"]),
  startedAt: z.number().int().nonnegative()
});
export type AnalyticsView = z.infer<typeof claims>;

const key = async (secret: string) => {
  const bytes = new TextEncoder().encode(secret);
  if (bytes.length < 32) throw new Error("Analytics signing secret is unavailable");
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`portfolio-analytics-v1\0${secret}`)));
};

const sign = async (payload: Record<string, unknown>, purpose: string, origin: string, secret: string, seconds: number, now: number) =>
  new SignJWT({ ...payload, purpose }).setProtectedHeader({ alg: "HS256" })
    .setIssuer("portfolio-analytics").setAudience(origin).setIssuedAt(Math.floor(now / 1000))
    .setExpirationTime(Math.floor(now / 1000) + seconds).sign(await key(secret));

const verify = async (token: string, purpose: string, origin: string, secret: string, now: number) => {
  const { payload } = await jwtVerify(token, await key(secret), {
    algorithms: ["HS256"], issuer: "portfolio-analytics", audience: origin,
    currentDate: new Date(now), requiredClaims: ["exp", "iat"]
  });
  if (payload.purpose !== purpose) throw new Error("Invalid analytics token purpose");
  return payload;
};

export const readAnalyticsSession = async (request: Request, secret: string, now = Date.now()) => {
  try {
    const cookie = request.headers.get("cookie")?.split(";").map(part => part.trim())
      .find(part => part.startsWith(`${COOKIE_NAME}=`));
    if (!cookie || cookie.length > 2048) return null;
    const token = decodeURIComponent(cookie.slice(COOKIE_NAME.length + 1));
    const payload = await verify(token, "session", new URL(request.url).origin, secret, now);
    return z.uuid().parse(payload.sessionId);
  } catch { return null; }
};

export const createAnalyticsSessionCookie = async (request: Request, sessionId: string, secret: string, now = Date.now()) => {
  const url = new URL(request.url);
  const token = await sign({ sessionId }, "session", url.origin, secret, ANALYTICS_SESSION_SECONDS, now);
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/api/analytics; HttpOnly; SameSite=Strict; Max-Age=${ANALYTICS_SESSION_SECONDS}${url.protocol === "https:" ? "; Secure" : ""}`;
};

export const issueAnalyticsView = async (
  request: Request,
  metadata: Pick<AnalyticsView, "path" | "referrer" | "device">,
  secret: string,
  resetSession = false,
  now = Date.now()
) => {
  const sessionId = (!resetSession && await readAnalyticsSession(request, secret, now)) || crypto.randomUUID();
  const view: AnalyticsView = { ...metadata, sessionId, id: crypto.randomUUID(), startedAt: now };
  const viewToken = await sign(view, "view", new URL(request.url).origin, secret, 86400, now);
  return { view, viewToken, cookie: await createAnalyticsSessionCookie(request, sessionId, secret, now) };
};

export const verifyAnalyticsView = async (request: Request, token: string, secret: string, now = Date.now()) => {
  try {
    const parsed = claims.safeParse(await verify(token, "view", new URL(request.url).origin, secret, now));
    if (!parsed.success || parsed.data.startedAt > now) return null;
    const sessionId = await readAnalyticsSession(request, secret, now);
    return sessionId === parsed.data.sessionId ? parsed.data : null;
  } catch { return null; }
};

export const boundedAnalyticsSeconds = (claimed: number, startedAt: number, now: number) =>
  Math.max(0, Math.min(claimed, 86400, Math.floor((now - startedAt) / 1000)));
