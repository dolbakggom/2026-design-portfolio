import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, PointerEvent, SyntheticEvent } from "react";
import type { Profile, TimelineItem, WorkItem } from "../../types";
import {
  AdminIcon,
  emptyProfile,
  lessSuccessfulPublication,
  navItems,
  normalizeImageForUpload,
  reorderById,
  requestJson,
  slugify,
  workSnapshot,
  workSnapshots,
  type AssetResponse,
  type PublicationResult,
  type PublishedResponse,
  type Tab,
  type WorkAssetKind,
  type WorkScreen
} from "./AdminSupport";
import { ProfilePanel, TimelinePanel, WorksListPanel } from "./AdminPanels";
import WorkEditorPanel from "./WorkEditorPanel";
import "../../styles/admin.css";

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

  const openWorkFromCard = (id: string) => {
    if (workDragMoved.current) return;
    openWorkEditor(id);
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
          <ProfilePanel
            profile={profile}
            imageUploading={profileImageUploading}
            onChange={setProfile}
            onImageUpload={(file) => void uploadProfileImage(file)}
            onSave={() => void saveProfile()}
          />
        ) : null}

        {activeTab === "timeline" ? (
          <TimelinePanel
            timeline={timeline}
            onChange={setTimeline}
            onAdd={() => void addTimelineItem()}
            onDelete={(id) => void deleteTimelineItem(id)}
            onSave={() => void saveTimeline()}
          />
        ) : null}

        {activeTab === "works" ? (
          workScreen === "list" ? (
            <WorksListPanel
              works={works}
              draggedWorkId={draggedWorkId}
              dragOverWorkId={dragOverWorkId}
              onOpen={openWorkFromCard}
              onDragStart={startWorkDrag}
              onDragOver={moveDraggedWork}
              onDragFinish={finishWorkDrag}
            />
          ) : (
            <WorkEditorPanel
              work={selectedWork}
              previewWidth={workPreviewWidth}
              editorRef={workEditorRef}
              onUpdate={(patch) => {
                if (selectedWork) updateWorkLocal(selectedWork.id, patch);
              }}
              onUploadAsset={uploadWorkAsset}
              onClearAsset={clearWorkAsset}
              onUploadBlockAsset={uploadAsset}
              onDelete={() => void deleteSelectedWork()}
              onResize={resizeWorkPreview}
              onResizeStart={startWorkPreviewResize}
            />
          )
        ) : null}
      </section>
      </main>
    </>
  );
}
