import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Brain, Check, FilePenLine, Headphones, Languages, Lightbulb, Mic, RotateCcw, Target, Trophy, Volume2, X } from "lucide-react";
import { allPhrases, clozeItems, courseTopics, readings, units, writingItems } from "../data/course.js";
import { buildFocusDeck, buildReviewDeck, evaluateWriting, nextRecommendation, nextUnitForProgress, scoreCloze, scoreForRating, scoreReading, shuffled, similarity } from "../lib/learning.js";
import { useDrillKeys } from "../lib/drill-keys.js";
import { speakPolish } from "../lib/speech.js";
import { AudioButton, PronunciationCard } from "./LearningControls.jsx";
import DiacriticsBar from "./DiacriticsBar.jsx";

const RATINGS = [
  { id: "again", label: "Again", hint: "Today" },
  { id: "hard", label: "Hard", hint: "1+ day" },
  { id: "good", label: "Good", hint: "2× interval" },
  { id: "easy", label: "Easy", hint: "3× interval" },
];

export default function PracticeView({ progress, award, onAttempt = () => {}, initialMode = "flashcards", initialTopic = "All" }) {
  const topicOptions = [...courseTopics, "Entire course"];
  const [mode, setMode] = useState(initialMode);
  const [topic, setTopic] = useState(topicOptions.includes(initialTopic) ? initialTopic : "All");
  const [showModeChooser, setShowModeChooser] = useState(false);
  const [practiceRun, setPracticeRun] = useState(0);
  const tabRefs = useRef([]);
  useEffect(() => setMode(initialMode), [initialMode]);
  useEffect(() => setTopic(topicOptions.includes(initialTopic) ? initialTopic : "All"), [initialTopic]);
  const modes = [
    { id: "focus", label: "Focus review", icon: Target, hint: "Hard & due" },
    { id: "flashcards", label: "Flashcards", icon: RotateCcw, hint: "Recall meanings" },
    { id: "listen", label: "Listen", icon: Headphones, hint: "Train your ear" },
    { id: "builder", label: "Build it", icon: Languages, hint: "Make sentences" },
    { id: "speak", label: "Speak", icon: Mic, hint: "Pronunciation reps" },
    { id: "reading", label: "Reading", icon: BookOpen, hint: "Practical texts" },
    { id: "writing", label: "Write", icon: FilePenLine, hint: "Controlled replies" },
    { id: "grammar", label: "Grammar", icon: Lightbulb, hint: "Complete the gap" },
  ];
  const nextUnit = nextUnitForProgress(progress);
  const focusDeck = buildFocusDeck(progress, 10);
  const recommendation = nextRecommendation(progress);
  const recommendedMode = recommendation.kind === "practice" && modes.some((item) => item.id === recommendation.mode) ? recommendation.mode : "flashcards";
  const recommendedLabel = modes.find((item) => item.id === recommendedMode)?.label ?? "Flashcards";
  const recommendedIds = new Set(buildReviewDeck(progress, 60).map((phrase) => phrase.id));
  progress.learnedPhrases.forEach((id) => recommendedIds.add(id));
  allPhrases.filter((phrase) => phrase.stage === nextUnit.stage).forEach((phrase) => recommendedIds.add(phrase.id));
  const recommendedPhrases = allPhrases.filter((phrase) => recommendedIds.has(phrase.id));
  const phrasePool = topic === "All" ? recommendedPhrases : topic === "Entire course" ? allPhrases : allPhrases.filter((phrase) => phrase.topic === topic);
  const readingPool = topic === "All" ? readings.filter((item) => item.stage === nextUnit.stage) : topic === "Entire course" ? readings : readings.filter((item) => item.topic === topic);
  const writingPool = topic === "All" ? writingItems.filter((item) => item.stage === nextUnit.stage) : topic === "Entire course" ? writingItems : writingItems.filter((item) => item.topic === topic);
  const grammarPool = topic === "All" ? clozeItems.filter((item) => item.stage === nextUnit.stage) : topic === "Entire course" ? clozeItems : clozeItems.filter((item) => item.topic === topic);
  const updateRoute = (nextMode, nextTopic) => window.history.replaceState(null, "", `#practice?mode=${encodeURIComponent(nextMode)}&topic=${encodeURIComponent(nextTopic)}`);
  const selectMode = (nextMode) => { setMode(nextMode); updateRoute(nextMode, topic); };
  const startRecommended = () => {
    const nextMode = recommendedMode === "focus" && !focusDeck.length ? "flashcards" : recommendedMode;
    if (mode !== nextMode) selectMode(nextMode);
    setPracticeRun((current) => current + 1);
    setShowModeChooser(false);
  };
  const chooseAnotherDrill = (nextMode = "flashcards") => { selectMode(nextMode); setShowModeChooser(true); };
  const selectTopic = (nextTopic) => { setTopic(nextTopic); updateRoute(mode, nextTopic); };
  const moveTabFocus = (event, index) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? modes.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + modes.length) % modes.length;
    selectMode(modes[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="view-stack practice-page">
      <header className="page-header"><div><span className="eyebrow red"><Brain size={15} /> PRACTICE STUDIO</span><h1>Make it stick</h1><p>Choose a drill whenever you want extra practice. Ratings feed the same review schedule as your daily session.</p></div><div className="mastery-chip"><Trophy size={21} /><span><strong>{progress.totalReviews}</strong> reviews</span></div></header>
      <section className="practice-recommendation panel" aria-label="Recommended practice">
        <div><span className="eyebrow">BEST NEXT DRILL</span><strong>{recommendedLabel}</strong><p>{recommendation.kind === "practice" ? recommendation.reason : `${nextUnit.stage} recall is the clearest practice starting point.`}</p></div>
        <button className="primary-button" onClick={startRecommended}>{mode === recommendedMode && (recommendedMode === "focus" || practiceRun > 0) ? "Restart" : "Start"} {recommendedLabel} <ArrowRight size={17} /></button>
      </section>
      <div className="practice-toolbar">
        <button className="secondary-button practice-mode-toggle" aria-expanded={showModeChooser} onClick={() => setShowModeChooser((open) => !open)}>{showModeChooser ? "Hide drill choices" : `Choose another drill · ${modes.find((item) => item.id === mode)?.label}`}</button>
        <div className={`mode-tabs ${showModeChooser ? "" : "mobile-collapsed"}`} role="tablist" aria-label="Practice mode">
          {modes.map(({ id, label, icon: Icon, hint }, index) => <button key={id} id={`practice-tab-${id}`} ref={(element) => { tabRefs.current[index] = element; }} role="tab" aria-label={label} aria-selected={mode === id} aria-controls={`practice-panel-${id}`} tabIndex={mode === id ? 0 : -1} className={mode === id ? "active" : ""} onKeyDown={(event) => moveTabFocus(event, index)} onClick={() => selectMode(id)}><Icon size={20} /><span><strong>{label}</strong><small>{hint}</small></span></button>)}
        </div>
        {mode === "focus"
          ? <span className="focus-deck-size"><Target size={16} /> {focusDeck.length ? `${focusDeck.length}-phrase focus set` : "Focus set unlocks after learning"}</span>
          : <label className="practice-filter">Practice set <select value={topic} onChange={(event) => selectTopic(event.target.value)}>{topicOptions.map((item) => <option key={item} value={item}>{item === "All" ? "Recommended" : item}</option>)}</select></label>}
      </div>
      {mode === "focus"
        ? <p className="practice-scope-note">Built from Hard and Again ratings, repeat lapses, lower-scoring practice skills, and phrases due now. It is calculated from your existing progress, not saved as another list.</p>
        : topic === "All" && <p className="practice-scope-note">Recommended set: reviews due, phrases you have learned, and {nextUnit.stage} material from your current course stage.</p>}
      <div id={`practice-panel-${mode}`} role="tabpanel" aria-labelledby={`practice-tab-${mode}`}>
        {mode === "focus" && <FocusReview key={`focus-${practiceRun}`} deck={focusDeck} award={award} onAttempt={onAttempt} onChooseAnother={chooseAnotherDrill} />}
        {mode === "flashcards" && <Flashcards key={`flashcards-${topic}-${practiceRun}`} progress={progress} award={award} onAttempt={onAttempt} pool={phrasePool} />}
        {mode === "listen" && <ListeningQuiz key={`listen-${topic}-${practiceRun}`} award={award} onAttempt={onAttempt} pool={phrasePool} />}
        {mode === "builder" && <SentenceBuilder key={`builder-${topic}-${practiceRun}`} award={award} onAttempt={onAttempt} pool={phrasePool} />}
        {mode === "speak" && <SpeakPractice key={`speak-${topic}-${practiceRun}`} progress={progress} award={award} onAttempt={onAttempt} pool={phrasePool} />}
        {mode === "reading" && <ReadingPractice key={`reading-${topic}-${practiceRun}`} items={readingPool.length ? readingPool : readings} award={award} onAttempt={onAttempt} />}
        {mode === "writing" && <WritingPractice key={`writing-${topic}-${practiceRun}`} items={writingPool.length ? writingPool : writingItems} award={award} onAttempt={onAttempt} />}
        {mode === "grammar" && <GrammarPractice key={`grammar-${topic}-${practiceRun}`} items={grammarPool.length ? grammarPool : clozeItems} award={award} onAttempt={onAttempt} />}
      </div>
    </div>
  );
}

