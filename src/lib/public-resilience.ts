export const getWorkFallback = <T extends { slug: string }>(
  slug: string,
  works: T[],
  databaseUnavailable: boolean
): T | null => {
  if (!databaseUnavailable) return null;
  return works.find((work) => work.slug === slug) ?? null;
};

export const hasImageLoadFailed = (complete: boolean, naturalWidth: number, deferred = false) => (
  !deferred && complete && naturalWidth === 0
);
