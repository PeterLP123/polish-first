import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const html = readFileSync("dist/index.html", "utf8");
const entryPath = html.match(/<script[^>]+src="([^"]+\.js)"/)?.[1];
if (!entryPath) throw new Error("Could not identify the built app entry path.");
const assetsIndex = entryPath.lastIndexOf("assets/");
const basePath = assetsIndex < 0 ? "/" : entryPath.slice(0, assetsIndex);
const origin = "http://127.0.0.1:4174";
const appUrl = new URL(basePath, origin).href;
const preview = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", "4174", "--strictPort"], {
  env: { ...process.env, VITE_BASE_PATH: basePath },
  stdio: ["ignore", "pipe", "pipe"],
});
let previewLog = "";
preview.stdout.on("data", (chunk) => { previewLog += chunk; });
preview.stderr.on("data", (chunk) => { previewLog += chunk; });

let browser;
try {
  const deadline = Date.now() + 20_000;
  let ready = false;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(appUrl);
      if (response.ok) { ready = true; break; }
    } catch { /* Preview is still starting. */ }
    await delay(250);
  }
  if (!ready) throw new Error(`Production preview did not start.\n${previewLog}`);

  const entryResponse = await fetch(new URL(entryPath, origin));
  const entryType = entryResponse.headers.get("content-type") || "unknown";
  if (!entryResponse.ok || !entryType.includes("javascript")) {
    throw new Error(`Production entry was not served as JavaScript (${entryResponse.status}, ${entryType}).`);
  }

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(15_000);
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${appUrl}#dialogues`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: /Train the conversation, then take away the script/i }).waitFor();
  await page.getByRole("button", { name: /Start Challenge/i }).click();
  await page.getByRole("heading", { name: /Dzień dobry\. Co podać/i }).waitFor();
  await page.getByText("Turn 1 of 5").waitFor();
  if (errors.length) throw new Error(`Production browser errors:\n${errors.join("\n")}`);
  console.log(`Production smoke passed: ${appUrl}#dialogues → Conversation Mission turn 1`);
} finally {
  await browser?.close();
  const stopped = new Promise((resolve) => preview.once("exit", resolve));
  preview.kill("SIGTERM");
  await Promise.race([stopped, delay(2_000)]);
}
