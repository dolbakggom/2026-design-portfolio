import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";

const optimizerExcludes = [
  "drizzle-orm",
  "drizzle-orm/d1",
  "drizzle-orm/sqlite-core",
  "zod"
];

const optimizerIncludes = [
  "@tiptap/react",
  "@tiptap/starter-kit",
  "@tiptap/extension-image",
  "@tiptap/extension-placeholder",
  "use-sync-external-store/shim/index.js",
  "use-sync-external-store/shim/with-selector.js"
];

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
      include: optimizerIncludes,
      exclude: optimizerExcludes
    },
    ssr: {
      optimizeDeps: {
        exclude: optimizerExcludes
      }
    }
  }
});
