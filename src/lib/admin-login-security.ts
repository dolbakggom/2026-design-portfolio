type LoginRateLimiter = {
  limit(options: { key: string }): Promise<{ success: boolean }>;
};

type LoginSecurityReason = "invalid_credentials" | "rate_limited" | "verification_unavailable";

export const adminLoginRateLimitKey = (request: Request) => {
  // Cloudflare supplies this header; do not trust client-controlled forwarding headers.
  const ip = request.headers.get("cf-connecting-ip")?.trim();
  return `portfolio-admin-login:ip:${ip || "unknown"}`;
};

export const isAdminLoginAllowed = async (request: Request, limiter: LoginRateLimiter) =>
  (await limiter.limit({ key: adminLoginRateLimitKey(request) })).success;

export const reportAdminLoginSecurityEvent = (
  request: Request,
  reason: LoginSecurityReason,
  logger: (...args: unknown[]) => void = console.warn
) => {
  const ray = request.headers.get("cf-ray");
  logger("[portfolio.admin.login_security]", {
    event: "portfolio.admin.login_security",
    reason,
    ...(ray && /^[a-f0-9]{16,32}-[A-Z]{3}$/.test(ray) ? { ray } : {})
  });
};
