// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";
import { DEFAULT_PROGRESS, buildDailySession } from "./lib/learning.js";

describe("guided learning flow", () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "#home";
    window.scrollTo = vi.fn();
    window.speechSynthesis = { cancel: vi.fn(), speak: vi.fn(), getVoices: () => [], addEventListener: vi.fn() };
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("starts a finite daily session and persists its cursor for refresh", async () => {
    const first = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /start 15-minute session/i }));
    expect(await screen.findByText(/step 1 of 11/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /reveal meaning/i }));
    fireEvent.click(screen.getByRole("button", { name: /i said it aloud/i }));
    expect(await screen.findByText(/step 2 of 11/i)).toBeInTheDocument();
    await waitFor(() => expect(JSON.parse(localStorage.getItem("polish-first-progress")).activeSession.cursor).toBe(1));

    first.unmount();
    window.location.hash = "#session";
    render(<App />);
    expect(await screen.findByText(/step 2 of 11/i)).toBeInTheDocument();
  });

  it("shows a completion summary and can deliberately build another session", async () => {
    const session = buildDailySession({ ...DEFAULT_PROGRESS });
    session.cursor = session.tasks.length;
    session.completedAt = new Date().toISOString();
    session.results = [{ kind: "review", rating: "good", xp: 7, minutes: 1 }, { kind: "dialogue", mistakes: 1, xp: 30, minutes: 5 }];
    localStorage.setItem("polish-first-progress", JSON.stringify({ ...DEFAULT_PROGRESS, activeSession: session }));
    window.location.hash = "#session";
    render(<App />);

    expect(await screen.findByRole("heading", { name: /świetna robota/i })).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /build another session/i }));
    expect(await screen.findByText(/step 1 of 11/i)).toBeInTheDocument();
  });

  it("moves keyboard focus to the destination heading after navigation", async () => {
    render(<App />);
    fireEvent.click(screen.getAllByRole("button", { name: /^progress & data$/i })[0]);
    const heading = await screen.findByRole("heading", { name: /your learning stays yours/i });
    expect(heading).toHaveFocus();
    expect(document.title).toBe("Progress & Data · Cześć!");
  });

  it("skips to content without changing the current route", async () => {
    window.location.hash = "#course";
    render(<App />);
    const main = await screen.findByRole("main");
    fireEvent.click(screen.getByRole("link", { name: /skip to main content/i }));
    expect(main).toHaveFocus();
    expect(window.location.hash).toBe("#course");
    expect(screen.getByRole("heading", { name: /polish for real life/i })).toBeInTheDocument();
  });

  it("explains the memory system until the first phrase is learned", async () => {
    render(<App />);
    expect(screen.getByText(/come back right before you would forget them/i)).toBeInTheDocument();
    expect(screen.queryByText("Due now")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /learn your first phrases/i }));
    expect(await screen.findByText(/step 1 of 11/i)).toBeInTheDocument();
  });

  it("reaches overflow sections through the bottom-nav More sheet", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /^more$/i }));
    fireEvent.click(within(screen.getByRole("dialog", { name: /more sections/i })).getByRole("button", { name: /grammar/i }));
    expect(await screen.findByRole("heading", { name: /patterns, not paperwork/i })).toBeInTheDocument();
    expect(document.title).toBe("Grammar · Cześć!");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("groups desktop navigation into learn, reference, and progress", () => {
    render(<App />);
    expect(screen.getByText("LEARN")).toBeInTheDocument();
    expect(screen.getByText("REFERENCE")).toBeInTheDocument();
    expect(screen.getByText("PROGRESS")).toBeInTheDocument();
  });

  it("groups the course into stage sections with only the frontier stage open", async () => {
    window.location.hash = "#course";
    render(<App />);
    const starterHeader = await screen.findByRole("button", { name: /stage 1 · .*starter/i });
    expect(starterHeader).toHaveAttribute("aria-expanded", "true");
    const everydayHeader = screen.getByRole("button", { name: /stage 2 · .*everyday/i });
    expect(everydayHeader).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(everydayHeader);
    expect(everydayHeader).toHaveAttribute("aria-expanded", "true");
  });

  it("returns focus to the unit action after closing a lesson", async () => {
    window.location.hash = "#course";
    render(<App />);
    const start = (await screen.findAllByRole("button", { name: /start unit/i }))[0];
    start.focus();
    fireEvent.click(start);
    expect(await screen.findByRole("dialog", { name: /lesson/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /finish this lesson later/i }));
    await waitFor(() => expect(start).toHaveFocus());
  });

  it("requires meaning reveal before a phrase can be completed", async () => {
    window.location.hash = "#course";
    render(<App />);
    fireEvent.click((await screen.findAllByRole("button", { name: /start unit/i }))[0]);
    const next = await screen.findByRole("button", { name: /got it — next phrase/i });
    expect(next).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /reveal meaning/i }));
    expect(next).toBeEnabled();
  });

  it("closes a unit lesson when browser history changes the route", async () => {
    window.location.hash = "#course";
    render(<App />);
    fireEvent.click((await screen.findAllByRole("button", { name: /start unit/i }))[0]);
    expect(await screen.findByRole("dialog", { name: /lesson/i })).toBeInTheDocument();
    window.history.pushState(null, "", "#home");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /lesson/i })).not.toBeInTheDocument());
  });

  it("preserves unreadable local progress until the learner explicitly starts fresh", async () => {
    const unreadable = "{not-valid-json";
    localStorage.setItem("polish-first-progress", unreadable);
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/left untouched/i);
    expect(localStorage.getItem("polish-first-progress")).toBe(unreadable);
    fireEvent.click(screen.getByRole("button", { name: /use fresh progress/i }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem("polish-first-progress")).version).toBe(5));
  });

  it("re-reads and restores existing progress after a transient storage read failure", async () => {
    localStorage.setItem("polish-first-progress", JSON.stringify({ ...DEFAULT_PROGRESS, xp: 321 }));
    const nativeGetItem = Storage.prototype.getItem;
    let failFirstRead = true;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function getItem(key) {
      if (failFirstRead && key === "polish-first-progress") {
        failFirstRead = false;
        throw new DOMException("Temporarily unavailable", "SecurityError");
      }
      return nativeGetItem.call(this, key);
    });

    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/not allowing local progress to be read/i);
    fireEvent.click(screen.getByRole("button", { name: /try saving again/i }));

    expect(await screen.findByText(/existing local progress restored/i)).toBeInTheDocument();
    await waitFor(() => expect(JSON.parse(localStorage.getItem("polish-first-progress")).xp).toBe(321));
  });

  it("does not write fallback progress while storage reads remain unavailable", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Still unavailable", "SecurityError");
    });

    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: /try saving again/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/nothing has been replaced/i);
    expect(setItem).not.toHaveBeenCalled();
  });

  it("reveals the grammar reference in manageable batches", async () => {
    window.location.hash = "#grammar";
    render(<App />);
    expect(await screen.findByText(/showing 12 of \d+ patterns/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /show 12 more patterns/i }));
    expect(screen.getByText(/showing 24 of \d+ patterns/i)).toBeInTheDocument();
  });
});
