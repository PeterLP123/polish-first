// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

class TestUtterance {
  constructor(text) {
    this.text = text;
  }
}

function installSynthesis(voices = []) {
  const engine = {
    paused: false,
    cancel: vi.fn(),
    resume: vi.fn(),
    speak: vi.fn(),
    getVoices: vi.fn(() => voices),
    addEventListener: vi.fn(),
  };
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: engine });
  Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: TestUtterance });
  return engine;
}

describe("Polish speech controls", () => {
  beforeEach(() => {
    vi.resetModules();
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
  });

  it("selects an exact local Polish voice and reports real playback events", async () => {
    const localPolish = { name: "Local Polish", lang: "pl-PL", localService: true };
    const engine = installSynthesis([
      { name: "Remote Polish", lang: "pl", localService: false },
      { name: "English", lang: "en-GB", localService: true },
      localPolish,
    ]);
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const { speakPolish } = await import("./speech.js");

    expect(speakPolish("  Dzień dobry  ", { rate: 0.9, onStart, onEnd })).toBe(true);
    const utterance = engine.speak.mock.calls[0][0];
    expect(utterance).toMatchObject({ text: "Dzień dobry", lang: "pl-PL", rate: 0.9, pitch: 1, volume: 1, voice: localPolish });
    utterance.onstart();
    utterance.onend();
    expect(onStart).toHaveBeenCalledOnce();
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it("finishes the previous playback when speech is replaced or stopped", async () => {
    const engine = installSynthesis();
    const firstEnd = vi.fn();
    const secondEnd = vi.fn();
    const { speakPolish, stopPolishSpeech } = await import("./speech.js");

    speakPolish("Pierwsze", { onEnd: firstEnd });
    const first = engine.speak.mock.calls[0][0];
    speakPolish("Drugie", { onEnd: secondEnd });
    const second = engine.speak.mock.calls[1][0];

    expect(firstEnd).toHaveBeenCalledOnce();
    expect(secondEnd).not.toHaveBeenCalled();
    stopPolishSpeech();
    expect(secondEnd).toHaveBeenCalledOnce();

    first.onend();
    second.onend();
    expect(firstEnd).toHaveBeenCalledOnce();
    expect(secondEnd).toHaveBeenCalledOnce();
  });

  it("configures a short, cancellable Polish recognition session and keeps alternatives", async () => {
    installSynthesis();
    let instance;
    class Recognition {
      constructor() { instance = this; }
      start = vi.fn(() => this.onstart());
      stop = vi.fn();
    }
    window.webkitSpeechRecognition = Recognition;
    const onResult = vi.fn();
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const { listenForPolish } = await import("./speech.js");

    const recognition = listenForPolish({ onResult, onStart, onEnd, onError: vi.fn() });
    expect(recognition).toBe(instance);
    expect(instance).toMatchObject({ lang: "pl-PL", continuous: false, interimResults: false, maxAlternatives: 5 });
    expect(onStart).toHaveBeenCalledOnce();

    instance.onresult({ resultIndex: 0, results: [[{ transcript: "dzień dobry" }, { transcript: "dzień dobry" }, { transcript: "dzień dobry pani" }]] });
    expect(onResult).toHaveBeenCalledWith(["dzień dobry", "dzień dobry pani"]);
    instance.onend();
    expect(onEnd).toHaveBeenCalledWith({ hadError: false });
  });

  it("provides actionable mobile fallbacks for microphone errors", async () => {
    installSynthesis();
    const { speechRecognitionMessage } = await import("./speech.js");
    expect(speechRecognitionMessage("not-allowed")).toMatch(/browser settings.*phone dictation/i);
    expect(speechRecognitionMessage("audio-capture")).toMatch(/no microphone.*phone dictation/i);
    expect(speechRecognitionMessage("no-speech")).toMatch(/didn't catch/i);
  });
});
