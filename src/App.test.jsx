// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    fireEvent.click(screen.getAllByRole("button", { name: /^progress & data$/i })[1]);
    const heading = await screen.findByRole("heading", { name: /your learning stays yours/i });
    expect(heading).toHaveFocus();
    expect(document.title).toBe("Progress & Data · Cześć!");
  });
});
