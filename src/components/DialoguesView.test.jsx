// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS } from "../lib/learning.js";
import DialoguesView from "./DialoguesView.jsx";

describe("dialogue scene browser", () => {
  afterEach(cleanup);

  it("keeps the active scene prominent and filters the scene library", () => {
    render(<DialoguesView progress={DEFAULT_PROGRESS} onCorrect={vi.fn()} onCompleteDialogue={vi.fn()} />);
    expect(screen.getByText("ACTIVE SCENE")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /change scene/i }));
    fireEvent.change(screen.getByRole("searchbox", { name: /search conversation scenes/i }), { target: { value: "neighbour" } });
    expect(screen.getByRole("button", { name: /meeting a neighbour/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /at a café/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /meeting a neighbour/i }));
    expect(screen.getByText("You meet someone in your building.", { selector: "em" })).toBeInTheDocument();
  });

  it("returns focus to the scene trigger when the picker closes", async () => {
    render(<DialoguesView progress={DEFAULT_PROGRESS} onCorrect={vi.fn()} onCompleteDialogue={vi.fn()} />);
    const trigger = screen.getByRole("button", { name: /change scene/i });
    fireEvent.click(trigger);
    fireEvent.click(within(screen.getByRole("dialog", { name: /choose a conversation scene/i })).getByRole("button", { name: /close scene picker/i }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
