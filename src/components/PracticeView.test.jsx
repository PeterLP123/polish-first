// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { writingItems } from "../data/course.js";
import { DEFAULT_PROGRESS } from "../lib/learning.js";
import PracticeView from "./PracticeView.jsx";

describe("expanded practice modes", () => {
  afterEach(cleanup);

  it("scores a complete reading and records reading evidence", () => {
    const onAttempt = vi.fn();
    render(<PracticeView progress={DEFAULT_PROGRESS} award={vi.fn()} onAttempt={onAttempt} initialMode="reading" />);
    const groups = screen.getAllByRole("group");
    groups.forEach((group) => fireEvent.click(group.querySelector('input[type="radio"]')));
    fireEvent.click(screen.getByRole("button", { name: /check answers/i }));
    expect(screen.getByRole("status")).toHaveTextContent("100% correct");
    expect(onAttempt).toHaveBeenCalledWith(expect.stringMatching(/^reading-/), "reading", "reading", 1);
  });

  it("scores an accepted controlled-writing answer", () => {
    const onAttempt = vi.fn();
    render(<PracticeView progress={DEFAULT_PROGRESS} award={vi.fn()} onAttempt={onAttempt} initialMode="writing" />);
    fireEvent.change(screen.getByLabelText(/your Polish/i), { target: { value: writingItems[0].acceptedAnswers[0] } });
    fireEvent.click(screen.getByRole("button", { name: /check response/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/required meaning included/i);
    expect(onAttempt).toHaveBeenCalledWith(writingItems[0].id, "writing", "writing", 1);
  });

  it("exposes the grammar mode with an explicitly named tab", () => {
    render(<PracticeView progress={DEFAULT_PROGRESS} award={vi.fn()} initialMode="grammar" />);
    expect(screen.getByRole("tab", { name: "Grammar" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("COMPLETE THE GAP", { exact: true })).toBeInTheDocument();
  });
});
