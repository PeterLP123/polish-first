import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  CircleHelp,
  Flame,
  GraduationCap,
  Headphones,
  Lightbulb,
  LockKeyhole,
  Mic,
  Play,
  Search,
  Sparkles,
  Star,
  Target,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { allPhrases, courseTopics, grammarGuides, soundLessons, units } from "./data/course.js";
import { addStudy, buildDailySession, currentSession, effectiveStreak, getDuePhrases, loadProgress, localDate, masterySummary, recordAttempt, recordDialogue, recordMilestoneResult, saveProgress, scoreForRating, todayMinutes } from "./lib/learning.js";
import { viewFromHash } from "./lib/navigation.js";
import { listenForPolish, speakPolish, speechRecognitionMessage } from "./lib/speech.js";
import DialoguesPage from "./components/DialoguesView.jsx";
import GuidedSession from "./components/GuidedSession.jsx";
import { AudioButton, PronunciationCard } from "./components/LearningControls.jsx";
import { BottomNav, MobileHeader, NAV_ITEMS, Sidebar } from "./components/Navigation.jsx";
import PracticePage from "./components/PracticeView.jsx";
import ProgressDataView from "./components/ProgressDataView.jsx";

function ProgressRing({ value, size = 86, stroke = 8, children }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, value) / 100) * circumference;

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} />
        <circle
          className="ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-content">{children}</div>
    </div>
  );
}

function StatPill({ icon: Icon, value, label, tone }) {
  return (
    <div className={`stat-pill ${tone || ""}`}>
      <span className="stat-icon"><Icon size={19} /></span>
      <span><strong>{value}</strong><small>{label}</small></span>
    </div>
  );
}

