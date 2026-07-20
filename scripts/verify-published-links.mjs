import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const dist = resolve("dist");
const htmlFiles = [];
const collectHtml = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) collectHtml(path);
    else if (entry.name.endsWith(".html")) htmlFiles.push(path);
  }
};
collectHtml(dist);
const missing = [];

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    const link = match[1];
    if (
      !link ||
      link.startsWith("#") ||
      link.startsWith("data:") ||
      /^[a-z]+:/i.test(link) ||
      link.startsWith("//")
    ) {
      continue;
    }
    const path = link.split(/[?#]/, 1)[0];
    if (!path) continue;
    const target = path.startsWith("/")
      ? join(dist, path.slice(1))
      : resolve(dirname(file), path);
    if (!existsSync(target)) missing.push(`${file.slice(dist.length + 1)}: ${link}`);
  }
}

if (missing.length) {
  throw new Error(`Published links are missing:\n${missing.join("\n")}`);
}

console.log(`Verified published links across ${htmlFiles.length} HTML pages.`);
