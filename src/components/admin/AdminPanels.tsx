import type { DragEvent } from "react";
import type { Profile, TimelineItem, WorkItem } from "../../types";
import { ProfileLinkIcon } from "./AdminSupport";

type ProfilePanelProps = {
  profile: Profile;
  imageUploading: boolean;
  onChange: (profile: Profile) => void;
  onImageUpload: (file: File | undefined) => void;
  onSave: () => void;
};

export function ProfilePanel({ profile, imageUploading, onChange, onImageUpload, onSave }: ProfilePanelProps) {
  const updateLink = (index: number, patch: Partial<Profile["links"][number]>) => {
    const links = [...profile.links];
    links[index] = { ...links[index], ...patch };
    onChange({ ...profile, links });
  };

  return (
    <div className="admin-profile-grid">
      <section className="admin-panel">
        <div className="field-grid">
          <label>
            Headline
            <input value={profile.headline} onChange={(event) => onChange({ ...profile, headline: event.target.value })} />
          </label>
          <label>
            Name
            <input value={profile.name} onChange={(event) => onChange({ ...profile, name: event.target.value })} />
          </label>
          <label>
            Profile Image
            <input type="file" accept="image/*" disabled={imageUploading} onChange={(event) => onImageUpload(event.target.files?.[0])} />
          </label>
          <label className="full-field">
            Intro
            <textarea value={profile.intro} onChange={(event) => onChange({ ...profile, intro: event.target.value })} />
          </label>
          <label className="full-field">
            Bio
            <textarea value={profile.bio} rows={6} onChange={(event) => onChange({ ...profile, bio: event.target.value })} />
          </label>
        </div>
      </section>

      <section className="admin-panel">
        <div className="link-editor" style={{ marginTop: 0 }}>
          <header>
            <h3>Links</h3>
          </header>
          {profile.links.map((link, index) => (
            <div className="link-fields" key={`profile-link-${index}`}>
              <span className="link-icon" aria-hidden="true">
                <ProfileLinkIcon label={link.label} url={link.url} />
              </span>
              <input
                aria-label="Displayed text"
                placeholder="Displayed text"
                value={link.label}
                onChange={(event) => updateLink(index, { label: event.target.value })}
              />
              <input
                aria-label="Click action"
                placeholder="mailto:, tel:, https://"
                value={link.url}
                onChange={(event) => updateLink(index, { url: event.target.value })}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="action-row sticky-actions">
        <button type="button" className="primary-action" onClick={onSave} disabled={imageUploading}>
          {imageUploading ? "Uploading..." : "Save profile"}
        </button>
      </div>
    </div>
  );
}

type TimelinePanelProps = {
  timeline: TimelineItem[];
  onChange: (timeline: TimelineItem[]) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onSave: () => void;
};

export function TimelinePanel({ timeline, onChange, onAdd, onDelete, onSave }: TimelinePanelProps) {
  const updateItem = (id: string, patch: Partial<TimelineItem>) => {
    onChange(timeline.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  return (
    <section className="timeline-cards-layout">
      <div className="panel-actions" style={{ marginBottom: "20px" }}>
        <button type="button" onClick={onAdd}>Add career item</button>
      </div>
      <div className="timeline-editor-list" style={{ display: "grid", gap: "20px", marginTop: 0 }}>
        {[...timeline]
          .sort((a, b) => String(a.period || "").localeCompare(String(b.period || "")))
          .map((item) => (
            <article className="admin-panel admin-timeline-card" key={item.id}>
              <div className="field-grid">
                <label>
                  Period
                  <input value={item.period} onChange={(event) => updateItem(item.id, { period: event.target.value })} />
                </label>
                <label>
                  Title
                  <input value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} />
                </label>
                <label>
                  Organization
                  <input value={item.organization} onChange={(event) => updateItem(item.id, { organization: event.target.value })} />
                </label>
              </div>
              <div className="action-row" style={{ marginTop: "16px" }}>
                <button type="button" className="danger" onClick={() => onDelete(item.id)}>Delete</button>
              </div>
            </article>
          ))}
      </div>
      <div className="action-row sticky-actions">
        <button type="button" className="primary-action" onClick={onSave}>Save career</button>
      </div>
    </section>
  );
}

type WorksListPanelProps = {
  works: WorkItem[];
  draggedWorkId: string;
  dragOverWorkId: string;
  onOpen: (id: string) => void;
  onDragStart: (event: DragEvent<HTMLElement>, id: string) => void;
  onDragOver: (event: DragEvent<HTMLElement>, id: string) => void;
  onDragFinish: () => void;
};

export function WorksListPanel({
  works,
  draggedWorkId,
  dragOverWorkId,
  onOpen,
  onDragStart,
  onDragOver,
  onDragFinish
}: WorksListPanelProps) {
  return (
    <section className={`works-list-view ${draggedWorkId ? "is-ordering" : ""}`}>
      {works.length ? (
        <div className="work-grid admin-work-grid">
          {works.map((work) => {
            const isDragging = draggedWorkId === work.id;
            const isDragOver = dragOverWorkId === work.id && draggedWorkId !== work.id;

            return (
              <article
                key={work.id}
                className={`work-tile admin-work-card ${isDragging ? "is-dragging" : ""} ${isDragOver ? "is-drag-over" : ""}`}
                draggable
                role="button"
                tabIndex={0}
                aria-label={`${work.title} 편집`}
                onClick={() => onOpen(work.id)}
                onDragStart={(event) => onDragStart(event, work.id)}
                onDragOver={(event) => onDragOver(event, work.id)}
                onDrop={onDragFinish}
                onDragEnd={onDragFinish}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  onOpen(work.id);
                }}
              >
                <div
                  className={`work-tile-media ${work.thumbnail?.url ? "has-image" : ""}`}
                  aria-label={work.thumbnail?.alt ?? work.title}
                  role="img"
                >
                  {work.thumbnail?.url ? (
                    <img
                      src={work.thumbnail.url}
                      alt=""
                      width={work.thumbnail.width ?? undefined}
                      height={work.thumbnail.height ?? undefined}
                      loading="lazy"
                      decoding="async"
                      onLoad={(event) => event.currentTarget.parentElement?.classList.remove("is-image-unavailable")}
                      onError={(event) => event.currentTarget.parentElement?.classList.add("is-image-unavailable")}
                    />
                  ) : null}
                </div>
                <div className="admin-work-card-copy">
                  <h3>{work.title}</h3>
                  <span>{work.category}</span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="admin-panel empty-panel">작업물이 없습니다. Add work로 새 작업물을 추가하세요.</section>
      )}
    </section>
  );
}
