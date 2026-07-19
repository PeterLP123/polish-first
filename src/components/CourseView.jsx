import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, ChevronRight, GraduationCap, Headphones, Play, Search } from "lucide-react";
import { allPhrases, courseTopics, units } from "../data/course.js";
import AppIcon from "./AppIcon.jsx";
import ProgressRing from "./ProgressRing.jsx";

function UnitCard({ unit, progress, onOpenUnit, highlight = false }) {
  const done = progress.completedUnits.includes(unit.id);
  const learned = unit.phrases.filter((phrase) => progress.learnedPhrases.includes(phrase.id)).length;
  const percent = Math.round((learned / unit.phrases.length) * 100);
  return (
    <article className={`unit-card ${done ? "completed" : ""} ${highlight ? "frontier-highlight" : ""}`} id={`unit-card-${unit.id}`}>
      <div className="unit-card-top">
        <span className="unit-index">{done ? <Check size={18} /> : String(unit.number).padStart(2, "0")}</span>
        <span className="unit-art"><AppIcon icon={unit.icon} /></span>
        {done && <span className="complete-label">Complete</span>}
      </div>
      <div className="unit-tags"><small>{unit.topic}</small><span>{unit.stage}</span></div>
      <h2>{unit.title}</h2>
      <p>{unit.description}</p>
      <div className="unit-progress"><span style={{ width: `${done ? 100 : percent}%` }} /></div>
      <div className="unit-footer"><span><Headphones size={15} /> {unit.phrases.length} phrases</span><span>{unit.time} min</span></div>
      <button className={done ? "secondary-button full" : "primary-button full"} onClick={() => onOpenUnit(unit)}>
        {done ? "Practise again" : percent ? "Continue unit" : "Start unit"}<ArrowRight size={17} />
      </button>
    </article>
  );
}

const COURSE_STAGES = [...new Set(units.map((unit) => unit.stage))];

export default function CourseView({ progress, onOpenUnit }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All");
  const nextUnit = units.find((unit) => !progress.completedUnits.includes(unit.id)) || units[units.length - 1];
  const [openStages, setOpenStages] = useState(() => new Set([nextUnit.stage]));
  const [showChip, setShowChip] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const normalizedQuery = query.trim().toLocaleLowerCase("pl");
  const filtering = Boolean(normalizedQuery) || topic !== "All";
  const visibleUnits = units.filter((unit) => {
    const matchesTopic = topic === "All" || unit.topic === topic;
    const searchable = `${unit.title} ${unit.description} ${unit.topic} ${unit.phrases.map((phrase) => `${phrase.polish} ${phrase.english}`).join(" ")}`.toLocaleLowerCase("pl");
    return matchesTopic && (!normalizedQuery || searchable.includes(normalizedQuery));
  });

  useEffect(() => {
    const onScroll = () => setShowChip(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleStage = (stage) => setOpenStages((current) => {
    const next = new Set(current);
    if (next.has(stage)) next.delete(stage);
    else next.add(stage);
    return next;
  });

  const jumpToFrontier = () => {
    setOpenStages((current) => new Set(current).add(nextUnit.stage));
    setHighlightId(nextUnit.id);
    const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    window.setTimeout(() => document.getElementById(`unit-card-${nextUnit.id}`)?.scrollIntoView({ behavior, block: "center" }), 60);
    window.setTimeout(() => setHighlightId(null), 2200);
  };

  return (
    <div className="view-stack">
      <header className="page-header">
        <div><span className="eyebrow red"><GraduationCap size={15} /> THE CONVERSATION PATH</span><h1>Polish for real life</h1><p>{allPhrases.length} high-value phrases across {units.length} practical units, from first words to extended B1 and B2-bridge conversations. Nothing is locked.</p></div>
        <ProgressRing value={(progress.completedUnits.length / units.length) * 100}><strong>{progress.completedUnits.length}</strong><span>of {units.length}</span></ProgressRing>
      </header>
      <section className="course-continue panel" aria-label="Continue learning">
        <div className="course-continue-icon" aria-hidden="true"><AppIcon icon={nextUnit.icon} /></div>
        <div><span className="eyebrow">UP NEXT · {nextUnit.stage}</span><h2>{nextUnit.title}</h2><p>{nextUnit.phrases.length} phrases · {nextUnit.time} min</p></div>
        <button className="primary-button" onClick={() => onOpenUnit(nextUnit)}>{progress.learnedPhrases.some((id) => id.startsWith(`${nextUnit.id}-`)) ? "Continue unit" : "Start unit"}<ArrowRight size={17} /></button>
      </section>
      <section className="course-tools" aria-label="Find a course unit">
        <label className="course-search">
          <Search size={19} aria-hidden="true" />
          <span className="sr-only">Search units and phrases</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search units or phrases…" type="search" inputMode="search" enterKeyHint="search" autoComplete="off" aria-label="Search units or phrases" />
        </label>
        <div className="topic-filters" role="group" aria-label="Filter units by topic">
          {courseTopics.map((item) => <button key={item} className={topic === item ? "active" : ""} onClick={() => setTopic(item)} aria-pressed={topic === item}>{item}</button>)}
        </div>
        {filtering && <p className="course-result-count" aria-live="polite">Showing {visibleUnits.length} of {units.length} units</p>}
      </section>
      {filtering ? (
        <div className="course-grid">
          {visibleUnits.map((unit) => <UnitCard key={unit.id} unit={unit} progress={progress} onOpenUnit={onOpenUnit} />)}
        </div>
      ) : (
        COURSE_STAGES.map((stage, stageIndex) => {
          const stageUnits = units.filter((unit) => unit.stage === stage);
          const doneCount = stageUnits.filter((unit) => progress.completedUnits.includes(unit.id)).length;
          const stageDone = doneCount === stageUnits.length;
          const open = openStages.has(stage);
          const panelId = `stage-panel-${stageIndex}`;
          return (
            <section className={`stage-section ${open ? "open" : ""} ${stageDone ? "complete" : ""}`} key={stage}>
              <button className="stage-header" aria-expanded={open} aria-controls={panelId} onClick={() => toggleStage(stage)}>
                <span className="stage-index" aria-hidden="true">{stageDone ? <Check size={16} /> : String(stageIndex + 1).padStart(2, "0")}</span>
                <span className="stage-copy"><small>STAGE {stageIndex + 1} · {stageUnits.length} UNITS</small><strong>{stage}</strong></span>
                <span className="stage-meta">
                  <span className="stage-count">{doneCount} of {stageUnits.length} complete</span>
                  <span className="stage-progress" aria-hidden="true"><span style={{ width: `${Math.round((doneCount / stageUnits.length) * 100)}%` }} /></span>
                </span>
                <ChevronRight size={19} className="stage-chevron" aria-hidden="true" />
              </button>
              {open && (
                <div className="course-grid" id={panelId}>
                  {stageUnits.map((unit) => <UnitCard key={unit.id} unit={unit} progress={progress} onOpenUnit={onOpenUnit} highlight={highlightId === unit.id} />)}
                </div>
              )}
            </section>
          );
        })
      )}
      {!filtering && showChip && createPortal(
        <button className="frontier-chip" onClick={jumpToFrontier}>
          <Play size={14} fill="currentColor" /> Up next · Unit {nextUnit.number}
        </button>,
        document.body,
      )}
      {filtering && !visibleUnits.length && <section className="course-empty panel"><Search size={28} /><h2>No matching units</h2><p>Try a broader phrase or show every topic.</p><button className="secondary-button" onClick={() => { setQuery(""); setTopic("All"); }}>Clear filters</button></section>}
    </div>
  );
}
