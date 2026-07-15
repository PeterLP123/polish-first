import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronRight, MessageCircle, RotateCcw, Search, X } from "lucide-react";
import { dialogues } from "../data/course.js";
import { AudioButton } from "./LearningControls.jsx";

export default function DialoguesView({ progress, onCorrect, onCompleteDialogue }) {
  const [selected, setSelected] = useState(dialogues[0]);
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);
  const triggerRef = useRef(null);
  const normalizedQuery = query.trim().toLocaleLowerCase("pl");
  const visibleDialogues = dialogues.filter((dialogue) => `${dialogue.title} ${dialogue.setting}`.toLocaleLowerCase("pl").includes(normalizedQuery));

  useEffect(() => {
    if (!pickerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    pickerRef.current?.querySelector("input")?.focus();
    const close = (event) => {
      if (event.key === "Escape") {
        setPickerOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", close); };
  }, [pickerOpen]);

  const choose = (dialogue) => {
    setSelected(dialogue);
    setPickerOpen(false);
    setQuery("");
    window.setTimeout(() => triggerRef.current?.focus({ preventScroll: true }), 0);
  };

  return (
    <div className="view-stack dialogues-page">
      <header className="page-header"><div><span className="eyebrow red"><MessageCircle size={15} /> CONVERSATION PRACTICE</span><h1>Choose what you would say</h1><p>Low-pressure branching scenes for the moments you are most likely to meet first.</p></div></header>
      <div className="dialogue-workspace">
        {pickerOpen && <button className="sheet-scrim dialogue-picker-scrim" onClick={() => setPickerOpen(false)} aria-label="Close scene picker" />}
        <aside ref={pickerRef} className={`dialogue-library panel ${pickerOpen ? "open" : ""}`} role={pickerOpen ? "dialog" : undefined} aria-modal={pickerOpen || undefined} aria-label="Choose a conversation scene">
          <div className="picker-heading"><span><span className="eyebrow">SCENE LIBRARY</span><strong>{dialogues.length} real-life situations</strong></span><button className="icon-button picker-close" onClick={() => setPickerOpen(false)} aria-label="Close scene picker"><X size={19} /></button></div>
          <label className="dialogue-search"><Search size={18} /><span className="sr-only">Search conversation scenes</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search scenes…" aria-label="Search conversation scenes" /></label>
          <div className="dialogue-list">
            {visibleDialogues.map((dialogue) => {
              const stats = progress.dialogueStats?.[dialogue.id];
              return <button key={dialogue.id} className={dialogue.id === selected.id ? "active" : ""} aria-current={dialogue.id === selected.id ? "true" : undefined} onClick={() => choose(dialogue)}><span className="scene-list-icon">{dialogue.icon}</span><span><strong>{dialogue.title}</strong><small>{stats ? `${stats.completions} complete · best ${stats.bestMistakes} retries` : `${dialogue.lines.length} turns · Not tried yet`}</small></span><ChevronRight size={17} /></button>;
            })}
            {!visibleDialogues.length && <p className="dialogue-empty">No matching scene. Try a shorter search.</p>}
          </div>
        </aside>
        <div className="dialogue-active">
          <div className="active-scene-bar panel"><span className="scene-list-icon">{selected.icon}</span><span><small>ACTIVE SCENE</small><strong>{selected.title}</strong><em>{selected.setting}</em></span><button ref={triggerRef} className="secondary-button" onClick={() => setPickerOpen(true)} aria-haspopup="dialog">Change scene <ChevronRight size={17} /></button></div>
          <DialoguePlayer key={selected.id} dialogue={selected} onCorrect={onCorrect} onFinish={(mistakes) => onCompleteDialogue(selected.id, mistakes)} />
        </div>
      </div>
    </div>
  );
}

export function DialoguePlayer({ dialogue, onCorrect, onFinish, embedded = false }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const done = step >= dialogue.lines.length;

  if (done) return (
    <section className={`dialogue-complete panel ${embedded ? "embedded" : ""}`}><div className="celebration">🎉</div><span className="eyebrow red">SCENE COMPLETE</span><h2>Rozmowa zakończona!</h2><p>You made it through “{dialogue.title}” with {mistakes ? `${mistakes} useful ${mistakes === 1 ? "retry" : "retries"}` : "no retries"}.</p>{!embedded && <button className="primary-button" onClick={() => { setStep(0); setSelected(null); setMistakes(0); }}><RotateCcw size={17} /> Play again</button>}</section>
  );

  const line = dialogue.lines[step];
  const choose = (choice, index) => {
    setSelected(index);
    if (!choice.good) setMistakes((current) => current + 1);
    if (choice.good) onCorrect?.();
  };
  const advance = () => {
    const nextStep = step + 1;
    setStep(nextStep);
    setSelected(null);
    if (nextStep >= dialogue.lines.length) onFinish?.(mistakes);
  };
  const selectedChoice = selected === null ? null : line.choices[selected];

  return (
    <section className={`dialogue-stage ${embedded ? "embedded" : ""}`}>
      <div className="scene-header"><div><span className="scene-icon">{dialogue.icon}</span><span><strong>{dialogue.title}</strong><small>{dialogue.setting}</small></span></div><span>Turn {step + 1} of {dialogue.lines.length}</span></div>
      <div className="dialogue-progress"><span style={{ width: `${((step + 1) / dialogue.lines.length) * 100}%` }} /></div>
      <div className="chat-window"><div className="chat-avatar">{line.speaker.charAt(0)}</div><div className="chat-bubble"><small>{line.speaker} says</small><div><h2>{line.polish}</h2><AudioButton text={line.polish} compact /></div><p className="phonetic">{line.phonetic}</p><span>{line.english}</span></div></div>
      <div className="response-area"><span className="eyebrow">HOW DO YOU RESPOND?</span><div className="response-options">{line.choices.map((choice, index) => <button key={choice.polish} className={selected === index ? (choice.good ? "correct" : "wrong") : selectedChoice?.good ? "muted" : ""} onClick={() => selectedChoice?.good ? null : choose(choice, index)}><span><strong>{choice.polish}</strong>{choice.phonetic && <em>{choice.phonetic}</em>}<small>{choice.english}</small></span>{selected === index && (choice.good ? <Check /> : <X />)}</button>)}</div></div>
      {selectedChoice && <div className={`choice-feedback ${selectedChoice.good ? "correct" : "wrong"}`} role="status"><div><strong>{selectedChoice.good ? "Natural choice" : "That would be an unexpected reply"}</strong><p>{selectedChoice.good ? "You matched the situation and kept the conversation moving." : "Try another response — meaning matters more than perfection."}</p></div>{selectedChoice.good && <button className="primary-button" onClick={advance}>Continue <ArrowRight size={17} /></button>}</div>}
    </section>
  );
}
