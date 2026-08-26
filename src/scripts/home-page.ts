import { getReducedMotionTarget, shouldLoadMotion, type MotionIntent } from "../lib/motion-loader";
import { initHomeFeatured } from "./home/home-featured";
import { initHomeIdentity } from "./home/home-identity";
import { createHomeTypewriter } from "./home/home-typewriter";
import { initHomeWorkSection } from "./home/home-work";

type GsapModule = typeof import("gsap").default;
type ScrollTriggerModule = typeof import("gsap/ScrollTrigger").ScrollTrigger;
let gsap: GsapModule;
let ScrollTrigger: ScrollTriggerModule;
let homeMotionPromise: Promise<void> | null = null;

let activeHomeShell: HTMLElement | null = null;
let cleanupHomePage = () => {};

const completeHomeLoader = (immediate = false) => {
  const loader = document.querySelector<HTMLElement>("[data-home-loader]");
  const shell = document.querySelector<HTMLElement>(".site-shell");
  document.documentElement.classList.remove("home-is-loading");
  shell?.setAttribute("aria-busy", "false");
  if (!loader) return;

  if (immediate) loader.style.transition = "none";
  loader.classList.add("is-complete");
  loader.setAttribute("aria-hidden", "true");
  window.setTimeout(() => {
    loader.hidden = true;
  }, immediate ? 0 : 440);
};

const initHomePage = () => {
  const shell = document.querySelector<HTMLElement>(".site-shell");
  if (shell && shell === activeHomeShell) return;

  cleanupHomePage();

  if (!shell) {
    activeHomeShell = null;
    document.documentElement.classList.remove("intro-complete");
    return;
  }

  activeHomeShell = shell;
  const pageController = new AbortController();
  const pageSignal = pageController.signal;
  const {
    cleanup: cleanupTypewriter,
    fillElement: fillTypeElement,
    prepareElement: prepareTypeElement,
    typeElement,
    typeText
  } = createHomeTypewriter();
  const homeScrollTriggers: ScrollTrigger[] = [];
  const homeScrollAnimations: gsap.core.Animation[] = [];
  let initialScrollFrame = 0;
  let initialScrollTimeout = 0;
  let viewportSyncFrame = 0;
  let viewportRefreshTimeout = 0;
  let lastSyncedViewportHeight = 0;
  let deferredImageObserver: IntersectionObserver | null = null;
  let updateScrollGeometryCache = () => {};
  let cachedWorkTop = Number.POSITIVE_INFINITY;
  let cachedPanelHeight = window.innerHeight;
  let routeDebounceTimeout = 0;
  let initialReadyTimeout = 0;
  let pendingRoute: string | null = null;
  const portfolioWindow = window as Window & {
    __portfolioLenis?: { resize?: () => void };
    __portfolioScrollToTop?: () => void;
    __portfolioLenisScrollTo?: (target: number | string | HTMLElement, options?: { immediate?: boolean; duration?: number; onComplete?: () => void }) => void;
  };
  let scrollToTopHandler: (() => void) | null = null;

  cleanupHomePage = () => {
    if (scrollToTopHandler && portfolioWindow.__portfolioScrollToTop === scrollToTopHandler) {
      delete portfolioWindow.__portfolioScrollToTop;
    }
    pageController.abort();
    window.cancelAnimationFrame(initialScrollFrame);
    if (initialScrollTimeout) {
      window.clearTimeout(initialScrollTimeout);
    }
    window.cancelAnimationFrame(viewportSyncFrame);
    if (viewportRefreshTimeout) {
      window.clearTimeout(viewportRefreshTimeout);
    }
    if (routeDebounceTimeout) {
      window.clearTimeout(routeDebounceTimeout);
    }
    if (initialReadyTimeout) {
      window.clearTimeout(initialReadyTimeout);
    }
    cleanupTypewriter();
    identityController.cleanup();
    featuredController.cleanup();
    deferredImageObserver?.disconnect();
    document.documentElement.style.removeProperty("--home-viewport-height");
    ScrollTrigger.removeEventListener("refreshInit", updateScrollGeometryCache);
    ScrollTrigger.removeEventListener("refresh", updateScrollGeometryCache);
    homeScrollAnimations.forEach((animation) => animation.kill());
    homeScrollTriggers.forEach((trigger) => trigger.kill());
    document.documentElement.classList.remove("intro-complete");
    activeHomeShell = null;
    cleanupHomePage = () => {};
  };

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const initialSection = shell.dataset.initialSection ?? "intro";
const deferredImages = Array.from(document.querySelectorAll<HTMLImageElement>("img[data-deferred-src]"));
const loadDeferredImage = (image: HTMLImageElement) => {
  const source = image.dataset.deferredSrc;
  if (!source || image.src) return;
  const sourceSet = image.dataset.deferredSrcset;
  if (sourceSet) image.srcset = sourceSet;
  image.src = source;
  image.removeAttribute("data-deferred-src");
  image.removeAttribute("data-deferred-srcset");
};

if (deferredImages.length && "IntersectionObserver" in window) {
  deferredImageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const image = entry.target as HTMLImageElement;
      loadDeferredImage(image);
      deferredImageObserver?.unobserve(image);
    });
  }, { rootMargin: "0px" });
  deferredImages.forEach((image) => deferredImageObserver?.observe(image));
} else {
  deferredImages.forEach(loadDeferredImage);
}
const navigationEntry = window.performance?.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
const shouldPreserveRestoredWorkScroll = initialSection === "work" && navigationEntry?.type === "back_forward";

