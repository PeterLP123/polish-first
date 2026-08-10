import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronRight, MessageCircle, RotateCcw, Search, X } from "lucide-react";
import { dialogues, units } from "../data/course.js";
import { STAGES } from "../data/content/schema.js";
import { AudioButton } from "./LearningControls.jsx";
import AppIcon from "./AppIcon.jsx";
import ConversationMission from "./ConversationMission.jsx";

export default function DialoguesView({ progress, onCorrect, onCompleteDialogue, onMissionStateChange = () => {}, onPickerStateChange = () => {} }) {
  const [selected, setSelected] = useState(dialogues[0]);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("Recommended");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [mode, setMode] = useState("challenge");
  const [missionActive, setMissionActive] = useState(false);
  const [focusSupported, setFocusSupported] = useState(false);
  const pickerRef = useRef(null);
  const triggerRef = useRef(null);
  const supportedModeRef = useRef(null);
  const missionStateCallbackRef = useRef(onMissionStateChange);
  const pickerStateCallbackRef = useRef(onPickerStateChange);
  const nextUnit = units.find((unit) => !progress.completedUnits.includes(unit.id)) ?? units.at(-1);
  const currentStageIndex = Math.max(0, STAGES.indexOf(nextUnit.stage));
  const normalizedQuery = query.trim().toLocaleLowerCase("pl");
  const visibleDialogues = dialogues.filter((dialogue) => {
    const inScope = scope === "Entire library" || (scope === "Recommended" ? STAGES.indexOf(dialogue.stage) <= currentStageIndex : dialogue.stage === scope);
    return inScope && `${dialogue.title} ${dialogue.setting} ${dialogue.stage} ${dialogue.mission.goal}`.toLocaleLowerCase("pl").includes(normalizedQuery);
  });

  const closePicker = (restoreFocus = false) => {
    setPickerOpen(false);
    onPickerStateChange(false);
    if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const openPicker = () => {
    setPickerOpen(true);
    onPickerStateChange(true);
  };

  useEffect(() => {
    missionStateCallbackRef.current = onMissionStateChange;
    pickerStateCallbackRef.current = onPickerStateChange;
  }, [onMissionStateChange, onPickerStateChange]);
  useEffect(() => () => {
    pickerStateCallbackRef.current(false);
    missionStateCallbackRef.current(false);
  }, []);

  useEffect(() => {
    if (!pickerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    pickerRef.current?.querySelector("input")?.focus();
    const close = (event) => {
      if (event.key === "Escape") {
        closePicker(true);
        return;
      }
      if (event.key !== "Tab") return;
      const controls = [...(pickerRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])') ?? [])]
        .filter((control) => control.getClientRects().length > 0 && control.getAttribute("aria-hidden") !== "true");
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
      if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
    };
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", close); };
  }, [pickerOpen]);

  const choose = (dialogue) => {
    setSelected(dialogue);
    setFocusSupported(false);
    setPickerOpen(false);
    onPickerStateChange(false);
    setQuery("");
    window.setTimeout(() => triggerRef.current?.focus({ preventScroll: true }), 0);
  };

  const changeMissionState = (active) => {
    setMissionActive(active);
    onMissionStateChange(active);
  };

  const startSupported = () => {
    setFocusSupported(true);
    setMode("supported");
    changeMissionState(true);
  };

  const exitSupported = () => {
    setFocusSupported(false);
    setMode("challenge");
    changeMissionState(false);
    window.setTimeout(() => supportedModeRef.current?.focus({ preventScroll: true }), 0);
  };

  return (
    <div className={`view-stack dialogues-page ${missionActive ? "mission-active" : ""}`}>
      <header className="page-header" inert={pickerOpen}><div><span className="eyebrow red"><MessageCircle size={15} /> CONVERSATION PRACTICE</span><h1>Train the conversation, then take away the script</h1><p>Start with authored support or produce the Polish yourself in a five-turn real-life mission.</p></div></header>
      <div className="dialogue-workspace">
        {pickerOpen && <div className="sheet-scrim dialogue-picker-scrim" onClick={() => closePicker(true)} aria-hidden="true" />}
        <section ref={pickerRef} className={`dialogue-library panel ${pickerOpen ? "open" : ""}`} role={pickerOpen ? "dialog" : undefined} aria-modal={pickerOpen || undefined} aria-label="Choose a conversation scene">
          <div className="picker-heading"><span><span className="eyebrow">SCENE LIBRARY</span><strong>{visibleDialogues.length} {scope === "Recommended" ? "recommended" : "matching"} situations</strong></span><button className="icon-button picker-close" onClick={() => closePicker(true)} aria-label="Close scene picker"><X size={19} /></button></div>
          <label className="dialogue-search"><Search size={18} /><span className="sr-only">Search conversation scenes</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search scenes…" aria-label="Search conversation scenes" /></label>
          <label className="dialogue-stage-filter"><span>Level</span><select value={scope} onChange={(event) => setScope(event.target.value)}><option>Recommended</option>{STAGES.map((stage) => <option key={stage}>{stage}</option>)}<option>Entire library</option></select></label>
          <div className="dialogue-list">
            {visibleDialogues.map((dialogue) => {
              const stats = progress.dialogueStats?.[dialogue.id];
              return <button key={dialogue.id} className={dialogue.id === selected.id ? "active" : ""} aria-current={dialogue.id === selected.id ? "true" : undefined} onClick={() => choose(dialogue)}><span className="scene-list-icon"><AppIcon icon={dialogue.icon} /></span><span><strong>{dialogue.title}</strong><small>{dialogue.stage} · {stats ? `${stats.completions} ${stats.completions === 1 ? "completion" : "completions"} · best ${stats.bestMistakes} ${stats.bestMistakes === 1 ? "retry" : "retries"}` : "Not tried yet"}</small></span><ChevronRight size={17} /></button>;
            })}
            {!visibleDialogues.length && <div className="dialogue-empty"><p>No matching scene. Try a shorter search or another level.</p><button className="secondary-button" onClick={() => { setQuery(""); setScope("Recommended"); }}>Clear filters</button></div>}
          </div>
        </section>
        <div className="dialogue-active" inert={pickerOpen}>
          <div className="active-scene-bar panel"><span className="scene-list-icon"><AppIcon icon={selected.icon} /></span><span><small>ACTIVE SCENE</small><strong>{selected.title}</strong><em>{selected.setting}</em><span className="active-scene-stage">{selected.stage}</span></span><button ref={triggerRef} className="secondary-button" onClick={openPicker} aria-haspopup="dialog">Change scene <ChevronRight size={17} /></button></div>
          <section className="conversation-mode-bar panel" aria-label="Conversation practice mode"><div><span className="eyebrow">HOW DO YOU WANT TO PRACTISE?</span><strong>{mode === "challenge" ? "Challenge · produce before reveal" : "Supported · choose with every guide visible"}</strong><p>{selected.mission.goal}</p></div><div className="conversation-mode-buttons" role="group" aria-label="Choose conversation mode"><button className={mode === "challenge" ? "active" : ""} aria-pressed={mode === "challenge"} onClick={() => { setFocusSupported(false); setMode("challenge"); }}>Challenge <small>Polish first</small></button><button ref={supportedModeRef} className={mode === "supported" ? "active" : ""} aria-pressed={mode === "supported"} onClick={startSupported}>Supported <small>Choices visible</small></button></div></section>
          {mode === "challenge"
            ? <ConversationMission key={`${selected.id}-challenge`} dialogue={selected} completionCount={progress.dialogueStats?.[selected.id]?.completions ?? 0} onFinish={(mistakes, summary) => onCompleteDialogue(selected.id, mistakes, summary)} onChooseScene={openPicker} onChooseSupported={startSupported} onActiveChange={changeMissionState} />
            : <DialoguePlayer key={`${selected.id}-supported`} dialogue={selected} autoFocus={focusSupported} onExit={exitSupported} onCorrect={onCorrect} onFinish={(mistakes) => onCompleteDialogue(selected.id, mistakes)} />}
        </div>
      </div>
    </div>
  );
}

export function DialoguePlayer({ dialogue, onCorrect, onFinish, onExit, embedded = false, autoFocus = false }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const headingRef = useRef(null);
  const continueRef = useRef(null);
  const done = step >= dialogue.lines.length;
  const FocusHeading = onExit ? "h1" : "h2";

  useEffect(() => { if (autoFocus) headingRef.current?.focus(); }, [autoFocus, step]);

  if (done) return (
    <section className={`dialogue-complete panel ${embedded ? "embedded" : ""}`}><div className="celebration"><AppIcon icon="🎉" /></div><span className="eyebrow red">SCENE COMPLETE</span><FocusHeading ref={headingRef} tabIndex={autoFocus ? -1 : undefined}>Rozmowa zakończona!</FocusHeading><p>You made it through “{dialogue.title}” with {mistakes ? `${mistakes} useful ${mistakes === 1 ? "retry" : "retries"}` : "no retries"}.</p>{!embedded && <div className="dialogue-complete-actions"><button className="primary-button" onClick={() => { setStep(0); setSelected(null); setMistakes(0); }}><RotateCcw size={17} /> Play again</button>{onExit && <button className="secondary-button" onClick={onExit}>Back to conversation modes</button>}</div>}</section>
  );

  const line = dialogue.lines[step];
  const choose = (choice, index) => {
    setSelected(index);
    if (!choice.good) setMistakes((current) => current + 1);
    if (choice.good) {
      onCorrect?.();
      window.setTimeout(() => continueRef.current?.focus(), 0);
    }
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
      {onExit && <header className="supported-focus-bar"><button className="text-button" onClick={onExit}><X size={17} /> Exit walkthrough</button><span className="eyebrow red">SUPPORTED MODE</span></header>}
      <div className="scene-header"><div><span className="scene-icon"><AppIcon icon={dialogue.icon} /></span><span><strong>{dialogue.title}</strong><small>{dialogue.setting}</small></span></div><span>Turn {step + 1} of {dialogue.lines.length}</span></div>
      <div className="dialogue-progress"><span style={{ width: `${((step + 1) / dialogue.lines.length) * 100}%` }} /></div>
      <div className="chat-window"><div className="chat-avatar">{line.speaker.charAt(0)}</div><div className="chat-bubble"><small>{line.speaker} says</small><div><FocusHeading ref={headingRef} tabIndex={autoFocus ? -1 : undefined} lang="pl">{line.polish}</FocusHeading><AudioButton text={line.polish} compact /></div><p className="phonetic">{line.phonetic}</p><span>{line.english}</span></div></div>
      <div className="response-area"><span className="eyebrow">HOW DO YOU RESPOND?</span><div className="response-options">{line.choices.map((choice, index) => <button key={choice.polish} className={selected === index ? (choice.good ? "correct" : "wrong") : selectedChoice?.good ? "muted" : ""} aria-pressed={selected === index} disabled={Boolean(selectedChoice?.good)} onClick={() => choose(choice, index)}><span><strong lang="pl">{choice.polish}</strong>{choice.phonetic && <em>{choice.phonetic}</em>}<small>{choice.english}</small></span>{selected === index && (choice.good ? <Check /> : <X />)}</button>)}</div></div>
      {selectedChoice && <div className={`choice-feedback ${selectedChoice.good ? "correct" : "wrong"}`} role="status"><div><strong>{selectedChoice.good ? "Natural choice" : "That changes the subject"}</strong><p>{selectedChoice.good ? `“${selectedChoice.english}” answers “${line.english}” and keeps the exchange moving.` : `The other person just said “${line.english}”. Choose a reply that responds to that situation.`}</p></div>{selectedChoice.good && <button ref={continueRef} className="primary-button" onClick={advance}>Continue <ArrowRight size={17} /></button>}</div>}
    </section>
  );
}
