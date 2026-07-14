import { getRovingTabIndex } from "../lib/keyboard-navigation";
import { getReducedMotionTarget, shouldLoadMotion, type MotionIntent } from "../lib/motion-loader";

type GsapModule = typeof import("gsap").default;
type ScrollTriggerModule = typeof import("gsap/ScrollTrigger").ScrollTrigger;
let gsap: GsapModule;
let ScrollTrigger: ScrollTriggerModule;
let homeMotionPromise: Promise<void> | null = null;

let activeHomeShell: HTMLElement | null = null;
let cleanupHomePage = () => {};

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
  const homeScrollTriggers: ScrollTrigger[] = [];
  const homeScrollAnimations: gsap.core.Animation[] = [];
  let initialScrollFrame = 0;
  let initialScrollTimeout = 0;
  let featuredBlurTimeout = 0;
  let viewportSyncFrame = 0;
  let viewportRefreshTimeout = 0;
  let timelineScrollFrame = 0;
  let lastSyncedViewportHeight = 0;
  let currentIdentityMode: "about" | "career" | null = null;
  let currentCareerListVisible: boolean | null = null;
  let deferredImageObserver: IntersectionObserver | null = null;
  let activeTimelineIndex = -1;
  let activeFeaturedIndex = -1;
  let identityProgressTrigger: ScrollTrigger | null = null;
  let updateScrollGeometryCache = () => {};
  let cachedIdentityTop = Number.POSITIVE_INFINITY;
  let cachedWorkTop = Number.POSITIVE_INFINITY;
  let cachedFeaturedTop = Number.POSITIVE_INFINITY;
  let cachedPanelHeight = window.innerHeight;
  let cachedStickyStageHeight = window.innerHeight;
  let cachedTimelineMaxOffset = 0;
  let cachedTimelineCardProgresses: number[] = [];
  let routeDebounceTimeout = 0;
  let pendingRoute: string | null = null;
  const typewriterTimers: number[] = [];
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
    if (featuredBlurTimeout) {
      window.clearTimeout(featuredBlurTimeout);
    }
    window.cancelAnimationFrame(viewportSyncFrame);
    if (viewportRefreshTimeout) {
      window.clearTimeout(viewportRefreshTimeout);
    }
    window.cancelAnimationFrame(timelineScrollFrame);
    if (routeDebounceTimeout) {
      window.clearTimeout(routeDebounceTimeout);
    }
    typewriterTimers.forEach((timer) => window.clearTimeout(timer));
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

const typeText = (target: HTMLElement, value: string, speed = 58, done?: () => void) => {
  target.textContent = "";
  const chars = value.split("");
  chars.forEach((char, index) => {
    const timer = window.setTimeout(() => {
      target.textContent += char;
      if (index === chars.length - 1) done?.();
    }, speed * index);
    typewriterTimers.push(timer);
  });
};

const textCopies = new Map<HTMLElement, { node: Text; text: string }[]>();
let typeRunCounter = 0;

const prepareTypeElement = (element: HTMLElement | null) => {
  if (!element || textCopies.has(element)) return;

  const copies: { node: Text; text: string }[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => node.textContent?.trim()
      ? NodeFilter.FILTER_ACCEPT
      : NodeFilter.FILTER_REJECT
  });

  let node = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    copies.push({ node: textNode, text: textNode.textContent ?? "" });
    node = walker.nextNode();
  }

  textCopies.set(element, copies);
  copies.forEach(({ node: textNode }) => {
    textNode.textContent = "";
  });
  element.dataset.typed = "false";
};

const fillTypeElement = (element: HTMLElement | null) => {
  if (!element) return;
  const copies = textCopies.get(element);
  if (!copies) return;

  copies.forEach(({ node: textNode, text }) => {
    textNode.textContent = text;
  });
  element.dataset.typeRun = String(++typeRunCounter);
  element.dataset.typed = "true";
};