const updateScrollTriggers = () => {
  ScrollTrigger.update();
};

const scrollToPosition = (top: number, mode: "auto" | "smooth" = "smooth", onComplete?: () => void) => {
  if (portfolioWindow.__portfolioLenisScrollTo) {
    portfolioWindow.__portfolioLenisScrollTo(Math.round(top), {
      immediate: mode === "auto",
      duration: mode === "smooth" ? 1.05 : 0,
      onComplete
    });
    return;
  }

  window.scrollTo({ top: Math.round(top), behavior: mode === "smooth" ? "smooth" : "auto" });
  if (mode === "auto") {
    onComplete?.();
    return;
  }
  window.setTimeout(() => onComplete?.(), 1060);
};

const commitPendingRoute = () => {
  routeDebounceTimeout = 0;
  const nextRoute = pendingRoute;
  pendingRoute = null;
  if (!nextRoute || window.location.pathname === nextRoute) return;

  try {
    window.history.replaceState(null, "", nextRoute);
  } catch (error) {
    console.warn("Skipped route update after browser history throttling.", error);
  }
};

const replaceRoute = (route: string, options: { immediate?: boolean } = {}) => {
  if (routeDebounceTimeout) {
    window.clearTimeout(routeDebounceTimeout);
    routeDebounceTimeout = 0;
  }

  if (window.location.pathname === route) {
    pendingRoute = null;
    return;
  }

  pendingRoute = route;
  if (options.immediate) {
    commitPendingRoute();
    return;
  }

  routeDebounceTimeout = window.setTimeout(commitPendingRoute, 150);
};

const clearHomeRoute = () => {
  const gallery = document.querySelector<HTMLElement>(".gallery-section");
  if (gallery && window.scrollY >= gallery.offsetTop - 10) {
    replaceRoute("/work");
    return;
  }

  if (pendingRoute || ["/about", "/career", "/work"].includes(window.location.pathname)) {
    replaceRoute("/");
  }
};

const introLogo = document.querySelector<HTMLElement>(".intro-logo");
const introTypeTarget = document.querySelector<HTMLElement>("[data-intro-typewriter]");
const homeLoader = document.querySelector<HTMLElement>("[data-home-loader]");

