// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PlacementCheck, { placementStage } from "./PlacementCheck.jsx";

describe("placement check", () => {
  afterEach(cleanup);

  it("combines demonstrated knowledge with the learner's starting context", () => {
    expect(placementStage(0.2, "new")).toBe("Starter");
    expect(placementStage(0.4, "some")).toBe("Everyday");
    expect(placementStage(0.6, "returning")).toBe("B1 foundations");
    expect(placementStage(1, "returning")).toBe("B1 in action");
  });

  it("lets a learner choose a goal and safely skip to Starter", () => {
    const onComplete = vi.fn();
    render(<PlacementCheck onComplete={onComplete} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /travel confidently/i }));
    fireEvent.click(screen.getByRole("button", { name: /skip the check/i }));

    expect(onComplete).toHaveBeenCalledWith({
      goal: "travel",
      primaryTopic: "Travel",
      selfLevel: "new",
      placementScore: 0,
      startingStage: "Starter",
    });
  });
});
