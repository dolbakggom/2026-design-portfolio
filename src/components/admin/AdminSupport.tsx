import type { CSSProperties, ReactNode } from "react";
import type { AssetVariant, Profile, WorkBlock, WorkCategory, WorkItem } from "../../types";
import { fitImageDimensions, MAX_IMAGE_UPLOAD_BYTES } from "../../lib/image-upload";
import { selectVariantWidths, variantDimensions } from "../../lib/responsive-images";

export type AssetResponse = {
  asset: {
    id: string;
    url: string;
    alt: string;
    mime: string;
    size: number;
    width: number | null;
    height: number | null;
    variants: AssetVariant[];
  };
};

export type PublicationResult = {
  status: "purged" | "deferred" | "failed";
};

export type PublishedResponse<T> = T & {
  publication: PublicationResult;
};

export const publicationPriority: Record<PublicationResult["status"], number> = {
  purged: 0,
  deferred: 1,
  failed: 2
};

export const lessSuccessfulPublication = (current: PublicationResult | null, next: PublicationResult) =>
  !current || publicationPriority[next.status] > publicationPriority[current.status] ? next : current;

export type Tab = "profile" | "timeline" | "works";
export type WorkScreen = "list" | "editor";
export type WorkAssetKind = "thumbnail" | "featuredThumbnail";
export type AdminIconName = Tab | "logout";

export const navItems: Array<{ tab: Tab; label: string; icon: AdminIconName }> = [
  { tab: "profile", label: "Profile", icon: "profile" },
  { tab: "timeline", label: "Timeline", icon: "timeline" },
  { tab: "works", label: "Works", icon: "works" }
];

export function AdminIcon({ name }: { name: AdminIconName }) {
  const paths: Record<AdminIconName, ReactNode> = {
    profile: (
      <>
        <path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>
    ),
    timeline: (
      <>
        <path d="M8 5h10" />
        <path d="M8 12h10" />
        <path d="M8 19h10" />
        <path d="M4 5h.01" />
        <path d="M4 12h.01" />
        <path d="M4 19h.01" />
      </>
    ),
    works: (
      <>
        <path d="M4 5h16v5H4z" />
        <path d="M4 14h7v5H4z" />
        <path d="M15 14h5v5h-5z" />
      </>
    ),
    logout: (
      <>
        <path d="M10 5H6v14h4" />
        <path d="M14 8l4 4-4 4" />
        <path d="M8 12h10" />
      </>
    )
  };

  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function ProfileLinkIcon({ label, url }: { label: string; url: string }) {
  const lowerLabel = label.toLowerCase();
  const lowerUrl = url.toLowerCase();
  const isEmail = lowerUrl.startsWith("mailto:") || lowerLabel.includes("email") || lowerLabel.includes("메일");
  const isPhone = lowerUrl.startsWith("tel:") || lowerLabel.includes("phone") || lowerLabel.includes("전화");
  const isMap = lowerUrl.includes("map") || lowerUrl.includes("place") || lowerLabel.includes("location") || lowerLabel.includes("지역") || lowerLabel.includes("서울");

  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      {isEmail ? (
        <>
          <path d="M4 6h16v12H4z" />
          <path d="m4 7 8 6 8-6" />
        </>
      ) : isPhone ? (
        <>
          <path d="M6.5 4.5 9 4l2 5-1.5 1.2a11 11 0 0 0 4.3 4.3L15 13l5 2-.5 2.5c-.2 1-1.2 1.7-2.3 1.5C10.7 18 6 13.3 5 6.8c-.2-1.1.5-2.1 1.5-2.3Z" />
        </>
      ) : isMap ? (
        <>
          <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
          <path d="M12 10.5h.01" />
        </>
      ) : (
        <>
          <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
          <path d="M14 11a5 5 0 0 0-7.1 0l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" />
        </>
      )}
    </svg>
  );
}

export const workMediaFields: Array<{
  kind: WorkAssetKind;
  label: string;
  hint: string;
  aspect: string;
}> = [
  {
    kind: "thumbnail",
    label: "Gallery thumbnail",
    hint: "WORK gallery card에 사용됩니다. 16:9 가로 이미지 권장.",
    aspect: "16 / 9"
  },
  {
    kind: "featuredThumbnail",
    label: "Featured thumbnail",
    hint: "Featured work full-screen 배경과 상세 상단 cover에 사용됩니다. 16:9 이상 와이드 이미지 권장.",
    aspect: "16 / 9"
  }
];

