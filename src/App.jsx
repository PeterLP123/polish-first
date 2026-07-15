import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  ChevronRight,
  CircleHelp,
  Flame,
  Headphones,
  Lightbulb,
  Mic,
  Play,
  Sparkles,
  Star,
  Target,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { allPhrases, units } from "./data/course.js";
import { addStudy, buildDailySession, currentSession, effectiveStreak, getDuePhrases, loadProgressResult, localDate, masterySummary, recordAttempt, recordDialogue, recordMilestoneResult, saveProgress, scoreForRating, todayMinutes } from "./lib/learning.js";
import { viewFromHash } from "./lib/navigation.js";
import { listenForPolish, speakPolish, speechRecognitionMessage } from "./lib/speech.js";
import { AudioButton, PronunciationCard } from "./components/LearningControls.jsx";
import { BottomNav, MobileHeader, NAV_ITEMS, Sidebar } from "./components/Navigation.jsx";
import ProgressRing from "./components/ProgressRing.jsx";

const CourseView = lazy(() => import("./components/CourseView.jsx"));
const DialoguesPage = lazy(() => import("./components/DialoguesView.jsx"));
const GrammarView = lazy(() => import("./components/GrammarView.jsx"));
const GuidedSession = lazy(() => import("./components/GuidedSession.jsx"));
const PracticePage = lazy(() => import("./components/PracticeView.jsx"));
const ProgressDataView = lazy(() => import("./components/ProgressDataView.jsx"));
const SoundsView = lazy(() => import("./components/SoundsView.jsx"));

