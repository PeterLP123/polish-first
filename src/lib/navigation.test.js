import { describe, expect, it } from "vitest";
import { viewFromHash } from "./navigation.js";

describe("section navigation", () => {
  it("restores valid sections from the URL hash", () => {
    expect(viewFromHash("#course")).toBe("course");
    expect(viewFromHash("#/practice")).toBe("practice");
    expect(viewFromHash("#grammar/details")).toBe("grammar");
  });

  it("falls back to Today for an unknown or empty hash", () => {
    expect(viewFromHash("#unknown")).toBe("home");
    expect(viewFromHash("")).toBe("home");
  });
});