function RatingButtons({ onRate }) {
  return <div className="srs-rating-row" aria-label="Schedule this phrase">{RATINGS.map((rating, index) => <button key={rating.id} className={`rating-${rating.id}`} onClick={() => onRate(rating.id)}><strong>{rating.label}</strong><small>{rating.hint}</small><kbd className="key-hint" aria-hidden="true">{index + 1}</kbd></button>)}</div>;
}

function FocusReview({ deck, award, onAttempt, onChooseAnother }) {
  const [activeDeck, setActiveDeck] = useState(() => deck.slice(0, 10));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [phase, setPhase] = useState("review");
  const [results, setResults] = useState([]);
  const [repairCompleted, setRepairCompleted] = useState(false);
  const actionLock = useRef(false);
  const phrase = activeDeck[index];
  const toughResults = results.filter((result) => result.rating === "again" || result.rating === "hard");

  useEffect(() => { actionLock.current = false; }, [index, phase]);

  const rate = (rating) => {
    if (!phrase || phase !== "review" || actionLock.current) return;
    actionLock.current = true;
    const xp = rating === "again" ? 2 : rating === "hard" ? 4 : rating === "good" ? 6 : 8;
    award({ xp, minutes: index % 3 === 0 ? 1 : 0, phraseId: phrase.id, review: true, rating }, `+${xp} XP · Focus review scheduled`);
    onAttempt(phrase.id, "recall", "flashcards", scoreForRating(rating));
    const nextResults = [...results, { phrase, rating }];
    setResults(nextResults);
    if (index + 1 >= activeDeck.length) {
      setPhase("summary");
      setRevealed(false);
      return;
    }
    setIndex((current) => current + 1);
    setRevealed(false);
  };

  const startRepair = () => {
    setActiveDeck(toughResults.map((result) => result.phrase));
    setIndex(0);
    setRevealed(false);
    setRepairCompleted(false);
    setPhase("repair");
  };

  const nextRepair = () => {
    if (!phrase || phase !== "repair" || actionLock.current) return;
    actionLock.current = true;
    if (index + 1 >= activeDeck.length) {
      setRepairCompleted(true);
      setPhase("summary");
      setRevealed(false);
      return;
    }
    setIndex((current) => current + 1);
    setRevealed(false);
  };

  const restart = () => {
    setActiveDeck(deck.slice(0, 10));
    setIndex(0);
    setRevealed(false);
    setResults([]);
    setRepairCompleted(false);
    setPhase("review");
  };

  useDrillKeys({
    onSpace: () => {
      if (!phrase || phase === "summary") return false;
      if (revealed) speakPolish(phrase.polish); else setRevealed(true);
      return true;
    },
    onRate: (rating) => {
      if (phase !== "review" || !revealed) return false;
      rate(rating);
      return true;
    },
  });

  if (!activeDeck.length) {
    return <section className="practice-stage focus-empty panel"><span className="focus-empty-icon"><Target /></span><h2>Your focus set will grow here</h2><p>Learn and rate a few phrases first. Focus Review will then gather what is hard, missed, or due without creating another saved list.</p><button className="primary-button" onClick={() => onChooseAnother("flashcards")}>Start with flashcards <ArrowRight size={17} /></button></section>;
  }

  if (phase === "summary") {
    const recalled = results.filter((result) => result.rating === "good" || result.rating === "easy").length;
    const hard = results.filter((result) => result.rating === "hard").length;
    const missed = results.filter((result) => result.rating === "again").length;
    const title = repairCompleted ? "Repair pass complete" : toughResults.length ? "Set complete — weak spots identified" : `All ${results.length} phrases recalled`;
    const summary = repairCompleted
      ? "You retrieved every tough phrase once more. Your original ratings still control the review schedule."
      : toughResults.length
        ? "Your first ratings decide what returns and when. Repair the tough phrases once now, or leave them to the schedule."
        : "Your first ratings have updated the review schedule. This set is finished.";
    return <section className="practice-stage focus-summary panel" aria-labelledby="focus-summary-title"><span className="focus-summary-icon"><Target /></span><span className="eyebrow red">FOCUS SET COMPLETE</span><h2 id="focus-summary-title">{title}</h2><p>{summary}</p><div className="focus-summary-grid"><article><strong>{recalled}</strong><span>Recalled</span></article><article><strong>{hard}</strong><span>Hard</span></article><article><strong>{missed}</strong><span>Missed</span></article></div><div className="focus-summary-actions">{toughResults.length > 0 && !repairCompleted && <button className="primary-button" onClick={startRepair}><RotateCcw size={17} /> Review {toughResults.length} tough {toughResults.length === 1 ? "phrase" : "phrases"}</button>}<button className="secondary-button" onClick={restart}>Run a fresh focus set</button><button className="text-button" onClick={() => onChooseAnother("flashcards")}>Choose another drill</button></div></section>;
  }

  return (
    <section className="practice-stage focus-review-stage">
      <div className="practice-topline"><span>{phase === "repair" ? "Repair" : "Focus"} {index + 1} of {activeDeck.length}</span><div className="mini-progress"><span style={{ width: `${((index + 1) / activeDeck.length) * 100}%` }} /></div><span>English → Polish</span></div>
      <article className={`flashcard focus-card ${revealed ? "flipped" : ""}`} aria-label={`Focus review: ${phrase.english}`}>
        <span className="flashcard-label">{phase === "repair" ? "REPAIR FROM MEMORY" : "PRODUCE THE POLISH"}</span>
        <h2>{phrase.english}</h2>
        {!revealed && <p className="focus-cue">Say the Polish before revealing it. An effortful attempt matters more than a perfect one.</p>}
        {revealed ? <div className="focus-answer"><AudioButton text={phrase.polish} compact /><strong lang="pl">{phrase.polish}</strong><span className="phonetic large">{phrase.phonetic}</span>{phrase.tip && <small>{phrase.tip}</small>}</div> : <button className="flashcard-reveal" onClick={() => setRevealed(true)}>Reveal Polish <kbd className="key-hint" aria-hidden="true">Space</kbd></button>}
      </article>
      {revealed && (phase === "review" ? <RatingButtons onRate={rate} /> : <div className="focus-repair-action"><button className="primary-button" onClick={nextRepair}>{index + 1 >= activeDeck.length ? "Finish repair" : "Next tough phrase"} <ArrowRight size={17} /></button><small>This repair pass does not overwrite your first rating.</small></div>)}
    </section>
  );
}

