export const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {})
    }
  });

export const unauthorized = () => json({ error: "Unauthorized" }, { status: 401 });

export const badRequest = (message: string, details?: unknown) =>
  json({ error: message, details }, { status: 400 });

export const notFound = () => json({ error: "Not found" }, { status: 404 });

export const serverError = (message = "Server error") => json({ error: message }, { status: 500 });

export const readJson = async (request: Request) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};
