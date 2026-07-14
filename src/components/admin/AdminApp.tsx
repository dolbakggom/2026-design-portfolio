import { Component, Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, DragEvent, PointerEvent, ReactNode, SyntheticEvent } from "react";
import type { Profile, TimelineItem, WorkBlock, WorkItem } from "../../types";
import {
  AdminIcon,
  ProfileLinkIcon,
  WorkLivePreview,
  emptyProfile,
  getWorkCategories,
  lessSuccessfulPublication,
  navItems,
  normalizeImageForUpload,
  reorderById,
  requestJson,
  sanitizeSlugInput,
  slugify,
  toggleWorkCategory,
  workCategoryOptions,
  workMediaFields,
  workSnapshot,
  workSnapshots,
  type AssetResponse,
  type PublicationResult,
  type PublishedResponse,
  type Tab,
  type WorkAssetKind,
  type WorkScreen
} from "./AdminSupport";
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

export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loginPending, setLoginPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState<string>("");
  const [workScreen, setWorkScreen] = useState<WorkScreen>("list");
  const [savedWorkSnapshots, setSavedWorkSnapshots] = useState<Record<string, string>>({});
  const [workPreviewWidth, setWorkPreviewWidth] = useState(460);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileAdmin, setIsMobileAdmin] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [draggedWorkId, setDraggedWorkId] = useState("");
  const [dragOverWorkId, setDragOverWorkId] = useState("");
  const profileRef = useRef<Profile>(emptyProfile);
  const workDragMoved = useRef(false);
  const worksRef = useRef<WorkItem[]>([]);
  const workEditorRef = useRef<HTMLElement | null>(null);
  const workEditorScrollTop = useRef(0);
  const shouldRestoreWorkEditorScroll = useRef(false);
  const workEditorRestoreFrame = useRef(0);

  const selectedWork = useMemo(
    () => works.find((work) => work.id === selectedWorkId) ?? works[0],
    [selectedWorkId, works]
  );
  const selectedWorkDirty = Boolean(
    selectedWork &&
      workScreen === "editor" &&
      savedWorkSnapshots[selectedWork.id] &&
      savedWorkSnapshots[selectedWork.id] !== workSnapshot(selectedWork)
  );

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    worksRef.current = works;
  }, [works]);

  useLayoutEffect(() => {
    if (!shouldRestoreWorkEditorScroll.current) return;

    const node = workEditorRef.current;
    if (!node) {
      shouldRestoreWorkEditorScroll.current = false;
      return;
    }

    const target = Math.min(workEditorScrollTop.current, Math.max(0, node.scrollHeight - node.clientHeight));
    node.scrollTop = target;
    window.cancelAnimationFrame(workEditorRestoreFrame.current);
    workEditorRestoreFrame.current = window.requestAnimationFrame(() => {
      const currentNode = workEditorRef.current;
      if (currentNode) {
        currentNode.scrollTop = Math.min(target, Math.max(0, currentNode.scrollHeight - currentNode.clientHeight));
      }
      shouldRestoreWorkEditorScroll.current = false;
    });
  });

  useEffect(
    () => () => {
      window.cancelAnimationFrame(workEditorRestoreFrame.current);
    },
    []
  );

  useEffect(() => {
    if (!authenticated || !selectedWorkDirty) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      Reflect.set(event, "returnValue", "");
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [authenticated, selectedWorkDirty]);

  const flash = (value: string) => {
    setMessage(value);
    setWarning("");
    setError("");
    window.setTimeout(() => setMessage(""), 2400);
  };

  const warn = (value: string) => {
    setWarning(value);
    setMessage("");
    setError("");
  };

  const fail = (value: string) => {
    setError(value);
    setMessage("");
    setWarning("");
  };

  const reportPublication = (publication: PublicationResult, successMessage: string) => {
    if (publication.status === "purged") {
      flash(`${successMessage} 공개 페이지에도 바로 반영됩니다.`);
      return;
    }

    if (publication.status === "deferred") {
      warn(`${successMessage} CDN 즉시 갱신이 설정되지 않아 최대 10분 뒤 반영됩니다.`);
      return;
    }

    warn(`${successMessage} 다만 공개 캐시 갱신에 실패했습니다. 잠시 후 다시 저장해주세요.`);
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
      setSavedWorkSnapshots(workSnapshots(worksData.works));
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
    const mediaQuery = window.matchMedia("(max-width: 980px)");
    const syncMobileState = () => {
      setIsMobileAdmin(mediaQuery.matches);
      if (!mediaQuery.matches) {
        setMobileDrawerOpen(false);
      }
    };

    syncMobileState();
    mediaQuery.addEventListener("change", syncMobileState);
    void loadAll();

    return () => mediaQuery.removeEventListener("change", syncMobileState);
  }, []);

  const login = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loginPending) return;

    const form = new FormData(event.currentTarget);
    setLoginPending(true);

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
    } finally {
      setLoginPending(false);
    }
  };

  const logout = async () => {
    await requestJson("/api/admin/logout", { method: "POST", body: "{}" }).catch(() => null);
    setAuthenticated(false);
  };

  const saveProfile = async () => {
    if (profileImageUploading) {
      fail("프로필 이미지 업로드가 끝난 뒤 저장해주세요.");
      return;
    }

    try {
      const data = await requestJson<PublishedResponse<{ profile: Profile }>>("/api/admin/profile", {
        method: "PUT",
        body: JSON.stringify(profileRef.current)
      });
      setProfile(data.profile);
      profileRef.current = data.profile;
      reportPublication(data.publication, "자기소개가 저장되었습니다.");
    } catch (saveError) {
      fail(saveError instanceof Error ? saveError.message : "저장에 실패했습니다.");
    }
  };

  const saveTimeline = async () => {
    try {
      let nextTimeline = timeline;
      let publication: PublicationResult | null = null;

      for (const item of timeline) {
        const data = await requestJson<PublishedResponse<{ timeline: TimelineItem[] }>>(`/api/admin/timeline/${item.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...item, description: "" })
        });
        nextTimeline = data.timeline;
        publication = lessSuccessfulPublication(publication, data.publication);
      }

      setTimeline(nextTimeline);
      if (publication) reportPublication(publication, "이력이 모두 저장되었습니다.");
    } catch (saveError) {
      fail(saveError instanceof Error ? saveError.message : "이력 저장에 실패했습니다.");
    }
  };

  const addTimelineItem = async () => {
    try {
      const data = await requestJson<PublishedResponse<{ timeline: TimelineItem[] }>>("/api/admin/timeline", {
        method: "POST",
        body: JSON.stringify({
          period: "2026",
          title: "New career item",
          organization: "",
          description: ""
        })
      });
      setTimeline(data.timeline);
      reportPublication(data.publication, "이력이 추가되었습니다.");
    } catch (saveError) {
      fail(saveError instanceof Error ? saveError.message : "이력 추가에 실패했습니다.");
    }
  };

  const deleteTimelineItem = async (id: string) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      const data = await requestJson<PublishedResponse<{ timeline: TimelineItem[] }>>(`/api/admin/timeline/${id}`, {
        method: "DELETE"
      });
      setTimeline(data.timeline);
      reportPublication(data.publication, "이력이 삭제되었습니다.");
    } catch (deleteError) {
      fail(deleteError instanceof Error ? deleteError.message : "이력 삭제에 실패했습니다.");
    }
  };

  const uploadAsset = async (file: File, alt = "") => {
    const upload = await normalizeImageForUpload(file);
    const form = new FormData();
    form.set("file", upload.file);
    form.set("alt", alt);
    form.set("width", String(upload.width));
    form.set("height", String(upload.height));
    form.set(
      "variantManifest",
      JSON.stringify(
        upload.variants.map(({ field, width, height, mime }) => ({ field, width, height, mime }))
      )
    );
    for (const variant of upload.variants) {
      if (variant.field !== "file") form.set(variant.field, variant.file);
    }

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
    setProfileImageUploading(true);
    try {
      const asset = await uploadAsset(file, profile.name);
      setProfile((current) => {
        const nextProfile = {
        ...current,
        portraitAssetId: asset.id,
        portrait: {
          id: asset.id,
          url: asset.url,
          alt: asset.alt,
          mime: asset.mime,
          width: asset.width,
          height: asset.height,
          variants: asset.variants
        }
        };
        profileRef.current = nextProfile;
        return nextProfile;
      });
      flash("프로필 이미지가 업로드되었습니다. 저장을 눌러 반영하세요.");
    } catch (uploadError) {
      fail(uploadError instanceof Error ? uploadError.message : "업로드에 실패했습니다.");
    } finally {
      setProfileImageUploading(false);
    }
  };

  const updateWorkLocal = (id: string, patch: Partial<WorkItem>) => {
    if (workScreen === "editor" && workEditorRef.current) {
      workEditorScrollTop.current = workEditorRef.current.scrollTop;
      shouldRestoreWorkEditorScroll.current = true;
    }

    setWorks((current) => current.map((work) => (work.id === id ? { ...work, ...patch } : work)));
  };

  const openWorkEditor = (id: string) => {
    setSelectedWorkId(id);
    setWorkScreen("editor");
    window.history.pushState({ adminWorkEditor: id }, "", window.location.href);
  };

  const saveWork = async (work: WorkItem) => {
    try {
      const data = await requestJson<PublishedResponse<{ works: WorkItem[] }>>(`/api/admin/works/${work.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...work,
          heroAssetId: null,
          hero: null,
          blocks: (work.blocks ?? []).map((block, index) => ({ ...block, sortOrder: index + 1 }))
        })
      });
      setWorks(data.works);
      setSavedWorkSnapshots(workSnapshots(data.works));
      setSelectedWorkId(work.id);
      reportPublication(data.publication, "작업물이 저장되었습니다.");
      return true;
    } catch (saveError) {
      fail(saveError instanceof Error ? saveError.message : "작업물 저장에 실패했습니다.");
      return false;
    }
  };

  const confirmLeaveWorkEditor = async () => {
    if (!selectedWork || !selectedWorkDirty) return true;

    const shouldSave = window.confirm("저장하지 않은 작업물 수정사항이 있습니다. 저장하고 이동하시겠습니까?");
    if (!shouldSave) return false;

    return saveWork(selectedWork);
  };

  const leaveWorkEditorForList = async () => {
    if (!(await confirmLeaveWorkEditor())) return;
    setWorkScreen("list");
    window.history.replaceState({ adminWorkScreen: "list" }, "", window.location.href);
  };

  const switchAdminTab = async (tab: Tab) => {
    if (tab === activeTab) return;
    if (activeTab === "works" && workScreen === "editor" && !(await confirmLeaveWorkEditor())) return;

    setActiveTab(tab);
    if (tab !== "works") {
      setWorkScreen("list");
    }
  };

  const handleAdminNavClick = async (tab: Tab) => {
    await switchAdminTab(tab);
    setMobileDrawerOpen(false);
  };

  useEffect(() => {
    if (!authenticated || workScreen !== "editor") return;

    const handlePopState = () => {
      void (async () => {
        if (await confirmLeaveWorkEditor()) {
          setWorkScreen("list");
          return;
        }

        if (selectedWork) {
          window.history.pushState({ adminWorkEditor: selectedWork.id }, "", window.location.href);
        }
      })();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [authenticated, workScreen, selectedWork, selectedWorkDirty]);

  const startWorkDrag = (event: DragEvent<HTMLElement>, id: string) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    workDragMoved.current = false;
    setDraggedWorkId(id);
    setDragOverWorkId(id);
  };

  const moveDraggedWork = (event: DragEvent<HTMLElement>, overId: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverWorkId(overId);

    if (!draggedWorkId || draggedWorkId === overId) return;

    workDragMoved.current = true;
    setWorks((current) => {
      const next = reorderById(current, draggedWorkId, overId);
      worksRef.current = next;
      return next;
    });
  };

  const finishWorkDrag = () => {
    const shouldSave = workDragMoved.current;
    const orderedWorks = worksRef.current;

    setDraggedWorkId("");
    setDragOverWorkId("");

    window.setTimeout(() => {
      workDragMoved.current = false;
    }, 0);

    if (shouldSave) {
      void persistWorkOrder(orderedWorks);
    }
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

  const addWork = async () => {
    const title = "New Project";
    try {
      const data = await requestJson<PublishedResponse<{ works: WorkItem[] }>>("/api/admin/works", {
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
      setSavedWorkSnapshots(workSnapshots(data.works));
      setSelectedWorkId(data.works[data.works.length - 1]?.id ?? "");
      setActiveTab("works");
      setWorkScreen("editor");
      reportPublication(data.publication, "작업물이 추가되었습니다.");
    } catch (saveError) {
      fail(saveError instanceof Error ? saveError.message : "작업물 추가에 실패했습니다.");
    }
  };

  const deleteSelectedWork = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    if (!selectedWork) return;
    try {
      const data = await requestJson<PublishedResponse<{ works: WorkItem[] }>>(`/api/admin/works/${selectedWork.id}`, {
        method: "DELETE"
      });
      setWorks(data.works);
      setSavedWorkSnapshots(workSnapshots(data.works));
      setSelectedWorkId(data.works[0]?.id ?? "");
      setWorkScreen("list");
      reportPublication(data.publication, "작업물이 삭제되었습니다.");
    } catch (deleteError) {
      fail(deleteError instanceof Error ? deleteError.message : "작업물 삭제에 실패했습니다.");
    }
  };

  const persistWorkOrder = async (items: WorkItem[]) => {
    setWorks(items);
    await requestJson<PublishedResponse<{ works: WorkItem[] }>>("/api/admin/reorder", {
      method: "PATCH",
      body: JSON.stringify({ type: "works", ids: items.map((item) => item.id) })
    })
      .then((data) => {
        setWorks(data.works);
        reportPublication(data.publication, "작업물 순서가 저장되었습니다.");
      })
      .catch(() => fail("작업물 순서 저장에 실패했습니다."));
  };

  const workAssetPatch = (kind: WorkAssetKind, asset: AssetResponse["asset"] | null): Partial<WorkItem> => {
    const assetRef = asset
      ? {
          id: asset.id,
          url: asset.url,
          alt: asset.alt,
          mime: asset.mime,
          width: asset.width,
          height: asset.height,
          variants: asset.variants
        }
      : null;

    if (kind === "thumbnail") {
      return { thumbnailAssetId: asset?.id ?? null, thumbnail: assetRef };
    }

    if (kind === "featuredThumbnail") {
      return { featuredThumbnailAssetId: asset?.id ?? null, featuredThumbnail: assetRef };
    }

    return {};
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
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
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
            <input name="username" autoComplete="username" disabled={loginPending} required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" disabled={loginPending} required />
          </label>
          {error ? <div className="admin-alert error">{error}</div> : null}
          <button type="submit" disabled={loginPending}>{loginPending ? "Signing in..." : "Login"}</button>
        </form>
      </main>
    );
  }

  return (
    <>
      {message || warning || error ? (
        <div className={`admin-toast ${error ? "error" : warning ? "warning" : ""}`} role={error ? "alert" : "status"}>
          {error || warning || message}
        </div>
      ) : null}
      <main
        className={[
          "admin-shell",
          !isMobileAdmin && sidebarCollapsed ? "is-sidebar-collapsed" : "",
          isMobileAdmin && mobileDrawerOpen ? "is-mobile-drawer-open" : ""
        ].filter(Boolean).join(" ")}
      >
        {isMobileAdmin && mobileDrawerOpen ? (
          <div
            className="admin-drawer-overlay"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />
        ) : null}
      <aside className="admin-sidebar">
        {!isMobileAdmin ? (
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={sidebarCollapsed}
            onClick={() => setSidebarCollapsed((current) => !current)}
          >
            {sidebarCollapsed ? "›" : "‹"}
          </button>
        ) : null}
        <div className="sidebar-brand">
          <p>Beyond CMS</p>
          <h1>Portfolio Admin</h1>
        </div>
        <nav>
          {navItems.map((item) => (
            <button key={item.tab} type="button" className={activeTab === item.tab ? "is-active" : ""} onClick={() => void handleAdminNavClick(item.tab)}>
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

      <section className={`admin-content ${activeTab === "works" ? "is-works-tab" : ""}`}>
        <header className="admin-topbar">
          {isMobileAdmin && !(activeTab === "works" && workScreen === "editor") ? (
            <button
              type="button"
              className="admin-hamburger"
              aria-label="Open menu"
              aria-expanded={mobileDrawerOpen}
              onClick={() => setMobileDrawerOpen(true)}
            >
              ☰
            </button>
          ) : null}
          <div className="admin-title-block">
            <p>{activeTab}</p>
            <div className="admin-title-row">
              {activeTab === "works" && workScreen === "editor" ? (
                <button type="button" className="admin-title-back" aria-label="Back to work list" onClick={() => void leaveWorkEditorForList()}>
                  ←
                </button>
              ) : null}
              <h2>{activeTab === "profile" ? "자기소개 관리" : activeTab === "timeline" ? "이력 관리" : activeTab === "works" && workScreen === "editor" ? selectedWork?.title || "작업물 편집" : "작업물 관리"}</h2>
            </div>
          </div>
          <div className="admin-topbar-actions">
            {activeTab === "works" && workScreen === "list" ? (
              <button type="button" className="primary-action" onClick={addWork}>
                Add work
              </button>
            ) : null}
            {activeTab === "works" && workScreen === "editor" && selectedWork ? (
              <button type="button" className="primary-action" onClick={() => saveWork(selectedWork)}>
                Save
              </button>
            ) : null}
            <a href="/" target="_blank" rel="noreferrer">
              View site
            </a>
          </div>
        </header>

        {activeTab === "profile" ? (
          <div className="admin-profile-grid">
            <section className="admin-panel">
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
                  Profile Image
                  <input type="file" accept="image/*" disabled={profileImageUploading} onChange={(event) => uploadProfileImage(event.target.files?.[0])} />
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
                      onChange={(event) => {
                        const links = [...profile.links];
                        links[index] = { ...link, label: event.target.value };
                        setProfile({ ...profile, links });
                      }}
                    />
                    <input
                      aria-label="Click action"
                      placeholder="mailto:, tel:, https://"
                      value={link.url}
                      onChange={(event) => {
                        const links = [...profile.links];
                        links[index] = { ...link, url: event.target.value };
                        setProfile({ ...profile, links });
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>

            <div className="action-row sticky-actions">
              <button type="button" className="primary-action" onClick={saveProfile} disabled={profileImageUploading}>
                {profileImageUploading ? "Uploading..." : "Save profile"}
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === "timeline" ? (
          <section className="timeline-cards-layout">
            <div className="panel-actions" style={{ marginBottom: "20px" }}>
              <button type="button" onClick={addTimelineItem}>
                Add career item
              </button>
            </div>
            <div className="timeline-editor-list" style={{ display: "grid", gap: "20px", marginTop: 0 }}>
              {[...timeline]
                .sort((a, b) => String(a.period || "").localeCompare(String(b.period || "")))
                .map((item) => (
                <article className="admin-panel admin-timeline-card" key={item.id}>
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
                  </div>
                  <div className="action-row" style={{ marginTop: "16px" }}>
                    <button type="button" className="danger" onClick={() => deleteTimelineItem(item.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <div className="action-row sticky-actions">
              <button type="button" className="primary-action" onClick={saveTimeline}>
                Save career
              </button>
            </div>
          </section>
        ) : null}

        {activeTab === "works" ? (
          workScreen === "list" ? (
            <section className={`works-list-view ${draggedWorkId ? "is-ordering" : ""}`}>
              {works.length ? (
                <div className="work-grid admin-work-grid">
                  {works.map((work) => {
                    const tileStyle = work.thumbnail?.url ? ({ "--tile-image": `url("${work.thumbnail.url}")` } as CSSProperties) : undefined;
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
                        onClick={() => {
                          if (workDragMoved.current) return;
                          openWorkEditor(work.id);
                        }}
                        onDragStart={(event) => startWorkDrag(event, work.id)}
                        onDragOver={(event) => moveDraggedWork(event, work.id)}
                        onDrop={finishWorkDrag}
                        onDragEnd={finishWorkDrag}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ") return;
                          event.preventDefault();
                          openWorkEditor(work.id);
                        }}
                      >
                        <div
                          className={`work-tile-media ${work.thumbnail?.url ? "has-image" : ""}`}
                          style={tileStyle}
                          aria-label={work.thumbnail?.alt ?? work.title}
                          role="img"
                        />
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
          ) : (
            <section className="works-editor-layout" style={{ "--work-preview-width": `${workPreviewWidth}px` } as CSSProperties}>
              {selectedWork ? (
                <>
                  <section className="work-editor" aria-label="Work editor" ref={workEditorRef}>
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
                            onChange={(event) => updateWorkLocal(selectedWork.id, { slug: sanitizeSlugInput(event.target.value) })}
                            onBlur={(event) => updateWorkLocal(selectedWork.id, { slug: slugify(event.target.value) })}
                          />
                        </label>
                        <div className="category-check-group">
                          <span>Category</span>
                          <div className="category-check-options">
                            {workCategoryOptions.map((category) => (
                              <label key={category}>
                                <input
                                  type="checkbox"
                                  checked={getWorkCategories(selectedWork.category).includes(category)}
                                  onChange={(event) => updateWorkLocal(selectedWork.id, { category: toggleWorkCategory(selectedWork.category, category, event.target.checked) })}
                                />
                                {category}
                              </label>
                            ))}
                          </div>
                        </div>
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
                              <label
                                className="media-upload-zone"
                                onDragOver={(event: DragEvent<HTMLLabelElement>) => {
                                  event.preventDefault();
                                  event.dataTransfer.dropEffect = "copy";
                                }}
                                onDrop={(event: DragEvent<HTMLLabelElement>) => {
                                  event.preventDefault();
                                  void uploadWorkAsset(field.kind, event.dataTransfer.files?.[0]);
                                }}
                              >
                                <input
                                  className="media-upload-input"
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) => {
                                    const input = event.currentTarget;
                                    void uploadWorkAsset(field.kind, input.files?.[0]).finally(() => {
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
                            blocks={selectedWork.blocks ?? []}
                            onUpload={uploadAsset}
                            onChange={(blocks: WorkBlock[]) => updateWorkLocal(selectedWork.id, { blocks })}
                          />
                        </Suspense>
                      </EditorBoundary>
                    </section>

                    <div className="action-row work-editor-actions">
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
          )
        ) : null}
      </section>
      </main>
    </>
  );
}
