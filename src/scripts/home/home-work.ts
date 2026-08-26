import { getRovingTabIndex } from "../../lib/keyboard-navigation";

type GsapModule = typeof import("gsap").default;

type WorkSectionOptions = {
  gsap: GsapModule;
  signal: AbortSignal;
};

const updateFeaturedContrast = (signal: AbortSignal) => {
  document.querySelectorAll<HTMLElement>(".featured-work").forEach((card) => {
    const image = card.querySelector<HTMLImageElement>(".work-visual img");
    if (!image) {
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

        context.drawImage(image, 0, 0, size, size);
        const pixels = context.getImageData(0, 0, size, size).data;
        let total = 0;
        let count = 0;

        for (let index = 0; index < pixels.length; index += 4) {
          const alpha = pixels[index + 3] / 255;
          if (alpha < 0.2) continue;
          total += (0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2]) * alpha;
          count += alpha;
        }

        const luminance = count ? total / count : 0;
        card.dataset.textTone = luminance > 148 ? "dark" : "light";
      } catch {
        card.dataset.textTone = "light";
      }
    };

    if (image.complete && image.naturalWidth) {
      sampleImage();
    } else {
      image.addEventListener("load", sampleImage, { once: true, signal });
      image.addEventListener("error", () => {
        card.dataset.textTone = "light";
      }, { once: true, signal });
    }
  });
};

export const initHomeWorkSection = ({ gsap, signal }: WorkSectionOptions) => {
  updateFeaturedContrast(signal);

  const filterButtons = document.querySelectorAll<HTMLButtonElement>("[data-filter]");
  const galleryPanel = document.querySelector<HTMLElement>("#work-gallery-grid");
  const galleryStatus = document.querySelector<HTMLElement>("[data-gallery-status]");
  const galleryFilterEmpty = document.querySelector<HTMLElement>("[data-gallery-filter-empty]");
  const tiles = Array.from(galleryPanel?.querySelectorAll<HTMLElement>("[data-category]") ?? []);

  const animateGalleryFilter = (filter: string) => {
    const previousRects = new Map<HTMLElement, DOMRect>();

    tiles.forEach((tile) => {
      if (!tile.hidden) previousRects.set(tile, tile.getBoundingClientRect());
    });

    const matchesFilter = (tile: HTMLElement) => {
      const categories = (tile.dataset.category ?? "").split(",").map((category) => category.trim());
      return filter === "ALL" || categories.includes(filter);
    };

    tiles.filter((tile) => !tile.hidden && !matchesFilter(tile)).forEach((tile) => {
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
          gsap.fromTo(tile, { x: deltaX, y: deltaY }, {
            x: 0,
            y: 0,
            duration: 0.48,
            ease: "power3.out",
            overwrite: true
          });
        }
      } else {
        gsap.to(tile, { autoAlpha: 1, scale: 1, y: 0, duration: 0.42, ease: "power3.out", overwrite: true });
      }
    });

    const visibleCount = tiles.filter((tile) => !tile.hidden).length;
    const showFilterEmpty = filter !== "ALL" && visibleCount === 0;
    if (galleryFilterEmpty) {
      gsap.killTweensOf(galleryFilterEmpty);
      galleryFilterEmpty.hidden = !showFilterEmpty;
      if (showFilterEmpty) {
        gsap.fromTo(galleryFilterEmpty, { autoAlpha: 0, y: 12 }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.42,
          ease: "power3.out",
          overwrite: true
        });
      }
    }

    return visibleCount;
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
      if (button.id) galleryPanel?.setAttribute("aria-labelledby", button.id);
      const visibleCount = animateGalleryFilter(filter);
      if (galleryStatus) {
        galleryStatus.textContent = visibleCount === 0 && filter !== "ALL"
          ? `${filter} 작업물 0개. 아직 등록된 작업물이 없습니다.`
          : `${filter === "ALL" ? "전체" : filter} 작업물 ${visibleCount}개`;
      }
    }, { signal });

    button.addEventListener("keydown", (event) => {
      const currentIndex = Array.from(filterButtons).indexOf(button);
      const nextIndex = getRovingTabIndex(currentIndex, event.key, filterButtons.length);
      if (nextIndex === null) return;

      event.preventDefault();
      const nextButton = filterButtons[nextIndex];
      nextButton?.focus();
      nextButton?.click();
    }, { signal });
  });
};
