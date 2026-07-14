import type { AssetRef, AssetVariant } from "../types";

export const RESPONSIVE_IMAGE_WIDTHS = [640, 1280, 1920, 2560] as const;

export const selectVariantWidths = (sourceWidth: number) => {
  if (!Number.isFinite(sourceWidth) || sourceWidth <= 0) {
    throw new Error("Invalid source image width");
  }

  const fittedWidth = Math.max(1, Math.round(sourceWidth));
  return [...new Set([...RESPONSIVE_IMAGE_WIDTHS.filter((width) => width < fittedWidth), fittedWidth])].sort(
    (left, right) => left - right
  );
};

export const variantDimensions = (sourceWidth: number, sourceHeight: number, targetWidth: number) => {
  if (
    !Number.isFinite(sourceWidth) ||
    !Number.isFinite(sourceHeight) ||
    !Number.isFinite(targetWidth) ||
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    targetWidth <= 0
  ) {
    throw new Error("Invalid image dimensions");
  }

  const width = Math.min(Math.round(sourceWidth), Math.round(targetWidth));
  return {
    width,
    height: Math.max(1, Math.round((sourceHeight / sourceWidth) * width))
  };
};

export const attachAssetVariants = (
  asset: AssetRef | null | undefined,
  variantsByAssetId: Map<string, AssetVariant[]>
) => {
  if (!asset?.id) return asset;
  const variants = variantsByAssetId.get(asset.id);
  return variants?.length ? { ...asset, variants } : asset;
};

export const buildResponsiveImageSource = (asset: AssetRef | null | undefined) => {
  const fallback = asset?.url ?? "";
  if (!fallback || asset?.mime === "image/gif") return { src: fallback };

  const uniqueVariants = new Map<number, string>();
  for (const variant of asset?.variants ?? []) {
    if (
      typeof variant.width === "number" &&
      Number.isFinite(variant.width) &&
      variant.width > 0 &&
      typeof variant.url === "string" &&
      variant.url.length > 0 &&
      !uniqueVariants.has(variant.width)
    ) {
      uniqueVariants.set(variant.width, variant.url);
    }
  }

  const variants = [...uniqueVariants.entries()].sort(([left], [right]) => left - right);
  if (!variants.length) return { src: fallback };

  return {
    src: variants.at(-1)?.[1] ?? fallback,
    srcset: variants.map(([width, url]) => `${url} ${width}w`).join(", ")
  };
};
