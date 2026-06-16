export type CloudflarePurgeCredentials = {
  zoneId: string;
  token: string;
};

type CloudflarePurgeEnv = Record<string, unknown>;

type PurgeFilesOptions = {
  credentials: CloudflarePurgeCredentials | null;
  urls: string[];
  fetcher?: typeof fetch;
};

const PURGE_BATCH_SIZE = 30;

const readEnvString = (source: CloudflarePurgeEnv, key: string) => {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

export const getCloudflarePurgeCredentials = (source: CloudflarePurgeEnv): CloudflarePurgeCredentials | null => {
  const zoneId = readEnvString(source, "CLOUDFLARE_ZONE_ID") ?? readEnvString(source, "CF_ZONE_ID");
  const token =
    readEnvString(source, "CLOUDFLARE_CACHE_PURGE_TOKEN") ??
    readEnvString(source, "CF_CACHE_PURGE_TOKEN") ??
    readEnvString(source, "CLOUDFLARE_API_TOKEN");

  return zoneId && token ? { zoneId, token } : null;
};

export const createCloudflarePurgeBatches = (urls: string[], batchSize = PURGE_BATCH_SIZE) => {
  const batches: string[][] = [];
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));

  for (let index = 0; index < uniqueUrls.length; index += batchSize) {
    batches.push(uniqueUrls.slice(index, index + batchSize));
  }

  return batches;
};

export const purgeCloudflareFiles = async ({ credentials, urls, fetcher = fetch }: PurgeFilesOptions) => {
  if (!credentials || !urls.length) return { ok: false, skipped: true };

  const endpoint = `https://api.cloudflare.com/client/v4/zones/${credentials.zoneId}/purge_cache`;
  const batches = createCloudflarePurgeBatches(urls);
  const responses = await Promise.allSettled(
    batches.map((files) =>
      fetcher(endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${credentials.token}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({ files })
      })
    )
  );

  return {
    ok: responses.every((response) => response.status === "fulfilled" && response.value.ok),
    skipped: false
  };
};
