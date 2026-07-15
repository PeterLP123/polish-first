import { describe, expect, it } from "vitest";
import { viewFromHash } from "./navigation.js";

describe("section navigation", () => {
  it("restores valid sections from the URL hash", () => {
    expect(viewFromHash("#course").view).toBe("course");
    expect(viewFromHash("#/practice").view).toBe("practice");
    expect(viewFromHash("#grammar/details").view).toBe("grammar");
    expect(viewFromHash("#session").view).toBe("session");
    expect(viewFromHash("#data").view).toBe("data");
  });

  it("falls back to Today for an unknown or empty hash", () => {
    expect(viewFromHash("#unknown").view).toBe("home");
    expect(viewFromHash("").view).toBe("home");
  });

  it("parses practice state and defaults duplicate or invalid fields", () => {
    expect(viewFromHash("#practice?mode=reading&topic=Travel").practice).toEqual({ mode: "reading", topic: "Travel" });
    expect(viewFromHash("#practice?mode=listen&topic=Entire%20course").practice).toEqual({ mode: "listen", topic: "Entire course" });
    expect(viewFromHash("#practice?mode=reading&mode=speak&topic=").practice).toEqual({ mode: "flashcards", topic: "All" });
    expect(viewFromHash("#practice?mode=unknown&extra=value").practice).toEqual({ mode: "flashcards", topic: "All" });
  });
});