if (introTypeTarget && !reduceMotion) {
  const phrase = introTypeTarget.dataset.introTypewriter ?? introTypeTarget.textContent ?? "";
  introTypeTarget.textContent = "";
  gsap.set(introLogo, { autoAlpha: 0, filter: "blur(18px)", scale: 0.94 });

  const loadReady = document.readyState === "complete"
    ? Promise.resolve()
    : new Promise<void>((resolve) => window.addEventListener("load", () => resolve(), { once: true, signal: pageSignal }));
  const fontsReady = document.fonts?.ready?.then(() => undefined).catch(() => undefined) ?? Promise.resolve();
  const readyTimeout = new Promise<void>((resolve) => {
    initialReadyTimeout = window.setTimeout(resolve, 4500);
  });

  void Promise.race([Promise.all([loadReady, fontsReady]), readyTimeout]).then(() => {
    if (pageSignal.aborted) return;
    if (initialReadyTimeout) {
      window.clearTimeout(initialReadyTimeout);
      initialReadyTimeout = 0;
    }
    completeHomeLoader();
    const introTimeline = gsap.timeline({ defaults: { ease: "power3.out", overwrite: "auto" } });
    introTimeline
      .to(introLogo, { autoAlpha: 1, filter: "blur(0px)", scale: 1, duration: 1.45 }, homeLoader ? 0.18 : 0)
      .add(() => {
        typeText(introTypeTarget, phrase, 64, () => {
          document.documentElement.classList.add("intro-complete");
        });
      }, homeLoader ? 1.18 : 1);
    homeScrollAnimations.push(introTimeline);
  });
} else {
  completeHomeLoader(true);
  document.documentElement.classList.add("intro-complete");
}

const introSection = document.querySelector<HTMLElement>(".intro-section");
const workSection = document.querySelector<HTMLElement>("#work");
const gallerySection = document.querySelector<HTMLElement>(".gallery-section");

const getWorkTop = () => cachedWorkTop;
const getPanelHeight = () => cachedPanelHeight;
cachedWorkTop = workSection?.offsetTop ?? Number.POSITIVE_INFINITY;
cachedPanelHeight = introSection?.offsetHeight || window.innerHeight;
const featuredController = initHomeFeatured({
  gsap,
  ScrollTrigger,
  reduceMotion,
  signal: pageSignal,
  getPanelHeight,
  scrollToPosition,
  clearHomeRoute,
  updateScrollTriggers,
  registerAnimation: (animation) => homeScrollAnimations.push(animation),
  registerTrigger: (trigger) => homeScrollTriggers.push(trigger)
});
const featuredSection = featuredController.section;
const identityController = initHomeIdentity({
  gsap,
  ScrollTrigger,
  reduceMotion,
  signal: pageSignal,
  getWorkTop,
  getPanelHeight,
  prepareTypeElement,
  fillTypeElement,
  typeElement,
  scrollToPosition,
  replaceRoute,
  updateScrollTriggers,
  registerAnimation: (animation) => homeScrollAnimations.push(animation),
  registerTrigger: (trigger) => homeScrollTriggers.push(trigger)
});
const { identity, identityStage } = identityController;

updateScrollGeometryCache = () => {
  cachedWorkTop = workSection?.offsetTop ?? Number.POSITIVE_INFINITY;
  cachedPanelHeight = introSection?.offsetHeight || window.innerHeight;
  featuredController.updateGeometry();
  identityController.updateGeometry();
};
const supportsLargeViewportHeight = typeof CSS !== "undefined" && CSS.supports?.("height", "100lvh") === true;
const shouldUseViewportHeightFallback = () => identityController.isMobileLayout() && !supportsLargeViewportHeight;
const getFallbackViewportHeight = () => Math.round(window.innerHeight);
const syncHomeViewportHeight = () => {
  if (!shouldUseViewportHeightFallback()) {
    if (lastSyncedViewportHeight !== 0) {
      document.documentElement.style.removeProperty("--home-viewport-height");
      lastSyncedViewportHeight = 0;
      return true;
    }
    return false;
  }

  const nextHeight = Math.max(1, getFallbackViewportHeight());
  if (Math.abs(nextHeight - lastSyncedViewportHeight) < 1) return false;

  lastSyncedViewportHeight = nextHeight;
  document.documentElement.style.setProperty("--home-viewport-height", `${nextHeight}px`);
  return true;
};