const typeElement = (element: HTMLElement | null, speed = 24) => {
  if (!element || element.dataset.typed === "true") return;

  const copies = textCopies.get(element);
  if (!copies) return;

  if (speed <= 0) {
    fillTypeElement(element);
    return;
  }

  element.dataset.typed = "true";
  const runId = String(++typeRunCounter);
  element.dataset.typeRun = runId;
  let cursor = 0;
  copies.forEach(({ node: textNode, text }) => {
    textNode.textContent = "";
    text.split("").forEach((_, charIndex) => {
      const timer = window.setTimeout(() => {
        if (element.dataset.typeRun !== runId) return;
        textNode.textContent = text.slice(0, charIndex + 1);
      }, cursor * speed);
      typewriterTimers.push(timer);
      cursor += 1;
    });
  });
};

const introLogo = document.querySelector<HTMLElement>(".intro-logo");
const introTypeTarget = document.querySelector<HTMLElement>("[data-intro-typewriter]");

if (introTypeTarget && !reduceMotion) {
  const phrase = introTypeTarget.dataset.introTypewriter ?? introTypeTarget.textContent ?? "";
  introTypeTarget.textContent = "";
  gsap.set(introLogo, { filter: "blur(18px)", scale: 0.94 });
  gsap.to(introLogo, { filter: "blur(0px)", scale: 1, duration: 1.45, ease: "power3.out" });
  gsap.delayedCall(1, () => {
    typeText(introTypeTarget, phrase, 64, () => {
      document.documentElement.classList.add("intro-complete");
    });
  });
} else {
  document.documentElement.classList.add("intro-complete");
}

const aboutCopy = document.querySelector<HTMLElement>('[data-type-copy="about"]');
const careerCopy = document.querySelector<HTMLElement>('[data-type-copy="career"]');
const introSection = document.querySelector<HTMLElement>(".intro-section");
const identity = document.querySelector<HTMLElement>("[data-identity]");
const workSection = document.querySelector<HTMLElement>("#work");
const profileLogo = document.querySelector<HTMLElement>(".profile-logo");
const profileContact = document.querySelector<HTMLElement>("[data-profile-contact]");
const profileMedia = document.querySelector<HTMLElement>("[data-profile-media]");
const identityStage = document.querySelector<HTMLElement>(".identity-stage");
const careerList = document.querySelector<HTMLElement>("[data-career-list]");
const timelineTrack = document.querySelector<HTMLElement>("[data-timeline-track]");
const timelineCards = Array.from(document.querySelectorAll<HTMLElement>("[data-timeline-card]"));
const featuredPanels = gsap.utils.toArray<HTMLElement>("[data-featured-panel]");
const featuredDots = gsap.utils.toArray<HTMLElement>("[data-featured-dot]");
const featuredStage = document.querySelector<HTMLElement>(".featured-stage");
const featuredSection = document.querySelector<HTMLElement>("#featured-work:not(.is-empty)");
const gallerySection = document.querySelector<HTMLElement>(".gallery-section");
const mobileIdentityQuery = window.matchMedia("(max-width: 1180px)");

const isMobileIdentityLayout = () => mobileIdentityQuery.matches;
updateScrollGeometryCache = () => {
  cachedIdentityTop = identity?.offsetTop ?? Number.POSITIVE_INFINITY;
  cachedWorkTop = workSection?.offsetTop ?? Number.POSITIVE_INFINITY;
  cachedFeaturedTop = featuredSection?.offsetTop ?? Number.POSITIVE_INFINITY;
  cachedPanelHeight = introSection?.offsetHeight || window.innerHeight;
  cachedStickyStageHeight = identityStage?.offsetHeight || window.innerHeight;
  cachedTimelineMaxOffset = Math.max(0, (timelineTrack?.scrollHeight ?? 0) - (careerList?.clientHeight ?? 0));
  const cardCount = timelineCards.length;
  const viewportCenter = (careerList?.clientHeight ?? 0) / 2;
  const maxOffset = Math.max(1, cachedTimelineMaxOffset);

  cachedTimelineCardProgresses = timelineCards.map((card, index) => {
    if (cardCount <= 1) return 0;
    if (!careerList || cachedTimelineMaxOffset <= 0) {
      return index / Math.max(1, cardCount - 1);
    }

    const cardCenter = card.offsetTop + card.offsetHeight / 2;
    const centeredOffset = gsap.utils.clamp(0, cachedTimelineMaxOffset, cardCenter - viewportCenter);
    return gsap.utils.clamp(0, 1, centeredOffset / maxOffset);
  });
};
const supportsLargeViewportHeight = typeof CSS !== "undefined" && CSS.supports?.("height", "100lvh") === true;
const shouldUseViewportHeightFallback = () => isMobileIdentityLayout() && !supportsLargeViewportHeight;
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

