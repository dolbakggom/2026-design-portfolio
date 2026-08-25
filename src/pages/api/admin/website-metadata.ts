import type { APIRoute } from "astro";
import { isAdminRequest } from "../../../lib/auth";
import { createAssetRecord } from "../../../lib/admin-data";
import { getR2 } from "../../../lib/db";
import { badRequest, json, readJson, serverError, unauthorized } from "../../../lib/http";
import { normalizeErrorForLog } from "../../../lib/content-observability";
import { websiteMetadataSchema } from "../../../lib/validation";
import { fetchWebsiteImage, fetchWebsiteMetadata } from "../../../lib/website-metadata";

export const prerender = false;

const extensionByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();

  const parsed = websiteMetadataSchema.safeParse(await readJson(request));
  if (!parsed.success) return badRequest("올바른 웹사이트 주소를 입력해주세요.", parsed.error.issues);

  try {
    const metadata = await fetchWebsiteMetadata(parsed.data.url);
    let asset = null;
    let imageWarning = "";

    if (metadata.imageUrl) {
      try {
        const image = await fetchWebsiteImage(metadata.imageUrl);
        const id = crypto.randomUUID();
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, "0");
        const key = `website/${year}/${month}/${id}.${extensionByMime[image.mime]}`;
        const bucket = getR2();

        await bucket.put(key, image.bytes, { httpMetadata: { contentType: image.mime } });
        try {
          asset = await createAssetRecord({
            id,
            r2_key: key,
            alt: metadata.title ? `${metadata.title} website preview` : `${metadata.domain} website preview`,
            mime: image.mime,
            width: null,
            height: null,
            size: image.bytes.byteLength
          });
        } catch (error) {
          await bucket.delete(key).catch(() => undefined);
          throw error;
        }
      } catch (error) {
        imageWarning = error instanceof Error ? error.message : "대표 이미지를 가져오지 못했습니다.";
      }
    } else {
      imageWarning = "사이트에 설정된 대표 이미지를 찾지 못했습니다.";
    }

    return json({ metadata, asset, imageWarning });
  } catch (error) {
    console.error("[portfolio.website_metadata.fetch_failed]", {
      event: "portfolio.website_metadata.fetch_failed",
      ...normalizeErrorForLog(error)
    });
    return serverError(error instanceof Error ? error.message : "사이트 정보를 불러오지 못했습니다.");
  }
};
