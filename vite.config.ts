import { defineConfig } from "vite";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const publishedDirectories = ["schematics", "docs", "specifications"] as const;

export default defineConfig({
  plugins: [
    {
      name: "publish-qec-reference-library",
      closeBundle() {
        for (const directory of publishedDirectories) {
          const source = resolve(directory);
          const destination = resolve("dist", directory);
          if (!existsSync(source)) continue;
          mkdirSync(destination, { recursive: true });
          cpSync(source, destination, { recursive: true });
        }
      },
    },
  ],
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
