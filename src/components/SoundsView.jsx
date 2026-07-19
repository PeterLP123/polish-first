import { useEffect, useRef, useState } from "react";
import { AudioLines, Check, ChevronRight, Ear, Lightbulb, Mic, Play, RotateCcw, Volume2, X } from "lucide-react";
import { allPhrases, soundLessons } from "../data/course.js";
import { listPolishVoices, preferredPolishVoiceName, setPreferredPolishVoice, speakPolish } from "../lib/speech.js";
import AppIcon from "./AppIcon.jsx";
import { AudioButton } from "./LearningControls.jsx";

// Classic hard/soft traps, one spoken word per round. Words chosen to be common
// and unambiguous for speech synthesis; the gloss is revealed after answering.
const MINIMAL_PAIRS = [
  { a: { sound: "CZ", word: "czas", english: "time" }, b: { sound: "Ć", word: "ćma", english: "moth" } },
  { a: { sound: "SZ", word: "sześć", english: "six" }, b: { sound: "Ś", word: "sieć", english: "net" } },
  { a: { sound: "Ż", word: "żona", english: "wife" }, b: { sound: "Ź", word: "zima", english: "winter" } },
  { a: { sound: "DZ", word: "dzwon", english: "bell" }, b: { sound: "DŻ", word: "dżem", english: "jam" } },
  { a: { sound: "Ł", word: "łza", english: "a tear" }, b: { sound: "W", word: "wiza", english: "visa" } },
];

function buildPairsDeck() {
  return MINIMAL_PAIRS.map((pair) => ({ pair, side: Math.random() < 0.5 ? "a" : "b" })).sort(() => Math.random() - 0.5);
}

function MinimalPairsDrill({ award }) {
  const [deck, setDeck] = useState(null);
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const item = deck?.[round];
  const played = item ? item.pair[item.side] : null;
  const isLastRound = deck ? round === deck.length - 1 : false;

  const start = () => {
    const nextDeck = buildPairsDeck();
    setDeck(nextDeck);
    setRound(0);
    setPicked(null);
    setScore(0);
    setDone(false);
    speakPolish(nextDeck[0].pair[nextDeck[0].side].word, 0.72);
  };

  const choose = (side) => {
    if (picked) return;
    setPicked(side);
    if (side === item.side) setScore((current) => current + 1);
  };

  const next = () => {
    if (isLastRound) {
      const finalScore = score;
      setDone(true);
      award({ xp: 4 + finalScore * 2, minutes: 2 }, `Listening drill · ${finalScore} of ${deck.length} right`);
      return;
    }
    const nextRound = round + 1;
    setRound(nextRound);
    setPicked(null);
    const nextItem = deck[nextRound];
    speakPolish(nextItem.pair[nextItem.side].word, 0.72);
  };

  return (
    <section className="pairs-drill panel" aria-label="Minimal pairs listening drill">
      <div className="pairs-drill-copy">
        <span className="eyebrow red"><Ear size={14} /> LISTENING DRILL</span>
        <h2>Hear the difference</h2>
        <p>Five quick rounds, straight from the trickiest corners of the sound code. Hear a word, then tap the sound it starts with.</p>
      </div>
      {!deck && <button className="primary-button pairs-start" onClick={start}><Play size={18} fill="currentColor" /> Start the drill</button>}
      {deck && !done && item && (
        <div className="pairs-round">
          <div className="practice-topline"><span>Round {round + 1} of {deck.length}</span><div className="mini-progress"><span style={{ width: `${(round / deck.length) * 100}%` }} /></div><span>{score} right</span></div>
          <button className="big-listen pairs-listen" onClick={() => speakPolish(played.word, 0.72)}><span><Volume2 size={22} /></span>{picked ? "Hear it again" : "Play the word"}</button>
          <div className="answer-grid pairs-options">
            {["a", "b"].map((side) => {
              const option = item.pair[side];
              const state = !picked ? "" : side === item.side ? "correct" : side === picked ? "wrong" : "muted";
              return <button key={side} className={state} disabled={Boolean(picked)} onClick={() => choose(side)}><span><strong className="pairs-sound">{option.sound}</strong></span></button>;
            })}
          </div>
          {picked && (
            <div className={`quiz-feedback ${picked === item.side ? "correct" : "wrong"}`} role="status">
              <span className="feedback-icon">{picked === item.side ? <Check size={19} /> : <X size={19} />}</span>
              <div><strong lang="pl">{played.word}</strong> — {played.english}<p>Starts with <strong>{played.sound}</strong>. The other word was {item.pair[item.side === "a" ? "b" : "a"].word}.</p></div>
              <button className="primary-button" onClick={next}>{isLastRound ? "Finish" : "Next"}</button>
            </div>
          )}
        </div>
      )}
      {done && (
        <div className="pairs-result" role="status">
          <strong>{score}<small>/ {deck.length}</small></strong>
          <p>{score === deck.length ? "Perfect ears. The hard/soft line is yours." : score >= deck.length - 2 ? "Close. Replay the sounds above and try again." : "Those pairs are genuinely hard. Pick the sounds above, listen, then retry."}</p>
          <button className="secondary-button" onClick={start}><RotateCcw size={17} /> Play again</button>
        </div>
      )}
    </section>
  );
}