function HomeView({ progress, onNavigate, onOpenUnit, award, onSetGoal, onStartSession }) {
  const nextUnit = units.find((unit) => !progress.completedUnits.includes(unit.id)) || units[units.length - 1];
  const coursePercent = Math.round((progress.completedUnits.length / units.length) * 100);
  const minutesToday = todayMinutes(progress);
  const dailyPercent = Math.round((minutesToday / progress.dailyGoal) * 100);
  const mastery = masterySummary(progress);
  const resumableSession = currentSession(progress);
  const todaySession = progress.activeSession?.date === localDate() ? progress.activeSession : null;
  const sessionPlan = todaySession ?? buildDailySession(progress);
  const newCount = sessionPlan.tasks.filter((task) => task.type === "learn").length;
  const reviewCount = sessionPlan.tasks.filter((task) => task.type === "review").length;
  const dayIndex = Math.floor(Date.now() / 86_400_000) % allPhrases.length;
  const dailyPhrase = allPhrases[dayIndex];

  return (
    <div className="view-stack home-view">
      <section className="welcome-row">
        <div>
          <span className="eyebrow red"><Sparkles size={14} /> DZIEŃ DOBRY!</span>
          <h1>{progress.xp === 0 ? "Your Polish starts with one real conversation." : "Ready for a little more Polish?"}</h1>
          <p>Small, useful steps. Speak from day one and let the endings come later.</p>
        </div>
        <div className="header-stats">
          <StatPill icon={Flame} value={effectiveStreak(progress)} label="day streak" tone="orange" />
          <span className="desktop-xp-stat"><StatPill icon={Zap} value={progress.xp} label="total XP" tone="yellow" /></span>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="continue-card">
          <div className="continue-copy">
            <span className="eyebrow light">TODAY'S GUIDED SESSION</span>
            <div className="unit-emoji" aria-hidden="true">🧠</div>
            <h2>{todaySession?.completedAt ? "Today's plan is complete" : resumableSession ? "Pick up where you left off" : "Learn, remember, then use it"}</h2>
            <p>A finite plan built from what is due and what comes next. Speaking is always optional.</p>
            <div className="lesson-meta"><span><Headphones size={16} /> {reviewCount} reviews</span><span>·</span><span>{newCount} new</span><span>·</span><span>1 dialogue</span></div>
            <button className="primary-button light-button" onClick={onStartSession}>
              <Play size={18} fill="currentColor" /> {todaySession?.completedAt ? "View today's summary" : resumableSession ? `Resume step ${resumableSession.cursor + 1}` : `Start ${progress.dailyGoal}-minute session`}
            </button>
          </div>
          <div className="continue-visual" aria-hidden="true">
            <div className="speech-orbit orbit-one">Cześć!</div>
            <div className="speech-orbit orbit-two">Dzień dobry</div>
            <div className="mascot"><span>ę</span></div>
          </div>
        </article>

        <article className="goal-card panel">
          <div className="panel-heading"><div><span className="eyebrow">DAILY GOAL</span><h3>Keep the chain going</h3></div><Target size={22} /></div>
          <div className="goal-main">
            <ProgressRing value={dailyPercent} size={112} stroke={10}><strong>{Math.min(minutesToday, progress.dailyGoal)}</strong><span>of {progress.dailyGoal} min</span></ProgressRing>
            <div className="goal-copy"><strong>{dailyPercent >= 100 ? "Goal complete!" : `${Math.max(0, progress.dailyGoal - minutesToday)} minutes to go`}</strong><p>A short session is enough to make today count.</p></div>
          </div>
          <div className="goal-presets" role="group" aria-label="Set daily goal in minutes">
            {[10, 15, 20, 30].map((minutes) => (
              <button key={minutes} className={progress.dailyGoal === minutes ? "active" : ""} onClick={() => onSetGoal(minutes)}>{minutes} min</button>
            ))}
          </div>
          <button className="secondary-button full" onClick={() => onNavigate("practice")}>Free practice <ArrowRight size={17} /></button>
        </article>
      </section>

      {mastery.due + mastery.learning + mastery.mastered === 0 ? (
        <section className="mastery-strip panel empty" aria-label="How the memory system works">
          <div className="mastery-teaser">
            <span className="mastery-teaser-icon" aria-hidden="true"><Brain size={21} /></span>
            <div><strong>Phrases you learn come back right before you would forget them.</strong><span>First review tomorrow, then two days, then longer. A 30-day gap counts as mastered.</span></div>
          </div>
          <button className="secondary-button" onClick={onStartSession}>Learn your first phrases <ArrowRight size={16} /></button>
        </section>
      ) : (
        <section className="mastery-strip panel" aria-label="Memory progress">
          <div><strong>{mastery.due}</strong><span>Due now</span></div>
          <div><strong>{mastery.learning}</strong><span>Learning</span></div>
          <div><strong>{mastery.mastered}</strong><span>Mastered</span></div>
          <button className="secondary-button" onClick={() => onNavigate("data")}>Progress & data <ArrowRight size={16} /></button>
        </section>
      )}

      <section className="section-heading-row">
        <div><span className="eyebrow">SAY IT OUT LOUD</span><h2>Phrase of the day</h2></div>
        <button className="text-link" onClick={() => onNavigate("sounds")}>Open sound lab <ChevronRight size={17} /></button>
      </section>
      <PronunciationCard phrase={dailyPhrase} onComplete={() => award({ xp: 8, minutes: 1, phraseId: dailyPhrase.id, review: true, rating: "good" }, "+8 XP · Review scheduled")} />

      <section className="section-heading-row course-snapshot-heading">
        <div><span className="eyebrow">YOUR ROADMAP</span><h2>From first hello to real conversation</h2></div>
        <button className="text-link" onClick={() => onNavigate("course")}>See all {units.length} units <ChevronRight size={17} /></button>
      </section>
      <div className="snapshot-grid">
        {units.slice(0, 4).map((unit) => {
          const done = progress.completedUnits.includes(unit.id);
          return (
            <button key={unit.id} className={`snapshot-card ${done ? "done" : ""}`} onClick={() => onOpenUnit(unit)}>
              <span className="snapshot-number">{done ? <Check size={17} /> : unit.number}</span>
              <span className="snapshot-icon">{unit.icon}</span>
              <span><small>{unit.eyebrow}</small><strong>{unit.title}</strong></span>
              <ChevronRight size={18} />
            </button>
          );
        })}
      </div>

      <section className="progress-strip panel">
        <div><span className="eyebrow">COURSE PROGRESS</span><strong>{coursePercent}%</strong></div>
        <div className="wide-progress"><span style={{ width: `${coursePercent}%` }} /></div>
        <p>{progress.learnedPhrases.length} of {allPhrases.length} useful phrases practised</p>
      </section>
    </div>
  );
}

