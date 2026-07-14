const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const isStrongSessionSecret = (secret: string) => new TextEncoder().encode(secret).byteLength >= 32;

export const isAllowedAdminMutation = (request: Request) => {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return true;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
};
