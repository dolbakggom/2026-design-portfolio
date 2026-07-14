export const MAX_JSON_BODY_BYTES = 2 * 1024 * 1024;

export const json = (body: unknown, init?: ResponseInit) => {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");

  return new Response(JSON.stringify(body), {
    ...init,
    headers
  });
};

export const unauthorized = () => json({ error: "Unauthorized" }, { status: 401 });

export const forbidden = () => json({ error: "Forbidden" }, { status: 403 });

export const tooManyRequests = () =>
  json(
    { error: "로그인 시도가 너무 많습니다. 1분 뒤 다시 시도해주세요." },
    { status: 429, headers: { "retry-after": "60" } }
  );

export const badRequest = (message: string, details?: unknown) =>
  json({ error: message, details }, { status: 400 });

export const notFound = () => json({ error: "Not found" }, { status: 404 });

export const serverError = (message = "Server error") => json({ error: message }, { status: 500 });

export const readJson = async (request: Request, maxBytes = MAX_JSON_BODY_BYTES) => {
  try {
    const declaredLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) return null;

    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > maxBytes) return null;
    return JSON.parse(body);
  } catch {
    return null;
  }
};
