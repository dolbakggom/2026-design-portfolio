import { env } from "cloudflare:workers";

const COOKIE_NAME = "portfolio_admin";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

const base64UrlEncode = (bytes: Uint8Array) => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
};

const base64UrlDecode = (value: string) => {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const hexToBytes = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
};

const timingSafeEqual = (a: Uint8Array, b: Uint8Array) => {
  let diff = a.length ^ b.length;
  const max = Math.max(a.length, b.length);
  for (let index = 0; index < max; index += 1) {
    diff |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return diff === 0;
};

const hmac = async (value: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return new Uint8Array(signature);
};

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return new Uint8Array(digest);
};

const pbkdf2 = async (password: string, iterations: number, salt: Uint8Array, byteLength: number) => {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBuffer, iterations },
    key,
    byteLength * 8
  );
  return new Uint8Array(bits);
};

const getCookie = (request: Request, name: string) => {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;

  const match = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

export const verifyPassword = async (password: string, storedHash = env.ADMIN_PASSWORD_HASH) => {
  if (!storedHash) return false;

  if (storedHash.startsWith("sha256:")) {
    const expected = hexToBytes(storedHash.slice("sha256:".length));
    return timingSafeEqual(await sha256(password), expected);
  }

  if (storedHash.startsWith("pbkdf2:")) {
    const [, iterationsValue, saltValue, hashValue] = storedHash.split(":");
    const expected = base64UrlDecode(hashValue ?? "");
    const derived = await pbkdf2(password, Number(iterationsValue), base64UrlDecode(saltValue ?? ""), expected.length);
    return timingSafeEqual(derived, expected);
  }

  return false;
};

export const createSessionCookie = async (request: Request) => {
  const payload = base64UrlEncode(
    encoder.encode(
      JSON.stringify({
        sub: "admin",
        exp: Date.now() + SESSION_MAX_AGE * 1000
      })
    )
  );
  const signature = base64UrlEncode(await hmac(payload));
  const token = `${payload}.${signature}`;
  const isSecure = new URL(request.url).protocol === "https:";

  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}${
    isSecure ? "; Secure" : ""
  }`;
};

export const createExpiredSessionCookie = () =>
  `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;

export const isAdminRequest = async (request: Request) => {
  const token = getCookie(request, COOKIE_NAME);
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = base64UrlEncode(await hmac(payload));
  if (!timingSafeEqual(encoder.encode(signature), encoder.encode(expected))) return false;

  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload))) as { sub?: string; exp?: number };
    return parsed.sub === "admin" && typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
};