function Flashcards({ progress, award, onAttempt, pool }) {
  const [deck] = useState(() => {
    const allowed = new Set(pool.map((phrase) => phrase.id));
    const filtered = buildReviewDeck(progress, 30).filter((phrase) => allowed.has(phrase.id)).slice(0, 12);
    return filtered.length ? filtered : pool.slice(0, 12);
  });
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const phrase = deck[index % deck.length];

  const rate = (rating) => {
    const xp = rating === "again" ? 2 : rating === "hard" ? 4 : rating === "good" ? 6 : 8;
    award({ xp, minutes: index % 3 === 0 ? 1 : 0, phraseId: phrase.id, review: true, rating }, `+${xp} XP · Review scheduled`);
    onAttempt(phrase.id, "recall", "flashcards", scoreForRating(rating));
    setIndex((current) => current + 1);
    setFlipped(false);
  };

  useDrillKeys({
    onSpace: () => { if (flipped) speakPolish(phrase.polish); else setFlipped(true); return true; },
    onRate: (rating) => { if (!flipped) return false; rate(rating); return true; },
  });

  return (
    <section className="practice-stage">
      <div className="practice-topline"><span>Card {(index % deck.length) + 1} of {deck.length}</span><div className="mini-progress"><span style={{ width: `${(((index % deck.length) + 1) / deck.length) * 100}%` }} /></div><span>Polish → English</span></div>
      <article className={`flashcard ${flipped ? "flipped" : ""}`} aria-label={`Flashcard: ${phrase.polish}`}>
        <span className="flashcard-label">{flipped ? "ANSWER" : "WHAT DOES THIS MEAN?"}</span>
        <AudioButton text={phrase.polish} compact />
        <h2 lang="pl">{phrase.polish}</h2>
        <p className="phonetic large">{phrase.phonetic}</p>
        {flipped ? <div className="flashcard-answer"><span>{phrase.english}</span>{phrase.tip && <small>{phrase.tip}</small>}</div> : <button className="flashcard-reveal" onClick={() => setFlipped(true)}>Reveal meaning <kbd className="key-hint" aria-hidden="true">Space</kbd></button>}
      </article>
      {flipped && <RatingButtons onRate={rate} />}
    </section>
  );
}

