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
};

type Props = {
  blocks: WorkBlock[];
  onChange: (blocks: WorkBlock[]) => void;
  onUpload: (file: File, alt?: string) => Promise<UploadedAsset>;
};

const lineHeightOptions = ["1.3", "1.5", "1.7", "1.9"];
const paragraphGapOptions = ["0px", "10px", "18px", "28px"];
const blockWidthOptions = ["680px", "880px", "1080px", "100%"];
const alignOptions = ["left", "center"];
const textBlockTypes = new Set<WorkBlockType>(["heading", "paragraph", "quote"]);

const newBlock = (type: WorkBlockType): WorkBlock => ({
  id: crypto.randomUUID(),
  type,
  content:
    type === "heading"
      ? { text: "New heading", lineHeight: "1.3", blockWidth: "880px", align: "left" }
      : type === "image"
        ? { url: "", alt: "", caption: "" }
        : type === "gallery"
          ? { images: [] }
          : {
              html: type === "quote" ? "<blockquote>New quote</blockquote>" : "<p>New paragraph</p>",
              lineHeight: type === "quote" ? "1.5" : "1.7",
              paragraphGap: "18px",
              blockWidth: "880px",
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
        heading: false
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
  const normalized = blocks.map((block, index) => ({ ...block, sortOrder: index + 1 }));
  const textBlocks = normalized.filter((block) => textBlockTypes.has(block.type));
  const editorWidth = textBlocks[0] ? optionFromBlock(textBlocks[0], "blockWidth", blockWidthOptions, "880px") : "880px";

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
    onChange([...normalized, newBlock(type)]);
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

  const startBlockDrag = (event: DragEvent<HTMLButtonElement>, id: string) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    setDraggedBlockId(id);
    setDragOverBlockId(id);
  };

  const moveDraggedBlock = (event: DragEvent<HTMLElement>, overId: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverBlockId(overId);

    if (!draggedBlockId || draggedBlockId === overId) return;
    onChange(reorderBlocks(normalized, draggedBlockId, overId));
  };

  const finishBlockDrag = () => {
    setDraggedBlockId("");
    setDragOverBlockId("");
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
          images: [...images, { assetId: asset.id, url: asset.url, alt: asset.alt }]
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
        alt: asset.alt
      }
    });
  };

  return (
    <div className="block-editor">
      <div className="block-toolbar">
        <button type="button" onClick={() => addBlock("heading")}>
          Heading
        </button>
        <button type="button" onClick={() => addBlock("paragraph")}>
          Paragraph
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
            onDragOver={(event) => moveDraggedBlock(event, block.id)}
            onDrop={finishBlockDrag}
          >
            <header>
              <strong>{block.type}</strong>
              <div className="editor-block-actions">
                <button
                  type="button"
                  className="block-drag-handle"
                  draggable
                  aria-label={`${block.type} 블록 순서 이동`}
                  onDragStart={(event) => startBlockDrag(event, block.id)}
                  onDragEnd={finishBlockDrag}
                >
                  ☰
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
          </article>
        ))}
      </div>
    </div>
  );
}
