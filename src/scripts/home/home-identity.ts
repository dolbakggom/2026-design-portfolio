type GsapModule = typeof import("gsap").default;
type ScrollTriggerModule = typeof import("gsap/ScrollTrigger").ScrollTrigger;
type ScrollTriggerInstance = ReturnType<ScrollTriggerModule["create"]>;
type GsapTimeline = ReturnType<GsapModule["timeline"]>;

type IdentityControllerOptions = {
  gsap: GsapModule;
  ScrollTrigger: ScrollTriggerModule;
  reduceMotion: boolean;
  signal: AbortSignal;
  getWorkTop: () => number;
  getPanelHeight: () => number;
  prepareTypeElement: (element: HTMLElement | null) => void;
  fillTypeElement: (element: HTMLElement | null) => void;
  typeElement: (element: HTMLElement | null, speed?: number) => void;
  scrollToPosition: (top: number, mode?: "auto" | "smooth", onComplete?: () => void) => void;
  replaceRoute: (route: string, options?: { immediate?: boolean }) => void;
  updateScrollTriggers: () => void;
  registerAnimation: (animation: GsapTimeline) => void;
  registerTrigger: (trigger: ScrollTriggerInstance) => void;
};

export const initHomeIdentity = ({
  gsap,
  ScrollTrigger,
  reduceMotion,
  signal,
  getWorkTop,
  getPanelHeight,
  prepareTypeElement,
  fillTypeElement,
  typeElement,
  scrollToPosition,
  replaceRoute,
  updateScrollTriggers,
  registerAnimation,
  registerTrigger
}: IdentityControllerOptions) => {
  const aboutCopy = document.querySelector<HTMLElement>('[data-type-copy="about"]');
  const careerCopy = document.querySelector<HTMLElement>('[data-type-copy="career"]');
  const identity = document.querySelector<HTMLElement>("[data-identity]");
  const profileLogo = document.querySelector<HTMLElement>(".profile-logo");
  const profileContact = document.querySelector<HTMLElement>("[data-profile-contact]");
  const profileMedia = document.querySelector<HTMLElement>("[data-profile-media]");
  const identityStage = document.querySelector<HTMLElement>(".identity-stage");
  const careerList = document.querySelector<HTMLElement>("[data-career-list]");
  const timelineTrack = document.querySelector<HTMLElement>("[data-timeline-track]");
  const timelineCards = Array.from(document.querySelectorAll<HTMLElement>("[data-timeline-card]"));
  const mobileIdentityQuery = window.matchMedia("(max-width: 1180px)");

  let currentMode: "about" | "career" | null = null;
  let currentCareerListVisible: boolean | null = null;
  let activeTimelineIndex = -1;
  let progressTrigger: ScrollTriggerInstance | null = null;
  let aboutIntroTimeline: GsapTimeline | null = null;
  let transitionTimeline: GsapTimeline | null = null;
  let timelineScrollFrame = 0;
  let cachedIdentityTop = Number.POSITIVE_INFINITY;
  let cachedStickyStageHeight = window.innerHeight;
  let cachedTimelineMaxOffset = 0;
  let cachedTimelineCardProgresses: number[] = [];

  const isMobileLayout = () => mobileIdentityQuery.matches;

  const updateGeometry = () => {
    cachedIdentityTop = identity?.offsetTop ?? Number.POSITIVE_INFINITY;
    cachedStickyStageHeight = identityStage?.offsetHeight || window.innerHeight;
    const timelineViewportHeight = careerList?.clientHeight ?? 0;
    const getExpandedCardHeight = (card: HTMLElement | undefined) => {
      if (!card) return 0;
      const titleHeight = card.querySelector<HTMLElement>("p")?.offsetHeight ?? 0;
      const detailHeight = card.querySelector<HTMLElement>(".timeline-card-details-inner")?.scrollHeight ?? 0;
      return Math.max(card.offsetHeight, titleHeight + detailHeight);
    };
    const firstCardHeight = getExpandedCardHeight(timelineCards[0]);
    const lastCardHeight = getExpandedCardHeight(timelineCards.at(-1));
    timelineTrack?.style.setProperty("--timeline-start-padding", `${Math.max(0, timelineViewportHeight / 2 - firstCardHeight / 2).toFixed(2)}px`);
    timelineTrack?.style.setProperty("--timeline-end-padding", `${Math.max(0, timelineViewportHeight / 2 - lastCardHeight / 2).toFixed(2)}px`);
    cachedTimelineMaxOffset = Math.max(0, (timelineTrack?.scrollHeight ?? 0) - (careerList?.clientHeight ?? 0));
    const cardCount = timelineCards.length;
    const viewportCenter = (careerList?.clientHeight ?? 0) / 2;
    const maxOffset = Math.max(1, cachedTimelineMaxOffset);

    cachedTimelineCardProgresses = timelineCards.map((card, index) => {
      if (cardCount <= 1) return 0;
      if (!careerList || cachedTimelineMaxOffset <= 0) return index / Math.max(1, cardCount - 1);

      const cardCenter = card.offsetTop + card.offsetHeight / 2;
      const centeredOffset = gsap.utils.clamp(0, cachedTimelineMaxOffset, cardCenter - viewportCenter);
      return gsap.utils.clamp(0, 1, centeredOffset / maxOffset);
    });
  };

  const setCareerListStage = (visible: boolean, immediate = false) => {
    if (!immediate && currentCareerListVisible === visible) return;
    currentCareerListVisible = visible;
    identity?.classList.toggle("is-career-list", visible);
  };

  const setActiveTimeline = (index: number) => {
    const nextIndex = timelineCards.length ? Math.min(timelineCards.length - 1, Math.max(0, index)) : -1;
    if (nextIndex === activeTimelineIndex) return;

    activeTimelineIndex = nextIndex;
    timelineCards.forEach((card, cardIndex) => {
      const isActive = cardIndex === nextIndex;
      card.classList.toggle("is-active", isActive);
      card.dataset.focusDistance = String(Math.min(3, Math.abs(cardIndex - nextIndex)));
      if (isActive) card.setAttribute("aria-current", "step");
      else card.removeAttribute("aria-current");
    });
  };

  const setMode = (mode: "about" | "career") => {
    if (!identity || currentMode === mode) return;
    const isCareer = mode === "career";
    currentMode = mode;
    identity.classList.toggle("is-career", isCareer);
    if (!isCareer) {
      identity.classList.remove("is-career-list");
      identity.dataset.aboutPlayed = "true";
    }
  };

  const playAboutIntro = () => {
    if (!identity || !aboutCopy || reduceMotion || identity.dataset.aboutPlayed === "true") return;

    identity.dataset.aboutPlayed = "true";
    aboutIntroTimeline?.kill();
    aboutIntroTimeline = gsap.timeline({ defaults: { ease: "power3.out", overwrite: "auto" } });
    aboutIntroTimeline
      .to(profileLogo, { autoAlpha: 1, y: 0, filter: "brightness(0) blur(0px)", duration: 0.72 }, 0)
      .add(() => typeElement(aboutCopy, 24), 0.14)
      .to(profileContact, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.62 }, 0.42)
      .to(aboutCopy, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.48 }, 0.16);
    registerAnimation(aboutIntroTimeline);
  };

  const aboutHoldEndProgress = 0.09;
  const careerStartProgress = 0.29;
  const careerEndpointHoldScale = 0.5;
  const careerVisibleProgress = aboutHoldEndProgress + (careerStartProgress - aboutHoldEndProgress) * 0.5;
  const desktopTimelineStartProgress = careerStartProgress - (careerStartProgress - careerVisibleProgress) * careerEndpointHoldScale;
  const mobileCareerListStartProgress = careerStartProgress + aboutHoldEndProgress;
  const getCareerTransitionProgress = (progress: number) => gsap.utils.clamp(
    0,
    1,
    (progress - aboutHoldEndProgress) / Math.max(0.001, careerStartProgress - aboutHoldEndProgress)
  );
  const getIdentityProgressRange = () => Math.max(1, getWorkTop() - cachedIdentityTop - cachedStickyStageHeight);
  const getIdentityScrollForProgress = (progress: number) => {
    const clampedProgress = gsap.utils.clamp(0, 1, progress);
    if (progressTrigger) {
      return progressTrigger.start + (progressTrigger.end - progressTrigger.start) * clampedProgress;
    }
    return cachedIdentityTop + getIdentityProgressRange() * clampedProgress;
  };
  const getTimelineScrollForProgress = (progress: number) => {
    const totalHeight = Math.max(1, getWorkTop() - cachedIdentityTop);
    const maxTimelineTravel = Math.max(1, totalHeight - getPanelHeight() * 0.3);
    return cachedIdentityTop + maxTimelineTravel * gsap.utils.clamp(0, 1, progress);
  };
  const getTimelineStartProgress = () => isMobileLayout() ? mobileCareerListStartProgress : desktopTimelineStartProgress;
  const getTimelineStartTop = () => getTimelineScrollForProgress(getTimelineStartProgress());
  const getWorkRevealTop = () => getWorkTop() - getPanelHeight();
  const getTimelineTravel = () => {
    const count = Math.max(1, timelineCards.length);
    const availableBeforeWork = Math.max(1, getWorkRevealTop() - getTimelineStartTop());
    if (count <= 1) return availableBeforeWork;
    const currentTravel = availableBeforeWork * ((count - 1) / (count + 1));
    const currentEndHold = availableBeforeWork - currentTravel;
    return Math.max(1, availableBeforeWork - currentEndHold * careerEndpointHoldScale);
  };
  const getTimelineEndTop = () => getTimelineStartTop() + getTimelineTravel();
  const getCareerEntryTop = () => getTimelineScrollForProgress(getTimelineStartProgress());
  const getPointProgress = (index: number) => {
    const count = Math.max(1, timelineCards.length);
    if (count <= 1) return 0;
    const clampedIndex = Math.min(count - 1, Math.max(0, index));
    return cachedTimelineCardProgresses[clampedIndex] ?? gsap.utils.clamp(0, 1, clampedIndex / (count - 1));
  };
  const getPointTop = (index: number) => getTimelineStartTop() + getTimelineTravel() * getPointProgress(index);

  const renderTimelineProgress = (timelineProgress: number) => {
    if (reduceMotion || !timelineCards.length || !timelineTrack || !careerList) return;
    const progress = gsap.utils.clamp(0, 1, timelineProgress);
    const count = timelineCards.length;
    const progressSlots = Math.max(1, count - 1);
    const focusRange = 1 / progressSlots * 1.15;
    let bestIndex = 0;
    let bestWeight = -1;
    let bestDiff = Number.POSITIVE_INFINITY;

    timelineCards.forEach((card, index) => {
      const cardProgress = cachedTimelineCardProgresses[index] ?? (count <= 1 ? 0 : index / progressSlots);
      const diff = Math.abs(progress - cardProgress);
      const focusWeight = count <= 1 ? 1 : gsap.utils.clamp(0, 1, 1 - diff / focusRange);

      if (focusWeight > bestWeight || (focusWeight === bestWeight && diff < bestDiff)) {
        bestWeight = focusWeight;
        bestDiff = diff;
        bestIndex = index;
      }

      card.style.setProperty("--timeline-card-opacity", (0.2 + 0.8 * focusWeight).toFixed(3));
      card.style.setProperty("--timeline-card-scale", (0.97 + 0.03 * focusWeight).toFixed(3));
      card.style.setProperty("--timeline-detail-opacity", focusWeight.toFixed(3));
      card.style.setProperty("--timeline-detail-y", `${((1 - focusWeight) * 8).toFixed(2)}px`);
      card.style.setProperty("--timeline-detail-row", `${focusWeight.toFixed(3)}fr`);
      card.style.setProperty("--timeline-dot-scale", (0.6667 + 0.3333 * focusWeight).toFixed(3));
      card.style.setProperty("--timeline-dot-accent-opacity", focusWeight.toFixed(3));
    });
    const timelineViewportCenter = careerList.clientHeight / 2;
    const getCardCenterOffset = (card: HTMLElement | undefined) => card
      ? card.offsetTop + card.offsetHeight / 2 - timelineViewportCenter
      : 0;
    const firstCenterOffset = getCardCenterOffset(timelineCards[0]);
    const lastCenterOffset = getCardCenterOffset(timelineCards.at(-1));
    const focusOffset = gsap.utils.interpolate(firstCenterOffset, lastCenterOffset, progress);
    careerList.style.setProperty("--timeline-focus-offset", `${focusOffset.toFixed(2)}px`);
    setActiveTimeline(bestIndex);
  };

  const syncTimelineProgress = () => {
    const startTop = getTimelineStartTop();
    const endTop = getTimelineEndTop();
    renderTimelineProgress((window.scrollY - startTop) / Math.max(1, endTop - startTop));
  };

  const queueTimelineFromScroll = () => {
    window.cancelAnimationFrame(timelineScrollFrame);
    timelineScrollFrame = window.requestAnimationFrame(syncTimelineProgress);
  };

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
    transitionTimeline = gsap.timeline({ paused: true, defaults: { ease: "none", overwrite: "auto" } });
    transitionTimeline
      .fromTo(aboutCopy, { autoAlpha: 1, y: 0, filter: "blur(0px)" }, { autoAlpha: 0, y: -24, filter: "blur(8px)", duration: 0.58 }, 0)
      .fromTo(profileContact, { autoAlpha: 1, y: 0, filter: "blur(0px)" }, { autoAlpha: 0, y: 20, filter: "blur(8px)", duration: 0.5 }, 0)
      .fromTo(profileMedia, {
        "--profile-career-dim": 0,
        "--profile-media-brightness": 1,
        "--profile-media-contrast": 1,
        "--profile-media-enter-blur": "0px",
        "--profile-media-grayscale": 0,
        autoAlpha: 1,
        scale: 1
      }, {
        "--profile-career-dim": 0,
        "--profile-media-brightness": 0.62,
        "--profile-media-contrast": 1.12,
        "--profile-media-enter-blur": "3px",
        "--profile-media-grayscale": 0.45,
        autoAlpha: 1,
        scale: 1.04,
        duration: 0.72
      }, 0)
      .fromTo(careerCopy, { autoAlpha: 0, y: 24, filter: "blur(8px)" }, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.58 }, 0.18)
      .fromTo(careerList, { autoAlpha: 0, x: 32, yPercent: -50, filter: "blur(10px)" }, { autoAlpha: 1, x: 0, yPercent: -50, filter: "blur(0px)", duration: 0.46 }, 0.54);
    registerAnimation(transitionTimeline);
  }
  currentMode = "about";
  updateGeometry();

  if (identity && !reduceMotion) {
    registerTrigger(ScrollTrigger.create({ trigger: identity, start: "top 65%", onEnter: playAboutIntro, onEnterBack: playAboutIntro }));
    progressTrigger = ScrollTrigger.create({
      trigger: identity,
      start: "top top",
      end: () => `bottom-=${window.innerHeight * 3}px bottom`,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const transitionProgress = getCareerTransitionProgress(self.progress);
        if (transitionProgress > 0.001) {
          fillTypeElement(aboutCopy);
          aboutIntroTimeline?.kill();
          aboutIntroTimeline = null;
        }
        transitionTimeline?.progress(transitionProgress);
        const showCareer = transitionProgress >= 0.5;
        const showCareerList = showCareer && (!isMobileLayout() || self.progress >= mobileCareerListStartProgress);
        setMode(showCareer ? "career" : "about");
        setCareerListStage(showCareerList);
      }
    });
    registerTrigger(progressTrigger);

    if (timelineCards.length) {
      registerTrigger(ScrollTrigger.create({
        trigger: identity,
        start: () => getTimelineStartTop(),
        end: () => getTimelineEndTop(),
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => renderTimelineProgress(self.progress),
        onLeave: () => renderTimelineProgress(1),
        onLeaveBack: () => renderTimelineProgress(0)
      }));
    }
  }

  const jumpToCareerPoint = (index: number) => {
    if (!Number.isFinite(index) || index < 0 || index >= timelineCards.length) return;
    setMode("career");
    setCareerListStage(true);
    setActiveTimeline(index);
    scrollToPosition(getPointTop(index), reduceMotion ? "auto" : "smooth", () => {
      setActiveTimeline(index);
      syncTimelineProgress();
      updateScrollTriggers();
    });
    replaceRoute("/career", { immediate: true });
  };

  timelineCards.forEach((card, index) => {
    card.addEventListener("click", () => jumpToCareerPoint(index), { signal });
  });

  const showCareerInitial = () => {
    setCareerListStage(!isMobileLayout(), true);
    setMode("career");
    setActiveTimeline(0);
  };

  setActiveTimeline(0);
  syncTimelineProgress();

  const cleanup = () => {
    window.cancelAnimationFrame(timelineScrollFrame);
  };

  return {
    cleanup,
    getCareerEntryTop,
    getIdentityScrollForProgress,
    identity,
    identityStage,
    isMobileLayout,
    playAboutIntro,
    queueTimelineFromScroll,
    showCareerInitial,
    updateGeometry
  };
};
