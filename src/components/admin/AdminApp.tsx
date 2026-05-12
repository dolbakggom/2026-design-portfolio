import { Component, Suspense, lazy, useEffect, useMemo, useState } from "react";
import type { CSSProperties, PointerEvent, ReactNode, SyntheticEvent } from "react";
import type { Profile, TimelineItem, WorkBlock, WorkCategory, WorkItem } from "../../types";
import "../../styles/admin.css";

const BlockEditor = lazy(() => import("./BlockEditor"));

class EditorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="admin-editor-loading error">
          에디터를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.
        </div>
      );
    }

    return this.props.children;
  }
}

type AssetResponse = {
  asset: {
    id: string;
    url: string;
    alt: string;
    mime: string;
    size: number;
  };
};

type Tab = "profile" | "timeline" | "works";
type WorkAssetKind = "thumbnail" | "featuredThumbnail" | "hero";
type AdminIconName = Tab | "logout";

const navItems: Array<{ tab: Tab; label: string; icon: AdminIconName }> = [
  { tab: "profile", label: "Profile", icon: "profile" },
  { tab: "timeline", label: "Timeline", icon: "timeline" },
  { tab: "works", label: "Works", icon: "works" }
];

function AdminIcon({ name }: { name: AdminIconName }) {
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

const workMediaFields: Array<{
  kind: WorkAssetKind;
  label: string;
  hint: string;
  aspect: string;
}> = [
  {
    kind: "thumbnail",
    label: "Gallery thumbnail",
    hint: "WORK gallery card와 상세 상단 transition cover에 사용됩니다. 세로형 3:4 비율 권장, 상세 상단에서는 cover로 crop됩니다.",
    aspect: "3 / 4"
  },
  {
    kind: "featuredThumbnail",
    label: "Featured thumbnail",
    hint: "Featured work full-screen 배경에 사용됩니다. 16:9 이상 와이드 이미지 권장.",
    aspect: "16 / 9"
  },
  {
    kind: "hero",
    label: "Hero",
    hint: "작업물 상세 본문 대표 이미지에 사용됩니다. 16:9 또는 와이드 이미지 권장.",
    aspect: "16 / 9"
  }
];

const emptyProfile: Profile = {
  headline: "Beyond the Answer.",
  name: "",
  role: "",
  intro: "",
  bio: "",
  links: []
};

const requestJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
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

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `work-${Date.now()}`;

const moveItem = <T extends { id: string }>(items: T[], id: string, direction: -1 | 1) => {
  const index = items.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
};

const contentText = (block: WorkBlock, key: string, fallback = "") => {
  const value = block.content[key];
  return typeof value === "string" ? value : fallback;
};

const contentOption = (block: WorkBlock, key: string, options: string[], fallback: string) => {
  const value = block.content[key];
  return typeof value === "string" && options.includes(value) ? value : fallback;
};

const previewBlockStyle = (block: WorkBlock, defaults = { lineHeight: "1.7", paragraphGap: "18px" }) =>
  ({
    "--preview-line-height": contentOption(block, "lineHeight", ["1.3", "1.5", "1.7", "1.9"], defaults.lineHeight),
    "--preview-paragraph-gap": contentOption(block, "paragraphGap", ["0px", "10px", "18px", "28px"], defaults.paragraphGap),
    "--preview-block-width": contentOption(block, "blockWidth", ["680px", "880px", "1080px", "100%"], "880px"),
    textAlign: contentOption(block, "align", ["left", "center"], "left") as CSSProperties["textAlign"]
  }) as CSSProperties;

function WorkLivePreview({ work }: { work: WorkItem }) {
  const coverUrl = work.thumbnail?.url || work.hero?.url;
  const blocks = work.blocks ?? [];

  return (
    <aside className="work-preview-panel">
      <header>
        <div>
          <p>Live preview</p>
          <h3>{work.title || "Untitled work"}</h3>
        </div>
        <a href={`/work/${work.slug}`} target="_blank" rel="noreferrer">
          Open
        </a>
      </header>

      <div className="work-preview-scroll">
        <section className="preview-hero">
          <div className="preview-hero-media">{coverUrl ? <img src={coverUrl} alt={work.thumbnail?.alt ?? work.hero?.alt ?? work.title} /> : null}</div>
          <p>{work.category}</p>
          <h4>{work.title || "Untitled work"}</h4>
          <span>{work.summary || "Summary preview will appear here."}</span>
          <dl>
            <div>
              <dt>Year</dt>
              <dd>{work.year || "2026"}</dd>
            </div>
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

export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState<string>("");
  const [workPreviewWidth, setWorkPreviewWidth] = useState(460);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedWork = useMemo(
    () => works.find((work) => work.id === selectedWorkId) ?? works[0],
    [selectedWorkId, works]
  );

  const flash = (value: string) => {
    setMessage(value);
    setError("");
    window.setTimeout(() => setMessage(""), 2400);
  };

  const fail = (value: string) => {
    setError(value);
    setMessage("");
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const profileData = await requestJson<{ profile: Profile | null }>("/api/admin/profile");
      const timelineData = await requestJson<{ timeline: TimelineItem[] }>("/api/admin/timeline");
      const worksData = await requestJson<{ works: WorkItem[] }>("/api/admin/works");
      setProfile(profileData.profile ?? emptyProfile);
      setTimeline(timelineData.timeline);
      setWorks(worksData.works);
      setSelectedWorkId((current) => current || worksData.works[0]?.id || "");
      setAuthenticated(true);
      setError("");
    } catch {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const login = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      await requestJson("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password")
        })
      });
      await loadAll();
      flash("로그인되었습니다.");
    } catch (loginError) {
      fail(loginError instanceof Error ? loginError.message : "로그인에 실패했습니다.");
    }
  };

  const logout = async () => {
    await requestJson("/api/admin/logout", { method: "POST", body: "{}" }).catch(() => null);
    setAuthenticated(false);
  };

  const saveProfile = async () => {
    try {
      const data = await requestJson<{ profile: Profile }>("/api/admin/profile", {
        method: "PUT",
        body: JSON.stringify(profile)
      });
      setProfile(data.profile);
      flash("자기소개가 저장되었습니다.");
    } catch (saveError) {
      fail(saveError instanceof Error ? saveError.message : "저장에 실패했습니다.");
    }
  };

  const saveTimelineItem = async (item: TimelineItem) => {
    try {
      const data = await requestJson<{ timeline: TimelineItem[] }>(`/api/admin/timeline/${item.id}`, {
        method: "PUT",
        body: JSON.stringify(item)
      });
      setTimeline(data.timeline);
      flash("이력이 저장되었습니다.");
    } catch (saveError) {
      fail(saveError instanceof Error ? saveError.message : "이력 저장에 실패했습니다.");
    }
  };

  const addTimelineItem = async () => {
    try {
      const data = await requestJson<{ timeline: TimelineItem[] }>("/api/admin/timeline", {
        method: "POST",
        body: JSON.stringify({
          period: "2026",
          title: "New career item",
          organization: "",
          description: ""
        })
      });
      setTimeline(data.timeline);
      flash("이력이 추가되었습니다.");
    } catch (saveError) {
      fail(saveError instanceof Error ? saveError.message : "이력 추가에 실패했습니다.");
    }
  };

  const deleteTimelineItem = async (id: string) => {
    try {
      const data = await requestJson<{ timeline: TimelineItem[] }>(`/api/admin/timeline/${id}`, {
        method: "DELETE"
      });
      setTimeline(data.timeline);
      flash("이력이 삭제되었습니다.");
    } catch (deleteError) {
      fail(deleteError instanceof Error ? deleteError.message : "이력 삭제에 실패했습니다.");
    }
  };

  const persistTimelineOrder = async (items: TimelineItem[]) => {
    setTimeline(items);
    await requestJson<{ timeline: TimelineItem[] }>("/api/admin/reorder", {
      method: "PATCH",
      body: JSON.stringify({ type: "timeline", ids: items.map((item) => item.id) })
    })
      .then((data) => setTimeline(data.timeline))
      .catch(() => fail("이력 순서 저장에 실패했습니다."));
  };

  const uploadAsset = async (file: File, alt = "") => {
    const form = new FormData();
    form.set("file", file);
    form.set("alt", alt);

    const response = await fetch("/api/admin/assets", {
      method: "POST",
      body: form
    });

    const data = (await response.json()) as AssetResponse | { error?: string };
    if (!response.ok || !("asset" in data)) {
      throw new Error("이미지 업로드에 실패했습니다.");
    }

    return data.asset;
  };

  const uploadProfileImage = async (file: File | undefined) => {
    if (!file) return;
    try {
      const asset = await uploadAsset(file, profile.name);
      setProfile((current) => ({
        ...current,
        portraitAssetId: asset.id,
        portrait: { id: asset.id, url: asset.url, alt: asset.alt, mime: asset.mime }
      }));
      flash("프로필 이미지가 업로드되었습니다. 저장을 눌러 반영하세요.");
    } catch (uploadError) {
      fail(uploadError instanceof Error ? uploadError.message : "업로드에 실패했습니다.");
    }
  };

  const updateWorkLocal = (id: string, patch: Partial<WorkItem>) => {
    setWorks((current) => current.map((work) => (work.id === id ? { ...work, ...patch } : work)));
  };

  const resizeWorkPreview = (nextWidth: number) => {
    setWorkPreviewWidth(Math.min(1160, Math.max(260, nextWidth)));
  };

  const startWorkPreviewResize = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startWidth = workPreviewWidth;

    const move = (moveEvent: globalThis.PointerEvent) => {
      resizeWorkPreview(startWidth + startX - moveEvent.clientX);
    };

    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  const saveWork = async (work: WorkItem) => {
    try {
      const data = await requestJson<{ works: WorkItem[] }>(`/api/admin/works/${work.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...work,
          blocks: (work.blocks ?? []).map((block, index) => ({ ...block, sortOrder: index + 1 }))
        })
      });
      setWorks(data.works);
      setSelectedWorkId(work.id);
      flash("작업물이 저장되었습니다.");
    } catch (saveError) {
      fail(saveError instanceof Error ? saveError.message : "작업물 저장에 실패했습니다.");
    }
  };

  const addWork = async () => {
    const title = "New Project";
    try {
      const data = await requestJson<{ works: WorkItem[] }>("/api/admin/works", {
        method: "POST",
        body: JSON.stringify({
          slug: slugify(`${title}-${Date.now()}`),
          title,
          category: "UI/UX",
          summary: "",
          client: "",
          year: "2026",
          role: "",
          featured: false,
          published: true,
          blocks: []
        })
      });
      setWorks(data.works);
      setSelectedWorkId(data.works[data.works.length - 1]?.id ?? "");
      setActiveTab("works");
      flash("작업물이 추가되었습니다.");
    } catch (saveError) {
      fail(saveError instanceof Error ? saveError.message : "작업물 추가에 실패했습니다.");
    }
  };

  const deleteSelectedWork = async () => {
    if (!selectedWork) return;
    try {
      const data = await requestJson<{ works: WorkItem[] }>(`/api/admin/works/${selectedWork.id}`, {
        method: "DELETE"
      });
      setWorks(data.works);
      setSelectedWorkId(data.works[0]?.id ?? "");
      flash("작업물이 삭제되었습니다.");
    } catch (deleteError) {
      fail(deleteError instanceof Error ? deleteError.message : "작업물 삭제에 실패했습니다.");
    }
  };

  const persistWorkOrder = async (items: WorkItem[]) => {
    setWorks(items);
    await requestJson<{ works: WorkItem[] }>("/api/admin/reorder", {
      method: "PATCH",
      body: JSON.stringify({ type: "works", ids: items.map((item) => item.id) })
    })
      .then((data) => setWorks(data.works))
      .catch(() => fail("작업물 순서 저장에 실패했습니다."));
  };

  const workAssetPatch = (kind: WorkAssetKind, asset: AssetResponse["asset"] | null): Partial<WorkItem> => {
    const assetRef = asset ? { id: asset.id, url: asset.url, alt: asset.alt, mime: asset.mime } : null;

    if (kind === "thumbnail") {
      return { thumbnailAssetId: asset?.id ?? null, thumbnail: assetRef };
    }

    if (kind === "featuredThumbnail") {
      return { featuredThumbnailAssetId: asset?.id ?? null, featuredThumbnail: assetRef };
    }

    return { heroAssetId: asset?.id ?? null, hero: assetRef };
  };

  const uploadWorkAsset = async (kind: WorkAssetKind, file: File | undefined) => {
    if (!selectedWork || !file) return;
    try {
      const asset = await uploadAsset(file, selectedWork.title);
      updateWorkLocal(selectedWork.id, workAssetPatch(kind, asset));
      flash("이미지가 업로드되었습니다. 저장을 눌러 반영하세요.");
    } catch (uploadError) {
      fail(uploadError instanceof Error ? uploadError.message : "업로드에 실패했습니다.");
    }
  };

  const clearWorkAsset = (kind: WorkAssetKind) => {
    if (!selectedWork) return;
    updateWorkLocal(selectedWork.id, workAssetPatch(kind, null));
    flash("이미지가 제거되었습니다. 저장을 눌러 반영하세요.");
  };

  if (loading) {
    return (
      <main className="admin-shell">
        <p className="admin-loading">Loading admin...</p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="login-shell">
        <form className="login-panel" onSubmit={login}>
          <p>Portfolio CMS</p>
          <h1>Admin Login</h1>
          <label>
            Username
            <input name="username" autoComplete="username" required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          {error ? <div className="admin-alert error">{error}</div> : null}
          <button type="submit">Login</button>
        </form>
      </main>
    );
  }

  return (
    <>
      {message || error ? (
        <div className={`admin-toast ${error ? "error" : ""}`} role={error ? "alert" : "status"}>
          {error || message}
        </div>
      ) : null}
      <main className={`admin-shell ${sidebarCollapsed ? "is-sidebar-collapsed" : ""}`}>
      <aside className="admin-sidebar">
        <button
          type="button"
          className="sidebar-toggle"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={sidebarCollapsed}
          onClick={() => setSidebarCollapsed((current) => !current)}
        >
          {sidebarCollapsed ? "›" : "‹"}
        </button>
        <div className="sidebar-brand">
          <p>Beyond CMS</p>
          <h1>Portfolio Admin</h1>
        </div>
        <nav>
          {navItems.map((item) => (
            <button key={item.tab} type="button" className={activeTab === item.tab ? "is-active" : ""} onClick={() => setActiveTab(item.tab)}>
              <span className="nav-icon" aria-hidden="true"><AdminIcon name={item.icon} /></span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <button type="button" className="ghost-button" onClick={logout}>
          <span className="nav-icon" aria-hidden="true"><AdminIcon name="logout" /></span>
          <span className="nav-label">Logout</span>
        </button>
      </aside>

      <section className="admin-content">
        <header className="admin-topbar">
          <div>
            <p>{activeTab}</p>
            <h2>{activeTab === "profile" ? "자기소개 관리" : activeTab === "timeline" ? "이력 관리" : "작업물 관리"}</h2>
          </div>
          <a href="/" target="_blank" rel="noreferrer">
            View site
          </a>
        </header>

        {activeTab === "profile" ? (
          <section className="admin-panel profile-panel">
            <div className="field-grid">
              <label>
                Headline
                <input value={profile.headline} onChange={(event) => setProfile({ ...profile, headline: event.target.value })} />
              </label>
              <label>
                Name
                <input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} />
              </label>
              <label>
                Role
                <input value={profile.role} onChange={(event) => setProfile({ ...profile, role: event.target.value })} />
              </label>
              <label>
                Profile Image
                <input type="file" accept="image/*" onChange={(event) => uploadProfileImage(event.target.files?.[0])} />
              </label>
              <label className="full-field">
                Intro
                <textarea value={profile.intro} onChange={(event) => setProfile({ ...profile, intro: event.target.value })} />
              </label>
              <label className="full-field">
                Bio
                <textarea value={profile.bio} rows={6} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} />
              </label>
            </div>

            <div className="link-editor">
              <header>
                <h3>Links</h3>
                <button type="button" onClick={() => setProfile({ ...profile, links: [...profile.links, { label: "", url: "" }] })}>
                  Add link
                </button>
              </header>
              {profile.links.map((link, index) => (
                <div className="link-fields" key={`${link.label}-${index}`}>
                  <input
                    placeholder="Label"
                    value={link.label}
                    onChange={(event) => {
                      const links = [...profile.links];
                      links[index] = { ...link, label: event.target.value };
                      setProfile({ ...profile, links });
                    }}
                  />
                  <input
                    placeholder="URL"
                    value={link.url}
                    onChange={(event) => {
                      const links = [...profile.links];
                      links[index] = { ...link, url: event.target.value };
                      setProfile({ ...profile, links });
                    }}
                  />
                  <button
                    type="button"
                    className="danger"
                    onClick={() => setProfile({ ...profile, links: profile.links.filter((_, linkIndex) => linkIndex !== index) })}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="action-row">
              <button type="button" className="primary-action" onClick={saveProfile}>
                Save profile
              </button>
            </div>
          </section>
        ) : null}

        {activeTab === "timeline" ? (
          <section className="admin-panel">
            <div className="panel-actions">
              <button type="button" onClick={addTimelineItem}>
                Add career item
              </button>
            </div>
            <div className="timeline-editor-list">
              {timeline.map((item, index) => (
                <article className="admin-item" key={item.id}>
                  <div className="item-order">
                    <button type="button" disabled={index === 0} onClick={() => persistTimelineOrder(moveItem(timeline, item.id, -1))}>
                      Up
                    </button>
                    <button
                      type="button"
                      disabled={index === timeline.length - 1}
                      onClick={() => persistTimelineOrder(moveItem(timeline, item.id, 1))}
                    >
                      Down
                    </button>
                  </div>
                  <div className="field-grid">
                    <label>
                      Period
                      <input value={item.period} onChange={(event) => setTimeline(timeline.map((row) => (row.id === item.id ? { ...row, period: event.target.value } : row)))} />
                    </label>
                    <label>
                      Title
                      <input value={item.title} onChange={(event) => setTimeline(timeline.map((row) => (row.id === item.id ? { ...row, title: event.target.value } : row)))} />
                    </label>
                    <label>
                      Organization
                      <input
                        value={item.organization}
                        onChange={(event) => setTimeline(timeline.map((row) => (row.id === item.id ? { ...row, organization: event.target.value } : row)))}
                      />
                    </label>
                    <label className="full-field">
                      Description
                      <textarea
                        value={item.description}
                        onChange={(event) => setTimeline(timeline.map((row) => (row.id === item.id ? { ...row, description: event.target.value } : row)))}
                      />
                    </label>
                  </div>
                  <div className="action-row">
                    <button type="button" className="primary-action" onClick={() => saveTimelineItem(item)}>
                      Save
                    </button>
                    <button type="button" className="danger" onClick={() => deleteTimelineItem(item.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === "works" ? (
          <section className="works-admin-grid" style={{ "--work-preview-width": `${workPreviewWidth}px` } as CSSProperties}>
            <aside className="work-list-panel">
              <button type="button" onClick={addWork}>
                Add work
              </button>
              <div className="work-list">
                {works.map((work, index) => (
                  <article key={work.id} className={selectedWork?.id === work.id ? "is-selected" : ""}>
                    <button type="button" className="work-select" onClick={() => setSelectedWorkId(work.id)}>
                      <strong>{work.title}</strong>
                      <span>{work.category}</span>
                    </button>
                    <div className="item-order">
                      <button type="button" disabled={index === 0} onClick={() => persistWorkOrder(moveItem(works, work.id, -1))}>
                        Up
                      </button>
                      <button type="button" disabled={index === works.length - 1} onClick={() => persistWorkOrder(moveItem(works, work.id, 1))}>
                        Down
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </aside>

            {selectedWork ? (
              <>
                <section className="admin-panel work-editor">
                  <div className="field-grid">
                    <label>
                      Title
                      <input
                        value={selectedWork.title}
                        onChange={(event) =>
                          updateWorkLocal(selectedWork.id, {
                            title: event.target.value
                          })
                        }
                      />
                    </label>
                    <label>
                      Slug
                      <input
                        value={selectedWork.slug}
                        onChange={(event) => updateWorkLocal(selectedWork.id, { slug: slugify(event.target.value) })}
                      />
                    </label>
                    <label>
                      Category
                      <select value={selectedWork.category} onChange={(event) => updateWorkLocal(selectedWork.id, { category: event.target.value as WorkCategory })}>
                        <option>UI/UX</option>
                        <option>BI/BX</option>
                      </select>
                    </label>
                    <label>
                      Year
                      <input value={selectedWork.year} onChange={(event) => updateWorkLocal(selectedWork.id, { year: event.target.value })} />
                    </label>
                    <label>
                      Client
                      <input value={selectedWork.client} onChange={(event) => updateWorkLocal(selectedWork.id, { client: event.target.value })} />
                    </label>
                    <label>
                      Role
                      <input value={selectedWork.role} onChange={(event) => updateWorkLocal(selectedWork.id, { role: event.target.value })} />
                    </label>
                    <label className="full-field">
                      Summary
                      <textarea value={selectedWork.summary} onChange={(event) => updateWorkLocal(selectedWork.id, { summary: event.target.value })} />
                    </label>
                  </div>

                  <div className="toggle-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedWork.featured}
                        onChange={(event) => updateWorkLocal(selectedWork.id, { featured: event.target.checked })}
                      />
                      Featured
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedWork.published}
                        onChange={(event) => updateWorkLocal(selectedWork.id, { published: event.target.checked })}
                      />
                      Published
                    </label>
                  </div>

                  <div className="media-grid">
                    {workMediaFields.map((field) => {
                      const media = selectedWork[field.kind];

                      return (
                        <section className="media-field" key={field.kind} style={{ "--media-aspect": field.aspect } as CSSProperties}>
                          <header>
                            <div>
                              <strong>{field.label}</strong>
                              <p>{field.hint}</p>
                            </div>
                            <button type="button" className="danger" disabled={!media?.url} onClick={() => clearWorkAsset(field.kind)}>
                              Remove
                            </button>
                          </header>
                          <div className="media-preview">
                            {media?.url ? <img src={media.url} alt={media.alt ?? selectedWork.title} /> : <span>No image</span>}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              const input = event.currentTarget;
                              void uploadWorkAsset(field.kind, input.files?.[0]).finally(() => {
                                input.value = "";
                              });
                            }}
                          />
                        </section>
                      );
                    })}
                  </div>

                  <EditorBoundary>
                    <Suspense fallback={<div className="admin-editor-loading">Loading editor...</div>}>
                      <BlockEditor
                        blocks={selectedWork.blocks ?? []}
                        onUpload={uploadAsset}
                        onChange={(blocks: WorkBlock[]) => updateWorkLocal(selectedWork.id, { blocks })}
                      />
                    </Suspense>
                  </EditorBoundary>

                  <div className="action-row sticky-actions">
                    <button type="button" className="primary-action" onClick={() => saveWork(selectedWork)}>
                      Save work
                    </button>
                    <button type="button" className="danger" onClick={deleteSelectedWork}>
                      Delete work
                    </button>
                  </div>
                </section>
                <div
                  aria-label="Resize live preview"
                  aria-orientation="vertical"
                  aria-valuemax={1160}
                  aria-valuemin={260}
                  aria-valuenow={workPreviewWidth}
                  className="work-splitter"
                  role="separator"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowLeft") {
                      event.preventDefault();
                      resizeWorkPreview(workPreviewWidth + 32);
                    }
                    if (event.key === "ArrowRight") {
                      event.preventDefault();
                      resizeWorkPreview(workPreviewWidth - 32);
                    }
                  }}
                  onPointerDown={startWorkPreviewResize}
                />
                <WorkLivePreview work={selectedWork} />
              </>
            ) : (
              <section className="admin-panel empty-panel">No work selected.</section>
            )}
          </section>
        ) : null}
      </section>
      </main>
    </>
  );
}
