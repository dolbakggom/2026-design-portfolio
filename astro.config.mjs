import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    imageService: "passthrough",
    platformProxy: {
      enabled: true
    }
  }),
  integrations: [react()],
  vite: {
    optimizeDeps: {
      exclude: ["drizzle-orm", "drizzle-orm/d1", "drizzle-orm/sqlite-core", "zod"]
    },
    ssr: {
      optimizeDeps: {
        exclude: ["drizzle-orm", "drizzle-orm/d1", "drizzle-orm/sqlite-core", "zod"]
      }
    }
  }
});