syncHomeViewportHeight();
updateScrollGeometryCache();
ScrollTrigger.addEventListener("refreshInit", updateScrollGeometryCache);
ScrollTrigger.addEventListener("refresh", updateScrollGeometryCache);

const scrollToIntroFromFloatingButton = () => {
  scrollToPosition(0, reduceMotion ? "auto" : "smooth");
  replaceRoute("/", { immediate: true });
};

scrollToTopHandler = scrollToIntroFromFloatingButton;
portfolioWindow.__portfolioScrollToTop = scrollToIntroFromFloatingButton;

const refreshHomeScrollLayout = (force = false) => {
  const viewportChanged = syncHomeViewportHeight();
  updateScrollGeometryCache();
  if (!force && !viewportChanged) return;

  featuredController.syncScrollHeight();
  updateScrollGeometryCache();
  identityController.queueTimelineFromScroll();
  portfolioWindow.__portfolioLenis?.resize?.();
  ScrollTrigger.update();

  if (viewportRefreshTimeout) {
    window.clearTimeout(viewportRefreshTimeout);
  }
  viewportRefreshTimeout = window.setTimeout(() => {
    syncHomeViewportHeight();
    featuredController.syncScrollHeight();
    updateScrollGeometryCache();
    identityController.queueTimelineFromScroll();
    portfolioWindow.__portfolioLenis?.resize?.();
    ScrollTrigger.refresh();
  }, 180);
};

const queueHomeScrollLayoutRefresh = (force = false) => {
  window.cancelAnimationFrame(viewportSyncFrame);
  viewportSyncFrame = window.requestAnimationFrame(() => refreshHomeScrollLayout(force));
};

if (identityStage) {
  homeScrollAnimations.push(gsap.fromTo(
    identityStage,
    { "--career-work-dim": 0 },
    {
      "--career-work-dim": 0.82,
      ease: "none",
      scrollTrigger: {
        trigger: "#work",
        start: "top bottom",
        end: "top top",
        scrub: true,
        invalidateOnRefresh: true
      }
    }
  ));
}

[
  introSection,
  identity,
  workSection,
  featuredSection,
  gallerySection
].forEach((panel) => {
  if (!panel) return;
  homeScrollTriggers.push(ScrollTrigger.create({
    trigger: panel,
    start: "top 55%",
    end: "bottom 45%",
    onEnter: () => panel.matches(".gallery-section") ? replaceRoute("/work") : clearHomeRoute(),
    onEnterBack: () => panel.matches(".gallery-section") ? replaceRoute("/work") : clearHomeRoute()
  }));
});

const scrollToInitialSection = () => {
  if (initialSection === "intro") return;

  if (shouldPreserveRestoredWorkScroll && window.scrollY > 0) {
    replaceRoute("/work", { immediate: true });
    updateScrollTriggers();
    return;
  }

  const identitySection = document.querySelector<HTMLElement>("[data-identity]");
  const targetTop =
    initialSection === "work"
      ? gallerySection?.offsetTop ?? workSection?.offsetTop
      : identitySection
        ? initialSection === "career"
          ? identityController.getCareerEntryTop()
          : identityController.getIdentityScrollForProgress(0.05)
        : 0;

  scrollToPosition(targetTop ?? 0, "auto");
  if (initialSection === "about") {
    identityController.playAboutIntro();
  }
  if (initialSection === "work") {
    replaceRoute("/work", { immediate: true });
  }
  if (initialSection === "career") {
    identityController.showCareerInitial();
  }
  updateScrollTriggers();
  if (initialSection === "work") {
    window.requestAnimationFrame(() => replaceRoute("/work", { immediate: true }));
  }
};

