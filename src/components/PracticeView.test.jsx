// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { allPhrases, readings, writingItems } from "../data/course.js";
import { DEFAULT_PROGRESS } from "../lib/learning.js";
import PracticeView from "./PracticeView.jsx";

describe("expanded practice modes", () => {
  afterEach(cleanup);

  it("scores a complete reading and records reading evidence", () => {
    const onAttempt = vi.fn();
    render(<PracticeView progress={DEFAULT_PROGRESS} award={vi.fn()} onAttempt={onAttempt} initialMode="reading" />);
    const groups = screen.getAllByRole("group");
    const item = readings.find((reading) => reading.stage === "Starter");
    groups.forEach((group, index) => fireEvent.click(within(group).getAllByRole("radio")[item.questions[index].answerIndex]));
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
    expect(screen.getByRole("status")).toHaveTextContent(/meaning.*covered/i);
    expect(screen.getByRole("status")).toHaveTextContent(/form & order.*model match/i);
    expect(screen.getByRole("status")).toHaveTextContent(/closest model/i);
    expect(onAttempt).toHaveBeenCalledWith(writingItems[0].id, "writing", "writing", 1);
  });

  it("puts one recommended action before the full drill chooser", () => {
    render(<PracticeView progress={DEFAULT_PROGRESS} award={vi.fn()} />);
    expect(screen.getByRole("region", { name: /recommended practice/i })).toHaveTextContent(/best next drill.*flashcards/i);
    expect(screen.getByRole("button", { name: /start flashcards/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose another drill/i })).toHaveAttribute("aria-expanded", "false");
  });

  it("exposes the grammar mode with an explicitly named tab", () => {
    render(<PracticeView progress={DEFAULT_PROGRESS} award={vi.fn()} initialMode="grammar" />);
    expect(screen.getByRole("tab", { name: "Grammar" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("COMPLETE THE GAP", { exact: true })).toBeInTheDocument();
  });

  it("defaults to a level-aware set and makes the whole course explicit", () => {
    render(<PracticeView progress={DEFAULT_PROGRESS} award={vi.fn()} />);
    expect(screen.getByText(/recommended set: reviews due.*starter material/i)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Entire course" })).toBeInTheDocument();
  });

  it("supports arrow-key navigation across practice tabs", () => {
    render(<PracticeView progress={DEFAULT_PROGRESS} award={vi.fn()} />);
    const flashcards = screen.getByRole("tab", { name: "Flashcards" });
    flashcards.focus();
    fireEvent.keyDown(flashcards, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Listen" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Listen" })).toHaveFocus();
  });

  it("ends Focus Review after ten productive-recall ratings", () => {
    const phrases = allPhrases.slice(0, 12);
    const progress = {
      ...DEFAULT_PROGRESS,
      learnedPhrases: phrases.map((phrase) => phrase.id),
      phraseStats: Object.fromEntries(phrases.map((phrase, index) => [phrase.id, {
        intervalDays: 1,
        difficulty: 0.75,
        dueDate: "2026-01-01",
        lastReviewed: "2025-12-31",
        reviews: 2,
        lapses: index + 1,
        lastRating: "again",
      }])),
    };
    const award = vi.fn();
    const onAttempt = vi.fn();
    render(<PracticeView progress={progress} award={award} onAttempt={onAttempt} initialMode="focus" />);

    for (let index = 0; index < 10; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: /reveal Polish/i }));
      fireEvent.click(screen.getByRole("button", { name: /^Easy/i }));
    }

    expect(screen.getByRole("heading", { name: /all 10 phrases recalled/i })).toBeInTheDocument();
    expect(screen.getByText("10", { selector: ".focus-summary-grid strong" })).toBeInTheDocument();
    expect(award).toHaveBeenCalledTimes(10);
    expect(onAttempt).toHaveBeenCalledTimes(10);
    expect(screen.queryByRole("button", { name: /reveal Polish/i })).not.toBeInTheDocument();
  });

  it("repairs hard and missed focus phrases without overwriting their first ratings", () => {
    const phrases = allPhrases.slice(0, 2);
    const progress = {
      ...DEFAULT_PROGRESS,
      learnedPhrases: phrases.map((phrase) => phrase.id),
      phraseStats: Object.fromEntries(phrases.map((phrase) => [phrase.id, {
        intervalDays: 1,
        difficulty: 0.7,
        dueDate: "2026-01-01",
        lastReviewed: "2025-12-31",
        reviews: 2,
        lapses: 1,
        lastRating: "hard",
      }])),
    };
    const award = vi.fn();
    render(<PracticeView progress={progress} award={award} onAttempt={vi.fn()} initialMode="focus" />);

    fireEvent.click(screen.getByRole("button", { name: /reveal Polish/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Again/i }));
    fireEvent.click(screen.getByRole("button", { name: /reveal Polish/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Good/i }));
    fireEvent.click(screen.getByRole("button", { name: /review 1 tough phrase/i }));
    fireEvent.click(screen.getByRole("button", { name: /reveal Polish/i }));
    fireEvent.click(screen.getByRole("button", { name: /finish repair/i }));

    expect(screen.getByRole("heading", { name: /repair pass complete/i })).toBeInTheDocument();
    expect(screen.getByText(/original ratings still control the review schedule/i)).toBeInTheDocument();
    expect(award).toHaveBeenCalledTimes(2);
  });
});
