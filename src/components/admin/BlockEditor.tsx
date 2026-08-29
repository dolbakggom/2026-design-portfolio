import { useState } from "react";
import type { DragEvent } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import type { WorkBlock, WorkBlockType } from "../../types";

type UploadedAsset = {
  id: string;
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
};

type Props = {
  blocks: WorkBlock[];
  onChange: (blocks: WorkBlock[]) => void;
  onUpload: (file: File, alt?: string) => Promise<UploadedAsset>;
};

type WebsiteMetadataResponse = {
  metadata: {
    url: string;
    domain: string;
    title: string;
    description: string;
  };
  asset: UploadedAsset & { mime: string } | null;
  imageWarning: string;
};

const lineHeightOptions = ["1.3", "1.5", "1.7", "1.9"];
const paragraphGapOptions = ["0px", "10px", "18px", "28px"];
const blockWidthOptions = ["680px", "880px", "1080px", "100%"];
const alignOptions = ["left", "center"];
const codeLanguageOptions = [
  ["plaintext", "Plain text"],
  ["html", "HTML"],
  ["css", "CSS"],
  ["javascript", "JavaScript"],
  ["typescript", "TypeScript"],
  ["json", "JSON"],
  ["bash", "Shell"]
] as const;
const textBlockTypes = new Set<WorkBlockType>(["heading", "paragraph", "quote", "code"]);

const newBlock = (type: WorkBlockType, blockWidth = "100%"): WorkBlock => ({
  id: crypto.randomUUID(),
  type,
  content:
    type === "heading"
      ? { text: "New heading", lineHeight: "1.3", blockWidth, align: "left" }
      : type === "code"
        ? { code: "", language: "plaintext", blockWidth, caption: "" }
        : type === "image"
          ? { url: "", alt: "", caption: "" }
          : type === "gallery"
            ? { images: [] }
            : type === "divider"
              ? {}
              : type === "website"
                ? { url: "", title: "", description: "", domain: "", imageUrl: "", imageAlt: "" }
                : {
                    html: type === "quote" ? "<blockquote>New quote</blockquote>" : "<p>New paragraph</p>",
                    lineHeight: type === "quote" ? "1.5" : "1.7",
                    paragraphGap: "18px",
                    blockWidth,
                    align: "left"
                  },
  sortOrder: 0
});

const reorderBlocks = (items: WorkBlock[], activeId: string, overId: string) => {
  if (activeId === overId) return items;
  const index = items.findIndex((item) => item.id === activeId);
  const target = items.findIndex((item) => item.id === overId);
  if (index < 0 || target < 0) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
};

const htmlFromBlock = (block: WorkBlock) => {
  const value = block.content.html;
  return typeof value === "string" ? value : "<p></p>";
};

const textFromBlock = (block: WorkBlock, key = "text") => {
  const value = block.content[key];
  return typeof value === "string" ? value : "";
};

const optionFromBlock = (block: WorkBlock, key: string, options: string[], fallback: string) => {
  const value = block.content[key];
  return typeof value === "string" && options.includes(value) ? value : fallback;
};

function RichTextBlock({
  block,
  onChange
}: {
  block: WorkBlock;
  onChange: (block: WorkBlock) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: {
          enableTabIndentation: true,
          tabSize: 2
        }
      }),
      Image,
      Placeholder.configure({
        placeholder: block.type === "quote" ? "Quote" : "Write project detail..."
      })
    ],
    content: htmlFromBlock(block),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange({
        ...block,
        content: {
          ...block.content,
          html: editor.getHTML()
        }
      });
    }
  });

  return (
    <div className="rich-editor-wrap">
      <div className="rich-editor-toolbar">
        <button type="button" className={editor?.isActive("bold") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleBold().run()}>
          B
        </button>
        <button type="button" className={editor?.isActive("italic") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleItalic().run()}>
          I
        </button>
        <button
          type="button"
          className={editor?.isActive("code") ? "is-active" : ""}
          aria-label="Inline code"
          title="Inline code (`code`)"
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          &lt;/&gt;
        </button>
        <button type="button" className={editor?.isActive("paragraph") ? "is-active" : ""} onClick={() => editor?.chain().focus().setParagraph().run()}>
          P
        </button>
        <button type="button" className={editor?.isActive("bulletList") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          List
        </button>
        <button type="button" className={editor?.isActive("orderedList") ? "is-active" : ""} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          1.
        </button>
        <button type="button" onClick={() => editor?.chain().focus().undo().run()}>
          Undo
        </button>
        <button type="button" onClick={() => editor?.chain().focus().redo().run()}>
          Redo
        </button>
      </div>
      <EditorContent editor={editor} className="rich-editor" />
    </div>
  );
}