initialScrollFrame = window.requestAnimationFrame(() => {
  initialScrollTimeout = window.setTimeout(scrollToInitialSection, 120);
});

window.addEventListener("load", () => {
  refreshHomeScrollLayout(true);
}, { once: true, signal: pageSignal });
window.addEventListener("resize", () => {
  queueHomeScrollLayoutRefresh(true);
}, { signal: pageSignal });
window.visualViewport?.addEventListener("resize", () => queueHomeScrollLayoutRefresh(), { signal: pageSignal });
window.visualViewport?.addEventListener("scroll", () => queueHomeScrollLayoutRefresh(), { signal: pageSignal });
window.addEventListener("orientationchange", () => {
  window.setTimeout(() => refreshHomeScrollLayout(true), 260);
}, { signal: pageSignal });
window.setTimeout(() => refreshHomeScrollLayout(true), 250);

initHomeWorkSection({ gsap, signal: pageSignal });

};

let homeMotionIntentCleanup = () => {};

const loadHomeMotion = (intent: MotionIntent) => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!shouldLoadMotion({ route: window.location.pathname, reducedMotion, intent })) return;
  if (homeMotionPromise) return;

  document.dispatchEvent(new CustomEvent("portfolio:motion-intent"));
  homeMotionPromise = Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
    .then(([gsapModule, scrollTriggerModule]) => {
      gsap = gsapModule.default;
      ScrollTrigger = scrollTriggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      initHomePage();
    })
    .catch(() => {
      document.documentElement.classList.add("motion-load-failed");
      completeHomeLoader(true);
      homeMotionPromise = null;
    });
};

const prepareHomeMotion = () => {
  homeMotionIntentCleanup();
  const controller = new AbortController();
  const signal = controller.signal;
  const route = window.location.pathname;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reducedMotion) {
    completeHomeLoader(true);
    const target = getReducedMotionTarget(route);
    const identity = document.querySelector<HTMLElement>("[data-identity]");
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    document.documentElement.style.scrollBehavior = "auto";
    identity?.classList.toggle("is-career", target?.career ?? false);
    identity?.classList.toggle("is-career-list", target?.career ?? false);
    const jumpToReducedMotionTarget = () => {
      if (target) {
        const targetElement = document.querySelector<HTMLElement>(target.selector);
        if (targetElement) window.scrollTo(0, targetElement.offsetTop);
      } else if (route === "/") {
        window.scrollTo(0, 0);
      }
    };
    window.requestAnimationFrame(jumpToReducedMotionTarget);
    window.setTimeout(jumpToReducedMotionTarget, 100);
  }

  if (shouldLoadMotion({ route, reducedMotion, intent: "initial" })) {
    loadHomeMotion("initial");
  } else if (!reducedMotion && route === "/") {
    window.addEventListener("wheel", () => loadHomeMotion("wheel"), { once: true, passive: true, signal });
    window.addEventListener("touchstart", () => loadHomeMotion("touch"), { once: true, passive: true, signal });
    window.addEventListener("keydown", (event) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
        loadHomeMotion("keyboard");
      }
    }, { signal });
    const idleTimer = window.setTimeout(() => loadHomeMotion("idle"), 1500);
    homeMotionIntentCleanup = () => {
      controller.abort();
      window.clearTimeout(idleTimer);
    };
    return;
  }

  homeMotionIntentCleanup = () => controller.abort();
};

document.addEventListener("astro:before-swap", () => {
  homeMotionIntentCleanup();
  cleanupHomePage();
  homeMotionPromise = null;
  document.documentElement.style.removeProperty("scroll-behavior");
});
document.addEventListener("astro:page-load", prepareHomeMotion);
prepareHomeMotion();