export const workCategoryOptions = ["UI/UX", "BI/BX"] as const;

export const getWorkCategories = (category: string) => {
  const values = category.split(",").map((value) => value.trim());
  return workCategoryOptions.filter((option) => values.includes(option));
};

export const normalizeWorkCategory = (categories: readonly string[]) => {
  const ordered = workCategoryOptions.filter((option) => categories.includes(option));
  return (ordered.join(", ") || "UI/UX") as WorkCategory;
};

export const toggleWorkCategory = (category: string, option: (typeof workCategoryOptions)[number], checked: boolean) => {
  const current = getWorkCategories(category);
  const next = checked ? [...current, option] : current.filter((value) => value !== option);
  return normalizeWorkCategory(next);
};

export const emptyProfile: Profile = {
  headline: "Beyond the Answer.",
  name: "",
  role: "",
  intro: "",
  bio: "",
  links: []
};

export const requestJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const data = (await response.json().catch(() => ({}))) as { error?: unknown };

  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Request failed");
  }

  return data as T;
};

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `work-${Date.now()}`;

export const sanitizeSlugInput = (value: string) =>
  value
    .toLowerCase()
    .trimStart()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);

export const reorderById = <T extends { id: string }>(items: T[], activeId: string, overId: string) => {
  if (activeId === overId) return items;
  const index = items.findIndex((item) => item.id === activeId);
  const target = items.findIndex((item) => item.id === overId);
  if (index < 0 || target < 0) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
};

export const workSnapshot = (work: WorkItem) =>
  JSON.stringify({
    slug: work.slug,
    title: work.title,
    category: work.category,
    summary: work.summary,
    client: work.client,
    year: work.year,
    role: work.role,
    featured: work.featured,
    published: work.published,
    thumbnailAssetId: work.thumbnailAssetId ?? null,
    featuredThumbnailAssetId: work.featuredThumbnailAssetId ?? null,
    heroAssetId: work.heroAssetId ?? null,
    blocks: (work.blocks ?? []).map((block) => ({
      id: block.id,
      type: block.type,
      content: block.content
    }))
  });

export const workSnapshots = (items: WorkItem[]) =>
  Object.fromEntries(items.map((work) => [work.id, workSnapshot(work)]));

export const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("이미지 SDR 변환에 실패했습니다."));
    }, type, quality);
  });

export const decodeImageSource = async (file: File) => {
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(file);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close()
    };
  }

  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  await image.decode();

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    cleanup: () => URL.revokeObjectURL(url)
  };
};

export const normalizeImageForUpload = async (file: File) => {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    throw new Error("JPG, PNG, WebP 또는 GIF 이미지만 업로드할 수 있습니다.");
  }

  if (file.size <= 0 || file.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error("이미지는 16MB보다 작아야 합니다.");
  }

  const decoded = await decodeImageSource(file);
  const dimensions = fitImageDimensions(decoded.width, decoded.height);

  if (file.type === "image/gif") {
    decoded.cleanup();
    return { file, width: decoded.width, height: decoded.height, variants: [] };
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "upload";
  const widths = selectVariantWidths(dimensions.width);

  try {
    const variants = await Promise.all(
      widths.map(async (targetWidth, index) => {
        const variant = variantDimensions(dimensions.width, dimensions.height, targetWidth);
        const canvas = document.createElement("canvas");
        canvas.width = variant.width;
        canvas.height = variant.height;
        const context = canvas.getContext("2d", { colorSpace: "srgb" } as CanvasRenderingContext2DSettings);

        if (!context) {
          throw new Error("이미지 SDR 변환에 실패했습니다.");
        }

        context.drawImage(decoded.source, 0, 0, variant.width, variant.height);
        const blob = await canvasToBlob(canvas, "image/webp", 0.9);
        const isCanonical = index === widths.length - 1;

        return {
          field: isCanonical ? "file" : `variant-${index}`,
          file: new File([blob], `${baseName}-${variant.width}w.webp`, {
            type: "image/webp",
            lastModified: Date.now()
          }),
          width: variant.width,
          height: variant.height,
          mime: "image/webp" as const
        };
      })
    );
    const canonical = variants.at(-1);

    if (!canonical) {
      throw new Error("이미지 변형본 생성에 실패했습니다.");
    }

    return {
      file: canonical.file,
      width: canonical.width,
      height: canonical.height,
      variants
    };
  } finally {
    decoded.cleanup();
  }
};