function UnitCard({ unit, progress, onOpenUnit, highlight = false }) {
  const done = progress.completedUnits.includes(unit.id);
  const learned = unit.phrases.filter((phrase) => progress.learnedPhrases.includes(phrase.id)).length;
  const percent = Math.round((learned / unit.phrases.length) * 100);
  return (
    <article className={`unit-card ${done ? "completed" : ""} ${highlight ? "frontier-highlight" : ""}`} id={`unit-card-${unit.id}`}>
      <div className="unit-card-top">
        <span className="unit-index">{done ? <Check size={18} /> : String(unit.number).padStart(2, "0")}</span>
        <span className="unit-art">{unit.icon}</span>
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

function CourseView({ progress, onOpenUnit }) {
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
        <div className="course-continue-icon" aria-hidden="true">{nextUnit.icon}</div>
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

function UnitLesson({ unit, progress, onClose, award, returnFocus }) {
  const firstUnlearned = unit.phrases.findIndex((phrase) => !progress.learnedPhrases.includes(phrase.id));
  const [index, setIndex] = useState(firstUnlearned === -1 ? 0 : firstUnlearned);
  const [showMeaning, setShowMeaning] = useState(false);
  const dialogRef = useRef(null);
  const phrase = unit.phrases[index];
  const isLast = index === unit.phrases.length - 1;

  const closeLesson = () => {
    onClose();
    window.setTimeout(() => returnFocus?.focus?.(), 0);
  };

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector("button")?.focus();
    const handleKeys = (event) => {
      if (event.key === "Escape") { event.stopPropagation(); closeLesson(); return; }
      if (event.key !== "Tab") return;
      const controls = [...(dialogRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? [])];
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
      if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
    };
    window.addEventListener("keydown", handleKeys, true);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKeys, true); };
  }, []);

  const next = () => {
    const isNew = !progress.learnedPhrases.includes(phrase.id);
    if (isNew) award({ xp: 5, minutes: 1, phraseId: phrase.id, introduction: true }, "+5 XP · First review tomorrow");
    if (isLast) {
      const unitIsNew = !progress.completedUnits.includes(unit.id);
      award({ xp: unitIsNew ? 40 : 10, minutes: 2, unitId: unit.id }, unitIsNew ? `Unit complete · +40 XP` : "Review complete · +10 XP");
      closeLesson();
    } else {
      setIndex((current) => current + 1);
      setShowMeaning(false);
    }
  };

  const previous = () => {
    setIndex((current) => Math.max(0, current - 1));
    setShowMeaning(false);
  };

  return (
    <div ref={dialogRef} className="lesson-overlay" role="dialog" aria-modal="true" aria-label={`${unit.title} lesson`}>
      <div className="lesson-shell">
        <header className="lesson-header">
          <button className="lesson-close" onClick={closeLesson} aria-label="Finish this lesson later"><X size={21} /><span>Finish later</span></button>
          <div className="lesson-header-center"><span>UNIT {unit.number} · {unit.title}</span><div className="lesson-progress" role="progressbar" aria-label="Lesson progress" aria-valuemin="1" aria-valuemax={unit.phrases.length} aria-valuenow={index + 1}><span style={{ width: `${((index + 1) / unit.phrases.length) * 100}%` }} /></div></div>
          <span className="lesson-count">{index + 1} / {unit.phrases.length}</span>
        </header>
        <main className="lesson-main">
          <div className="lesson-prompt"><span className="eyebrow red">LISTEN · READ · REPEAT</span><h1>Say it like you mean it</h1><p>Hear the natural Polish, use the sound guide, then speak it aloud.</p></div>
          <article className="learning-card">
            <div className="learning-card-audio"><AudioButton text={phrase.polish} compact /><span>Tap to hear it</span></div>
            <div className="learning-phrase"><h2>{phrase.polish}</h2><p className="phonetic large">{phrase.phonetic}</p></div>
            {showMeaning ? (
              <div className="learning-meaning"><span>IT MEANS</span><strong>{phrase.english}</strong></div>
            ) : (
              <button className="reveal-button" onClick={() => setShowMeaning(true)}>Reveal meaning</button>
            )}
            {phrase.tip && <div className="learning-tip"><Lightbulb size={18} /><span><strong>In real life</strong>{phrase.tip}</span></div>}
          </article>
          <div className="repeat-row">
            <button className="slow-audio" onClick={() => speakPolish(phrase.polish, 0.58)}><Volume2 size={20} /><span><strong>Hear it slowly</strong><small>Catch every sound</small></span></button>
            <SpeechMiniPractice phrase={phrase} onSuccess={() => award({ xp: 3, phraseId: phrase.id }, "+3 XP · Nicely said")} />
          </div>
          <div className="lesson-nav-actions">
            <button className="secondary-button" onClick={previous} disabled={index === 0}><ArrowLeft size={18} /> Previous</button>
            <button className="primary-button lesson-next" onClick={next}>{isLast ? "Finish unit" : "Got it — next phrase"}<ArrowRight size={19} /></button>
          </div>
        </main>
      </div>
    </div>
  );
}

