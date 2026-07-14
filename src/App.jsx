import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  Check,
  ChevronRight,
  CircleHelp,
  Flame,
  Gauge,
  GraduationCap,
  Headphones,
  Home,
  Languages,
  Lightbulb,
  LockKeyhole,
  Menu,
  MessageCircle,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Target,
  Trophy,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { allPhrases, courseTopics, dialogues, grammarGuides, soundLessons, units } from "./data/course.js";
import { addStudy, buildReviewDeck, effectiveStreak, loadProgress, saveProgress, shuffled, similarity, weekActivity } from "./lib/learning.js";
import { viewFromHash } from "./lib/navigation.js";
import { listenForPolish, speakPolish } from "./lib/speech.js";

const NAV_ITEMS = [
  { id: "home", label: "Today", icon: Home },
  { id: "course", label: "Course", icon: GraduationCap },
  { id: "practice", label: "Practice", icon: Brain },
  { id: "sounds", label: "Sounds", icon: Mic },
  { id: "dialogues", label: "Dialogues", icon: MessageCircle },
  { id: "grammar", label: "Grammar", icon: BookOpen },
];

function AudioButton({ text, label = "Hear Polish", compact = false, rate = 0.82 }) {
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

function PronunciationCard({ phrase, onComplete, extended = false }) {
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
        if (best.score >= 0.7) onComplete?.();
      },
    });
    if (!recognition) setError("Speech checking is not available in this browser. Chrome or Edge works best; listening still works here.");
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
        <div className={`speech-result ${scorePercent >= 70 ? "good" : "retry"}`}>
          <div className="score-badge">{scorePercent}%</div>
          <div><strong>{feedback}</strong><span>I heard: “{result.transcript}”</span></div>
        </div>
      )}
      {error && <p className="speech-error"><CircleHelp size={16} /> {error}</p>}
    </article>
  );
}

