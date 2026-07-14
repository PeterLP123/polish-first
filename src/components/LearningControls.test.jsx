// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PronunciationCard } from "./LearningControls.jsx";

const phrase = { id: "test-phrase", polish: "Dzień dobry", phonetic: "jen DOH-brih", english: "Good morning" };

describe("mobile pronunciation input", () => {
  beforeEach(() => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
    window.speechSynthesis = { cancel: vi.fn(), speak: vi.fn(), getVoices: () => [], addEventListener: vi.fn() };
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  });

  afterEach(cleanup);

  it("offers Polish keyboard dictation when live recognition is unavailable", () => {
    const onComplete = vi.fn();
    render(<PronunciationCard phrase={phrase} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole("button", { name: /try saying it/i }));

    const input = screen.getByRole("textbox", { name: /what did your phone hear/i });
    expect(input).toHaveAttribute("lang", "pl");
    expect(input).toHaveAttribute("inputmode", "text");
    expect(input).toHaveAttribute("enterkeyhint", "done");
    fireEvent.change(input, { target: { value: "Dzień dobry" } });
    fireEvent.click(screen.getByRole("button", { name: /check transcript/i }));

    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledWith(1);
  });
});
