import type { APIRoute } from "astro";
import { isAdminRequest } from "../../../lib/auth";
import { createAssetRecord } from "../../../lib/admin-data";
import { getR2 } from "../../../lib/db";
import { badRequest, json, serverError, unauthorized } from "../../../lib/http";
import {
  buildUploadedImageKeys,
  detectImageMime,
  IMAGE_UPLOAD_MIME_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_REQUEST_BYTES,
  parseImageVariantManifest
} from "../../../lib/image-upload";
import { normalizeErrorForLog } from "../../../lib/content-observability";

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
  if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_UPLOAD_REQUEST_BYTES + 1024 * 1024) {
    return badRequest("Upload request is too large");
  }

  const form = await request.formData();
  const file = form.get("file");
  const alt = String(form.get("alt") ?? "");
  const width = readDimension(form.get("width"));
  const height = readDimension(form.get("height"));
  let manifest;

  try {
    manifest = parseImageVariantManifest(String(form.get("variantManifest") ?? ""));
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "Invalid image variant manifest");
  }

  if (!(file instanceof File)) {
    return badRequest("Missing upload file");
  }

  if (!IMAGE_UPLOAD_MIME_TYPES.has(file.type)) {
    return badRequest("Unsupported image format");
  }

  if (file.size <= 0 || file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return badRequest("Image must be smaller than 16MB");
  }

  if (manifest.length > 0) {
    const canonicalEntry = manifest.find((entry) => entry.field === "file");
    const largestEntry = manifest.at(-1);
    if (
      !canonicalEntry ||
      canonicalEntry !== largestEntry ||
      canonicalEntry.width !== width ||
      canonicalEntry.height !== height ||
      file.type !== "image/webp"
    ) {
      return badRequest("Canonical image metadata does not match the variant manifest");
    }
  }

  try {
    const id = crypto.randomUUID();
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const key = `uploads/${year}/${month}/${id}-${safeFileName(file.name)}`;
    const uploadEntries = manifest.length
      ? manifest.map((entry) => ({ entry, file: form.get(entry.field) }))
      : [{ entry: { field: "file", width, height, mime: file.type }, file }];

    if (uploadEntries.some(({ file: uploadFile }) => !(uploadFile instanceof File))) {
      return badRequest("Missing image variant file");
    }

    const uploads = [];
    let totalBytes = 0;

    for (const { entry, file: uploadFileValue } of uploadEntries) {
      const uploadFile = uploadFileValue as File;
      if (uploadFile.size <= 0 || uploadFile.size > MAX_IMAGE_UPLOAD_BYTES) {
        return badRequest("Each image variant must be smaller than 16MB");
      }

      const bytes = await uploadFile.arrayBuffer();
      totalBytes += bytes.byteLength;
      const detectedMime = detectImageMime(new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 16)));
      if (!detectedMime || detectedMime !== uploadFile.type || detectedMime !== entry.mime) {
        return badRequest("Image content does not match its declared format");
      }

      uploads.push({
        field: entry.field,
        width: entry.width,
        height: entry.height,
        mime: detectedMime,
        bytes,
        key: entry.field === "file" ? key : `variants/${year}/${month}/${id}-${entry.width}w.webp`
      });
    }

    if (totalBytes > MAX_IMAGE_UPLOAD_REQUEST_BYTES) {
      return badRequest("Combined image variants are too large");
    }

    const canonical = uploads.find((upload) => upload.field === "file");
    if (!canonical) return badRequest("Missing canonical image file");

    const bucket = getR2();
    const uploadedKeys: string[] = [];

    try {
      for (const upload of uploads) {
        await bucket.put(upload.key, upload.bytes, {
          httpMetadata: {
            contentType: upload.mime
          }
        });
        uploadedKeys.push(upload.key);
      }
    } catch (error) {
      await Promise.all(uploadedKeys.map((uploadedKey) => bucket.delete(uploadedKey).catch(() => undefined)));
      throw error;
    }

    let asset;
    try {
      const variants = manifest.length
        ? uploads.map((upload) => ({
            width: upload.width as number,
            height: upload.height as number,
            r2_key: upload.key,
            mime: upload.mime,
            size: upload.bytes.byteLength
          }))
        : [];

      asset = await createAssetRecord({
        id,
        r2_key: key,
        alt,
        mime: canonical.mime,
        width,
        height,
        size: canonical.bytes.byteLength
      }, variants);
    } catch (error) {
      const rollbackKeys = buildUploadedImageKeys(
        key,
        uploads.filter((upload) => upload.field !== "file").map((upload) => upload.key)
      );
      await Promise.all(rollbackKeys.map((rollbackKey) => bucket.delete(rollbackKey).catch(() => undefined)));
      throw error;
    }

    return json({ asset }, { status: 201 });
  } catch (error) {
    console.error("[portfolio.asset.upload_failed]", {
      event: "portfolio.asset.upload_failed",
      ...normalizeErrorForLog(error)
    });
    return serverError("Unable to upload asset");
  }
};