function SpeechMiniPractice({ phrase, onSuccess }) {
  const [status, setStatus] = useState("idle");
  const [score, setScore] = useState(null);
  const [hint, setHint] = useState("Speak naturally, not perfectly");
  const recognitionRef = useRef(null);

  useEffect(() => {
    recognitionRef.current?.abort?.();
    recognitionRef.current = null;
    setStatus("idle");
    setScore(null);
    setHint("Speak naturally, not perfectly");
    return () => recognitionRef.current?.abort?.();
  }, [phrase.id]);

  const listen = () => {
    if (status === "listening") {
      recognitionRef.current?.stop?.();
      return;
    }
    const recognition = listenForPolish({
      onStart: () => setStatus("listening"),
      onEnd: () => {
        recognitionRef.current = null;
        setStatus((current) => current === "listening" ? "idle" : current);
      },
      onError: (code) => {
        setStatus("unsupported");
        setHint(speechRecognitionMessage(code));
      },
      onResult: (alternatives) => {
        const best = Math.max(...alternatives.map((value) => similarity(value, phrase.polish)));
        setScore(Math.round(best * 100));
        setStatus("done");
        setHint("Speak naturally, not perfectly");
        if (best >= 0.7) onSuccess?.();
      },
    });
    recognitionRef.current = recognition;
    if (!recognition) {
      setStatus("unsupported");
      setHint("Live speech checking is unavailable here. You can still listen and repeat aloud.");
    }
  };

  return (
    <button type="button" className={`speak-prompt ${status}`} onClick={listen} aria-pressed={status === "listening"}>
      <span className="mic-disc"><Mic size={20} /></span>
      <span><strong>{status === "listening" ? "Tap to stop" : score ? `${score}% match — try again` : status === "unsupported" ? "Say it aloud" : "Now you try"}</strong><small>{status === "listening" ? "Listening for Polish…" : hint}</small></span>
    </button>
  );
}