const setCareerListStage = (visible: boolean, immediate = false) => {
  if (!immediate && currentCareerListVisible === visible) return;

  currentCareerListVisible = visible;
  identity?.classList.toggle("is-career-list", visible);
};

let aboutIntroTimeline: gsap.core.Timeline | null = null;
let identityTransitionTimeline: gsap.core.Timeline | null = null;

if (!reduceMotion) {
  prepareTypeElement(aboutCopy);
  prepareTypeElement(careerCopy);
  fillTypeElement(careerCopy);
  gsap.set(profileLogo, { autoAlpha: 0, y: 18, filter: "brightness(0) blur(12px)" });
  gsap.set(profileContact, { autoAlpha: 0, y: 24, filter: "blur(8px)" });
  gsap.set(profileMedia, {
    "--profile-career-dim": 0,
    "--profile-media-brightness": 1,
    "--profile-media-contrast": 1,
    "--profile-media-enter-blur": "0px",
    "--profile-media-grayscale": 0,
    autoAlpha: 1,
    clipPath: "inset(0% 0% 0% 0%)",
    scale: 1
  });
  gsap.set(aboutCopy, { autoAlpha: 0, y: 18, filter: "blur(8px)" });
  gsap.set(careerCopy, { autoAlpha: 0, y: 24, filter: "blur(8px)" });
  gsap.set(careerList, { autoAlpha: 0, x: 32, yPercent: -50, filter: "blur(10px)" });
  setCareerListStage(false, true);
  identityTransitionTimeline = gsap.timeline({ paused: true, defaults: { ease: "none", overwrite: "auto" } });
  identityTransitionTimeline
    .fromTo(aboutCopy,
      { autoAlpha: 1, y: 0, filter: "blur(0px)" },
      { autoAlpha: 0, y: -24, filter: "blur(8px)", duration: 0.58 },
      0
    )
    .fromTo(profileContact,
      { autoAlpha: 1, y: 0, filter: "blur(0px)" },
      { autoAlpha: 0, y: 20, filter: "blur(8px)", duration: 0.5 },
      0
    )
    .fromTo(profileMedia,
      {
        "--profile-career-dim": 0,
        "--profile-media-brightness": 1,
        "--profile-media-contrast": 1,
        "--profile-media-enter-blur": "0px",
        "--profile-media-grayscale": 0,
        autoAlpha: 1,
        scale: 1
      },
      {
        "--profile-career-dim": 0,
        "--profile-media-brightness": 0.62,
        "--profile-media-contrast": 1.12,
        "--profile-media-enter-blur": "3px",
        "--profile-media-grayscale": 0.45,
        autoAlpha: 1,
        scale: 1.04,
        duration: 0.72
      },
      0
    )
    .fromTo(careerCopy,
      { autoAlpha: 0, y: 24, filter: "blur(8px)" },
      { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.58 },
      0.18
    )
    .fromTo(careerList,
      { autoAlpha: 0, x: 32, yPercent: -50, filter: "blur(10px)" },
      { autoAlpha: 1, x: 0, yPercent: -50, filter: "blur(0px)", duration: 0.46 },
      0.54
    );
  homeScrollAnimations.push(identityTransitionTimeline);
  currentIdentityMode = "about";
} else {
  currentIdentityMode = "about";
}