function ListeningQuiz({ award, onAttempt, pool }) {
  const [round, setRound] = useState(() => makeListeningRound(pool));
  const [answer, setAnswer] = useState(null);
  const choose = (option) => {
    setAnswer(option.id);
    const correct = option.id === round.phrase.id;
    award({ xp: correct ? 8 : 1, minutes: correct ? 1 : 0, phraseId: round.phrase.id, review: true, rating: correct ? "good" : "again" }, correct ? "+8 XP · Review scheduled" : "+1 XP · Back later today");
    onAttempt(round.phrase.id, "listening", "listen", correct ? 1 : 0);
  };
  useDrillKeys({ onSpace: () => { speakPolish(round.phrase.polish); return true; } });
  const next = () => { setRound(makeListeningRound(pool, round.phrase.id)); setAnswer(null); };
  const correct = answer === round.phrase.id;

  return (
    <section className="practice-stage listening-stage">
      <span className="eyebrow">LISTEN WITHOUT READING</span><h2>What did you hear?</h2>
      <button className="big-listen" onClick={() => speakPolish(round.phrase.polish)}><span><Volume2 size={32} /></span>Play Polish</button>
      <button className="slow-link" onClick={() => speakPolish(round.phrase.polish, 0.58)}>Play more slowly</button>
      <div className="answer-grid">{round.options.map((option) => {
        const chosen = answer === option.id;
        const isRight = option.id === round.phrase.id;
        return <button key={option.id} className={answer ? (isRight ? "correct" : chosen ? "wrong" : "muted") : ""} onClick={() => !answer && choose(option)}><span>{option.english}</span>{answer && isRight && <Check size={18} />}{answer && chosen && !isRight && <X size={18} />}</button>;
      })}</div>
      {answer && <div className={`quiz-feedback ${correct ? "correct" : "wrong"}`} role="status"><span className="feedback-icon">{correct ? <Check /> : <Lightbulb />}</span><div><strong>{correct ? "Exactly right" : "Reconnect the sound and meaning"}</strong><p><b>{round.phrase.polish}</b> · {round.phrase.phonetic} · {round.phrase.english}</p></div><button className="primary-button" onClick={next}>Next <ArrowRight size={17} /></button></div>}
    </section>
  );
}

