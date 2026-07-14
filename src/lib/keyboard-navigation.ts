const HORIZONTAL_TAB_KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

export const getRovingTabIndex = (currentIndex: number, key: string, itemCount: number) => {
  if (itemCount <= 0 || !HORIZONTAL_TAB_KEYS.has(key)) return null;

  if (key === "Home") return 0;
  if (key === "End") return itemCount - 1;
  if (key === "ArrowLeft") return (currentIndex - 1 + itemCount) % itemCount;
  return (currentIndex + 1) % itemCount;
};