function SoundsView({ award }) {
  const [selected, setSelected] = useState(soundLessons[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const related = allPhrases.filter((phrase) => selected.examples.some((example) => phrase.polish.toLowerCase().includes(example.toLowerCase()))).slice(0, 5);
  const fallback = related.length ? related : allPhrases.filter((phrase) => phrase.polish.toLowerCase().includes(selected.sound.toLowerCase().charAt(0))).slice(0, 5);

  return (
    <div className="view-stack sounds-page">
      <header className="page-header"><div><span className="eyebrow red"><Mic size={15} /> POLISH SOUND LAB</span><h1>Make Polish feel speakable</h1><p>The spelling is consistent once you know the code. Choose a sound, hear it in context, and repeat.</p></div><div className="sound-wave" aria-hidden="true">{[1,2,3,4,5,6,7].map((n) => <i key={n} />)}</div></header>
      <button className="mobile-picker-trigger panel" onClick={() => setPickerOpen(true)} aria-haspopup="dialog"><span><small>SELECTED SOUND</small><strong>{selected.sound} · {selected.like}</strong></span><span>Change <ChevronRight size={17} /></span></button>
      <div className="sound-layout">
        {pickerOpen && <button className="sheet-scrim sound-picker-scrim" onClick={() => setPickerOpen(false)} aria-label="Close sound picker" />}
        <aside className={`sound-list panel ${pickerOpen ? "open" : ""}`} role={pickerOpen ? "dialog" : undefined} aria-modal={pickerOpen || undefined} aria-label="Choose a Polish sound"><div className="picker-heading"><span><span className="eyebrow">THE SOUND CODE</span><strong>Choose a sound</strong></span><button className="icon-button picker-close" onClick={() => setPickerOpen(false)} aria-label="Close sound picker"><X size={19} /></button></div>{soundLessons.map((sound) => <button key={sound.sound} className={selected.sound === sound.sound ? "active" : ""} onClick={() => { setSelected(sound); setPickerOpen(false); }}><strong>{sound.sound}</strong><span>{sound.like}</span><ChevronRight size={17} /></button>)}</aside>
        <main className="sound-detail">
          <div className="sound-hero">
            <div className="sound-letter">{selected.sound}</div>
            <div><span className="eyebrow light">SOUNDS LIKE</span><h2>{selected.like}</h2><p>{selected.tip}</p></div>
          </div>
          <div className="example-sounds">
            {selected.examples.map((example) => <button key={example} onClick={() => speakPolish(example, 0.7)}><Volume2 size={17} /><strong>{example}</strong></button>)}
          </div>
          <div className="mouth-tip"><span>👄</span><div><strong>Mouth cue</strong><p>{selected.tip}</p></div></div>
          <div className="section-heading-row compact"><div><span className="eyebrow">TRY IT IN A PHRASE</span><h2>Hear the sound doing real work</h2></div></div>
          <div className="sound-phrases">
            {fallback.map((phrase) => <article key={phrase.id}><AudioButton text={phrase.polish} compact /><div><strong>{phrase.polish}</strong><span className="phonetic">{phrase.phonetic}</span><small>{phrase.english}</small></div><button className="tiny-mic" onClick={() => award({ xp: 3, phraseId: phrase.id }, "+3 XP · Spoken aloud")} aria-label={`Mark ${phrase.polish} as spoken`}><Mic size={16} /></button></article>)}
          </div>
          <div className="sound-note"><Lightbulb size={18} /><p><strong>A useful approximation, not a replacement for listening.</strong> English respellings get you confidently close. Polish audio trains the details your ears need.</p></div>
        </main>
      </div>
    </div>
  );
}

function GrammarView({ onNavigate }) {
  const [query, setQuery] = useState("");
  const [openGuide, setOpenGuide] = useState(grammarGuides[0]?.id ?? grammarGuides[0]?.title);
  const normalizedQuery = query.trim().toLocaleLowerCase("pl");
  const visibleGuides = grammarGuides.filter((guide) => `${guide.title} ${guide.example} ${guide.meaning} ${guide.body}`.toLocaleLowerCase("pl").includes(normalizedQuery));
  return (
    <div className="view-stack grammar-page">
      <header className="page-header"><div><span className="eyebrow red"><BookOpen size={15} /> FRIENDLY GRAMMAR</span><h1>Patterns, not paperwork</h1><p>Enough grammar to understand what you are saying — explained through phrases you can use today.</p></div></header>
      <div className="grammar-intro"><div className="grammar-intro-icon">ą</div><div><span className="eyebrow light">YOUR LEARNER PROMISE</span><h2>You do not need every ending before you speak.</h2><p>Start with dependable chunks, then connect them into longer ideas. Accuracy will grow around real conversations.</p></div></div>
      <div className="grammar-tools"><label className="course-search"><Search size={19} aria-hidden="true" /><span className="sr-only">Search grammar patterns</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patterns or examples…" type="search" aria-label="Search grammar patterns" /></label><button className="secondary-button" onClick={() => onNavigate("practice", { mode: "grammar", topic: "All" })}>Practise grammar <ArrowRight size={17} /></button></div>
      <p className="grammar-result-count" aria-live="polite">{visibleGuides.length} pattern{visibleGuides.length === 1 ? "" : "s"}</p>
      <div className="grammar-grid">{visibleGuides.map((guide, index) => { const id = guide.id ?? guide.title; const open = openGuide === id; return <article className={`grammar-card ${open ? "expanded" : ""}`} key={guide.title}><button className="grammar-summary" onClick={() => setOpenGuide(open ? null : id)} aria-expanded={open}><span className="grammar-number">{String(grammarGuides.indexOf(guide) + 1).padStart(2, "0")}</span><span><strong>{guide.title}</strong><small>{guide.example}</small></span><ChevronRight size={19} /></button><div className="grammar-example"><strong>{guide.example}</strong><span>{guide.meaning}</span><AudioButton text={guide.example.split("→")[0].replace(/[()]/g, "")} compact /></div>{open && <p>{guide.body}</p>}</article>; })}</div>
      {!visibleGuides.length && <section className="course-empty panel"><Search size={28} /><h2>No matching pattern</h2><p>Try a shorter search or browse every explainer.</p><button className="secondary-button" onClick={() => setQuery("")}>Clear search</button></section>}
      <div className="grammar-reassurance"><Lightbulb size={23} /><div><strong>When in doubt, use the phrase you know.</strong><p>Being understood is the goal. A friendly, imperfect sentence beats a perfect sentence that stays in your head.</p></div></div>
    </div>
  );
}

function App() {
  const [route, setRoute] = useState(() => viewFromHash(window.location.hash));
  const view = route.view;
  const [progress, setProgress] = useState(loadProgress);
  const [activeUnit, setActiveUnit] = useState(null);
  const unitTriggerRef = useRef(null);
  const [toast, setToast] = useState("");
  const mainRef = useRef(null);

  useEffect(() => saveProgress(progress), [progress]);
  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Escape") {
        setActiveUnit(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    const syncView = () => setRoute(viewFromHash(window.location.hash));
    window.addEventListener("hashchange", syncView);
    window.addEventListener("popstate", syncView);
    return () => {
      window.removeEventListener("hashchange", syncView);
      window.removeEventListener("popstate", syncView);
    };
  }, []);
  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, "", "#home");
  }, []);
  useEffect(() => {
    const heading = mainRef.current?.querySelector("h1");
    if (heading) {
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    const label = view === "session" ? "Daily session" : NAV_ITEMS.find((item) => item.id === view)?.label ?? "Today";
    document.title = `${label} · Cześć!`;
  }, [view]);

  const award = (payload, message) => {
    setProgress((current) => addStudy(current, payload));
    if (message) {
      setToast(message);
      window.clearTimeout(window.__polishToast);
      window.__polishToast = window.setTimeout(() => setToast(""), 2600);
    }
  };

  const openUnit = (unit) => {
    unitTriggerRef.current = document.activeElement;
    setActiveUnit(unit);
  };

  const navigate = (nextView, practice = null) => {
    const hash = nextView === "practice" && practice
      ? `#practice?mode=${encodeURIComponent(practice.mode ?? "flashcards")}&topic=${encodeURIComponent(practice.topic ?? "All")}`
      : `#${nextView}`;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    setRoute(viewFromHash(hash));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startSession = (forceNew = false) => {
    setProgress((current) => ({
      ...current,
      activeSession: !forceNew && current.activeSession?.date === localDate() ? current.activeSession : buildDailySession(current),
    }));
    navigate("session");
  };

  const commitSessionTask = (task, result) => {
    setProgress((current) => {
      let next = current;
      if (result.kind === "learn") {
        next = addStudy(next, { xp: result.xp, minutes: result.minutes, phraseId: task.phraseId, introduction: true });
      } else if (result.kind === "review") {
        next = addStudy(next, { xp: result.xp, minutes: result.minutes, phraseId: task.phraseId, review: true, rating: result.rating });
        const modes = { flashcard: ["recall", "flashcards"], listening: ["listening", "listen"], builder: ["recall", "builder"], speaking: ["speaking", "speak"] };
        const [skill, mode] = modes[task.mode] ?? ["recall", "flashcards"];
        next = recordAttempt(next, { itemId: task.phraseId, skill, mode, score: scoreForRating(result.rating), occurredAt: new Date().toISOString() });
      } else if (result.kind === "dialogue") {
        next = addStudy(next, { xp: result.xp, minutes: result.minutes });
        next = recordDialogue(next, task.dialogueId, result.mistakes);
      }

      const active = next.activeSession;
      if (!active) return next;
      const tasks = [...active.tasks];
      const requeuedPhraseIds = [...(active.requeuedPhraseIds ?? [])];
      if (result.rating === "again" && !requeuedPhraseIds.includes(task.phraseId)) {
        requeuedPhraseIds.push(task.phraseId);
        tasks.push({ ...task, id: `retry-${task.phraseId}`, mode: "flashcard" });
      }
      const cursor = active.cursor + 1;
      const completedAt = cursor >= tasks.length ? new Date().toISOString() : null;
      return {
        ...next,
        activeSession: {
          ...active,
          tasks,
          cursor,
          completedAt,
          requeuedPhraseIds,
          results: [...(active.results ?? []), { ...result, taskId: task.id, phraseId: task.phraseId, dialogueId: task.dialogueId }],
        },
      };
    });
  };

  const completeDialogue = (dialogueId, mistakes) => {
    setProgress((current) => recordDialogue(addStudy(current, { xp: 20, minutes: 1 }), dialogueId, mistakes));
    setToast(`Scene complete · ${mistakes ? `${mistakes} useful retries` : "no retries"}`);
  };

  const recordPracticeAttempt = (itemId, skill, mode, score) => {
    setProgress((current) => recordAttempt(current, { itemId, skill, mode, score, occurredAt: new Date().toISOString() }));
  };

  const completeMilestone = (milestoneId, autoScores, speakingRating) => {
    setProgress((current) => recordMilestoneResult(current, milestoneId, autoScores, speakingRating));
    setToast("Scenario check saved");
  };

  const currentLabel = view === "session" ? "Daily session" : NAV_ITEMS.find((item) => item.id === view)?.label;
  const dueCount = getDuePhrases(progress).length;
  const focusMode = view === "session";

  return (
    <div className={`app-shell ${focusMode ? "learning-mode" : ""}`}>
      {!focusMode && <Sidebar view={view} progress={progress} dueCount={dueCount} onNavigate={navigate} />}

      <div className={`app-main ${focusMode ? "focus-mode" : ""}`}>
        {!focusMode && <MobileHeader label={currentLabel} xp={progress.xp} />}
        <main className="content" ref={mainRef}>
          {view === "home" && <HomeView progress={progress} onNavigate={navigate} onOpenUnit={openUnit} award={award} onSetGoal={(minutes) => setProgress((current) => ({ ...current, dailyGoal: minutes }))} onStartSession={() => startSession(false)} />}
          {view === "session" && <GuidedSession session={progress.activeSession} onCommit={commitSessionTask} onExit={() => navigate("home")} onRestart={() => startSession(true)} upcomingDue={getDuePhrases(progress).length} />}
          {view === "course" && <CourseView progress={progress} onOpenUnit={openUnit} />}
          {view === "practice" && <PracticePage progress={progress} award={award} onAttempt={recordPracticeAttempt} initialMode={route.practice.mode} initialTopic={route.practice.topic} />}
          {view === "sounds" && <SoundsView award={award} />}
          {view === "dialogues" && <DialoguesPage progress={progress} onCorrect={() => award({ xp: 10, minutes: 1 }, "+10 XP · Natural response")} onCompleteDialogue={completeDialogue} />}
          {view === "grammar" && <GrammarView onNavigate={navigate} />}
          {view === "data" && <ProgressDataView progress={progress} onReplaceProgress={setProgress} onNavigatePractice={(mode, topic) => navigate("practice", { mode, topic })} onOpenUnit={openUnit} onCompleteMilestone={completeMilestone} onAttempt={recordPracticeAttempt} />}
        </main>
      </div>

      {!focusMode && <BottomNav view={view} dueCount={dueCount} progress={progress} onNavigate={navigate} />}
      {activeUnit && <UnitLesson unit={activeUnit} progress={progress} onClose={() => setActiveUnit(null)} award={award} returnFocus={unitTriggerRef.current} />}
      {toast && <div className="toast" role="status" aria-live="polite"><Star size={17} fill="currentColor" /> {toast}</div>}
    </div>
  );
}

export default App;
