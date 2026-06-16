import { env } from "cloudflare:workers";
import { getCloudflarePurgeCredentials, purgeCloudflareFiles } from "./cloudflare-purge";
import { createPublicHtmlPurgeUrls, deletePublicHtmlCache } from "./public-cache";

export const purgePublicHtmlCache = async (request: Request, paths: string[]) => {
  const purgeUrls = createPublicHtmlPurgeUrls(request.url, paths);
  const credentials = getCloudflarePurgeCredentials(env as unknown as Record<string, unknown>);

  await Promise.allSettled([
    deletePublicHtmlCache(request, paths),
    purgeCloudflareFiles({
      credentials,
      urls: purgeUrls
    })
  ]);
};