function HomeView({ progress, onNavigate, onOpenUnit, award, onSetGoal }) {
  const nextUnit = units.find((unit) => !progress.completedUnits.includes(unit.id)) || units[units.length - 1];
  const coursePercent = Math.round((progress.completedUnits.length / units.length) * 100);
  const dailyPercent = Math.round((progress.todayMinutes / progress.dailyGoal) * 100);
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
          <StatPill icon={Zap} value={progress.xp} label="total XP" tone="yellow" />
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="continue-card">
          <div className="continue-copy">
            <span className="eyebrow light">UP NEXT · UNIT {nextUnit.number}</span>
            <div className="unit-emoji" aria-hidden="true">{nextUnit.icon}</div>
            <h2>{nextUnit.title}</h2>
            <p>{nextUnit.description}</p>
            <div className="lesson-meta"><span><Headphones size={16} /> {nextUnit.phrases.length} phrases</span><span>·</span><span>{nextUnit.time} min</span></div>
            <button className="primary-button light-button" onClick={() => onOpenUnit(nextUnit)}>
              <Play size={18} fill="currentColor" /> {progress.completedUnits.length ? "Continue learning" : "Start my first lesson"}
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
            <ProgressRing value={dailyPercent} size={112} stroke={10}><strong>{Math.min(progress.todayMinutes, progress.dailyGoal)}</strong><span>of {progress.dailyGoal} min</span></ProgressRing>
            <div className="goal-copy"><strong>{dailyPercent >= 100 ? "Goal complete!" : `${Math.max(0, progress.dailyGoal - progress.todayMinutes)} minutes to go`}</strong><p>A short session is enough to make today count.</p></div>
          </div>
          <div className="goal-presets" role="group" aria-label="Set daily goal in minutes">
            {[10, 15, 20, 30].map((minutes) => (
              <button key={minutes} className={progress.dailyGoal === minutes ? "active" : ""} onClick={() => onSetGoal(minutes)}>{minutes} min</button>
            ))}
          </div>
          <button className="secondary-button full" onClick={() => onNavigate("practice")}>Quick 5-minute review <ArrowRight size={17} /></button>
        </article>
      </section>

      <section className="section-heading-row">
        <div><span className="eyebrow">SAY IT OUT LOUD</span><h2>Phrase of the day</h2></div>
        <button className="text-link" onClick={() => onNavigate("sounds")}>Open sound lab <ChevronRight size={17} /></button>
      </section>
      <PronunciationCard phrase={dailyPhrase} onComplete={() => award({ xp: 8, minutes: 1, phraseId: dailyPhrase.id }, "+8 XP · Great pronunciation practice")} />

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

function CourseView({ progress, onOpenUnit }) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("All");
  const nextUnit = units.find((unit) => !progress.completedUnits.includes(unit.id)) || units[units.length - 1];
  const normalizedQuery = query.trim().toLocaleLowerCase("pl");
  const visibleUnits = units.filter((unit) => {
    const matchesTopic = topic === "All" || unit.topic === topic;
    const searchable = `${unit.title} ${unit.description} ${unit.topic} ${unit.phrases.map((phrase) => `${phrase.polish} ${phrase.english}`).join(" ")}`.toLocaleLowerCase("pl");
    return matchesTopic && (!normalizedQuery || searchable.includes(normalizedQuery));
  });

  return (
    <div className="view-stack">
      <header className="page-header">
        <div><span className="eyebrow red"><GraduationCap size={15} /> THE CONVERSATION PATH</span><h1>Polish for real life</h1><p>{allPhrases.length} high-value phrases across {units.length} practical beginner units. Nothing is locked.</p></div>
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
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search units or phrases…" type="search" />
        </label>
        <div className="topic-filters" role="group" aria-label="Filter units by topic">
          {courseTopics.map((item) => <button key={item} className={topic === item ? "active" : ""} onClick={() => setTopic(item)} aria-pressed={topic === item}>{item}</button>)}
        </div>
        <p className="course-result-count" aria-live="polite">Showing {visibleUnits.length} of {units.length} units</p>
      </section>
      <div className="course-grid">
        {visibleUnits.map((unit) => {
          const done = progress.completedUnits.includes(unit.id);
          const learned = unit.phrases.filter((phrase) => progress.learnedPhrases.includes(phrase.id)).length;
          const percent = Math.round((learned / unit.phrases.length) * 100);
          return (
            <article className={`unit-card ${done ? "completed" : ""}`} key={unit.id}>
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
        })}
      </div>
      {!visibleUnits.length && <section className="course-empty panel"><Search size={28} /><h2>No matching units</h2><p>Try a broader phrase or show every topic.</p><button className="secondary-button" onClick={() => { setQuery(""); setTopic("All"); }}>Clear filters</button></section>}
    </div>
  );
}

function UnitLesson({ unit, progress, onClose, award }) {
  const firstUnlearned = unit.phrases.findIndex((phrase) => !progress.learnedPhrases.includes(phrase.id));
  const [index, setIndex] = useState(firstUnlearned === -1 ? 0 : firstUnlearned);
  const [showMeaning, setShowMeaning] = useState(false);
  const phrase = unit.phrases[index];
  const isLast = index === unit.phrases.length - 1;

  const next = () => {
    const isNew = !progress.learnedPhrases.includes(phrase.id);
    if (isNew) award({ xp: 5, minutes: 1, phraseId: phrase.id }, "+5 XP · Phrase added");
    if (isLast) {
      const unitIsNew = !progress.completedUnits.includes(unit.id);
      award({ xp: unitIsNew ? 40 : 10, minutes: 2, unitId: unit.id }, unitIsNew ? `Unit complete · +40 XP` : "Review complete · +10 XP");
      onClose();
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
    <div className="lesson-overlay" role="dialog" aria-modal="true" aria-label={`${unit.title} lesson`}>
      <div className="lesson-shell">
        <header className="lesson-header">
          <button className="lesson-close" onClick={onClose} aria-label="Finish this lesson later"><X size={21} /><span>Finish later</span></button>
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

  useEffect(() => {
    setStatus("idle");
    setScore(null);
  }, [phrase.id]);

  const listen = () => {
    const recognition = listenForPolish({
      onStart: () => setStatus("listening"),
      onEnd: () => setStatus((current) => current === "listening" ? "idle" : current),
      onError: () => setStatus("unsupported"),
      onResult: (alternatives) => {
        const best = Math.max(...alternatives.map((value) => similarity(value, phrase.polish)));
        setScore(Math.round(best * 100));
        setStatus("done");
        if (best >= 0.7) onSuccess?.();
      },
    });
    if (!recognition) setStatus("unsupported");
  };

  return (
    <button className={`speak-prompt ${status}`} onClick={listen} disabled={status === "listening"}>
      <span className="mic-disc"><Mic size={20} /></span>
      <span><strong>{status === "listening" ? "I'm listening…" : score ? `${score}% match — try again` : status === "unsupported" ? "Say it aloud" : "Now you try"}</strong><small>{status === "unsupported" ? "Speech checking unavailable here" : "Speak naturally, not perfectly"}</small></span>
    </button>
  );
}

function PracticeView({ progress, award }) {
  const [mode, setMode] = useState("flashcards");
  const modes = [
    { id: "flashcards", label: "Flashcards", icon: RotateCcw, hint: "Recall meanings" },
    { id: "listen", label: "Listen", icon: Headphones, hint: "Train your ear" },
    { id: "builder", label: "Build it", icon: Languages, hint: "Make sentences" },
    { id: "speak", label: "Speak", icon: Mic, hint: "Pronunciation reps" },
  ];

  return (
    <div className="view-stack practice-page">
      <header className="page-header"><div><span className="eyebrow red"><Brain size={15} /> PRACTICE STUDIO</span><h1>Make it stick</h1><p>Choose a short drill. Every answer strengthens the Polish you will need in a real conversation.</p></div><div className="mastery-chip"><Trophy size={21} /><span><strong>{progress.totalReviews}</strong> reviews</span></div></header>
      <div className="mode-tabs" role="tablist" aria-label="Practice mode">
        {modes.map(({ id, label, icon: Icon, hint }) => <button key={id} role="tab" aria-selected={mode === id} className={mode === id ? "active" : ""} onClick={() => setMode(id)}><Icon size={20} /><span><strong>{label}</strong><small>{hint}</small></span></button>)}
      </div>
      {mode === "flashcards" && <Flashcards progress={progress} award={award} />}
      {mode === "listen" && <ListeningQuiz award={award} />}
      {mode === "builder" && <SentenceBuilder award={award} />}
      {mode === "speak" && <SpeakPractice progress={progress} award={award} />}
    </div>
  );
}

function Flashcards({ progress, award }) {
  const [deck] = useState(() => buildReviewDeck(progress, 12));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const phrase = deck[index % deck.length];

  const rate = (known) => {
    award({ xp: known ? 5 : 2, minutes: index % 3 === 0 ? 1 : 0, phraseId: phrase.id, review: true, phraseResult: known }, known ? "+5 XP · Nailed it" : "+2 XP · Back in the deck");
    setIndex((current) => current + 1);
    setFlipped(false);
  };

  return (
    <section className="practice-stage">
      <div className="practice-topline"><span>Card {(index % deck.length) + 1} of {deck.length}</span><div className="mini-progress"><span style={{ width: `${(((index % deck.length) + 1) / deck.length) * 100}%` }} /></div><span>Polish → English</span></div>
      <article className={`flashcard ${flipped ? "flipped" : ""}`} aria-label={`Flashcard: ${phrase.polish}`}>
        <span className="flashcard-label">{flipped ? "ANSWER" : "WHAT DOES THIS MEAN?"}</span>
        <AudioButton text={phrase.polish} compact />
        <h2>{phrase.polish}</h2>
        <p className="phonetic large">{phrase.phonetic}</p>
        {flipped ? <div className="flashcard-answer"><span>{phrase.english}</span>{phrase.tip && <small>{phrase.tip}</small>}</div> : <button className="flashcard-reveal" onClick={() => setFlipped(true)}>Reveal meaning</button>}
      </article>
      {flipped && <div className="rating-row"><button className="again-button" onClick={() => rate(false)}><RotateCcw size={18} /> Again</button><button className="know-button" onClick={() => rate(true)}><Check size={19} /> I knew it</button></div>}
    </section>
  );
}

function ListeningQuiz({ award }) {
  const [round, setRound] = useState(() => makeListeningRound());
  const [answer, setAnswer] = useState(null);

  const choose = (option) => {
    setAnswer(option.id);
    if (option.id === round.phrase.id) award({ xp: 8, minutes: 1, phraseId: round.phrase.id, review: true, phraseResult: true }, "+8 XP · Your ear is working");
    else award({ phraseId: round.phrase.id, review: true, phraseResult: false });
  };

  const next = () => { setRound(makeListeningRound(round.phrase.id)); setAnswer(null); };
  const correct = answer === round.phrase.id;

  return (
    <section className="practice-stage listening-stage">
      <span className="eyebrow">LISTEN WITHOUT READING</span>
      <h2>What did you hear?</h2>
      <button className="big-listen" onClick={() => speakPolish(round.phrase.polish)}><span><Volume2 size={32} /></span>Play Polish</button>
      <button className="slow-link" onClick={() => speakPolish(round.phrase.polish, 0.58)}>Play more slowly</button>
      <div className="answer-grid">
        {round.options.map((option) => {
          const chosen = answer === option.id;
          const isRight = option.id === round.phrase.id;
          return <button key={option.id} className={answer ? (isRight ? "correct" : chosen ? "wrong" : "muted") : ""} onClick={() => !answer && choose(option)}><span>{option.english}</span>{answer && isRight && <Check size={18} />}{answer && chosen && !isRight && <X size={18} />}</button>;
        })}
      </div>
      {answer && <div className={`quiz-feedback ${correct ? "correct" : "wrong"}`}><span className="feedback-icon">{correct ? <Check /> : <Lightbulb />}</span><div><strong>{correct ? "Exactly right" : "Almost — connect the sound to this phrase"}</strong><p><b>{round.phrase.polish}</b> · {round.phrase.phonetic} · {round.phrase.english}</p></div><button className="primary-button" onClick={next}>Next <ArrowRight size={17} /></button></div>}
    </section>
  );
}

function makeListeningRound(excludeId) {
  const pool = allPhrases.filter((item) => item.id !== excludeId);
  const phrase = pool[Math.floor(Math.random() * pool.length)];
  const distractors = shuffled(allPhrases.filter((item) => item.id !== phrase.id && item.english !== phrase.english)).slice(0, 3);
  return { phrase, options: shuffled([phrase, ...distractors]) };
}

function SentenceBuilder({ award }) {
  const candidates = allPhrases.filter((phrase) => phrase.polish.split(" ").length >= 3 && phrase.polish.split(" ").length <= 7);
  const [phrase, setPhrase] = useState(() => shuffled(candidates)[0]);
  const [tokens, setTokens] = useState(() => makeTokens(phrase));
  const [chosen, setChosen] = useState([]);
  const [checked, setChecked] = useState(false);
  const answer = chosen.map((token) => token.word).join(" ").replace(/\s+([?!.,])/g, "$1");
  const expected = phrase.polish.replace(/[.,!?]$/g, "");
  const correct = similarity(answer, expected) > 0.98;

  const addToken = (token) => { setChosen((current) => [...current, token]); setTokens((current) => current.filter((item) => item.key !== token.key)); };
  const removeToken = (token) => { setTokens((current) => [...current, token]); setChosen((current) => current.filter((item) => item.key !== token.key)); setChecked(false); };
  const next = () => {
    const nextPhrase = shuffled(candidates.filter((item) => item.id !== phrase.id))[0];
    setPhrase(nextPhrase); setTokens(makeTokens(nextPhrase)); setChosen([]); setChecked(false);
  };
  const check = () => {
    setChecked(true);
    if (correct) award({ xp: 10, minutes: 1, phraseId: phrase.id, review: true, phraseResult: true }, "+10 XP · Sentence built");
    else award({ phraseId: phrase.id, review: true, phraseResult: false });
  };

  return (
    <section className="practice-stage builder-stage">
      <span className="eyebrow">BUILD THE POLISH</span><h2>{phrase.english}</h2><p>Tap the words in the right order.</p>
      <div className={`build-zone ${checked ? (correct ? "correct" : "wrong") : ""}`}>
        {chosen.length ? chosen.map((token) => <button key={token.key} onClick={() => removeToken(token)}>{token.word}</button>) : <span>Your Polish sentence will appear here</span>}
      </div>
      <div className="word-bank">{tokens.map((token) => <button key={token.key} onClick={() => addToken(token)}>{token.word}</button>)}</div>
      {checked && <div className={`builder-feedback ${correct ? "correct" : "wrong"}`}><strong>{correct ? "Świetnie! Perfect order." : "Not quite. Clear it and follow the sound guide."}</strong><span>{phrase.polish} · <em>{phrase.phonetic}</em></span></div>}
      <div className="builder-actions"><button className="secondary-button" onClick={() => { setTokens(makeTokens(phrase)); setChosen([]); setChecked(false); }}><RotateCcw size={17} /> Reset</button>{checked && correct ? <button className="primary-button" onClick={next}>Next sentence <ArrowRight size={17} /></button> : <button className="primary-button" onClick={check} disabled={tokens.length > 0}>Check my answer <Check size={17} /></button>}</div>
    </section>
  );
}

function makeTokens(phrase) {
  return shuffled(phrase.polish.replace(/[.,!?]$/g, "").split(" ").map((word, index) => ({ word, key: `${word}-${index}` })));
}

function SpeakPractice({ progress, award }) {
  const [deck] = useState(() => buildReviewDeck(progress, 10));
  const [index, setIndex] = useState(0);
  const phrase = deck[index % deck.length];

  return (
    <section className="practice-stage">
      <div className="practice-topline"><span>Phrase {(index % deck.length) + 1} of {deck.length}</span><div className="mini-progress"><span style={{ width: `${(((index % deck.length) + 1) / deck.length) * 100}%` }} /></div><span>Listen, then speak</span></div>
      <PronunciationCard phrase={phrase} extended onComplete={() => award({ xp: 8, minutes: 1, phraseId: phrase.id, review: true, phraseResult: true }, "+8 XP · Clearly said")} />
      <div className="builder-actions">
        <button className="primary-button" onClick={() => setIndex((current) => current + 1)}>Next phrase <ArrowRight size={17} /></button>
      </div>
    </section>
  );
}

function SoundsView({ award }) {
  const [selected, setSelected] = useState(soundLessons[0]);
  const related = allPhrases.filter((phrase) => selected.examples.some((example) => phrase.polish.toLowerCase().includes(example.toLowerCase()))).slice(0, 5);
  const fallback = related.length ? related : allPhrases.filter((phrase) => phrase.polish.toLowerCase().includes(selected.sound.toLowerCase().charAt(0))).slice(0, 5);

  return (
    <div className="view-stack sounds-page">
      <header className="page-header"><div><span className="eyebrow red"><Mic size={15} /> POLISH SOUND LAB</span><h1>Make Polish feel speakable</h1><p>The spelling is consistent once you know the code. Choose a sound, hear it in context, and repeat.</p></div><div className="sound-wave" aria-hidden="true">{[1,2,3,4,5,6,7].map((n) => <i key={n} />)}</div></header>
      <div className="sound-layout">
        <aside className="sound-list panel"><span className="eyebrow">THE SOUND CODE</span>{soundLessons.map((sound) => <button key={sound.sound} className={selected.sound === sound.sound ? "active" : ""} onClick={() => setSelected(sound)}><strong>{sound.sound}</strong><span>{sound.like}</span><ChevronRight size={17} /></button>)}</aside>
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

function DialoguesView({ award }) {
  const [selected, setSelected] = useState(dialogues[0]);
  return (
    <div className="view-stack">
      <header className="page-header"><div><span className="eyebrow red"><MessageCircle size={15} /> CONVERSATION PRACTICE</span><h1>Choose what you would say</h1><p>Low-pressure branching scenes for the moments you are most likely to meet first.</p></div></header>
      <div className="dialogue-picker">{dialogues.map((dialogue) => <button key={dialogue.id} className={dialogue.id === selected.id ? "active" : ""} onClick={() => setSelected(dialogue)}><span>{dialogue.icon}</span><strong>{dialogue.title}</strong><small>{dialogue.lines.length} turns</small></button>)}</div>
      <DialoguePlayer key={selected.id} dialogue={selected} award={award} />
    </div>
  );
}

function DialoguePlayer({ dialogue, award }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const line = dialogue.lines[step];
  const done = step >= dialogue.lines.length;

  if (done) return (
    <section className="dialogue-complete panel"><div className="celebration">🎉</div><span className="eyebrow red">SCENE COMPLETE</span><h2>Rozmowa zakończona!</h2><p>You made it through “{dialogue.title}” with {mistakes ? `${mistakes} useful ${mistakes === 1 ? "retry" : "retries"}` : "no retries"}. Real conversations get easier every time.</p><button className="primary-button" onClick={() => { setStep(0); setSelected(null); setMistakes(0); }}><RotateCcw size={17} /> Play again</button></section>
  );

  const choose = (choice, index) => {
    setSelected(index);
    if (!choice.good) setMistakes((current) => current + 1);
    if (choice.good) award({ xp: 10, minutes: 1, review: true }, "+10 XP · Natural response");
  };

  const selectedChoice = selected === null ? null : line.choices[selected];
  return (
    <section className="dialogue-stage">
      <div className="scene-header"><div><span className="scene-icon">{dialogue.icon}</span><span><strong>{dialogue.title}</strong><small>{dialogue.setting}</small></span></div><span>Turn {step + 1} of {dialogue.lines.length}</span></div>
      <div className="dialogue-progress"><span style={{ width: `${((step + 1) / dialogue.lines.length) * 100}%` }} /></div>
      <div className="chat-window">
        <div className="chat-avatar">{line.speaker.charAt(0)}</div>
        <div className="chat-bubble"><small>{line.speaker} says</small><div><h2>{line.polish}</h2><AudioButton text={line.polish} compact /></div><p className="phonetic">{line.phonetic}</p><span>{line.english}</span></div>
      </div>
      <div className="response-area"><span className="eyebrow">HOW DO YOU RESPOND?</span><div className="response-options">{line.choices.map((choice, index) => <button key={choice.polish} className={selected === index ? (choice.good ? "correct" : "wrong") : selectedChoice?.good ? "muted" : ""} onClick={() => selectedChoice?.good ? null : choose(choice, index)}><span><strong>{choice.polish}</strong>{choice.phonetic && <em>{choice.phonetic}</em>}<small>{choice.english}</small></span>{selected === index && (choice.good ? <Check /> : <X />)}</button>)}</div></div>
      {selectedChoice && <div className={`choice-feedback ${selectedChoice.good ? "correct" : "wrong"}`}><div><strong>{selectedChoice.good ? "Natural choice" : "That would be an unexpected reply"}</strong><p>{selectedChoice.good ? "You matched the situation and kept the conversation moving." : "Try the other response — meaning matters more than perfection."}</p></div>{selectedChoice.good && <button className="primary-button" onClick={() => { setStep((current) => current + 1); setSelected(null); }}>Continue <ArrowRight size={17} /></button>}</div>}
    </section>
  );
}

function GrammarView() {
  return (
    <div className="view-stack">
      <header className="page-header"><div><span className="eyebrow red"><BookOpen size={15} /> FRIENDLY GRAMMAR</span><h1>Patterns, not paperwork</h1><p>Enough grammar to understand what you are saying — explained through phrases you can use today.</p></div></header>
      <div className="grammar-intro"><div className="grammar-intro-icon">ą</div><div><span className="eyebrow light">YOUR BEGINNER PROMISE</span><h2>You do not need every ending before you speak.</h2><p>Start with dependable chunks. Notice the patterns below. Accuracy will grow around real conversations.</p></div></div>
      <div className="grammar-grid">{grammarGuides.map((guide, index) => <article className="grammar-card" key={guide.title}><span className="grammar-number">{String(index + 1).padStart(2, "0")}</span><h2>{guide.title}</h2><div className="grammar-example"><strong>{guide.example}</strong><span>{guide.meaning}</span><AudioButton text={guide.example.split("→")[0].replace(/[()]/g, "")} compact /></div><p>{guide.body}</p></article>)}</div>
      <div className="grammar-reassurance"><Lightbulb size={23} /><div><strong>When in doubt, use the phrase you know.</strong><p>Being understood is the goal. A friendly, imperfect sentence beats a perfect sentence that stays in your head.</p></div></div>
    </div>
  );
}

function App() {
  const [view, setView] = useState(() => viewFromHash(window.location.hash));
  const [progress, setProgress] = useState(loadProgress);
  const [activeUnit, setActiveUnit] = useState(null);
  const [toast, setToast] = useState("");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => saveProgress(progress), [progress]);
  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Escape") {
        setActiveUnit(null);
        setNavOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    const syncView = () => setView(viewFromHash(window.location.hash));
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
    if (!navOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [navOpen]);

  const award = (payload, message) => {
    setProgress((current) => addStudy(current, payload));
    if (message) {
      setToast(message);
      window.clearTimeout(window.__polishToast);
      window.__polishToast = window.setTimeout(() => setToast(""), 2600);
    }
  };

  const navigate = (nextView) => {
    if (window.location.hash !== `#${nextView}`) window.history.pushState(null, "", `#${nextView}`);
    setView(nextView);
    setNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentLabel = NAV_ITEMS.find((item) => item.id === view)?.label;

  return (
    <div className="app-shell">
      <aside id="main-sidebar" className={`sidebar ${navOpen ? "open" : ""}`} aria-label="Learning navigation">
        <div className="sidebar-topline"><button className="brand" onClick={() => navigate("home")}><span className="brand-mark">Cz</span><span><strong>Cześć!</strong><small>Polish for real life</small></span></button><button className="sidebar-close icon-button" onClick={() => setNavOpen(false)} aria-label="Close navigation"><X size={21} /></button></div>
        <nav aria-label="Main navigation">
          <span className="nav-label">LEARN</span>
          {NAV_ITEMS.map(({ id, label, icon: Icon }, index) => <button key={id} className={view === id ? "active" : ""} aria-current={view === id ? "page" : undefined} onClick={() => navigate(id)}><Icon size={20} /><span>{label}</span>{index === 2 && progress.totalReviews > 0 && <small className="nav-badge">{progress.totalReviews}</small>}</button>)}
        </nav>
        <div className="sidebar-card">
          <div className="sidebar-card-top"><Flame size={23} /><span><strong>{effectiveStreak(progress)} day streak</strong><small>{effectiveStreak(progress) ? "Keep showing up" : "Start today"}</small></span></div>
          <div className="week-dots">{weekActivity(progress.studyDates).map(({ label, done, today }, index) => <span key={`${label}-${index}`} className={done ? "active" : today ? "today" : ""}>{done ? <Check size={12} /> : label}</span>)}</div>
        </div>
        <p className="sidebar-footnote">Mów od pierwszego dnia.<br />Speak from day one.</p>
      </aside>

      {navOpen && <button className="nav-scrim" onClick={() => setNavOpen(false)} aria-label="Close navigation" />}

      <div className="app-main">
        <header className="mobile-header"><button className="icon-button" onClick={() => setNavOpen(true)} aria-label="Open navigation" aria-expanded={navOpen} aria-controls="main-sidebar"><Menu /></button><div className="mobile-brand"><span>Cz</span><strong>{currentLabel}</strong></div><span className="mobile-xp"><Zap size={16} /> {progress.xp}</span></header>
        <main className="content">
          {view === "home" && <HomeView progress={progress} onNavigate={navigate} onOpenUnit={setActiveUnit} award={award} onSetGoal={(minutes) => setProgress((current) => ({ ...current, dailyGoal: minutes }))} />}
          {view === "course" && <CourseView progress={progress} onOpenUnit={setActiveUnit} />}
          {view === "practice" && <PracticeView progress={progress} award={award} />}
          {view === "sounds" && <SoundsView award={award} />}
          {view === "dialogues" && <DialoguesView award={award} />}
          {view === "grammar" && <GrammarView />}
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Mobile navigation">{NAV_ITEMS.slice(0, 5).map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} aria-current={view === id ? "page" : undefined} onClick={() => navigate(id)}><Icon size={20} /><span>{label}</span></button>)}</nav>
      {activeUnit && <UnitLesson unit={activeUnit} progress={progress} onClose={() => setActiveUnit(null)} award={award} />}
      {toast && <div className="toast" role="status" aria-live="polite"><Star size={17} fill="currentColor" /> {toast}</div>}
    </div>
  );
}

export default App;
