type GsapModule = typeof import("gsap").default;
type ScrollTriggerModule = typeof import("gsap/ScrollTrigger").ScrollTrigger;
type ScrollTriggerInstance = ReturnType<ScrollTriggerModule["create"]>;
type GsapAnimation = ReturnType<GsapModule["fromTo"]>;

type FeaturedControllerOptions = {
  gsap: GsapModule;
  ScrollTrigger: ScrollTriggerModule;
  reduceMotion: boolean;
  signal: AbortSignal;
  getPanelHeight: () => number;
  scrollToPosition: (top: number, mode?: "auto" | "smooth", onComplete?: () => void) => void;
  clearHomeRoute: () => void;
  updateScrollTriggers: () => void;
  registerAnimation: (animation: GsapAnimation) => void;
  registerTrigger: (trigger: ScrollTriggerInstance) => void;
};

export const initHomeFeatured = ({
  gsap,
  ScrollTrigger,
  reduceMotion,
  signal,
  getPanelHeight,
  scrollToPosition,
  clearHomeRoute,
  updateScrollTriggers,
  registerAnimation,
  registerTrigger
}: FeaturedControllerOptions) => {
  const panels = gsap.utils.toArray<HTMLElement>("[data-featured-panel]");
  const dots = gsap.utils.toArray<HTMLElement>("[data-featured-dot]");
  const stage = document.querySelector<HTMLElement>(".featured-stage");
  const section = document.querySelector<HTMLElement>("#featured-work:not(.is-empty)");
  const gallerySection = document.querySelector<HTMLElement>(".gallery-section");
  let activeIndex = -1;
  let blurTimeout = 0;
  let cachedTop = Number.POSITIVE_INFINITY;

  const updateGeometry = () => {
    cachedTop = section?.offsetTop ?? Number.POSITIVE_INFINITY;
  };

  const setActive = (index: number) => {
    const nextIndex = panels.length ? Math.min(panels.length - 1, Math.max(0, index)) : -1;
    if (nextIndex === activeIndex) return;

    activeIndex = nextIndex;
    panels.forEach((panel, panelIndex) => {
      const isActive = panelIndex === nextIndex;
      panel.classList.toggle("is-active", isActive);
      panel.setAttribute("aria-hidden", isActive ? "false" : "true");
      panel.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
        if (isActive) link.removeAttribute("tabindex");
        else link.setAttribute("tabindex", "-1");
      });
    });
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === nextIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  const getIndexTop = (index: number) => {
    const count = Math.max(1, panels.length);
    return cachedTop + getPanelHeight() * gsap.utils.clamp(0, count - 1, index);
  };

  const syncScrollHeight = () => {
    if (!section) return;
    section.style.setProperty("--featured-scroll-height", `${(Math.max(1, panels.length) + 2) * getPanelHeight()}px`);
  };

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const targetIndex = Number(dot.dataset.featuredTarget ?? 0);
      stage?.classList.add("is-dot-jumping");
      const activateTarget = () => {
        updateScrollTriggers();
        setActive(targetIndex);
      };
      scrollToPosition(getIndexTop(targetIndex), "auto", activateTarget);
      clearHomeRoute();
      activateTarget();

      if (blurTimeout) window.clearTimeout(blurTimeout);
      blurTimeout = window.setTimeout(() => {
        stage?.classList.remove("is-dot-jumping");
      }, reduceMotion ? 0 : 180);
    }, { signal });
  });

  updateGeometry();
  syncScrollHeight();
  updateGeometry();
  setActive(0);

  if (section && panels.length) {
    registerTrigger(ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: () => `bottom-=${getPanelHeight() * 2}px bottom`,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const progress = gsap.utils.clamp(0, 0.999999, self.progress);
        setActive(Math.min(panels.length - 1, Math.floor(progress * panels.length)));
      }
    }));
  }

  if (stage && gallerySection) {
    registerAnimation(gsap.fromTo(stage, { "--featured-gallery-dim": 0 }, {
      "--featured-gallery-dim": 0.86,
      ease: "none",
      scrollTrigger: {
        trigger: gallerySection,
        start: "top bottom",
        end: "top top",
        scrub: true,
        invalidateOnRefresh: true
      }
    }));
  }

  const cleanup = () => {
    if (blurTimeout) window.clearTimeout(blurTimeout);
  };

  return { cleanup, section, stage, syncScrollHeight, updateGeometry };
};
