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
    const onPickerStateChange = vi.fn();
    render(<DialoguesView progress={DEFAULT_PROGRESS} onCorrect={vi.fn()} onCompleteDialogue={vi.fn()} onPickerStateChange={onPickerStateChange} />);
    const trigger = screen.getByRole("button", { name: /change scene/i });
    fireEvent.click(trigger);
    const picker = screen.getByRole("dialog", { name: /choose a conversation scene/i });
    expect(picker.tagName).toBe("SECTION");
    expect(document.querySelector(".page-header")).toHaveAttribute("inert");
    expect(document.querySelector(".dialogue-active")).toHaveAttribute("inert");
    expect(onPickerStateChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(within(picker).getByRole("button", { name: /close scene picker/i }));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(document.querySelector(".page-header")).not.toHaveAttribute("inert");
    expect(document.querySelector(".dialogue-active")).not.toHaveAttribute("inert");
    expect(onPickerStateChange).toHaveBeenLastCalledWith(false);
  });

  it("offers Challenge first while keeping the supported walkthrough intact", async () => {
    const onMissionStateChange = vi.fn();
    render(<DialoguesView progress={DEFAULT_PROGRESS} onCorrect={vi.fn()} onCompleteDialogue={vi.fn()} onMissionStateChange={onMissionStateChange} />);
    expect(screen.getByRole("button", { name: /challenge polish first/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { level: 2, name: /take away the script/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /supported choices visible/i }));
    expect(screen.getByRole("button", { name: /supported choices visible/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/HOW DO YOU RESPOND/i)).toBeInTheDocument();
    expect(screen.getByText("Poproszę kawę z mlekiem.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Dzień dobry. Co podać/i })).toHaveFocus();
    expect(onMissionStateChange).toHaveBeenLastCalledWith(true);
  });

  it("moves focus into the supported walkthrough when chosen from the mission briefing", () => {
    render(<DialoguesView progress={DEFAULT_PROGRESS} onCorrect={vi.fn()} onCompleteDialogue={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /use supported walkthrough/i }));
    expect(screen.getByRole("heading", { name: /Dzień dobry. Co podać/i })).toHaveFocus();
  });

  it("focuses Supported feedback and each new turn while removing resolved choices from the keyboard path", async () => {
    const onMissionStateChange = vi.fn();
    render(<DialoguesView progress={DEFAULT_PROGRESS} onCorrect={vi.fn()} onCompleteDialogue={vi.fn()} onMissionStateChange={onMissionStateChange} />);
    fireEvent.click(screen.getByRole("button", { name: /supported choices visible/i }));

    const firstOptions = within(document.querySelector(".response-options")).getAllByRole("button");
    fireEvent.click(firstOptions[0]);
    const continueButton = screen.getByRole("button", { name: /continue/i });
    await waitFor(() => expect(continueButton).toHaveFocus());
    firstOptions.forEach((option) => expect(option).toBeDisabled());

    fireEvent.click(continueButton);
    expect(screen.getByRole("heading", { name: /Na miejscu czy na wynos/i })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: /exit walkthrough/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /supported choices visible/i })).toHaveFocus());
    expect(screen.getByRole("button", { name: /challenge polish first/i })).toHaveAttribute("aria-pressed", "true");
    expect(onMissionStateChange).toHaveBeenLastCalledWith(false);
  });
});