export default function BlockEditor({ blocks, onChange, onUpload }: Props) {
  const [draggedBlockId, setDraggedBlockId] = useState("");
  const [dragOverBlockId, setDragOverBlockId] = useState("");
  const [dragEnabledId, setDragEnabledId] = useState("");
  const [websiteLoadingId, setWebsiteLoadingId] = useState("");
  const [websiteStatus, setWebsiteStatus] = useState<Record<string, { tone: "success" | "error"; text: string }>>({});

  const normalized = blocks.map((block, index) => ({ ...block, sortOrder: index + 1 }));
  const textBlocks = normalized.filter((block) => textBlockTypes.has(block.type));
  const editorWidth = textBlocks[0] ? optionFromBlock(textBlocks[0], "blockWidth", blockWidthOptions, "100%") : "100%";

  const updateBlock = (updated: WorkBlock) => {
    onChange(normalized.map((block) => (block.id === updated.id ? updated : block)));
  };

  const updateContent = (block: WorkBlock, key: string, value: string) => {
    updateBlock({
      ...block,
      content: {
        ...block.content,
        [key]: value
      }
    });
  };

  const removeBlock = (id: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    onChange(normalized.filter((block) => block.id !== id));
  };

  const addBlock = (type: WorkBlockType) => {
    onChange([...normalized, newBlock(type, editorWidth)]);
  };

  const updateEditorWidth = (value: string) => {
    onChange(
      normalized.map((block) =>
        textBlockTypes.has(block.type)
          ? {
              ...block,
              content: {
                ...block.content,
                blockWidth: value
              }
            }
          : block
      )
    );
  };

  const startBlockDrag = (event: DragEvent<HTMLElement>, id: string) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    setDraggedBlockId(id);
    setDragOverBlockId(id);
  };

  const moveDraggedBlock = (event: DragEvent<HTMLElement>, overId: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverBlockId !== overId) {
      setDragOverBlockId(overId);
    }
  };

  const dropBlock = (event: DragEvent<HTMLElement>, overId: string) => {
    event.preventDefault();
    if (!draggedBlockId || draggedBlockId === overId) return;
    onChange(reorderBlocks(normalized, draggedBlockId, overId));
  };

  const finishBlockDrag = () => {
    setDraggedBlockId("");
    setDragOverBlockId("");
    setDragEnabledId("");
  };

  const uploadForBlock = async (block: WorkBlock, file: File | undefined, alt?: string) => {
    if (!file) return;
    const asset = await onUpload(file, alt);

    if (block.type === "gallery") {
      const images = Array.isArray(block.content.images) ? block.content.images : [];
      updateBlock({
        ...block,
        content: {
          ...block.content,
          images: [...images, { assetId: asset.id, url: asset.url, alt: asset.alt, width: asset.width, height: asset.height }]
        }
      });
      return;
    }

    updateBlock({
      ...block,
      content: {
        ...block.content,
        assetId: asset.id,
        url: asset.url,
        alt: asset.alt,
        width: asset.width,
        height: asset.height
      }
    });
  };

  const fetchWebsiteForBlock = async (block: WorkBlock) => {
    const rawUrl = textFromBlock(block, "url").trim();
    const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    setWebsiteLoadingId(block.id);
    setWebsiteStatus((current) => ({ ...current, [block.id]: { tone: "success", text: "사이트 정보를 불러오는 중입니다." } }));

    try {
      const response = await fetch("/api/admin/website-metadata", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = (await response.json().catch(() => ({}))) as WebsiteMetadataResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || "사이트 정보를 불러오지 못했습니다.");

      updateBlock({
        ...block,
        content: {
          ...block.content,
          url: data.metadata.url,
          domain: data.metadata.domain,
          title: data.metadata.title || data.metadata.domain,
          description: data.metadata.description,
          ...(data.asset
            ? {
                imageAssetId: data.asset.id,
                imageUrl: data.asset.url,
                imageAlt: data.asset.alt,
                imageMime: data.asset.mime,
                imageWidth: data.asset.width,
                imageHeight: data.asset.height
              }
            : {})
        }
      });
      setWebsiteStatus((current) => ({
        ...current,
        [block.id]: {
          tone: data.imageWarning ? "error" : "success",
          text: data.imageWarning || "사이트 제목, 설명과 대표 이미지를 불러왔습니다."
        }
      }));
    } catch (error) {
      setWebsiteStatus((current) => ({
        ...current,
        [block.id]: { tone: "error", text: error instanceof Error ? error.message : "사이트 정보를 불러오지 못했습니다." }
      }));
    } finally {
      setWebsiteLoadingId("");
    }
  };

  return (
    <div className="block-editor">
      <div className="block-toolbar">
        <div className="block-add-actions">
          <button type="button" onClick={() => addBlock("heading")}>
            Heading
          </button>
          <button type="button" onClick={() => addBlock("paragraph")}>
            Paragraph
          </button>
          <button type="button" onClick={() => addBlock("code")}>
            Code
          </button>
          <button type="button" onClick={() => addBlock("image")}>
            Image
          </button>
          <button type="button" onClick={() => addBlock("gallery")}>
            Gallery
          </button>
          <button type="button" onClick={() => addBlock("quote")}>
            Quote
          </button>
          <button type="button" onClick={() => addBlock("divider")}>
            Divider
          </button>
          <button type="button" onClick={() => addBlock("website")}>
            Website
          </button>
        </div>
        <label className="block-width-control">
          Content width
          <select value={editorWidth} onChange={(event) => updateEditorWidth(event.target.value)}>
            {blockWidthOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="block-list">
        {normalized.map((block) => (
          <article
            className={`editor-block ${draggedBlockId === block.id ? "is-dragging" : ""} ${dragOverBlockId === block.id && draggedBlockId !== block.id ? "is-drag-over" : ""}`}
            key={block.id}
            draggable={dragEnabledId === block.id}
            onDragStart={(event) => startBlockDrag(event, block.id)}
            onDragOver={(event) => moveDraggedBlock(event, block.id)}
            onDrop={(event) => {
              dropBlock(event, block.id);
              finishBlockDrag();
            }}
            onDragEnd={finishBlockDrag}
          >
            <header>
              <strong>{block.type}</strong>
              <div className="editor-block-actions">
                <button
                  type="button"
                  className="block-drag-handle"
                  aria-label={`${block.type} 블록 순서 이동`}
                  onPointerEnter={() => setDragEnabledId(block.id)}
                  onPointerLeave={() => setDragEnabledId("")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="12" x2="20" y2="12"></line>
                    <line x1="4" y1="6" x2="20" y2="6"></line>
                    <line x1="4" y1="18" x2="20" y2="18"></line>
                  </svg>
                </button>
                <button type="button" className="danger" onClick={() => removeBlock(block.id)}>
                  Delete
                </button>
              </div>
            </header>

            {block.type === "heading" || block.type === "paragraph" || block.type === "quote" ? (
              <div className="block-style-controls">
                <label>
                  Line
                  <select value={optionFromBlock(block, "lineHeight", lineHeightOptions, block.type === "quote" ? "1.5" : "1.7")} onChange={(event) => updateContent(block, "lineHeight", event.target.value)}>
                    {lineHeightOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                {block.type === "paragraph" || block.type === "quote" ? (
                  <label>
                    Gap
                    <select value={optionFromBlock(block, "paragraphGap", paragraphGapOptions, "18px")} onChange={(event) => updateContent(block, "paragraphGap", event.target.value)}>
                      {paragraphGapOptions.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label>
                  Align
                  <select value={optionFromBlock(block, "align", alignOptions, "left")} onChange={(event) => updateContent(block, "align", event.target.value)}>
                    {alignOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            {block.type === "heading" ? (
              <input
                value={textFromBlock(block)}
                onChange={(event) =>
                  updateBlock({
                    ...block,
                    content: { ...block.content, text: event.target.value }
                  })
                }
              />
            ) : null}

            {block.type === "paragraph" || block.type === "quote" ? <RichTextBlock block={block} onChange={updateBlock} /> : null}

            {block.type === "code" ? (
              <div className="code-block-fields">
                <div className="code-block-editor">
                  <div className="code-block-editor-bar">
                    <span className="code-editor-identity">
                      <span className="code-editor-mark" aria-hidden="true">&lt;/&gt;</span>
                      <span>Code</span>
                    </span>
                    <label>
                      Language
                      <select
                        value={optionFromBlock(block, "language", codeLanguageOptions.map(([value]) => value), "plaintext")}
                        onChange={(event) => updateContent(block, "language", event.target.value)}
                      >
                        {codeLanguageOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                  </div>
                  <textarea
                    aria-label="Code"
                    value={textFromBlock(block, "code")}
                    rows={12}
                    spellCheck={false}
                    placeholder="Paste or write code here"
                    onChange={(event) => updateContent(block, "code", event.target.value)}
                  />
                </div>
                <label className="code-caption-field">
                  Caption
                  <input
                    value={textFromBlock(block, "caption")}
                    maxLength={1200}
                    placeholder="코드에 대한 설명"
                    onChange={(event) => updateContent(block, "caption", event.target.value)}
                  />
                </label>
              </div>
            ) : null}

            {block.type === "divider" ? (
              <div className="divider-edit-preview" aria-label="구분선 미리보기">
                <span />
              </div>
            ) : null}

            {block.type === "image" ? (
              <div className="media-edit-row">
                {textFromBlock(block, "url") ? <img src={textFromBlock(block, "url")} alt={textFromBlock(block, "alt")} /> : null}
                <input
                  placeholder="Alt text"
                  value={textFromBlock(block, "alt")}
                  onChange={(event) =>
                    updateBlock({
                      ...block,
                      content: { ...block.content, alt: event.target.value }
                    })
                  }
                />
                <input
                  placeholder="Caption"
                  value={textFromBlock(block, "caption")}
                  onChange={(event) =>
                    updateBlock({
                      ...block,
                      content: { ...block.content, caption: event.target.value }
                    })
                  }
                />
                <input type="file" accept="image/*" onChange={(event) => uploadForBlock(block, event.target.files?.[0], textFromBlock(block, "alt"))} />
              </div>
            ) : null}

            {block.type === "gallery" ? (
              <div className="gallery-edit">
                <div className="gallery-preview">
                  {(Array.isArray(block.content.images) ? block.content.images : []).map((image, imageIndex) => {
                    if (!image || typeof image !== "object" || !("url" in image) || typeof image.url !== "string") return null;
                    return (
                      <figure key={`${image.url}-${imageIndex}`}>
                        <img src={image.url} alt={"alt" in image && typeof image.alt === "string" ? image.alt : ""} />
                        <button
                          type="button"
                          onClick={() => {
                            if (!window.confirm("정말 삭제하시겠습니까?")) return;
                            const images = Array.isArray(block.content.images) ? [...block.content.images] : [];
                            images.splice(imageIndex, 1);
                            updateBlock({ ...block, content: { ...block.content, images } });
                          }}
                        >
                          Remove
                        </button>
                      </figure>
                    );
                  })}
                </div>
                <input type="file" accept="image/*" onChange={(event) => uploadForBlock(block, event.target.files?.[0])} />
              </div>
            ) : null}

            {block.type === "website" ? (
              <div className="website-block-editor">
                <div className="website-fetch-row">
                  <label>
                    Website URL
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={textFromBlock(block, "url")}
                      onChange={(event) => updateContent(block, "url", event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={websiteLoadingId === block.id}
                    onClick={() => void fetchWebsiteForBlock(block)}
                  >
                    {websiteLoadingId === block.id ? "불러오는 중" : "사이트 정보 불러오기"}
                  </button>
                </div>
                {websiteStatus[block.id] ? (
                  <p className={`website-fetch-status is-${websiteStatus[block.id].tone}`} role="status">
                    {websiteStatus[block.id].text}
                  </p>
                ) : null}
                {textFromBlock(block, "imageUrl") ? (
                  <div className="website-image-preview">
                    <img src={textFromBlock(block, "imageUrl")} alt={textFromBlock(block, "imageAlt")} />
                    <span>사이트 대표 이미지</span>
                  </div>
                ) : null}
                <label>
                  Custom title
                  <input
                    value={textFromBlock(block, "title")}
                    placeholder="사이트 제목"
                    maxLength={240}
                    onChange={(event) => updateContent(block, "title", event.target.value)}
                  />
                </label>
                <label>
                  Custom description
                  <textarea
                    value={textFromBlock(block, "description")}
                    placeholder="사이트를 소개하는 설명"
                    maxLength={1000}
                    rows={4}
                    onChange={(event) => updateContent(block, "description", event.target.value)}
                  />
                </label>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
