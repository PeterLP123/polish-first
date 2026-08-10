import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Eye, Headphones, Lightbulb, RotateCcw, Sparkles, Target, X } from "lucide-react";
import { buildConversationMission, compareMissionDraft, summariseMissionResults } from "../lib/conversation-mission.js";
import AppIcon from "./AppIcon.jsx";
import DiacriticsBar from "./DiacriticsBar.jsx";
import { AudioButton } from "./LearningControls.jsx";

export default function ConversationMission({ dialogue, completionCount = 0, onFinish = () => {}, onChooseScene = () => {}, onChooseSupported = () => {}, onActiveChange = () => {} }) {
  const [phase, setPhase] = useState("briefing");
  const [step, setStep] = useState(0);
  const [results, setResults] = useState([]);
  const [repairQueue, setRepairQueue] = useState([]);
  const [repairCursor, setRepairCursor] = useState(0);
  const [repairResults, setRepairResults] = useState([]);
  const [runOffset, setRunOffset] = useState(0);
  const startingCompletionRef = useRef(completionCount);
  const completionSentRef = useRef(false);
  const briefingHeadingRef = useRef(null);
  const returnToBriefingRef = useRef(false);
  const summaryHeadingRef = useRef(null);
  const mission = useMemo(() => buildConversationMission(dialogue, startingCompletionRef.current + runOffset), [dialogue, runOffset]);
  const summary = summariseMissionResults(results);

  useEffect(() => {
    if (phase === "briefing" && returnToBriefingRef.current) {
      returnToBriefingRef.current = false;
      briefingHeadingRef.current?.focus();
    }
    if (phase === "summary") summaryHeadingRef.current?.focus();
  }, [phase, repairResults.length]);

  const completeOriginalTurn = ({ outcome, modality }) => {
    const result = { turnIndex: step, outcome, modality };
    const nextResults = [...results, result];
    setResults(nextResults);
    if (step < mission.turns.length - 1) {
      setStep((current) => current + 1);
      return;
    }
    const nextSummary = summariseMissionResults(nextResults);
    if (!completionSentRef.current) {
      completionSentRef.current = true;
      onFinish(nextSummary.mistakes, { ...nextSummary, mode: "challenge" });
    }
    setPhase("summary");
  };

  const startRepair = () => {
    const queue = results.filter((result) => result.outcome === "revealed").map((result) => result.turnIndex);
    setRepairQueue(queue);
    setRepairCursor(0);
    setRepairResults([]);
    onActiveChange(true);
    setPhase("repair");
  };

  const completeRepairTurn = ({ outcome, modality }) => {
    const next = [...repairResults, { turnIndex: repairQueue[repairCursor], outcome, modality }];
    setRepairResults(next);
    if (repairCursor < repairQueue.length - 1) setRepairCursor((current) => current + 1);
    else setPhase("summary");
  };

  const exitMission = () => {
    if (completionSentRef.current) setRunOffset((current) => current + 1);
    completionSentRef.current = false;
    returnToBriefingRef.current = true;
    onActiveChange(false);
    setPhase("briefing");
    setStep(0);
    setResults([]);
    setRepairQueue([]);
    setRepairCursor(0);
    setRepairResults([]);
  };

  const replay = () => {
    completionSentRef.current = false;
    returnToBriefingRef.current = true;
    setRunOffset((current) => current + 1);
    setPhase("briefing");
    setStep(0);
    setResults([]);
    setRepairQueue([]);
    setRepairCursor(0);
    setRepairResults([]);
    onActiveChange(false);
  };

  if (phase === "briefing") return (
    <section className="conversation-mission briefing panel" aria-labelledby="mission-briefing-title">
      <div className="mission-briefing-icon"><AppIcon icon={dialogue.icon} /></div>
      <span className="eyebrow red"><Target size={15} /> CONVERSATION MISSION</span>
      <h2 id="mission-briefing-title" ref={briefingHeadingRef} tabIndex="-1">Take away the script</h2>
      <p className="mission-setting">{mission.setting}</p>
      <div className="mission-goal"><span>YOUR GOAL</span><strong>{mission.goal}</strong></div>
      <div className="mission-briefing-actions"><button className="primary-button" onClick={() => { onActiveChange(true); setPhase("turn"); }}>Start Challenge <ArrowRight size={17} /></button><button className="secondary-button" onClick={onChooseSupported}>Use supported walkthrough</button></div>
      <div className="mission-contract"><span><strong>5</strong> real-life turns</span><span><strong>2</strong> natural routes per turn</span><span><strong>1</strong> bounded repair pass</span></div>
      <p>Listen to the other person, form your Polish before revealing a model, and use as much or as little support as you need. No microphone is required.</p>
    </section>
  );

  if (phase === "turn") return (
    <MissionTurn
      key={`turn-${mission.turns[step].id}`}
      turn={mission.turns[step]}
      turnNumber={step + 1}
      total={mission.turns.length}
      goal={mission.goal}
      onExit={exitMission}
      onResolve={completeOriginalTurn}
    />
  );

  if (phase === "repair") {
    const turn = mission.turns[repairQueue[repairCursor]];
    return (
      <MissionTurn
        key={`repair-${turn.id}`}
        turn={turn}
        turnNumber={repairCursor + 1}
        total={repairQueue.length}
        goal={mission.goal}
        repair
        onExit={exitMission}
        onResolve={completeRepairTurn}
      />
    );
  }

  const repaired = repairResults.filter((result) => result.outcome !== "revealed").length;
  const repairFinished = repairQueue.length > 0 && repairResults.length === repairQueue.length;
  return (
    <section className="conversation-mission mission-summary panel" aria-labelledby="mission-summary-title">
      <div className="celebration"><AppIcon icon={repairFinished ? "✨" : "🎯"} /></div>
      <span className="eyebrow red">{repairFinished ? "REPAIR COMPLETE" : "MISSION COMPLETE"}</span>
      <h1 id="mission-summary-title" ref={summaryHeadingRef} tabIndex="-1">{mission.canDo}</h1>
      <p>{repairFinished ? `You retrieved ${repaired} previously modelled ${repaired === 1 ? "turn" : "turns"} once more. Your first-pass result stays honest.` : `You completed all ${summary.total} turns in “${mission.title}”.`}</p>
      <div className="mission-summary-grid">
        <article><strong>{summary.independent}</strong><span>Independent</span><small>No response support</small></article>
        <article><strong>{summary.supported}</strong><span>Supported</span><small>Hint or word tiles</small></article>
        <article><strong>{summary.revealed}</strong><span>Modelled</span><small>Model needed</small></article>
        {repairFinished && <article><strong>{repaired}</strong><span>Repaired</span><small>Recalled on the repair pass</small></article>}
      </div>
      <div className="mission-summary-actions">
        {summary.revealed > 0 && !repairFinished && <button className="primary-button" onClick={startRepair}><RotateCcw size={17} /> Repair {summary.revealed} {summary.revealed === 1 ? "turn" : "turns"}</button>}
        <button className={summary.revealed > 0 && !repairFinished ? "secondary-button" : "primary-button"} onClick={() => { onActiveChange(false); onChooseScene(); }}>Choose another scene</button>
        <button className="text-button" onClick={replay}><RotateCcw size={16} /> Run this mission again</button>
      </div>
    </section>
  );
}

