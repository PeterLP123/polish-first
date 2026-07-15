import { useEffect, useRef, useState } from "react";
import { CircleHelp, Gauge, Keyboard, Lightbulb, Mic, Pause, Volume2 } from "lucide-react";
import { similarity } from "../lib/learning.js";
import { listenForPolish, speakPolish, speechRecognitionMessage, stopPolishSpeech } from "../lib/speech.js";

export function AudioButton({ text, label = "Hear Polish", compact = false, rate = 0.82 }) {
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);

  const finish = () => {
    playingRef.current = false;
    setPlaying(false);
  };

  useEffect(() => () => {
    if (playingRef.current) stopPolishSpeech();
  }, []);

  const play = () => {
    if (playing) {
      stopPolishSpeech();
      finish();
      return;
    }
    const started = speakPolish(text, { rate, onStart: () => setPlaying(true), onEnd: finish, onError: finish });
    playingRef.current = started;
    setPlaying(started);
  };

  return (
    <button type="button" className={compact ? "icon-button" : "audio-button"} onClick={play} aria-pressed={playing} aria-label={`${playing ? "Stop" : label}: ${text}`}>
      {playing ? <Pause size={compact ? 17 : 18} /> : <Volume2 size={compact ? 17 : 18} />}
      {!compact && <span>{playing ? "Stop audio" : label}</span>}
    </button>
  );
}

export function PronunciationCard({ phrase, onComplete, extended = false }) {
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dictationOpen, setDictationOpen] = useState(false);
  const [dictation, setDictation] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    recognitionRef.current?.abort?.();
    recognitionRef.current = null;
    setListening(false);
    setResult(null);
    setError("");
    setDictation("");
  }, [phrase.id]);

  useEffect(() => () => {
    recognitionRef.current?.abort?.();
    stopPolishSpeech();
  }, [phrase.id]);

  const applyTranscript = (transcripts) => {
    const scored = transcripts.map((transcript) => ({ transcript, score: similarity(transcript, phrase.polish) }));
    const best = scored.sort((a, b) => b.score - a.score)[0];
    setResult(best);
    setError("");
    if (best.score >= 0.7) onComplete?.(best.score);
  };

  const startListening = () => {
    if (listening) {
      recognitionRef.current?.stop?.();
      return;
    }
    setError("");
    setResult(null);
    const recognition = listenForPolish({
      onStart: () => setListening(true),
      onEnd: () => {
        setListening(false);
        recognitionRef.current = null;
      },
      onError: (code) => {
        setListening(false);
        setError(speechRecognitionMessage(code));
      },
      onResult: applyTranscript,
    });
    recognitionRef.current = recognition;
    if (!recognition) {
      setDictationOpen(true);
      setError("Live speech checking is not available here. Use your phone keyboard's microphone below instead.");
    }
  };

  const checkDictation = (event) => {
    event.preventDefault();
    if (dictation.trim()) applyTranscript([dictation.trim()]);
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
        <h3 lang="pl">{phrase.polish}</h3>
        <p className="phonetic">{phrase.phonetic}</p>
        <p className="translation">{phrase.english}</p>
      </div>
      {phrase.tip && <div className="tip-line"><Lightbulb size={16} /> {phrase.tip}</div>}
      <div className="pronunciation-actions">
        <AudioButton text={phrase.polish} />
        <button type="button" className={`record-button ${listening ? "is-listening" : ""}`} onClick={startListening} aria-pressed={listening}>
          <span className="record-dot"><Mic size={18} /></span>
          {listening ? "Stop listening" : "Try saying it"}
        </button>
        <button type="button" className="text-button" onClick={() => speakPolish(phrase.polish, 0.58)}><Gauge size={17} /> Slower</button>
        <button type="button" className="text-button dictation-toggle" onClick={() => setDictationOpen((open) => !open)} aria-expanded={dictationOpen}><Keyboard size={17} /> Phone dictation</button>
      </div>
      {listening && <p className="listening-status" role="status"><span aria-hidden="true" /> Listening for Polish… tap again to stop.</p>}
      {dictationOpen && <form className="dictation-input" onSubmit={checkDictation}>
        <label>What did your phone hear?
          <input lang="pl" inputMode="text" enterKeyHint="done" autoComplete="off" autoCapitalize="sentences" autoCorrect="on" spellCheck value={dictation} onChange={(event) => setDictation(event.target.value)} placeholder="Speak or type in Polish" />
        </label>
        <p>On iPhone, tap the microphone on the Polish keyboard, then check the transcript.</p>
        <button className="secondary-button" type="submit" disabled={!dictation.trim()}>Check transcript</button>
      </form>}
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