function makeListeningRound(source, excludeId) {
  const pool = source.filter((item) => item.id !== excludeId);
  const phrase = pool[Math.floor(Math.random() * pool.length)];
  const scopedDistractors = source.filter((item) => item.id !== phrase.id && item.english !== phrase.english);
  const fallbackDistractors = allPhrases.filter((item) => item.id !== phrase.id && item.english !== phrase.english && !scopedDistractors.some((scoped) => scoped.id === item.id));
  const distractors = shuffled([...scopedDistractors, ...fallbackDistractors]).slice(0, 3);
  return { phrase, options: shuffled([phrase, ...distractors]) };
}

function SentenceBuilder({ award, onAttempt, pool }) {
  const candidates = pool.filter((phrase) => phrase.polish.split(" ").length >= 3 && phrase.polish.split(" ").length <= 7);
  const [phrase, setPhrase] = useState(() => shuffled(candidates)[0]);
  const [tokens, setTokens] = useState(() => makeTokens(phrase));
  const [chosen, setChosen] = useState([]);
  const [checked, setChecked] = useState(false);
  const answer = chosen.map((token) => token.word).join(" ").replace(/\s+([?!.,])/g, "$1");
  const expected = phrase.polish.replace(/[.,!?]$/g, "");
  const correct = similarity(answer, expected) > 0.98;
  const addToken = (token) => { setChosen((current) => [...current, token]); setTokens((current) => current.filter((item) => item.key !== token.key)); };
  const removeToken = (token) => { setTokens((current) => [...current, token]); setChosen((current) => current.filter((item) => item.key !== token.key)); setChecked(false); };
  const reset = () => { setTokens(makeTokens(phrase)); setChosen([]); setChecked(false); };
  const next = () => { const nextPhrase = shuffled(candidates.filter((item) => item.id !== phrase.id))[0]; setPhrase(nextPhrase); setTokens(makeTokens(nextPhrase)); setChosen([]); setChecked(false); };
  const check = () => {
    setChecked(true);
    award({ xp: correct ? 10 : 1, minutes: correct ? 1 : 0, phraseId: phrase.id, review: true, rating: correct ? "good" : "again" }, correct ? "+10 XP · Review scheduled" : "+1 XP · Try this again later");
    onAttempt(phrase.id, "recall", "builder", correct ? 1 : 0);
  };

  return (
    <section className="practice-stage builder-stage">
      <span className="eyebrow">BUILD THE POLISH</span><h2>{phrase.english}</h2><p>Tap the words in the right order.</p>
      <div className={`build-zone ${checked ? (correct ? "correct" : "wrong") : ""}`}>{chosen.length ? chosen.map((token) => <button key={token.key} onClick={() => removeToken(token)}>{token.word}</button>) : <span>Your Polish sentence will appear here</span>}</div>
      <div className="word-bank">{tokens.map((token) => <button key={token.key} onClick={() => addToken(token)}>{token.word}</button>)}</div>
      {checked && <div className={`builder-feedback ${correct ? "correct" : "wrong"}`} role="status"><strong>{correct ? "Świetnie! Perfect order." : "Not quite. Reset and follow the sound guide."}</strong><span>{phrase.polish} · <em>{phrase.phonetic}</em></span></div>}
      <div className="builder-actions"><button className="secondary-button" onClick={reset}><RotateCcw size={17} /> Reset</button>{checked && correct ? <button className="primary-button" onClick={next}>Next sentence <ArrowRight size={17} /></button> : <button className="primary-button" onClick={check} disabled={tokens.length > 0 || checked}>Check my answer <Check size={17} /></button>}</div>
    </section>
  );
}

