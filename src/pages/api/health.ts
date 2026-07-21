import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { reportDatabaseHealthFailure } from "../../lib/content-observability";
import { json } from "../../lib/http";

export const prerender = false;

const REQUIRED_CONTENT_TABLES = 6;

export const GET: APIRoute = async () => {
  try {
    const result = await env.DB
      .prepare(
        `SELECT COUNT(*) AS table_count
        FROM sqlite_master
        WHERE type = 'table'
          AND name IN ('profile', 'timeline_items', 'works', 'work_blocks', 'assets', 'asset_variants')`
      )
      .first<{ table_count: number }>();

    if (result?.table_count !== REQUIRED_CONTENT_TABLES) {
      throw new Error("Required D1 content tables are unavailable.");
    }

    return json({ status: "ok", database: "available" });
  } catch (error) {
    reportDatabaseHealthFailure(error);
    return json({ status: "degraded", database: "unavailable" }, { status: 503 });
  }
};