const playAboutIntro = () => {
  if (!identity || !aboutCopy || reduceMotion) return;
  if (identity.dataset.aboutPlayed === "true") return;

  identity.dataset.aboutPlayed = "true";
  aboutIntroTimeline?.kill();
  aboutIntroTimeline = gsap.timeline({ defaults: { ease: "power3.out", overwrite: "auto" } });
  aboutIntroTimeline
    .to(profileLogo, { autoAlpha: 1, y: 0, filter: "brightness(0) blur(0px)", duration: 0.72 }, 0)
    .add(() => typeElement(aboutCopy, 24), 0.14)
    .to(profileContact, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.62 }, 0.42)
    .to(aboutCopy, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.48 }, 0.16);
  homeScrollAnimations.push(aboutIntroTimeline);
};

const setActiveTimeline = (index: number) => {
  const nextIndex = timelineCards.length
    ? Math.min(timelineCards.length - 1, Math.max(0, index))
    : -1;

  if (nextIndex === activeTimelineIndex) return;

  activeTimelineIndex = nextIndex;
  timelineCards.forEach((card, cardIndex) => {
    const isActive = cardIndex === nextIndex;
    card.classList.toggle("is-active", isActive);
    card.dataset.focusDistance = String(Math.min(3, Math.abs(cardIndex - nextIndex)));
    if (isActive) {
      card.setAttribute("aria-current", "step");
    } else {
      card.removeAttribute("aria-current");
    }
  });
};

const setIdentityMode = (mode: "about" | "career") => {
  if (!identity) return;
  const isCareer = mode === "career";
  if (currentIdentityMode !== mode) {
    currentIdentityMode = mode;
    identity.classList.toggle("is-career", isCareer);
    if (!isCareer) {
      identity.classList.remove("is-career-list");
      identity.dataset.aboutPlayed = "true";
    }
  }
};

const aboutHoldEndProgress = 0.09;
const careerStartProgress = 0.29;
const mobileCareerListStartProgress = careerStartProgress + aboutHoldEndProgress;
const getCareerTransitionProgress = (identityProgress: number) => (
  gsap.utils.clamp(
    0,
    1,
    (identityProgress - aboutHoldEndProgress) / Math.max(0.001, careerStartProgress - aboutHoldEndProgress)
  )
);

const setActiveFeatured = (activeIndex: number) => {
  const nextIndex = featuredPanels.length
    ? Math.min(featuredPanels.length - 1, Math.max(0, activeIndex))
    : -1;

  if (nextIndex === activeFeaturedIndex) return;

  activeFeaturedIndex = nextIndex;
  featuredPanels.forEach((panel, index) => {
    panel.classList.toggle("is-active", index === nextIndex);
    panel.setAttribute("aria-hidden", index === nextIndex ? "false" : "true");
    panel.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
      if (index === nextIndex) {
        link.removeAttribute("tabindex");
      } else {
        link.setAttribute("tabindex", "-1");
      }
    });
  });
  featuredDots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === nextIndex);
    dot.setAttribute("aria-pressed", index === nextIndex ? "true" : "false");
  });
};