function makeTokens(phrase) {
  return shuffled(phrase.polish.replace(/[.,!?]$/g, "").split(" ").map((word, index) => ({ word, key: `${word}-${index}` })));
}

function SpeakPractice({ progress, award, onAttempt, pool }) {
  const [deck] = useState(() => {
    const allowed = new Set(pool.map((phrase) => phrase.id));
    const filtered = buildReviewDeck(progress, 30).filter((phrase) => allowed.has(phrase.id)).slice(0, 10);
    return filtered.length ? filtered : pool.slice(0, 10);
  });
  const [index, setIndex] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const phrase = deck[index % deck.length];
  const rate = (rating) => {
    const xp = rating === "again" ? 2 : rating === "hard" ? 4 : rating === "good" ? 7 : 9;
    award({ xp, minutes: 1, phraseId: phrase.id, review: true, rating }, `+${xp} XP · Speaking review scheduled`);
    onAttempt(phrase.id, "speaking", "speak", scoreForRating(rating));
    setIndex((current) => current + 1);
    setAttempted(false);
  };
  useDrillKeys({
    onSpace: () => { speakPolish(phrase.polish); return true; },
    onRate: (rating) => { if (!attempted) return false; rate(rating); return true; },
  });
  return (
    <section className="practice-stage">
      <div className="practice-topline"><span>Phrase {(index % deck.length) + 1} of {deck.length}</span><div className="mini-progress"><span style={{ width: `${(((index % deck.length) + 1) / deck.length) * 100}%` }} /></div><span>Listen, then speak</span></div>
      <PronunciationCard phrase={phrase} extended onComplete={() => setAttempted(true)} />
      <button className="secondary-button self-rate-toggle" onClick={() => setAttempted(true)}>{attempted ? "Rate your attempt below" : "I said it aloud"}</button>
      {attempted && <RatingButtons onRate={rate} />}
    </section>
  );
}

