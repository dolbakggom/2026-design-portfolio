/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    MEDIA_BUCKET: R2Bucket;
    ADMIN_USERNAME: string;
    ADMIN_PASSWORD_HASH: string;
    SESSION_SECRET: string;
    ADMIN_LOGIN_RATE_LIMITER: RateLimit;
  }
}