const getIdentityTop = () => cachedIdentityTop;
const getWorkTop = () => cachedWorkTop;
const getFeaturedTop = () => cachedFeaturedTop;
const getPanelHeight = () => cachedPanelHeight;
const getStickyStageHeight = () => cachedStickyStageHeight;
const getIdentityProgressRange = () => Math.max(1, getWorkTop() - getIdentityTop() - getStickyStageHeight());
const getIdentityScrollForProgress = (progress: number) => {
  const clampedProgress = gsap.utils.clamp(0, 1, progress);

  if (identityProgressTrigger) {
    return identityProgressTrigger.start + (identityProgressTrigger.end - identityProgressTrigger.start) * clampedProgress;
  }

  return getIdentityTop() + getIdentityProgressRange() * clampedProgress;
};
const getCareerEntryTop = () => getCareerTimelineScrollForProgress(isMobileIdentityLayout() ? mobileCareerListStartProgress : careerStartProgress);
const getCareerTimelineScrollForProgress = (progress: number) => {
  const clampedProgress = gsap.utils.clamp(0, 1, progress);
  const totalHeight = Math.max(1, getWorkTop() - getIdentityTop());
  const panelHeight = getPanelHeight();
  const maxTimelineTravel = Math.max(1, totalHeight - panelHeight * 0.3);
  return getIdentityTop() + maxTimelineTravel * clampedProgress;
};
const getCareerTimelineStartProgress = () => isMobileIdentityLayout() ? mobileCareerListStartProgress : careerStartProgress;
const getCareerTimelineStartTop = () => getCareerTimelineScrollForProgress(getCareerTimelineStartProgress());
const getWorkRevealTop = () => getWorkTop() - getPanelHeight();
const getCareerTimelineTravel = () => {
  const count = Math.max(1, timelineCards.length);
  const startTop = getCareerTimelineStartTop();
  const availableBeforeWork = Math.max(1, getWorkRevealTop() - startTop);

  if (count <= 1) return availableBeforeWork;

  // Leave two item-step distances after the final Career point before Work starts to cover it.
  return Math.max(1, availableBeforeWork * ((count - 1) / (count + 1)));
};
const getCareerTimelineEndTop = () => getCareerTimelineStartTop() + getCareerTimelineTravel();
const getCareerPointProgress = (index: number) => {
  const count = Math.max(1, timelineCards.length);
  if (count <= 1) return 0;
  const clampedIndex = Math.min(count - 1, Math.max(0, index));
  return cachedTimelineCardProgresses[clampedIndex] ?? gsap.utils.clamp(0, 1, clampedIndex / (count - 1));
};
const getCareerPointFocusWeight = (progress: number, cardProgress: number, count: number) => {
  if (count <= 1) return 1;
  const focusRange = 1 / Math.max(1, count - 1) * 1.15;
  return gsap.utils.clamp(0, 1, 1 - Math.abs(progress - cardProgress) / focusRange);
};
const getCareerPointTop = (index: number) => {
  return getCareerTimelineStartTop() + getCareerTimelineTravel() * getCareerPointProgress(index);
};
const renderCareerTimelineProgress = (timelineProgress: number) => {
  if (reduceMotion || !timelineCards.length || !timelineTrack || !careerList) return;
  const progress = gsap.utils.clamp(0, 1, timelineProgress);
  const count = timelineCards.length;
  const progressSlots = Math.max(1, count - 1);
  let bestIndex = 0;
  let bestWeight = -1;
  let bestDiff = Number.POSITIVE_INFINITY;

  careerList.style.setProperty("--timeline-focus-offset", `${(cachedTimelineMaxOffset * progress).toFixed(2)}px`);

  timelineCards.forEach((card, index) => {
    const cardProgress = cachedTimelineCardProgresses[index] ?? (count <= 1 ? 0 : index / progressSlots);
    const diff = Math.abs(progress - cardProgress);
    const focusWeight = getCareerPointFocusWeight(progress, cardProgress, count);
    const opacity = 0.2 + 0.8 * focusWeight;
    const scale = 0.97 + 0.03 * focusWeight;
    const detailOffset = (1 - focusWeight) * 8;
    const detailRow = `${focusWeight.toFixed(3)}fr`;
    const dotScale = 0.6667 + 0.3333 * focusWeight;

    if (focusWeight > bestWeight || (focusWeight === bestWeight && diff < bestDiff)) {
      bestWeight = focusWeight;
      bestDiff = diff;
      bestIndex = index;
    }

    card.style.setProperty("--timeline-card-opacity", opacity.toFixed(3));
    card.style.setProperty("--timeline-card-scale", scale.toFixed(3));
    card.style.setProperty("--timeline-detail-opacity", focusWeight.toFixed(3));
    card.style.setProperty("--timeline-detail-y", `${detailOffset.toFixed(2)}px`);
    card.style.setProperty("--timeline-detail-row", detailRow);
    card.style.setProperty("--timeline-dot-scale", dotScale.toFixed(3));
    card.style.setProperty("--timeline-dot-accent-opacity", focusWeight.toFixed(3));
  });

  setActiveTimeline(bestIndex);
};
const syncCareerTimelineProgress = () => {
  const startTop = getCareerTimelineStartTop();
  const endTop = getCareerTimelineEndTop();
  const rawProgress = (window.scrollY - startTop) / Math.max(1, endTop - startTop);

  renderCareerTimelineProgress(rawProgress);
};
const syncCareerTimelineFromScroll = () => {
  syncCareerTimelineProgress();
};
const queueCareerTimelineFromScroll = () => {
  window.cancelAnimationFrame(timelineScrollFrame);
  timelineScrollFrame = window.requestAnimationFrame(syncCareerTimelineFromScroll);
};
const getFeaturedIndexTop = (index: number) => {
  const count = Math.max(1, featuredPanels.length);
  const clampedIndex = gsap.utils.clamp(0, count - 1, index);
  return getFeaturedTop() + getPanelHeight() * clampedIndex;
};

