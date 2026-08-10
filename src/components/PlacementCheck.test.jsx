// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PlacementCheck, { placementStage } from "./PlacementCheck.jsx";

function PlacementHarness({ onClose = () => {} }) {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)}>Open placement check</button>
    {open && <PlacementCheck onComplete={vi.fn()} onClose={() => { onClose(); setOpen(false); }} />}
  </>;
}

describe("placement check", () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = "";
  });

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

  it("moves initial focus to the close button and locks body scrolling", () => {
    render(<PlacementCheck onComplete={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: /close placement check/i })).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<PlacementCheck onComplete={vi.fn()} onClose={onClose} />);

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("wraps focus in both directions at the dialog boundaries", () => {
    render(<PlacementCheck onComplete={vi.fn()} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: /personalise your Polish path/i });
    const controls = within(dialog).getAllByRole("button");
    const first = controls[0];
    const last = controls.at(-1);

    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(first).toHaveFocus();

    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("returns focus to the opener after the modal closes", () => {
    render(<PlacementHarness />);
    const opener = screen.getByRole("button", { name: /open placement check/i });
    opener.focus();
    fireEvent.click(opener);

    fireEvent.click(screen.getByRole("button", { name: /close placement check/i }));

    expect(screen.queryByRole("dialog", { name: /personalise your Polish path/i })).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("restores the body's previous overflow value when it unmounts", () => {
    document.body.style.overflow = "clip";
    const { unmount } = render(<PlacementCheck onComplete={vi.fn()} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("clip");
  });
});
