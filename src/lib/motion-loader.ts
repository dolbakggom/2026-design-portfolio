export type MotionIntent = "initial" | "wheel" | "touch" | "keyboard" | "idle";

const HOME_ROUTES = new Set(["/", "/about", "/career", "/work"]);

export const shouldLoadMotion = ({
  route,
  reducedMotion
}: {
  route: string;
  reducedMotion: boolean;
  intent: MotionIntent;
}) => {
  if (reducedMotion || !HOME_ROUTES.has(route)) return false;
  return true;
};

export const getReducedMotionTarget = (route: string) => {
  if (route === "/about") return { selector: "#about", career: false };
  if (route === "/career") return { selector: "#about", career: true };
  if (route === "/work") return { selector: "#work", career: false };
  return null;
};
