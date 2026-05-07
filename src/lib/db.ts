import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import * as schema from "../db/schema";

export const getD1 = () => {
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding `DB` is not available.");
  }

  return env.DB;
};

export const getR2 = () => {
  if (!env.MEDIA_BUCKET) {
    throw new Error("Cloudflare R2 binding `MEDIA_BUCKET` is not available.");
  }

  return env.MEDIA_BUCKET;
};

export const getDrizzle = () => drizzle(getD1(), { schema });