if (identity && !reduceMotion) {
  homeScrollTriggers.push(ScrollTrigger.create({
    trigger: identity,
    start: "top 65%",
    onEnter: playAboutIntro,
    onEnterBack: playAboutIntro
  }));

  identityProgressTrigger = ScrollTrigger.create({
    trigger: identity,
    start: "top top",
    end: () => `bottom-=${window.innerHeight * 3}px bottom`,
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const mobileIdentity = isMobileIdentityLayout();
      const careerTransitionProgress = getCareerTransitionProgress(self.progress);
      if (careerTransitionProgress > 0.001) {
        fillTypeElement(aboutCopy);
        aboutIntroTimeline?.kill();
        aboutIntroTimeline = null;
      }
      identityTransitionTimeline?.progress(careerTransitionProgress);
      const showCareer = careerTransitionProgress >= 0.5;
      const showCareerList = showCareer && (!mobileIdentity || self.progress >= mobileCareerListStartProgress);
      setIdentityMode(showCareer ? "career" : "about");
      setCareerListStage(showCareerList);
    }
  });
  homeScrollTriggers.push(identityProgressTrigger);

  if (timelineCards.length) {
    homeScrollTriggers.push(ScrollTrigger.create({
      trigger: identity,
      start: () => getCareerTimelineStartTop(),
      end: () => getCareerTimelineEndTop(),
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => renderCareerTimelineProgress(self.progress),
      onLeave: () => renderCareerTimelineProgress(1),
      onLeaveBack: () => renderCareerTimelineProgress(0)
    }));
  }
}

featuredDots.forEach((dot) => {
  dot.addEventListener("click", () => {
    const targetIndex = Number(dot.dataset.featuredTarget ?? 0);
    featuredStage?.classList.add("is-dot-jumping");
    scrollToPosition(getFeaturedIndexTop(targetIndex), "auto");
    setActiveFeatured(targetIndex);
    clearHomeRoute();
    updateScrollTriggers();

    if (featuredBlurTimeout) {
      window.clearTimeout(featuredBlurTimeout);
    }
    featuredBlurTimeout = window.setTimeout(() => {
      featuredStage?.classList.remove("is-dot-jumping");
    }, reduceMotion ? 0 : 180);
  }, { signal: pageSignal });
});

const jumpToCareerPoint = (index: number) => {
  if (!Number.isFinite(index) || index < 0 || index >= timelineCards.length) return;

  setIdentityMode("career");
  setCareerListStage(true);
  setActiveTimeline(index);
  scrollToPosition(getCareerPointTop(index), reduceMotion ? "auto" : "smooth", () => {
    setActiveTimeline(index);
    syncCareerTimelineProgress();
    updateScrollTriggers();
  });
  replaceRoute("/career", { immediate: true });
};

timelineCards.forEach((card, index) => {
  card.addEventListener("click", () => jumpToCareerPoint(index), { signal: pageSignal });
});

