import { defineConfig } from "vite";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const publishedDirectories = ["schematics", "docs", "specifications"] as const;

const publishedFiles = ["qec/spec.json"] as const;

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
        for (const file of publishedFiles) {
          const source = resolve(file);
          const destination = resolve("dist", file);
          if (!existsSync(source)) continue;
          mkdirSync(resolve(destination, ".."), { recursive: true });
          cpSync(source, destination);
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
        contracts: "contract-explorer.html",
        runtime: "qec-v0.1.html",
        wave: "wave.html",
        machine: "machine.html",
      },
    },
  },
});
