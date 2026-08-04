import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const assetsDirectory = "dist/assets";
const limits = { js: 450 * 1024, css: 110 * 1024, entry: 250 * 1024 };
const files = readdirSync(assetsDirectory).filter((file) => /\.(?:js|css)$/.test(file));
const rows = files.map((file) => ({ file, bytes: statSync(join(assetsDirectory, file)).size }));
const html = readFileSync("dist/index.html", "utf8");
const entryName = html.match(/<script[^>]+src="[^"]*\/([^/]+\.js)"/)?.[1];
const failures = [];

for (const row of rows) {
  const limit = row.file.endsWith(".css") ? limits.css : limits.js;
  if (row.bytes > limit) failures.push(`${row.file} is ${row.bytes} bytes; limit is ${limit}`);
}
const entry = rows.find((row) => row.file === entryName);
if (!entry) failures.push("Could not identify the production entry chunk.");
else if (entry.bytes > limits.entry) failures.push(`${entry.file} entry is ${entry.bytes} bytes; limit is ${limits.entry}`);

console.log("Production bundle budget");
rows.sort((left, right) => right.bytes - left.bytes).slice(0, 8).forEach((row) => console.log(`${row.file}: ${(row.bytes / 1024).toFixed(1)} KiB`));
if (failures.length) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`Entry chunk: ${entry.file} (${(entry.bytes / 1024).toFixed(1)} KiB)`);
}
