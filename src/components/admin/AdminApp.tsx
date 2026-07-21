import { AdminIcon, navItems } from "./AdminSupport";
import { ProfilePanel, TimelinePanel, WorksListPanel } from "./AdminPanels";
import WorkEditorPanel from "./WorkEditorPanel";
import { useAdminController } from "./useAdminController";
import "../../styles/admin.css";

export default function AdminApp() {
  const {
    activeTab,
    addTimelineItem,
    addWork,
    authenticated,
    clearWorkAsset,
    deleteSelectedWork,
    deleteTimelineItem,
    dragOverWorkId,
    draggedWorkId,
    error,
    finishWorkDrag,
    handleAdminNavClick,
    isMobileAdmin,
    leaveWorkEditorForList,
    loading,
    login,
    loginPending,
    logout,
    message,
    mobileDrawerOpen,
    moveDraggedWork,
    openWorkFromCard,
    profile,
    profileImageUploading,
    resizeWorkPreview,
    saveProfile,
    saveTimeline,
    saveWork,
    selectedWork,
    setMobileDrawerOpen,
    setProfile,
    setSidebarCollapsed,
    setTimeline,
    sidebarCollapsed,
    startWorkDrag,
    startWorkPreviewResize,
    timeline,
    updateWorkLocal,
    uploadAsset,
    uploadProfileImage,
    uploadWorkAsset,
    warning,
    workEditorRef,
    workPreviewWidth,
    works,
    workScreen
  } = useAdminController();
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