const scrollToIntroFromFloatingButton = () => {
  scrollToPosition(0, reduceMotion ? "auto" : "smooth");
  replaceRoute("/", { immediate: true });
};

scrollToTopHandler = scrollToIntroFromFloatingButton;
portfolioWindow.__portfolioScrollToTop = scrollToIntroFromFloatingButton;

const syncFeaturedScrollHeight = () => {
  if (!featuredSection) return;
  featuredSection.style.setProperty("--featured-scroll-height", `${(Math.max(1, featuredPanels.length) + 2) * getPanelHeight()}px`);
};

const refreshHomeScrollLayout = (force = false) => {
  const viewportChanged = syncHomeViewportHeight();
  updateScrollGeometryCache();
  if (!force && !viewportChanged) return;

  syncFeaturedScrollHeight();
  updateScrollGeometryCache();
  queueCareerTimelineFromScroll();
  portfolioWindow.__portfolioLenis?.resize?.();
  ScrollTrigger.update();

  if (viewportRefreshTimeout) {
    window.clearTimeout(viewportRefreshTimeout);
  }
  viewportRefreshTimeout = window.setTimeout(() => {
    syncHomeViewportHeight();
    syncFeaturedScrollHeight();
    updateScrollGeometryCache();
    queueCareerTimelineFromScroll();
    portfolioWindow.__portfolioLenis?.resize?.();
    ScrollTrigger.refresh();
  }, 180);
};

const queueHomeScrollLayoutRefresh = (force = false) => {
  window.cancelAnimationFrame(viewportSyncFrame);
  viewportSyncFrame = window.requestAnimationFrame(() => refreshHomeScrollLayout(force));
};

syncFeaturedScrollHeight();

setActiveTimeline(0);
syncCareerTimelineProgress();
setActiveFeatured(0);

if (featuredSection && featuredPanels.length) {
  homeScrollTriggers.push(ScrollTrigger.create({
    trigger: featuredSection,
    start: "top top",
    end: () => `bottom-=${getPanelHeight() * 2}px bottom`,
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const progress = gsap.utils.clamp(0, 0.999999, self.progress);
      const index = Math.min(featuredPanels.length - 1, Math.floor(progress * featuredPanels.length));
      setActiveFeatured(index);
    }
  }));
}

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

