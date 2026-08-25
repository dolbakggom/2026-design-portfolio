import { detectImageMime, MAX_IMAGE_UPLOAD_BYTES } from "./image-upload.ts";

const MAX_HTML_BYTES = 1_500_000;
const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 8_000;

const decodeHtmlEntities = (value: string) => {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"'
  };

  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, token: string) => {
    if (token.startsWith("#x") || token.startsWith("#X")) {
      const codePoint = Number.parseInt(token.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }
    if (token.startsWith("#")) {
      const codePoint = Number.parseInt(token.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }
    return named[token.toLowerCase()] ?? entity;
  });
};

const cleanText = (value: string, maxLength: number) =>
  decodeHtmlEntities(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const attributesOf = (tag: string) => {
  const attributes: Record<string, string> = {};
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of tag.matchAll(pattern)) {
    const name = match[1]?.toLowerCase();
    if (!name || name === "meta") continue;
    attributes[name] = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
};

const isBlockedIpv4 = (hostname: string) => {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
};

const isBlockedIpv6 = (hostname: string) => {
  const value = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!value.includes(":")) return false;
  if (value === "::" || value === "::1") return true;
  if (value.startsWith("fc") || value.startsWith("fd") || /^fe[89ab]/.test(value)) return true;
  const mappedIpv4 = value.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mappedIpv4 ? isBlockedIpv4(mappedIpv4) : false;
};

export const normalizePublicWebsiteUrl = (value: string, base?: string) => {
  const url = new URL(value, base);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("공개 HTTP 또는 HTTPS 사이트 주소만 사용할 수 있습니다.");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    isBlockedIpv4(hostname) ||
    isBlockedIpv6(hostname)
  ) {
    throw new Error("내부 네트워크 주소는 불러올 수 없습니다.");
  }

  url.hash = "";
  return url;
};

export type ParsedWebsiteMetadata = {
  title: string;
  description: string;
  imageUrl: string;
};

export const parseWebsiteMetadata = (html: string, pageUrl: string): ParsedWebsiteMetadata => {
  const values = new Map<string, string>();
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attributes = attributesOf(tag);
    const key = (attributes.property || attributes.name || attributes.itemprop || "").toLowerCase();
    if (key && attributes.content && !values.has(key)) values.set(key, attributes.content);
  }

  const documentTitle = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const title = cleanText(values.get("og:title") || values.get("twitter:title") || documentTitle, 240);
  const description = cleanText(
    values.get("og:description") || values.get("twitter:description") || values.get("description") || "",
    1000
  );
  const imageCandidate =
    values.get("og:image:secure_url") ||
    values.get("og:image") ||
    values.get("twitter:image") ||
    values.get("twitter:image:src") ||
    "";

  let imageUrl = "";
  if (imageCandidate) {
    try {
      imageUrl = normalizePublicWebsiteUrl(imageCandidate, pageUrl).toString();
    } catch {
      imageUrl = "";
    }
  }

  return { title, description, imageUrl };
};

const readResponseBytes = async (response: Response, maxBytes: number) => {
  const declaredSize = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > maxBytes) throw new Error("응답 파일이 너무 큽니다.");
  if (!response.body) return new Uint8Array();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("응답 파일이 너무 큽니다.");
    }
    chunks.push(value);
  }

  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
};

const fetchWithSafeRedirects = async (initialUrl: URL, accept: string) => {
  let currentUrl = initialUrl;
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      redirect: "manual",
      headers: {
        accept,
        "user-agent": "Dolbakggom Portfolio Website Preview/1.0"
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectCount === MAX_REDIRECTS) throw new Error("사이트 이동 경로가 너무 깁니다.");
      currentUrl = normalizePublicWebsiteUrl(location, currentUrl.toString());
      continue;
    }

    if (!response.ok) throw new Error(`사이트가 ${response.status} 응답을 반환했습니다.`);
    return { response, finalUrl: currentUrl };
  }

  throw new Error("사이트를 불러올 수 없습니다.");
};

export const fetchWebsiteMetadata = async (value: string) => {
  const initialUrl = normalizePublicWebsiteUrl(value);
  const { response, finalUrl } = await fetchWithSafeRedirects(initialUrl, "text/html,application/xhtml+xml");
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error("HTML 웹사이트 주소를 입력해주세요.");
  }

  const html = new TextDecoder().decode(await readResponseBytes(response, MAX_HTML_BYTES));
  const metadata = parseWebsiteMetadata(html, finalUrl.toString());
  return {
    ...metadata,
    url: finalUrl.toString(),
    domain: finalUrl.hostname.replace(/^www\./, "")
  };
};

export const fetchWebsiteImage = async (value: string) => {
  const imageUrl = normalizePublicWebsiteUrl(value);
  const { response } = await fetchWithSafeRedirects(imageUrl, "image/jpeg,image/png,image/webp,image/gif,image/*;q=0.8");
  const bytes = await readResponseBytes(response, MAX_IMAGE_UPLOAD_BYTES);
  const mime = detectImageMime(bytes.subarray(0, 16));
  if (!mime) throw new Error("대표 이미지 형식을 지원하지 않습니다.");
  return { bytes, mime };
};