function VoicePicker() {
  const [voices, setVoices] = useState(listPolishVoices);
  const [choice, setChoice] = useState(() => preferredPolishVoiceName() ?? "");

  useEffect(() => {
    const engine = window.speechSynthesis;
    if (!engine?.addEventListener) return undefined;
    const refresh = () => setVoices(listPolishVoices());
    engine.addEventListener("voiceschanged", refresh);
    return () => engine.removeEventListener("voiceschanged", refresh);
  }, []);

  const select = (name) => {
    setChoice(name);
    setPreferredPolishVoice(name || null);
    speakPolish("Dzień dobry! Miło mi.");
  };

  if (!window.speechSynthesis) return null;

  return (
    <section className="voice-bar panel" aria-label="Polish audio voice">
      <span className="voice-bar-icon" aria-hidden="true"><AudioLines size={20} /></span>
      <div className="voice-bar-copy"><strong>Polish audio voice</strong><span>{voices.length ? "Choosing a voice plays a short sample. Voices come from this device and browser." : "This browser has no Polish voice installed, so audio uses its closest default."}</span></div>
      {voices.length > 0 && (
        <label className="practice-filter voice-bar-select">
          <span className="sr-only">Choose a Polish voice</span>
          <select value={choice} onChange={(event) => select(event.target.value)}>
            <option value="">Automatic (best available)</option>
            {voices.map((voice) => <option key={voice.name} value={voice.name}>{voice.name}{voice.localService ? " · on-device" : ""}</option>)}
          </select>
        </label>
      )}
    </section>
  );
}

export default function SoundsView({ award }) {
  const [selected, setSelected] = useState(soundLessons[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);
  const pickerTriggerRef = useRef(null);
  const related = allPhrases.filter((phrase) => selected.examples.some((example) => phrase.polish.toLowerCase().includes(example.toLowerCase()))).slice(0, 5);
  const fallback = related.length ? related : allPhrases.filter((phrase) => phrase.polish.toLowerCase().includes(selected.sound.toLowerCase().charAt(0))).slice(0, 5);

  useEffect(() => {
    if (!pickerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    pickerRef.current?.querySelector("button")?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPickerOpen(false);
        pickerTriggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = [...(pickerRef.current?.querySelectorAll('button:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? [])];
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
      if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey, true);
    };
  }, [pickerOpen]);

  const closePicker = (restoreFocus = false) => {
    setPickerOpen(false);
    if (restoreFocus) window.setTimeout(() => pickerTriggerRef.current?.focus(), 0);
  };

  return (
    <div className="view-stack sounds-page">
      <header className="page-header"><div><span className="eyebrow red"><Mic size={15} /> POLISH SOUND LAB</span><h1>Make Polish feel speakable</h1><p>The spelling is consistent once you know the code. Choose a sound, hear it in context, and repeat.</p></div><div className="sound-wave" aria-hidden="true">{[1,2,3,4,5,6,7].map((n) => <i key={n} />)}</div></header>
      <VoicePicker />
      <button ref={pickerTriggerRef} className="mobile-picker-trigger panel" onClick={() => setPickerOpen(true)} aria-haspopup="dialog" aria-expanded={pickerOpen}><span><small>SELECTED SOUND</small><strong>{selected.sound} · {selected.like}</strong></span><span>Change <ChevronRight size={17} /></span></button>
      <div className="sound-layout">
        {pickerOpen && <button className="sheet-scrim sound-picker-scrim" onClick={() => closePicker(true)} aria-label="Close sound picker" />}
        <aside ref={pickerRef} className={`sound-list panel ${pickerOpen ? "open" : ""}`} role={pickerOpen ? "dialog" : undefined} aria-modal={pickerOpen || undefined} aria-label="Choose a Polish sound"><div className="picker-heading"><span><span className="eyebrow">THE SOUND CODE</span><strong>Choose a sound</strong></span><button className="icon-button picker-close" onClick={() => closePicker(true)} aria-label="Close sound picker"><X size={19} /></button></div>{soundLessons.map((sound) => <button key={sound.sound} className={selected.sound === sound.sound ? "active" : ""} onClick={() => { setSelected(sound); closePicker(true); }}><strong>{sound.sound}</strong><span>{sound.like}</span><ChevronRight size={17} /></button>)}</aside>
        <section className="sound-detail" aria-label={`${selected.sound} sound lesson`}>
          <div className="sound-hero">
            <div className="sound-letter">{selected.sound}</div>
            <div><span className="eyebrow light">SOUNDS LIKE</span><h2>{selected.like}</h2><p>{selected.tip}</p></div>
          </div>
          <div className="example-sounds">
            {selected.examples.map((example) => <button key={example} onClick={() => speakPolish(example, 0.7)}><Volume2 size={17} /><strong lang="pl">{example}</strong></button>)}
          </div>
          <div className="mouth-tip"><span><AppIcon icon="👄" /></span><div><strong>Mouth cue</strong><p>{selected.tip}</p></div></div>
          <div className="section-heading-row compact"><div><span className="eyebrow">TRY IT IN A PHRASE</span><h2>Hear the sound doing real work</h2></div></div>
          <div className="sound-phrases">
            {fallback.map((phrase) => <article key={phrase.id}><AudioButton text={phrase.polish} compact /><div><strong lang="pl">{phrase.polish}</strong><span className="phonetic">{phrase.phonetic}</span><small>{phrase.english}</small></div><button className="tiny-mic" onClick={() => award({ xp: 3, phraseId: phrase.id }, "+3 XP · Spoken aloud")} aria-label={`Mark ${phrase.polish} as spoken`}><Mic size={16} /></button></article>)}
          </div>
          <div className="sound-note"><Lightbulb size={18} /><p><strong>A useful approximation, not a replacement for listening.</strong> English respellings get you confidently close. Polish audio trains the details your ears need.</p></div>
        </section>
      </div>
      <MinimalPairsDrill award={award} />
    </div>
  );
}