if (featuredStage && gallerySection) {
  homeScrollAnimations.push(gsap.fromTo(
    featuredStage,
    { "--featured-gallery-dim": 0 },
    {
      "--featured-gallery-dim": 0.86,
      ease: "none",
      scrollTrigger: {
        trigger: gallerySection,
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
          ? getCareerEntryTop()
          : getIdentityScrollForProgress(0.05)
        : 0;

  scrollToPosition(targetTop ?? 0, "auto");
  if (initialSection === "about") {
    playAboutIntro();
  }
  if (initialSection === "work") {
    replaceRoute("/work", { immediate: true });
  }
  if (initialSection === "career") {
    setCareerListStage(!isMobileIdentityLayout(), true);
    setIdentityMode("career");
    setActiveTimeline(0);
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

const updateFeaturedContrast = () => {
  document.querySelectorAll<HTMLElement>(".featured-work").forEach((card) => {
    const img = card.querySelector<HTMLImageElement>(".work-visual img");
    if (!img) {
      card.dataset.textTone = "light";
      return;
    }

    const sampleImage = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;

        context.drawImage(img, 0, 0, size, size);
        const pixels = context.getImageData(0, 0, size, size).data;
        let total = 0;
        let count = 0;

        for (let index = 0; index < pixels.length; index += 4) {
          const alpha = pixels[index + 3] / 255;
          if (alpha < 0.2) continue;
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          total += (0.2126 * red + 0.7152 * green + 0.0722 * blue) * alpha;
          count += alpha;
        }

        const luminance = count ? total / count : 0;
        card.dataset.textTone = luminance > 148 ? "dark" : "light";
      } catch {
        card.dataset.textTone = "light";
      }
    };

    if (img.complete && img.naturalWidth) {
      sampleImage();
    } else {
      img.addEventListener("load", sampleImage, { once: true, signal: pageSignal });
      img.addEventListener("error", () => {
        card.dataset.textTone = "light";
      }, { once: true, signal: pageSignal });
    }
  });
};

updateFeaturedContrast();

const filterButtons = document.querySelectorAll<HTMLButtonElement>("[data-filter]");
const galleryPanel = document.querySelector<HTMLElement>("#work-gallery-grid");
const galleryStatus = document.querySelector<HTMLElement>("[data-gallery-status]");
const tiles = Array.from(document.querySelectorAll<HTMLElement>("[data-category]"));

const animateGalleryFilter = (filter: string) => {
  const previousRects = new Map<HTMLElement, DOMRect>();

  tiles.forEach((tile) => {
    if (!tile.hidden) {
      previousRects.set(tile, tile.getBoundingClientRect());
    }
  });

  const matchesFilter = (tile: HTMLElement) => {
    const categories = (tile.dataset.category ?? "").split(",").map((category) => category.trim());
    return filter === "ALL" || categories.includes(filter);
  };

  const exitingTiles = tiles.filter((tile) => !tile.hidden && !matchesFilter(tile));

  exitingTiles.forEach((tile) => {
    const rect = tile.getBoundingClientRect();
    const clone = tile.cloneNode(true) as HTMLElement;
    clone.classList.add("gallery-filter-clone");
    Object.assign(clone.style, {
      position: "fixed",
      left: "0",
      top: "0",
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      margin: "0",
      zIndex: "20",
      pointerEvents: "none",
      willChange: "transform, opacity"
    });
    document.body.appendChild(clone);
    gsap.set(clone, { x: rect.left, y: rect.top, force3D: true });
    gsap.to(clone, {
      autoAlpha: 0,
      scale: 0.96,
      y: rect.top + 10,
      duration: 0.32,
      ease: "power2.out",
      onComplete: () => clone.remove()
    });
  });

  tiles.forEach((tile) => {
    const shouldShow = matchesFilter(tile);
    tile.hidden = !shouldShow;

    if (shouldShow && !previousRects.has(tile)) {
      gsap.set(tile, { autoAlpha: 0, scale: 0.97, y: 14 });
    }
  });

  tiles.forEach((tile) => {
    if (tile.hidden) return;

    const previousRect = previousRects.get(tile);
    const nextRect = tile.getBoundingClientRect();

    if (previousRect) {
      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;

      if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
        gsap.fromTo(
          tile,
          { x: deltaX, y: deltaY },
          { x: 0, y: 0, duration: 0.48, ease: "power3.out", overwrite: true }
        );
      }
    } else {
      gsap.to(tile, { autoAlpha: 1, scale: 1, y: 0, duration: 0.42, ease: "power3.out", overwrite: true });
    }
  });
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter ?? "ALL";
    if (button.classList.contains("is-active")) return;

    filterButtons.forEach((item) => {
      const isSelected = item === button;
      item.classList.toggle("is-active", isSelected);
      item.setAttribute("aria-selected", isSelected ? "true" : "false");
      item.tabIndex = isSelected ? 0 : -1;
    });
    if (button.id) {
      galleryPanel?.setAttribute("aria-labelledby", button.id);
    }
    animateGalleryFilter(filter);
    const visibleCount = tiles.filter((tile) => !tile.hidden).length;
    if (galleryStatus) {
      galleryStatus.textContent = `${filter === "ALL" ? "전체" : filter} 작업물 ${visibleCount}개`;
    }
  }, { signal: pageSignal });

  button.addEventListener("keydown", (event) => {
    const currentIndex = Array.from(filterButtons).indexOf(button);
    const nextIndex = getRovingTabIndex(currentIndex, event.key, filterButtons.length);
    if (nextIndex === null) return;

    event.preventDefault();
    const nextButton = filterButtons[nextIndex];
    nextButton?.focus();
    nextButton?.click();
  }, { signal: pageSignal });
});

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
