import { Component, Suspense, lazy } from "react";
import type { CSSProperties, DragEvent, PointerEvent, ReactNode, RefObject } from "react";
import type { WorkBlock, WorkItem } from "../../types";
import {
  WorkLivePreview,
  getWorkCategories,
  sanitizeSlugInput,
  slugify,
  toggleWorkCategory,
  workCategoryOptions,
  workMediaFields,
  type AssetResponse,
  type WorkAssetKind
} from "./AdminSupport";

const BlockEditor = lazy(() => import("./BlockEditor"));

class EditorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="admin-editor-loading error">에디터를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.</div>;
    }

    return this.props.children;
  }
}

type WorkEditorPanelProps = {
  work: WorkItem | undefined;
  previewWidth: number;
  editorRef: RefObject<HTMLElement | null>;
  onUpdate: (patch: Partial<WorkItem>) => void;
  onUploadAsset: (kind: WorkAssetKind, file: File | undefined) => Promise<void>;
  onClearAsset: (kind: WorkAssetKind) => void;
  onUploadBlockAsset: (file: File, alt?: string) => Promise<AssetResponse["asset"]>;
  onDelete: () => void;
  onResize: (width: number) => void;
  onResizeStart: (event: PointerEvent<HTMLDivElement>) => void;
};

export default function WorkEditorPanel({
  work,
  previewWidth,
  editorRef,
  onUpdate,
  onUploadAsset,
  onClearAsset,
  onUploadBlockAsset,
  onDelete,
  onResize,
  onResizeStart
}: WorkEditorPanelProps) {
  return (
    <section className="works-editor-layout" style={{ "--work-preview-width": `${previewWidth}px` } as CSSProperties}>
      {work ? (
        <>
          <section className="work-editor" aria-label="Work editor" ref={editorRef}>
            <section className="admin-panel work-editor-card">
              <header className="work-editor-card-header">
                <div>
                  <p>Basic</p>
                  <h3>작업물 기본 정보</h3>
                </div>
              </header>
              <div className="field-grid">
                <label>
                  Title
                  <input value={work.title} onChange={(event) => onUpdate({ title: event.target.value })} />
                </label>
                <label>
                  Slug
                  <input
                    value={work.slug}
                    onChange={(event) => onUpdate({ slug: sanitizeSlugInput(event.target.value) })}
                    onBlur={(event) => onUpdate({ slug: slugify(event.target.value) })}
                  />
                </label>
                <div className="category-check-group">
                  <span>Category</span>
                  <div className="category-check-options">
                    {workCategoryOptions.map((category) => (
                      <label key={category}>
                        <input
                          type="checkbox"
                          checked={getWorkCategories(work.category).includes(category)}
                          onChange={(event) => onUpdate({ category: toggleWorkCategory(work.category, category, event.target.checked) })}
                        />
                        {category}
                      </label>
                    ))}
                  </div>
                </div>
                <label>
                  Year
                  <input value={work.year} onChange={(event) => onUpdate({ year: event.target.value })} />
                </label>
                <label>
                  Client
                  <input value={work.client} onChange={(event) => onUpdate({ client: event.target.value })} />
                </label>
                <label>
                  Tools
                  <input
                    value={work.role}
                    placeholder="Figma, Illustrator, Photoshop"
                    onChange={(event) => onUpdate({ role: event.target.value })}
                  />
                </label>
                <label className="full-field">
                  Summary
                  <textarea value={work.summary} onChange={(event) => onUpdate({ summary: event.target.value })} />
                </label>
              </div>

              <div className="toggle-row">
                <label>
                  <input type="checkbox" checked={work.featured} onChange={(event) => onUpdate({ featured: event.target.checked })} />
                  Featured
                </label>
                <label>
                  <input type="checkbox" checked={work.published} onChange={(event) => onUpdate({ published: event.target.checked })} />
                  Published
                </label>
              </div>
            </section>

            <section className="admin-panel work-editor-card">
              <header className="work-editor-card-header">
                <div>
                  <p>Images</p>
                  <h3>썸네일 설정</h3>
                </div>
              </header>
              <div className="media-grid">
                {workMediaFields.map((field) => {
                  const media = work[field.kind];

                  return (
                    <section className="media-field" key={field.kind} style={{ "--media-aspect": field.aspect } as CSSProperties}>
                      <header>
                        <div>
                          <strong>{field.label}</strong>
                          <p>{field.hint}</p>
                        </div>
                        <button type="button" className="danger" disabled={!media?.url} onClick={() => onClearAsset(field.kind)}>Remove</button>
                      </header>
                      <div className="media-preview">
                        {media?.url ? <img src={media.url} alt={media.alt ?? work.title} /> : <span>No image</span>}
                      </div>
                      <label
                        className="media-upload-zone"
                        onDragOver={(event: DragEvent<HTMLLabelElement>) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "copy";
                        }}
                        onDrop={(event: DragEvent<HTMLLabelElement>) => {
                          event.preventDefault();
                          void onUploadAsset(field.kind, event.dataTransfer.files?.[0]);
                        }}
                      >
                        <input
                          className="media-upload-input"
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const input = event.currentTarget;
                            void onUploadAsset(field.kind, input.files?.[0]).finally(() => {
                              input.value = "";
                            });
                          }}
                        />
                        <span className="media-upload-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path d="M12 16V5" />
                            <path d="M8 9l4-4 4 4" />
                            <path d="M5 16v2.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V16" />
                          </svg>
                        </span>
                        <span className="media-upload-text">클릭하거나 파일을 이곳으로 드래그하세요</span>
                        <span className="media-upload-note">이미지는 업로드 후 Save를 눌러야 게시됩니다.</span>
                      </label>
                    </section>
                  );
                })}
              </div>
            </section>

            <section className="admin-panel work-editor-card">
              <header className="work-editor-card-header">
                <div>
                  <p>Body</p>
                  <h3>본문 에디터</h3>
                </div>
              </header>
              <EditorBoundary>
                <Suspense fallback={<div className="admin-editor-loading">Loading editor...</div>}>
                  <BlockEditor
                    blocks={work.blocks ?? []}
                    onUpload={onUploadBlockAsset}
                    onChange={(blocks: WorkBlock[]) => onUpdate({ blocks })}
                  />
                </Suspense>
              </EditorBoundary>
            </section>

            <div className="action-row work-editor-actions">
              <button type="button" className="danger" onClick={onDelete}>Delete work</button>
            </div>
          </section>
          <div
            aria-label="Resize live preview"
            aria-orientation="vertical"
            aria-valuemax={1160}
            aria-valuemin={260}
            aria-valuenow={previewWidth}
            className="work-splitter"
            role="separator"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                onResize(previewWidth + 32);
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                onResize(previewWidth - 32);
              }
            }}
            onPointerDown={onResizeStart}
          />
          <WorkLivePreview work={work} />
        </>
      ) : (
        <section className="admin-panel empty-panel">No work selected.</section>
      )}
    </section>
  );
}
