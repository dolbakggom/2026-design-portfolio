export type ProgressEase = (progress: number) => number;

const clampUnit = (value: number) => Math.min(1, Math.max(0, value));

export const createCubicBezierEasing = (x1: number, y1: number, x2: number, y2: number): ProgressEase => {
  const sample = (first: number, second: number, time: number) => {
    const inverse = 1 - time;
    return 3 * inverse * inverse * time * first + 3 * inverse * time * time * second + time * time * time;
  };

  return (progress: number) => {
    const target = clampUnit(progress);
    let lower = 0;
    let upper = 1;

    for (let iteration = 0; iteration < 12; iteration += 1) {
      const time = (lower + upper) / 2;
      if (sample(x1, x2, time) < target) lower = time;
      else upper = time;
    }

    return clampUnit(sample(y1, y2, (lower + upper) / 2));
  };
};

export const remapProgressWithDwell = (
  progress: number,
  anchors: number[],
  dwellRatio: number,
  ease: ProgressEase
) => {
  const current = clampUnit(progress);
  if (anchors.length < 2) return current;

  const hold = Math.min(0.45, Math.max(0, dwellRatio));
  const segmentIndex = anchors.findIndex((anchor, index) => index > 0 && current <= anchor);
  const endIndex = segmentIndex === -1 ? anchors.length - 1 : segmentIndex;
  const start = anchors[Math.max(0, endIndex - 1)] ?? 0;
  const end = anchors[endIndex] ?? 1;
  const span = Math.max(0.000001, end - start);
  const localProgress = clampUnit((current - start) / span);

  if (localProgress <= hold) return start;
  if (localProgress >= 1 - hold) return end;

  const transitionProgress = (localProgress - hold) / Math.max(0.000001, 1 - hold * 2);
  return start + span * ease(transitionProgress);
};
