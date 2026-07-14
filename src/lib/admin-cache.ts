import { env } from "cloudflare:workers";
import { getCloudflarePurgeCredentials, purgeCloudflareFiles } from "./cloudflare-purge";
import { createPublicHtmlPurgeUrls, deletePublicHtmlCache } from "./public-cache";

type CachePurgeResult = {
  ok: boolean;
  skipped: boolean;
};

export type PublicationResult = {
  status: "purged" | "deferred" | "failed";
  workerCache: CachePurgeResult;
  cloudflare: CachePurgeResult;
};

export const getPublicationStatus = (workerCache: CachePurgeResult, cloudflare: CachePurgeResult): PublicationResult["status"] => {
  if (cloudflare.ok) return "purged";
  if (cloudflare.skipped && (workerCache.ok || workerCache.skipped)) return "deferred";
  return "failed";
};

export const purgePublicHtmlCache = async (request: Request, paths: string[]) => {
  const purgeUrls = createPublicHtmlPurgeUrls(request.url, paths);
  const credentials = getCloudflarePurgeCredentials(env as unknown as Record<string, unknown>);

  const [workerResult, cloudflareResult] = await Promise.allSettled([
    deletePublicHtmlCache(request, paths),
    purgeCloudflareFiles({
      credentials,
      urls: purgeUrls
    })
  ]);

  const workerCache = workerResult.status === "fulfilled"
    ? workerResult.value
    : { ok: false, skipped: false };
  const cloudflare = cloudflareResult.status === "fulfilled"
    ? cloudflareResult.value
    : { ok: false, skipped: false };

  return {
    status: getPublicationStatus(workerCache, cloudflare),
    workerCache,
    cloudflare
  } satisfies PublicationResult;
};
