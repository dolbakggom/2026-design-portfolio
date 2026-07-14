import type { APIRoute } from "astro";
import { isAdminRequest } from "../../../lib/auth";
import { createAssetRecord } from "../../../lib/admin-data";
import { getR2 } from "../../../lib/db";
import { badRequest, json, serverError, unauthorized } from "../../../lib/http";
import { detectImageMime, IMAGE_UPLOAD_MIME_TYPES, MAX_IMAGE_UPLOAD_BYTES } from "../../../lib/image-upload";

export const prerender = false;

const safeFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "upload";

const readDimension = (value: FormDataEntryValue | null) => {
  const dimension = Number(value);
  return Number.isInteger(dimension) && dimension > 0 && dimension <= 20_000 ? dimension : null;
};

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_UPLOAD_BYTES + 1024 * 1024) {
    return badRequest("Upload request is too large");
  }

  const form = await request.formData();
  const file = form.get("file");
  const alt = String(form.get("alt") ?? "");
  const width = readDimension(form.get("width"));
  const height = readDimension(form.get("height"));

  if (!(file instanceof File)) {
    return badRequest("Missing upload file");
  }

  if (!IMAGE_UPLOAD_MIME_TYPES.has(file.type)) {
    return badRequest("Unsupported image format");
  }

  if (file.size <= 0 || file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return badRequest("Image must be smaller than 16MB");
  }

  try {
    const id = crypto.randomUUID();
    const now = new Date();
    const key = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${id}-${safeFileName(
      file.name
    )}`;
    const bytes = await file.arrayBuffer();
    const detectedMime = detectImageMime(new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 16)));
    if (!detectedMime || detectedMime !== file.type) {
      return badRequest("Image content does not match its declared format");
    }

    const mime = detectedMime;
    const bucket = getR2();

    await bucket.put(key, bytes, {
      httpMetadata: {
        contentType: mime
      }
    });

    let asset;
    try {
      asset = await createAssetRecord({
        id,
        r2_key: key,
        alt,
        mime,
        width,
        height,
        size: bytes.byteLength
      });
    } catch (error) {
      await bucket.delete(key).catch(() => undefined);
      throw error;
    }

    return json({ asset }, { status: 201 });
  } catch {
    return serverError("Unable to upload asset");
  }
};
