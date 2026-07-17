import { useEffect, useRef, useState } from "react";
import { AudioLines, ChevronRight, Lightbulb, Mic, Volume2, X } from "lucide-react";
import { allPhrases, soundLessons } from "../data/course.js";
import { listPolishVoices, preferredPolishVoiceName, setPreferredPolishVoice, speakPolish } from "../lib/speech.js";
import { AudioButton } from "./LearningControls.jsx";

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
          <div className="mouth-tip"><span>👄</span><div><strong>Mouth cue</strong><p>{selected.tip}</p></div></div>
          <div className="section-heading-row compact"><div><span className="eyebrow">TRY IT IN A PHRASE</span><h2>Hear the sound doing real work</h2></div></div>
          <div className="sound-phrases">
            {fallback.map((phrase) => <article key={phrase.id}><AudioButton text={phrase.polish} compact /><div><strong lang="pl">{phrase.polish}</strong><span className="phonetic">{phrase.phonetic}</span><small>{phrase.english}</small></div><button className="tiny-mic" onClick={() => award({ xp: 3, phraseId: phrase.id }, "+3 XP · Spoken aloud")} aria-label={`Mark ${phrase.polish} as spoken`}><Mic size={16} /></button></article>)}
          </div>
          <div className="sound-note"><Lightbulb size={18} /><p><strong>A useful approximation, not a replacement for listening.</strong> English respellings get you confidently close. Polish audio trains the details your ears need.</p></div>
        </section>
      </div>
    </div>
  );
}