function ReadingPractice({ items, award, onAttempt }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const item = items[index % items.length];
  const submit = () => {
    const ordered = item.questions.map((_, questionIndex) => answers[questionIndex]);
    const score = scoreReading(item, ordered);
    setResult(score);
    award({ xp: Math.round(4 + score * 8), minutes: 2 }, `Reading score · ${Math.round(score * 100)}%`);
    onAttempt(item.id, "reading", "reading", score);
  };
  const next = () => { setIndex((value) => value + 1); setAnswers({}); setResult(null); };
  return <section className="practice-stage text-practice"><span className="eyebrow">READ A PRACTICAL TEXT</span><h2 lang="pl">{item.text}</h2>{item.questions.map((question, questionIndex) => <fieldset key={question.prompt} disabled={result !== null}><legend>{question.prompt}</legend>{question.options.map((option, optionIndex) => <label key={option}><input type="radio" name={`${item.id}-${questionIndex}`} checked={answers[questionIndex] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))} /> {option}</label>)}</fieldset>)}{result === null ? <button className="primary-button" disabled={Object.keys(answers).length !== item.questions.length} onClick={submit}>Check answers</button> : <div className="quiz-feedback correct" role="status"><strong>{Math.round(result * 100)}% correct</strong><button className="primary-button" onClick={next}>Next reading <ArrowRight size={17} /></button></div>}</section>;
}

