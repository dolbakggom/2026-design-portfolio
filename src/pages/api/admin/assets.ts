import type { APIRoute } from "astro";
import { isAdminRequest } from "../../../lib/auth";
import { createAssetRecord } from "../../../lib/admin-data";
import { getR2 } from "../../../lib/db";
import { badRequest, json, serverError, unauthorized } from "../../../lib/http";

export const prerender = false;

const safeFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "upload";

export const POST: APIRoute = async ({ request }) => {
  if (!(await isAdminRequest(request))) return unauthorized();

  const form = await request.formData();
  const file = form.get("file");
  const alt = String(form.get("alt") ?? "");

  if (!(file instanceof File)) {
    return badRequest("Missing upload file");
  }

  try {
    const id = crypto.randomUUID();
    const now = new Date();
    const key = `uploads/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${id}-${safeFileName(
      file.name
    )}`;
    const mime = file.type || "application/octet-stream";
    const bytes = await file.arrayBuffer();

    await getR2().put(key, bytes, {
      httpMetadata: {
        contentType: mime
      }
    });

    const asset = await createAssetRecord({
      id,
      r2_key: key,
      alt,
      mime,
      width: null,
      height: null,
      size: bytes.byteLength
    });

    return json({ asset }, { status: 201 });
  } catch {
    return serverError("Unable to upload asset");
  }
};
