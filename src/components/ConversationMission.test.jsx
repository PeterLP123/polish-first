// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { dialogues } from "../data/course.js";
import ConversationMission from "./ConversationMission.jsx";

const cafe = dialogues.find((dialogue) => dialogue.id === "cafe");

describe("conversation mission", () => {
  afterEach(cleanup);

  it("keeps authored responses hidden until the learner has attempted or requested help", () => {
    render(<ConversationMission dialogue={cafe} />);
    fireEvent.click(screen.getByRole("button", { name: /start challenge/i }));
    expect(screen.getByRole("heading", { name: cafe.lines[0].polish })).toHaveFocus();
    expect(screen.queryByText("Poproszę kawę z mlekiem.")).not.toBeInTheDocument();
    expect(screen.queryByText("Poproszę herbatę bez cukru.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /show me a model/i }));
    expect(screen.getByText("Poproszę kawę z mlekiem.")).toBeInTheDocument();
    expect(screen.getByText("Poproszę herbatę bez cukru.")).toBeInTheDocument();
  });

  it("compares a typed draft without leaking it to completion callbacks", () => {
    const onFinish = vi.fn();
    render(<ConversationMission dialogue={cafe} onFinish={onFinish} />);
    fireEvent.click(screen.getByRole("button", { name: /start challenge/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /optional Polish draft/i }), { target: { value: "Poproszę kawę z mlekiem." } });
    fireEvent.click(screen.getByRole("button", { name: /compare my Polish/i }));
    expect(screen.getByText("100% closest model match")).toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();
  });

  it("moves keyboard focus into the word scaffold and keeps it there while building", async () => {
    render(<ConversationMission dialogue={cafe} />);
    fireEvent.click(screen.getByRole("button", { name: /start challenge/i }));
    fireEvent.click(screen.getByRole("button", { name: /give me a hint/i }));
    fireEvent.click(screen.getByRole("button", { name: /show word tiles/i }));
    const firstTile = screen.getByLabelText(/model word tiles/i).querySelector("button");
    await waitFor(() => expect(firstTile).toHaveFocus());
    fireEvent.click(firstTile);
    expect(firstTile).toHaveFocus();
    expect(screen.getByRole("textbox", { name: /optional Polish draft/i })).not.toHaveValue("");
  });

  it("records independent, supported and modelled turns once, then runs one unawarded repair pass", () => {
    const onFinish = vi.fn();
    render(<ConversationMission dialogue={cafe} onFinish={onFinish} />);
    fireEvent.click(screen.getByRole("button", { name: /start challenge/i }));

    completeSpokenTurn("worked");
    fireEvent.click(screen.getByRole("button", { name: /give me a hint/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/starts with/i);
    completeSpokenTurn("worked");
    fireEvent.click(screen.getByRole("button", { name: /show me a model/i }));
    fireEvent.click(screen.getByRole("button", { name: /studied the model/i }));
    completeSpokenTurn("worked");
    completeSpokenTurn("worked");

    expect(screen.getByRole("heading", { name: cafe.mission.canDo })).toBeInTheDocument();
    const cards = screen.getByRole("heading", { name: cafe.mission.canDo }).closest("section").querySelectorAll(".mission-summary-grid article");
    expect(cards[0]).toHaveTextContent("3Independent");
    expect(cards[1]).toHaveTextContent("1Supported");
    expect(cards[2]).toHaveTextContent("1Modelled");
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(1, expect.objectContaining({
      total: 5,
      independent: 3,
      supported: 1,
      revealed: 1,
      mode: "challenge",
      evidence: [{ skill: "speaking", mode: "speak", score: 0.913 }],
    }));

    fireEvent.click(screen.getByRole("button", { name: /repair 1 turn/i }));
    expect(screen.queryByRole("button", { name: /give me a hint/i })).not.toBeInTheDocument();
    completeSpokenTurn("recalled");
    expect(screen.getByText(/retrieved 1 previously modelled turn/i)).toBeInTheDocument();
    expect(screen.getByText("1", { selector: ".mission-summary-grid article:last-child strong" })).toBeInTheDocument();
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("guards completion against repeated activation", () => {
    const onFinish = vi.fn();
    render(<ConversationMission dialogue={cafe} onFinish={onFinish} />);
    fireEvent.click(screen.getByRole("button", { name: /start challenge/i }));
    for (let turn = 0; turn < 4; turn += 1) completeSpokenTurn("worked");
    fireEvent.click(screen.getByRole("button", { name: /answered aloud/i }));
    const worked = screen.getByRole("button", { name: /my response worked/i });
    fireEvent.click(worked);
    fireEvent.click(worked);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("keeps the completed run's targets stable while progress updates and repair begins", () => {
    const onFinish = vi.fn();
    const { rerender } = render(<ConversationMission dialogue={cafe} completionCount={0} onFinish={onFinish} />);
    fireEvent.click(screen.getByRole("button", { name: /start challenge/i }));
    fireEvent.click(screen.getByRole("button", { name: /show me a model/i }));
    fireEvent.click(screen.getByRole("button", { name: /studied the model/i }));
    for (let turn = 0; turn < 4; turn += 1) completeSpokenTurn("worked");

    rerender(<ConversationMission dialogue={cafe} completionCount={1} onFinish={onFinish} />);
    fireEvent.click(screen.getByRole("button", { name: /repair 1 turn/i }));
    fireEvent.click(screen.getByRole("button", { name: /answered aloud/i }));

    expect(document.querySelector(".mission-model-card.primary strong")).toHaveTextContent("Poproszę kawę z mlekiem.");
  });

  it("starts a fresh rotated run after leaving repair", () => {
    const onFinish = vi.fn();
    render(<ConversationMission dialogue={cafe} completionCount={0} onFinish={onFinish} />);
    fireEvent.click(screen.getByRole("button", { name: /start challenge/i }));
    fireEvent.click(screen.getByRole("button", { name: /show me a model/i }));
    fireEvent.click(screen.getByRole("button", { name: /studied the model/i }));
    for (let turn = 0; turn < 4; turn += 1) completeSpokenTurn("worked");
    fireEvent.click(screen.getByRole("button", { name: /repair 1 turn/i }));
    fireEvent.click(screen.getByRole("button", { name: /exit mission/i }));
    expect(screen.getByRole("heading", { name: /take away the script/i })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: /start challenge/i }));
    fireEvent.click(screen.getByRole("button", { name: /answered aloud/i }));
    expect(document.querySelector(".mission-model-card.primary strong")).toHaveTextContent("Poproszę herbatę bez cukru.");
    fireEvent.click(screen.getByRole("button", { name: /my response worked/i }));
    for (let turn = 0; turn < 4; turn += 1) completeSpokenTurn("worked");
    expect(onFinish).toHaveBeenCalledTimes(2);
  });

  it("returns focus to the briefing after exit and replay", () => {
    render(<ConversationMission dialogue={cafe} />);
    fireEvent.click(screen.getByRole("button", { name: /start challenge/i }));
    expect(screen.getByRole("heading", { level: 1, name: cafe.lines[0].polish })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: /exit mission/i }));
    expect(screen.getByRole("heading", { name: /take away the script/i })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: /start challenge/i }));
    for (let turn = 0; turn < 5; turn += 1) completeSpokenTurn("worked");
    expect(screen.getByRole("heading", { level: 1, name: cafe.mission.canDo })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: /run this mission again/i }));
    expect(screen.getByRole("heading", { name: /take away the script/i })).toHaveFocus();
  });
});

function completeSpokenTurn(kind) {
  fireEvent.click(screen.getByRole("button", { name: /answered aloud/i }));
  const pattern = kind === "recalled" ? /recalled it this time/i : /my response worked/i;
  fireEvent.click(screen.getByRole("button", { name: pattern }));
}
