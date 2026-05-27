import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";

const optimizerExcludes = [
  "drizzle-orm",
  "drizzle-orm/d1",
  "drizzle-orm/sqlite-core",
  "zod",
  "zod/v4"
];

const optimizerIncludes = [
  "@tiptap/react",
  "@tiptap/starter-kit",
  "@tiptap/extension-image",
  "@tiptap/extension-placeholder",
  "use-sync-external-store/shim/index.js",
  "use-sync-external-store/shim/with-selector.js"
];

const isDevCommand = process.argv.includes("dev");

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    imageService: "passthrough",
    platformProxy: {
      enabled: true
    }
  }),
  integrations: [react()],
  build: {
    inlineStylesheets: "auto"
  },
  vite: {
    build: {
      assetsInlineLimit: 32 * 1024
    },
    cacheDir: isDevCommand ? "node_modules/.vite-portfolio-dev" : "node_modules/.vite-portfolio-build",
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
