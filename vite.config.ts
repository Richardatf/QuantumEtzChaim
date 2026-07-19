import { defineConfig } from "vite";

export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        atlas: "index.html",
        landing: "landing.html",
        console: "console.html",
      },
    },
  },
});
