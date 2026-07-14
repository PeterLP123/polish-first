import { useEffect, useRef, useState } from "react";
import { CircleHelp, Gauge, Lightbulb, Mic, Pause, Volume2 } from "lucide-react";
import { similarity } from "../lib/learning.js";
import { listenForPolish, speakPolish } from "../lib/speech.js";

export function AudioButton({ text, label = "Hear Polish", compact = false, rate = 0.82 }) {
  const [playing, setPlaying] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  const play = () => {
    if (playing) {
      window.speechSynthesis?.cancel();
      window.clearTimeout(timeoutRef.current);
      setPlaying(false);
      return;
    }
    setPlaying(true);
    speakPolish(text, rate);
    timeoutRef.current = window.setTimeout(() => setPlaying(false), Math.max(800, text.length * 65));
  };

  return (
    <button className={compact ? "icon-button" : "audio-button"} onClick={play} aria-label={`${label}: ${text}`}>
      {playing ? <Pause size={compact ? 17 : 18} /> : <Volume2 size={compact ? 17 : 18} />}
      {!compact && <span>{label}</span>}
    </button>
  );
}

export function PronunciationCard({ phrase, onComplete, extended = false }) {
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setResult(null);
    setError("");
  }, [phrase.id]);

  const startListening = () => {
    setError("");
    setResult(null);
    const recognition = listenForPolish({
      onStart: () => setListening(true),
      onEnd: () => setListening(false),
      onError: (code) => {
        setListening(false);
        setError(code === "not-allowed" ? "Microphone access was blocked. You can still listen and repeat aloud." : "I couldn't hear that clearly. Try again, a little closer to the mic.");
      },
      onResult: (alternatives) => {
        const scored = alternatives.map((transcript) => ({ transcript, score: similarity(transcript, phrase.polish) }));
        const best = scored.sort((a, b) => b.score - a.score)[0];
        setResult(best);
        if (best.score >= 0.7) onComplete?.(best.score);
      },
    });
    if (!recognition) setError("Speech checking is not available in this browser. Listen, repeat aloud, then rate yourself.");
  };

  const scorePercent = result ? Math.round(result.score * 100) : 0;
  const feedback = scorePercent >= 88 ? "Brzmi świetnie!" : scorePercent >= 70 ? "Good rhythm — one more time?" : "Nice attempt. Listen once more, then slow it down.";

  return (
    <article className={`pronunciation-card ${extended ? "extended" : ""}`}>
      <div className="pronunciation-topline">
        <span className="eyebrow"><Mic size={14} /> Pronunciation focus</span>
        <span className="slow-label">English-friendly sound guide</span>
      </div>
      <div className="phrase-lockup">
        <h3>{phrase.polish}</h3>
        <p className="phonetic">{phrase.phonetic}</p>
        <p className="translation">{phrase.english}</p>
      </div>
      {phrase.tip && <div className="tip-line"><Lightbulb size={16} /> {phrase.tip}</div>}
      <div className="pronunciation-actions">
        <AudioButton text={phrase.polish} />
        <button className={`record-button ${listening ? "is-listening" : ""}`} onClick={startListening} disabled={listening}>
          <span className="record-dot"><Mic size={18} /></span>
          {listening ? "Listening…" : "Try saying it"}
        </button>
        <button className="text-button" onClick={() => speakPolish(phrase.polish, 0.58)}><Gauge size={17} /> Slower</button>
      </div>
      {result && (
        <div className={`speech-result ${scorePercent >= 70 ? "good" : "retry"}`} role="status">
          <div className="score-badge">{scorePercent}%</div>
          <div><strong>{feedback}</strong><span>I heard: “{result.transcript}”</span></div>
        </div>
      )}
      {error && <p className="speech-error" role="status"><CircleHelp size={16} /> {error}</p>}
    </article>
  );
}