function WritingPractice({ items, award, onAttempt }) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);
  const item = items[index % items.length];
  const submit = () => {
    const evaluation = evaluateWriting(item, value);
    setResult(evaluation);
    award({ xp: evaluation.score ? 12 : 2, minutes: 2 }, evaluation.score ? "Controlled writing complete" : "Review the model answer");
    onAttempt(item.id, "writing", "writing", evaluation.score);
  };
  const next = () => { setIndex((value) => value + 1); setValue(""); setResult(null); };
  return <section className="practice-stage text-practice"><span className="eyebrow">CONTROLLED WRITING</span><h2>{item.prompt}</h2><label>Your Polish<textarea ref={inputRef} rows="5" lang="pl" inputMode="text" enterKeyHint="done" autoComplete="off" autoCapitalize="sentences" autoCorrect="on" spellCheck value={value} disabled={result !== null} onChange={(event) => setValue(event.target.value)} placeholder="Write or use your phone keyboard's microphone" /></label><DiacriticsBar inputRef={inputRef} value={value} onChange={setValue} disabled={result !== null} />{result === null ? <button className="primary-button" disabled={!value.trim()} onClick={submit}>Check response</button> : <div className={`writing-feedback ${result.score ? "correct" : "wrong"}`} role="status"><div className="writing-feedback-heading"><strong>{result.score ? "Required meaning included." : "Compare your response with the model."}</strong><span>{result.exact ? "Exact model match" : `${Math.round(result.form.value * 100)}% closest transcript match`}</span></div><div className="writing-rubric"><article><span>Meaning</span><strong>{result.meaning.status === "pass" ? "Covered" : result.meaning.status === "partial" ? "Partly covered" : "Needs another pass"}</strong><p>{result.missingTokens.length ? <>Still missing: <b lang="pl">{result.missingTokens.join(", ")}</b></> : "All required ideas are present."}</p></article><article><span>Form & order</span><strong>{result.form.status === "pass" ? "Model match" : result.form.status === "close" ? "Close" : "Different structure"}</strong><p>{result.exact ? "Word choice and order match an accepted answer." : "Read your version beside the closest model below."}</p></article><article><span>Polish marks</span><strong>{result.diacritics.status === "check" ? "Check marks" : "Not the issue"}</strong><p>{result.diacritics.message}</p></article></div><div className="writing-model"><span>Closest model</span><p lang="pl">{result.closestAnswer}</p>{result.alternatives.length > 1 && <small>{result.alternatives.length - 1} other accepted {result.alternatives.length === 2 ? "answer" : "answers"}</small>}</div><button className="primary-button" onClick={next}>Next prompt</button></div>}</section>;
}

function GrammarPractice({ items, award, onAttempt }) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);
  const item = items[index % items.length];
  const submit = () => {
    const score = scoreCloze(item, value);
    setResult(score);
    award({ xp: score ? 10 : 1, minutes: 1 }, score ? "Grammar answer correct" : "Review the accepted answer");
    onAttempt(item.id, "grammar", "grammar", score);
  };
  const next = () => { setIndex((value) => value + 1); setValue(""); setResult(null); };
  return <section className="practice-stage text-practice"><span className="eyebrow">COMPLETE THE GAP</span><h2>{item.prompt}</h2><label>Missing Polish<input ref={inputRef} lang="pl" inputMode="text" enterKeyHint="done" autoComplete="off" autoCapitalize="sentences" autoCorrect="on" spellCheck value={value} disabled={result !== null} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && value.trim() && result === null) { event.preventDefault(); submit(); } }} placeholder="Type or dictate the missing Polish" /></label><DiacriticsBar inputRef={inputRef} value={value} onChange={setValue} disabled={result !== null} />{result === null ? <button className="primary-button" disabled={!value.trim()} onClick={submit}>Check answer</button> : <div className={`builder-feedback ${result ? "correct" : "wrong"}`} role="status"><strong>{result ? "Correct." : <>Accepted answer: <span lang="pl">{item.acceptedAnswers[0]}</span></>}</strong><button className="primary-button" onClick={next}>Next grammar item</button></div>}</section>;
}
