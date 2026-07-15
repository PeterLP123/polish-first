// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContentCatalog, milestones } from "../data/course.js";
import MilestoneRunner from "./MilestoneRunner.jsx";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("milestone interactions", () => {
  it("keeps shuffled listening choices stable and scores by phrase identity", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const milestone = milestones[0];
    const item = ContentCatalog.byId.get(milestone.tasks[0].itemId);
    const onAttempt = vi.fn();
    const { container } = render(<MilestoneRunner milestone={milestone} onClose={vi.fn()} onComplete={vi.fn()} onAttempt={onAttempt} />);

    const initialChoices = [...container.querySelectorAll(".answer-grid button")].map((button) => button.textContent);
    expect(initialChoices).toHaveLength(3);
    expect(initialChoices.at(-1)).toBe(item.english);

    fireEvent.click(screen.getByRole("button", { name: item.english }));
    expect([...container.querySelectorAll(".answer-grid button")].map((button) => button.textContent)).toEqual(initialChoices);
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(onAttempt).toHaveBeenCalledWith(item.id, "listening", "milestone", 1);
  });

  it("moves focus to each new task heading after continuing", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const milestone = milestones[0];
    const item = ContentCatalog.byId.get(milestone.tasks[0].itemId);
    render(<MilestoneRunner milestone={milestone} onClose={vi.fn()} onComplete={vi.fn()} onAttempt={vi.fn()} />);

    const firstHeading = screen.getByRole("heading", { name: /what did you hear/i });
    expect(firstHeading).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: item.english }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => expect(screen.getByRole("heading", { level: 2 })).not.toBe(firstHeading));
    expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();
  });

  it("moves focus to the result and back to the task when retrying", async () => {
    const source = milestones[0];
    const speakingTask = source.tasks.find((task) => task.kind === "speaking");
    const milestone = { ...source, tasks: [speakingTask] };
    render(<MilestoneRunner milestone={milestone} onClose={vi.fn()} onComplete={vi.fn()} onAttempt={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /say this aloud/i })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: /i said it aloud/i }));
    fireEvent.click(screen.getByRole("button", { name: /^good$/i }));

    const resultHeading = await screen.findByRole("heading", { name: /keep building/i });
    expect(resultHeading).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    await waitFor(() => expect(screen.getByRole("heading", { name: /say this aloud/i })).toHaveFocus());
  });

  it("freezes a checked text answer and submits its stored score", () => {
    const source = milestones[0];
    const grammarTask = source.tasks.find((task) => task.kind === "grammar");
    const item = ContentCatalog.byId.get(grammarTask.itemId);
    const milestone = { ...source, tasks: [grammarTask, ...source.tasks.filter((task) => task !== grammarTask)] };
    const onAttempt = vi.fn();
    render(<MilestoneRunner milestone={milestone} onClose={vi.fn()} onComplete={vi.fn()} onAttempt={onAttempt} />);

    const input = screen.getByRole("textbox", { name: /your answer/i });
    fireEvent.change(input, { target: { value: item.acceptedAnswers[0] } });
    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));

    expect(input).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Correct.");
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onAttempt).toHaveBeenCalledWith(item.id, "grammar", "milestone", 1);
  });
});
