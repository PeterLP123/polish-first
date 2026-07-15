import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

describe("service worker cache boundaries", () => {
  it("only removes caches owned by Polish First", () => {
    expect(source).toContain('const CACHE_PREFIX = "polish-first-"');
    expect(source).toContain("key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME");
  });

  it("does not replace the offline shell with an error response", () => {
    expect(source).toMatch(/if \(response\.ok\) \{[\s\S]*cache\.put\(new URL\("\.\/", self\.registration\.scope\)\.href, copy\)/u);
  });
});
