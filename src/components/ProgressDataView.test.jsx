// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS, serializeProgress } from "../lib/learning.js";
import ProgressDataView from "./ProgressDataView.jsx";

describe("progress data tools", () => {
  afterEach(cleanup);

  it("turns the fresh-learner recommendation into the first unit action", () => {
    const onOpenUnit = vi.fn();
    render(<ProgressDataView progress={DEFAULT_PROGRESS} onReplaceProgress={vi.fn()} onOpenUnit={onOpenUnit} />);
    expect(screen.getByText(/Continue with Unit 1/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    expect(onOpenUnit).toHaveBeenCalledWith(expect.objectContaining({ number: 1 }));
  });

  it("previews and confirms a valid import", async () => {
    const onReplace = vi.fn();
    const imported = { ...DEFAULT_PROGRESS, xp: 123 };
    const { container } = render(<ProgressDataView progress={DEFAULT_PROGRESS} onReplaceProgress={onReplace} />);
    fireEvent.click(within(container).getByRole("tab", { name: /data tools/i }));
    const input = container.querySelector('input[type="file"]');
    const file = new File([serializeProgress(imported)], "progress.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByRole("heading", { name: /replace current progress/i })).toBeInTheDocument();
    expect(screen.getByText(/123 XP/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confirm import/i }));
    expect(onReplace).toHaveBeenCalledWith(expect.objectContaining({ xp: 123, version: 5 }));
  });

  it("rejects invalid files without replacing progress", async () => {
    const onReplace = vi.fn();
    const { container } = render(<ProgressDataView progress={DEFAULT_PROGRESS} onReplaceProgress={onReplace} />);
    fireEvent.click(within(container).getByRole("tab", { name: /data tools/i }));
    const file = new File(["not-json"], "broken.json", { type: "application/json" });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });

    expect(await screen.findByRole("alert")).toHaveTextContent(/not valid JSON/i);
    await waitFor(() => expect(onReplace).not.toHaveBeenCalled());
  });

  it("replaces empty analytics with a helpful fresh-learner state", () => {
    render(<ProgressDataView progress={DEFAULT_PROGRESS} onReplaceProgress={vi.fn()} />);
    expect(screen.getByRole("heading", { name: /practise first, then look for patterns/i })).toBeInTheDocument();
    expect(screen.queryByText(/scored attempts in the last 30 days/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: /skills/i }));
    expect(screen.getByRole("heading", { name: /six ways your Polish is growing/i })).toBeInTheDocument();
  });
});
