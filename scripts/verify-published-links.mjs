import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const dist = resolve("dist");
const htmlFiles = readdirSync(dist).filter((file) => file.endsWith(".html"));
const missing = [];

for (const file of htmlFiles) {
  const html = readFileSync(join(dist, file), "utf8");
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
      : resolve(dirname(join(dist, file)), path);
    if (!existsSync(target)) missing.push(`${file}: ${link}`);
  }
}

if (missing.length) {
  throw new Error(`Published links are missing:\n${missing.join("\n")}`);
}

console.log(`Verified published links across ${htmlFiles.length} HTML pages.`);