function MissionTurn({ turn, turnNumber, total, goal, repair = false, onExit, onResolve }) {
  const [draft, setDraft] = useState("");
  const [hintLevel, setHintLevel] = useState(0);
  const [incomingHelp, setIncomingHelp] = useState(false);
  const [comparison, setComparison] = useState(null);
  const inputRef = useRef(null);
  const firstTileRef = useRef(null);
  const headingRef = useRef(null);
  const modelRef = useRef(null);
  const resolvedRef = useRef(false);

  useEffect(() => {
    document.scrollingElement?.scrollTo({ top: 0, behavior: "auto" });
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => { if (comparison) modelRef.current?.focus(); }, [comparison]);

  const compare = (kind) => {
    if (comparison) return;
    const draftResult = draft.trim() ? compareMissionDraft(turn, draft.trim()) : null;
    setComparison({ kind, draftResult });
  };

  const resolve = (outcome) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    onResolve({ outcome, modality: comparison?.kind ?? "model" });
  };

  const addTile = (word) => {
    setDraft((current) => `${current.trim()}${current.trim() ? " " : ""}${word}`);
  };

  const revealNextHint = () => {
    if (hintLevel === 0) {
      setHintLevel(1);
      return;
    }
    setHintLevel(2);
    window.requestAnimationFrame(() => firstTileRef.current?.focus());
  };

  const workedOutcome = hintLevel > 0 ? "supported" : "independent";
  const promptId = `mission-turn-${turn.index + 1}-prompt`;
  return (
    <section className={`conversation-mission mission-turn panel ${repair ? "repair" : ""}`} aria-labelledby={promptId}>
      <header className="mission-turn-header">
        <button className="text-button mission-exit" onClick={onExit}><X size={17} /> Exit mission</button>
        <span className="eyebrow red">{repair ? "REPAIR FROM MEMORY" : "CHALLENGE MODE"}</span>
        <span>{repair ? "Repair" : "Turn"} {turnNumber} of {total}</span>
      </header>
      <div className="dialogue-progress" role="progressbar" aria-label={repair ? "Conversation repair progress" : "Conversation mission progress"} aria-valuemin="1" aria-valuemax={total} aria-valuenow={turnNumber}><span style={{ width: `${(turnNumber / total) * 100}%` }} /></div>

      <article className="mission-incoming">
        <div className="chat-avatar">{turn.incoming.speaker.charAt(0)}</div>
        <div><small><Headphones size={14} /> {turn.incoming.speaker} says</small><div className="mission-incoming-line"><h1 id={promptId} ref={headingRef} tabIndex="-1" lang="pl">{turn.incoming.polish}</h1><AudioButton text={turn.incoming.polish} compact /></div>{incomingHelp && <div className="mission-incoming-help"><p className="phonetic">{turn.incoming.phonetic}</p><span>{turn.incoming.english}</span></div>}<button className="text-button" aria-expanded={incomingHelp} onClick={() => setIncomingHelp((value) => !value)}><Eye size={16} /> {incomingHelp ? "Hide meaning & sound guide" : "Show meaning & sound guide"}</button></div>
      </article>

      <div className="mission-response" aria-labelledby="mission-intention-heading">
        <span className="eyebrow">YOUR INTENTION</span>
        <h2 id="mission-intention-heading">Say in Polish: “{turn.cue}”</h2>
        <p>Say it aloud first. Then compare directly, or type a draft to put the words under more pressure.</p>
        {!comparison && <>
          <label className="mission-draft">Optional Polish draft<textarea ref={inputRef} rows="2" lang="pl" inputMode="text" enterKeyHint="done" autoComplete="off" autoCapitalize="sentences" autoCorrect="on" spellCheck value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Say it, type it, or use your Polish keyboard microphone" /></label>
          <DiacriticsBar inputRef={inputRef} value={draft} onChange={setDraft} />
          {!repair && hintLevel >= 1 && <div className="mission-hint" role="status"><Lightbulb size={17} /><span>The model starts with <strong lang="pl">{turn.firstWord}</strong> and uses {turn.wordCount} {turn.wordCount === 1 ? "word" : "words"}.</span></div>}
          {!repair && hintLevel >= 2 && <div className="mission-word-tiles" aria-label="Model word tiles">{turn.tiles.map((tile, index) => <button ref={index === 0 ? firstTileRef : undefined} type="button" key={tile.id} onClick={() => addTile(tile.word)}>{tile.word}</button>)}</div>}
          <div className="mission-response-actions">
            <button className="primary-button" disabled={!draft.trim()} onClick={() => compare("draft")}><Check size={17} /> Compare my Polish</button>
            <button className="secondary-button" onClick={() => compare("spoken")}>I answered aloud — compare</button>
            {!repair && hintLevel < 2 && <button className="text-button" onClick={revealNextHint}><Lightbulb size={16} /> {hintLevel === 0 ? "Give me a hint" : "Show word tiles"}</button>}
            <button className="text-button" onClick={() => compare("model")}><Eye size={16} /> Show me a model</button>
          </div>
        </>}
      </div>

      {comparison && <section className="mission-model" aria-labelledby="mission-model-heading">
        <div className="mission-model-heading"><span className="eyebrow red">AUTHORED MODEL</span><h3 id="mission-model-heading" ref={modelRef} tabIndex="-1">Compare meaning, then form</h3></div>
        {comparison.draftResult && <div className="mission-draft-result"><strong>{comparison.draftResult.percent}% closest model match</strong><span>{comparison.draftResult.diacriticsOnly ? "The words match when Polish marks are ignored." : "This compares your text with one natural model, not every valid Polish answer."}</span></div>}
        <article className="mission-model-card primary"><AudioButton text={turn.target.polish} compact /><div><strong lang="pl">{turn.target.polish}</strong><span className="phonetic">{turn.target.phonetic}</span><small>{turn.target.english}</small></div></article>
        <article className="mission-model-card alternative"><AudioButton text={turn.alternative.polish} compact /><div><span>ANOTHER NATURAL RESPONSE</span><strong lang="pl">{turn.alternative.polish}</strong><small>{turn.alternative.english}</small></div></article>
        <div className="mission-coaching"><Sparkles size={18} /><p><strong>Why it works</strong>Both responses answer “{turn.incoming.english}” and keep you moving towards this mission: {goal}</p></div>
        {comparison.kind === "model" ? <button className="primary-button mission-continue" onClick={() => resolve("revealed")}>I’ve studied the model <ArrowRight size={17} /></button> : <div className="mission-self-check"><span>How did your response compare?</span><button className="primary-button" onClick={() => resolve(workedOutcome)}><Check size={17} /> {repair ? "I recalled it this time" : "My response worked"}</button><button className="secondary-button" onClick={() => resolve("revealed")}>{repair ? "I still needed the model" : "I needed the model"}</button></div>}
      </section>}
    </section>
  );
}
