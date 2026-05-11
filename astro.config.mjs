import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";

const optimizerExcludes = [
  "drizzle-orm",
  "drizzle-orm/d1",
  "drizzle-orm/sqlite-core",
  "zod",
  "@tiptap/react",
  "@tiptap/starter-kit",
  "@tiptap/extension-image",
  "@tiptap/extension-placeholder"
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
      exclude: optimizerExcludes
    },
    ssr: {
      optimizeDeps: {
        exclude: optimizerExcludes
      }
    }
  }
});
