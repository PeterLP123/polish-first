// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { allPhrases } from "../data/course.js";
import GuidedSession from "./GuidedSession.jsx";

describe("guided session tasks", () => {
  it("requires a new phrase meaning to be revealed before completion", () => {
    const onCommit = vi.fn();
    const session = { date: "2026-07-14", cursor: 0, completedAt: null, results: [], tasks: [{ id: "learn-1", type: "learn", phraseId: allPhrases[0].id }] };
    render(<GuidedSession session={session} onCommit={onCommit} onExit={vi.fn()} onRestart={vi.fn()} />);
    const complete = screen.getByRole("button", { name: /i said it aloud/i });
    expect(complete).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /reveal meaning/i }));
    expect(complete).toBeEnabled();
    fireEvent.click(complete);
    expect(onCommit).toHaveBeenCalledWith(session.tasks[0], expect.objectContaining({ kind: "learn" }));
  });
});
