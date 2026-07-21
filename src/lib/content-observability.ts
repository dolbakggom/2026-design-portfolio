type ContentReadContext =
  | { scope: "home"; slug?: never }
  | { scope: "work"; slug: string };

type ContentReadFailureEvent = {
  event: "portfolio.content.read_failed";
  scope: ContentReadContext["scope"];
  slug?: string;
  errorName: string;
  errorMessage: string;
};

type ErrorLogger = (...args: unknown[]) => void;

const safeLogValue = (value: string) => value.replace(/[\r\n\t]+/g, " ").slice(0, 500);

export const normalizeErrorForLog = (error: unknown) => {
  if (error instanceof Error) {
    return {
      errorName: safeLogValue(error.name || "Error"),
      errorMessage: safeLogValue(error.message || "Unknown content read failure")
    };
  }

  const objectMessage =
    error && typeof error === "object" && "message" in error && typeof error.message === "string"
      ? error.message
      : null;

  return {
    errorName: "UnknownError",
    errorMessage: safeLogValue(objectMessage ?? String(error))
  };
};

export const createContentReadFailureEvent = (
  context: ContentReadContext,
  error: unknown
): ContentReadFailureEvent => ({
  event: "portfolio.content.read_failed",
  scope: context.scope,
  ...(context.scope === "work" ? { slug: safeLogValue(context.slug) } : {}),
  ...normalizeErrorForLog(error)
});

export const reportContentReadFailure = (
  context: ContentReadContext,
  error: unknown,
  logger: ErrorLogger = console.error
) => {
  logger("[portfolio.content.read_failed]", createContentReadFailureEvent(context, error));
};

export const createDatabaseHealthFailureEvent = (error: unknown) => ({
  event: "portfolio.health.database_unavailable" as const,
  dependency: "D1" as const,
  ...normalizeErrorForLog(error)
});

export const reportDatabaseHealthFailure = (
  error: unknown,
  logger: ErrorLogger = console.error
) => {
  logger("[portfolio.health.database_unavailable]", createDatabaseHealthFailureEvent(error));
};