export const contentText = (block: WorkBlock, key: string, fallback = "") => {
  const value = block.content[key];
  return typeof value === "string" ? value : fallback;
};

export const contentOption = (block: WorkBlock, key: string, options: string[], fallback: string) => {
  const value = block.content[key];
  return typeof value === "string" && options.includes(value) ? value : fallback;
};

export const previewBlockStyle = (block: WorkBlock, defaults = { lineHeight: "1.7", paragraphGap: "18px" }) =>
  ({
    "--preview-line-height": contentOption(block, "lineHeight", ["1.3", "1.5", "1.7", "1.9"], defaults.lineHeight),
    "--preview-paragraph-gap": contentOption(block, "paragraphGap", ["0px", "10px", "18px", "28px"], defaults.paragraphGap),
    "--preview-block-width": contentOption(block, "blockWidth", ["680px", "880px", "1080px", "100%"], "880px"),
    textAlign: contentOption(block, "align", ["left", "center"], "left") as CSSProperties["textAlign"]
  }) as CSSProperties;

export function WorkLivePreview({ work }: { work: WorkItem }) {
  const coverUrl = work.featuredThumbnail?.url || work.thumbnail?.url;
  const blocks = work.blocks ?? [];

  return (
    <aside className="work-preview-panel">
      <header>
        <div>
          <p>Live preview</p>
          <h3>{work.title || "Untitled work"}</h3>
        </div>
        <a href={`/work/${work.slug}`} target="_blank" rel="noreferrer" aria-label="Open live preview in a new tab" title="Open live preview">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M7 17L17 7" />
            <path d="M9 7h8v8" />
          </svg>
        </a>
      </header>

      <div className="work-preview-scroll">
        <section className="preview-hero">
          <div className="preview-hero-media">{coverUrl ? <img src={coverUrl} alt={work.featuredThumbnail?.alt ?? work.thumbnail?.alt ?? work.title} /> : null}</div>
          <p>{work.category}</p>
          <h4>{work.title || "Untitled work"}</h4>
          <span>{work.summary || "Summary preview will appear here."}</span>
          <dl>
            <div>
              <dt>Year</dt>
              <dd>{work.year || "2026"}</dd>
            </div>
            {work.client ? (
              <div>
                <dt>Client</dt>
                <dd>{work.client}</dd>
              </div>
            ) : null}
            <div>
              <dt>Role</dt>
              <dd>{work.role || "Design"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{work.published ? "Published" : "Draft"}</dd>
            </div>
          </dl>
        </section>

        <section className="preview-block-list">
          {blocks.length ? (
            blocks.map((block) => {
              if (block.type === "heading") {
                return (
                  <h5 className="preview-block-heading" key={block.id} style={previewBlockStyle(block, { lineHeight: "1.3", paragraphGap: "0px" })}>
                    {contentText(block, "text", "Heading")}
                  </h5>
                );
              }

              if (block.type === "paragraph") {
                return <div className="preview-block-copy" key={block.id} style={previewBlockStyle(block)} dangerouslySetInnerHTML={{ __html: contentText(block, "html", "<p></p>") }} />;
              }

              if (block.type === "quote") {
                return (
                  <div
                    className="preview-block-quote"
                    key={block.id}
                    style={previewBlockStyle(block, { lineHeight: "1.5", paragraphGap: "10px" })}
                    dangerouslySetInnerHTML={{ __html: contentText(block, "html", "<blockquote></blockquote>") }}
                  />
                );
              }

              if (block.type === "image") {
                const src = contentText(block, "url");
                return (
                  <figure className="preview-block-image" key={block.id}>
                    {src ? <img src={src} alt={contentText(block, "alt")} /> : <div />}
                    {contentText(block, "caption") ? <figcaption>{contentText(block, "caption")}</figcaption> : null}
                  </figure>
                );
              }

              if (block.type === "gallery") {
                const images = Array.isArray(block.content.images) ? block.content.images : [];
                return (
                  <div className="preview-block-gallery" key={block.id}>
                    {images.map((image, index) => {
                      if (!image || typeof image !== "object" || !("url" in image) || typeof image.url !== "string") return null;
                      return <img key={`${image.url}-${index}`} src={image.url} alt={"alt" in image && typeof image.alt === "string" ? image.alt : ""} />;
                    })}
                  </div>
                );
              }

              return null;
            })
          ) : (
            <p className="preview-empty">본문 블록을 추가하면 이 영역에 바로 표시됩니다.</p>
          )}
        </section>
      </div>
    </aside>
  );
}