function FocusWhenReady({ routeKey, mainRef, children }) {
  useEffect(() => {
    const heading = mainRef.current?.querySelector("h1");
    if (!heading) return;
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }, [mainRef, routeKey]);
  return children;
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
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  const dailyPhrase = nextUnit.phrases[dayIndex % nextUnit.phrases.length];

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
            <div className="lesson-meta"><span><Headphones size={16} /> {reviewCount} recall steps</span><span>·</span><span>{newCount} new</span><span>·</span><span>1 dialogue</span></div>
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
        <div><span className="eyebrow">SAY IT OUT LOUD · {nextUnit.stage.toUpperCase()}</span><h2>Explore a phrase from your next unit</h2></div>
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
        <div className="lesson-main">
          <div className="lesson-prompt"><span className="eyebrow red">LISTEN · READ · REPEAT</span><h1>Say it like you mean it</h1><p>Hear the natural Polish, use the sound guide, then speak it aloud.</p></div>
          <article className="learning-card">
            <div className="learning-card-audio"><AudioButton text={phrase.polish} compact /><span>Tap to hear it</span></div>
            <div className="learning-phrase"><h2 lang="pl">{phrase.polish}</h2><p className="phonetic large">{phrase.phonetic}</p></div>
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
            <button className="primary-button lesson-next" onClick={next} disabled={!showMeaning} title={!showMeaning ? "Reveal the meaning before continuing" : undefined}>{isLast ? "Finish unit" : "Got it — next phrase"}<ArrowRight size={19} /></button>
          </div>
        </div>
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

function App() {
  const [initialLoad] = useState(() => loadProgressResult());
  const [route, setRoute] = useState(() => viewFromHash(window.location.hash));
  const view = route.view;
  const [progress, setProgress] = useState(initialLoad.progress);
  const [storageRecoveryRequired, setStorageRecoveryRequired] = useState(initialLoad.recoveryRequired);
  const [storageIssue, setStorageIssue] = useState(() => initialLoad.recoveryRequired ? {
    kind: initialLoad.status === "recovery" ? "recovery" : "save",
    message: initialLoad.status === "recovery"
      ? "Saved progress could not be read, so the existing browser data has been left untouched."
      : "This browser is not allowing local progress to be read or saved right now.",
  } : null);
  const [activeUnit, setActiveUnit] = useState(null);
  const unitTriggerRef = useRef(null);
  const [toast, setToast] = useState("");
  const toastTimerRef = useRef(null);
  const mainRef = useRef(null);

  useEffect(() => {
    if (storageRecoveryRequired) return;
    const result = saveProgress(progress);
    if (!result.ok) {
      setStorageIssue({ kind: "save", message: "Your progress is still open, but this browser could not save the latest change locally." });
    } else {
      setStorageIssue((current) => current?.kind === "save" ? null : current);
    }
  }, [progress, storageRecoveryRequired]);
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
    const syncView = () => {
      setActiveUnit(null);
      setRoute(viewFromHash(window.location.hash));
    };
    window.addEventListener("hashchange", syncView);
    window.addEventListener("popstate", syncView);
    return () => {
      window.removeEventListener("hashchange", syncView);
      window.removeEventListener("popstate", syncView);
    };
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimerRef.current), []);
  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, "", "#home");
  }, []);
  useEffect(() => {
    const label = view === "session" ? "Daily session" : NAV_ITEMS.find((item) => item.id === view)?.label ?? "Today";
    document.title = `${label} · Cześć!`;
  }, [view]);

  const showToast = (message) => {
    if (!message) return;
    setToast(message);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(""), 2600);
  };

  const retryLocalSave = () => {
    if (storageRecoveryRequired && storageIssue?.kind !== "recovery") {
      const reload = loadProgressResult();
      if (reload.status === "unavailable") {
        setStorageIssue({ kind: "save", message: "Local progress still cannot be read. Nothing has been replaced; try again when browser storage is available." });
        return;
      }
      if (reload.status === "recovery") {
        setStorageIssue({ kind: "recovery", message: "Saved progress could not be read, so the existing browser data has been left untouched." });
        return;
      }
      if (reload.status === "loaded") {
        setProgress(reload.progress);
        setStorageRecoveryRequired(false);
        setStorageIssue(null);
        showToast("Existing local progress restored");
        return;
      }
    }
    const result = saveProgress(progress);
    if (result.ok) {
      setStorageRecoveryRequired(false);
      setStorageIssue(null);
      showToast(storageIssue?.kind === "recovery" ? "Fresh local progress is now saving in this browser" : "Local progress is saving again");
      return;
    }
    setStorageIssue({ kind: "save", message: "Local saving is still unavailable. Export progress before closing this page." });
  };

  const replaceProgress = (nextProgress) => {
    setStorageRecoveryRequired(false);
    setStorageIssue(null);
    setProgress(nextProgress);
  };

  const skipToContent = (event) => {
    event.preventDefault();
    mainRef.current?.focus({ preventScroll: true });
    mainRef.current?.scrollIntoView?.({ block: "start" });
  };

  const award = (payload, message) => {
    setProgress((current) => addStudy(current, payload));
    showToast(message);
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
    setActiveUnit(null);
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
        next = task.reinforcement
          ? addStudy(next, { xp: result.xp, minutes: result.minutes })
          : addStudy(next, { xp: result.xp, minutes: result.minutes, phraseId: task.phraseId, review: true, rating: result.rating });
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
    showToast(`Scene complete · ${mistakes ? `${mistakes} useful ${mistakes === 1 ? "retry" : "retries"}` : "no retries"}`);
  };

  const recordPracticeAttempt = (itemId, skill, mode, score) => {
    setProgress((current) => recordAttempt(current, { itemId, skill, mode, score, occurredAt: new Date().toISOString() }));
  };

  const completeMilestone = (milestoneId, autoScores, speakingRating) => {
    setProgress((current) => recordMilestoneResult(current, milestoneId, autoScores, speakingRating));
    showToast("Scenario check saved");
  };

  const currentLabel = view === "session" ? "Daily session" : NAV_ITEMS.find((item) => item.id === view)?.label;
  const dueCount = getDuePhrases(progress).length;
  const focusMode = view === "session";

  return (
    <>
    <a className="skip-link" href="#main-content" onClick={skipToContent}>Skip to main content</a>
    <div className={`app-shell ${focusMode ? "learning-mode" : ""}`}>
      {!focusMode && <Sidebar view={view} progress={progress} dueCount={dueCount} onNavigate={navigate} />}

      <div className={`app-main ${focusMode ? "focus-mode" : ""}`}>
        {!focusMode && <MobileHeader label={currentLabel} xp={progress.xp} />}
        {storageIssue && <div className="storage-alert" role="alert"><CircleHelp size={18} /><span><strong>Local progress needs attention</strong>{storageIssue.message}</span><button className="secondary-button" onClick={retryLocalSave}>{storageIssue.kind === "recovery" ? "Use fresh progress" : "Try saving again"}</button></div>}
        <main id="main-content" className="content" ref={mainRef} tabIndex={-1}>
          <Suspense fallback={<div className="route-loading" role="status">Loading this section…</div>}>
            <FocusWhenReady routeKey={view} mainRef={mainRef}>
              {view === "home" && <HomeView progress={progress} onNavigate={navigate} onOpenUnit={openUnit} award={award} onSetGoal={(minutes) => setProgress((current) => ({ ...current, dailyGoal: minutes }))} onStartSession={() => startSession(false)} />}
              {view === "session" && <GuidedSession session={progress.activeSession} onCommit={commitSessionTask} onExit={() => navigate("home")} onRestart={() => startSession(true)} upcomingDue={getDuePhrases(progress).length} />}
              {view === "course" && <CourseView progress={progress} onOpenUnit={openUnit} />}
              {view === "practice" && <PracticePage progress={progress} award={award} onAttempt={recordPracticeAttempt} initialMode={route.practice.mode} initialTopic={route.practice.topic} />}
              {view === "sounds" && <SoundsView award={award} />}
              {view === "dialogues" && <DialoguesPage progress={progress} onCorrect={() => award({ xp: 10, minutes: 1 }, "+10 XP · Natural response")} onCompleteDialogue={completeDialogue} />}
              {view === "grammar" && <GrammarView onNavigate={navigate} />}
              {view === "data" && <ProgressDataView progress={progress} onReplaceProgress={replaceProgress} onNavigatePractice={(mode, topic) => navigate("practice", { mode, topic })} onOpenUnit={openUnit} onCompleteMilestone={completeMilestone} onAttempt={recordPracticeAttempt} />}
            </FocusWhenReady>
          </Suspense>
        </main>
      </div>

      {!focusMode && <BottomNav view={view} dueCount={dueCount} progress={progress} onNavigate={navigate} />}
      {activeUnit && <UnitLesson unit={activeUnit} progress={progress} onClose={() => setActiveUnit(null)} award={award} returnFocus={unitTriggerRef.current} />}
      {toast && <div className="toast" role="status" aria-live="polite"><Star size={17} fill="currentColor" /> {toast}</div>}
    </div>
    </>
  );
}

export default App;
