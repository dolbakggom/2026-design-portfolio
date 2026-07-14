export const MAX_IMAGE_DIMENSION = 2560;
export const MAX_IMAGE_UPLOAD_BYTES = 16 * 1024 * 1024;
export const MAX_IMAGE_UPLOAD_REQUEST_BYTES = 32 * 1024 * 1024;
export const MAX_IMAGE_VARIANTS = 4;
export const IMAGE_UPLOAD_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type ImageVariantManifestEntry = {
  field: string;
  width: number;
  height: number;
  mime: "image/webp";
};

const isValidDimension = (value: unknown): value is number =>
  Number.isInteger(value) && Number(value) > 0 && Number(value) <= 20_000;

export const parseImageVariantManifest = (value: string | null | undefined): ImageVariantManifestEntry[] => {
  if (!value) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("Image variant manifest must be valid JSON");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Image variant manifest must be an array");
  }

  if (parsed.length > MAX_IMAGE_VARIANTS) {
    throw new Error(`Image variant manifest supports at most ${MAX_IMAGE_VARIANTS} entries`);
  }

  const entries = parsed.map((entry): ImageVariantManifestEntry => {
    if (!entry || typeof entry !== "object") {
      throw new Error("Image variant manifest contains an invalid entry");
    }

    const candidate = entry as Record<string, unknown>;
    const validField = candidate.field === "file" || /^variant-[0-3]$/.test(String(candidate.field));
    if (!validField || !isValidDimension(candidate.width) || !isValidDimension(candidate.height)) {
      throw new Error("Image variant manifest contains invalid metadata");
    }

    if (candidate.mime !== "image/webp") {
      throw new Error("Image variants must use image/webp");
    }

    return {
      field: String(candidate.field),
      width: candidate.width,
      height: candidate.height,
      mime: candidate.mime
    };
  });

  if (new Set(entries.map((entry) => entry.width)).size !== entries.length) {
    throw new Error("Image variant widths must be unique");
  }

  if (new Set(entries.map((entry) => entry.field)).size !== entries.length) {
    throw new Error("Image variant fields must be unique");
  }

  return entries.sort((a, b) => a.width - b.width);
};

export const buildUploadedImageKeys = (canonicalKey: string, variantKeys: string[]) =>
  Array.from(new Set([canonicalKey, ...variantKeys]));

const startsWithBytes = (bytes: Uint8Array, signature: number[]) =>
  signature.every((value, index) => bytes[index] === value);

export const detectImageMime = (bytes: Uint8Array) => {
  if (startsWithBytes(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (
    startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    startsWithBytes(bytes.slice(8), [0x57, 0x45, 0x42, 0x50])
  ) {
    return "image/webp";
  }
  if (
    startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return "image/gif";
  }
  return null;
};

export const fitImageDimensions = (width: number, height: number, maxDimension = MAX_IMAGE_DIMENSION) => {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error("Invalid image dimensions");
  }

  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
};
