import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Headphones, Languages, Mic, RotateCcw, Sparkles, Volume2, X } from "lucide-react";
import { allPhrases, dialogues } from "../data/course.js";
import { shuffled, similarity } from "../lib/learning.js";
import { speakPolish } from "../lib/speech.js";
import { DialoguePlayer } from "./DialoguesView.jsx";
import { AudioButton, PronunciationCard } from "./LearningControls.jsx";

const phraseMap = new Map(allPhrases.map((phrase) => [phrase.id, phrase]));
const dialogueMap = new Map(dialogues.map((dialogue) => [dialogue.id, dialogue]));
const RATINGS = [
  { id: "again", label: "Again", hint: "Review again today" },
  { id: "hard", label: "Hard", hint: "Short interval" },
  { id: "good", label: "Good", hint: "Double the interval" },
  { id: "easy", label: "Easy", hint: "Triple the interval" },
];

export default function GuidedSession({ session, onCommit, onExit, onRestart, upcomingDue = 0 }) {
  if (!session) return <section className="session-empty panel"><Sparkles size={34} /><h1>No session is active</h1><p>Return to Today to build a fresh plan from your due reviews and next phrases.</p><button className="primary-button" onClick={onExit}>Back to Today</button></section>;
  if (session.completedAt) return <SessionComplete session={session} onExit={onExit} onRestart={onRestart} upcomingDue={upcomingDue} />;

  const task = session.tasks[session.cursor];
  const progress = Math.round(((session.cursor + 1) / session.tasks.length) * 100);
  const taskLabel = task.type === "learn" ? "Learn" : task.type === "dialogue" ? "Apply" : task.mode === "listening" ? "Listen" : task.mode === "builder" ? "Build" : task.mode === "speaking" ? "Speak" : "Recall";

  return (
    <div className="guided-session">
      <header className="session-header">
        <button className="lesson-close" onClick={onExit}><ArrowLeft size={20} /><span>Finish later</span></button>
        <div><span>{taskLabel} · Step {session.cursor + 1} of {session.tasks.length}</span><div className="lesson-progress" role="progressbar" aria-label="Daily session progress" aria-valuemin="1" aria-valuemax={session.tasks.length} aria-valuenow={session.cursor + 1}><span style={{ width: `${progress}%` }} /></div></div>
        <span className="lesson-count">{progress}%</span>
      </header>
      <main className="session-main" key={`${task.id}-${session.cursor}`}>
        {task.type === "learn" && <LearnTask phrase={phraseMap.get(task.phraseId)} onDone={() => onCommit(task, { kind: "learn", xp: 5, minutes: 1 })} />}
        {task.type === "review" && <ReviewTask task={task} phrase={phraseMap.get(task.phraseId)} onRate={(rating) => onCommit(task, { kind: "review", rating, xp: rating === "again" ? 2 : rating === "hard" ? 4 : rating === "good" ? 7 : 9, minutes: 1 })} />}
        {task.type === "dialogue" && <div className="session-dialogue"><div className="session-task-heading"><span className="eyebrow red">USE IT IN CONTEXT</span><h1>Finish with a real-life scene</h1><p>Choose naturally. A retry is useful evidence, not a failure.</p></div><DialoguePlayer dialogue={dialogueMap.get(task.dialogueId)} embedded onFinish={(mistakes) => onCommit(task, { kind: "dialogue", mistakes, xp: 30, minutes: 5 })} /></div>}
      </main>
    </div>
  );
}

function LearnTask({ phrase, onDone }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <section className="session-task-card learn-task">
      <div className="session-task-heading"><span className="eyebrow red">NEW PHRASE</span><h1>Listen, notice, then say it</h1><p>This phrase will return tomorrow for its first real review.</p></div>
      <article className="learning-card"><div className="learning-card-audio"><AudioButton text={phrase.polish} compact /><span>Tap to hear it</span></div><div className="learning-phrase"><h2>{phrase.polish}</h2><p className="phonetic large">{phrase.phonetic}</p></div>{revealed ? <div className="learning-meaning"><span>IT MEANS</span><strong>{phrase.english}</strong></div> : <button className="reveal-button" onClick={() => setRevealed(true)}>Reveal meaning</button>}{phrase.tip && <div className="learning-tip"><Sparkles size={18} /><span><strong>In real life</strong>{phrase.tip}</span></div>}</article>
      <div className="session-primary-action"><button className="primary-button" onClick={onDone} disabled={!revealed}>I said it aloud <ArrowRight size={18} /></button></div>
    </section>
  );
}

function ReviewTask({ task, phrase, onRate }) {
  if (task.mode === "listening") return <ListeningTask phrase={phrase} onRate={onRate} />;
  if (task.mode === "builder") return <BuilderTask phrase={phrase} onRate={onRate} />;
  if (task.mode === "speaking") return <SpeakingTask phrase={phrase} onRate={onRate} />;
  return <RecallTask phrase={phrase} onRate={onRate} />;
}

function RatingButtons({ onRate }) {
  return <div className="srs-rating-row session-ratings" aria-label="How well did you remember?">{RATINGS.map((rating) => <button key={rating.id} className={`rating-${rating.id}`} onClick={() => onRate(rating.id)}><strong>{rating.label}</strong><small>{rating.hint}</small></button>)}</div>;
}

function RecallTask({ phrase, onRate }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <section className="session-task-card"><div className="session-task-heading"><span className="eyebrow"><RotateCcw size={14} /> RETRIEVE</span><h1>What does this mean?</h1><p>Try to recall it before revealing the answer.</p></div><article className={`flashcard ${revealed ? "flipped" : ""}`}><AudioButton text={phrase.polish} compact /><h2>{phrase.polish}</h2><p className="phonetic large">{phrase.phonetic}</p>{revealed ? <div className="flashcard-answer"><span>{phrase.english}</span>{phrase.tip && <small>{phrase.tip}</small>}</div> : <button className="flashcard-reveal" onClick={() => setRevealed(true)}>Reveal meaning</button>}</article>{revealed && <RatingButtons onRate={onRate} />}</section>
  );
}

function ListeningTask({ phrase, onRate }) {
  const [answer, setAnswer] = useState(null);
  const options = useMemo(() => {
    const index = allPhrases.findIndex((item) => item.id === phrase.id);
    const distractors = [1, 7, 19].map((offset) => allPhrases[(index + offset) % allPhrases.length]).filter((item) => item.english !== phrase.english);
    return shuffled([phrase, ...distractors.slice(0, 3)]);
  }, [phrase]);
  const correct = answer === phrase.id;
  return (
    <section className="session-task-card listening-stage"><div className="session-task-heading"><span className="eyebrow"><Headphones size={14} /> LISTEN</span><h1>What did you hear?</h1><p>Connect the sound directly to its meaning.</p></div><button className="big-listen" onClick={() => speakPolish(phrase.polish)}><span><Volume2 size={32} /></span>Play Polish</button><button className="slow-link" onClick={() => speakPolish(phrase.polish, 0.58)}>Play more slowly</button><div className="answer-grid">{options.map((option) => <button key={option.id} className={answer ? (option.id === phrase.id ? "correct" : option.id === answer ? "wrong" : "muted") : ""} onClick={() => !answer && setAnswer(option.id)}>{option.english}{answer && option.id === phrase.id && <Check size={18} />}{answer === option.id && option.id !== phrase.id && <X size={18} />}</button>)}</div>{answer && <div className={`quiz-feedback ${correct ? "correct" : "wrong"}`} role="status"><div><strong>{correct ? "Exactly right" : "Reconnect the sound and answer"}</strong><p>{phrase.polish} · {phrase.phonetic} · {phrase.english}</p></div><button className="primary-button" onClick={() => onRate(correct ? "good" : "again")}>Continue <ArrowRight size={17} /></button></div>}</section>
  );
}

function BuilderTask({ phrase, onRate }) {
  const words = useMemo(() => shuffled(phrase.polish.replace(/[.,!?]$/g, "").split(" ").map((word, index) => ({ word, key: `${word}-${index}` }))), [phrase]);
  const [bank, setBank] = useState(words);
  const [chosen, setChosen] = useState([]);
  const [checked, setChecked] = useState(false);
  const answer = chosen.map((token) => token.word).join(" ");
  const expected = phrase.polish.replace(/[.,!?]$/g, "");
  const correct = similarity(answer, expected) > 0.98;
  const add = (token) => { setChosen((current) => [...current, token]); setBank((current) => current.filter((item) => item.key !== token.key)); };
  return (
    <section className="session-task-card builder-stage"><div className="session-task-heading"><span className="eyebrow"><Languages size={14} /> BUILD</span><h1>{phrase.english}</h1><p>Put the Polish words in their natural order.</p></div><div className={`build-zone ${checked ? (correct ? "correct" : "wrong") : ""}`}>{chosen.length ? chosen.map((token) => <button key={token.key} onClick={() => { setBank((current) => [...current, token]); setChosen((current) => current.filter((item) => item.key !== token.key)); setChecked(false); }}>{token.word}</button>) : <span>Your sentence appears here</span>}</div><div className="word-bank">{bank.map((token) => <button key={token.key} onClick={() => add(token)}>{token.word}</button>)}</div>{checked && <div className={`builder-feedback ${correct ? "correct" : "wrong"}`} role="status"><strong>{correct ? "Świetnie!" : "Follow the sound guide and try this again later."}</strong><span>{phrase.polish} · <em>{phrase.phonetic}</em></span></div>}<div className="builder-actions"><button className="secondary-button" onClick={() => { setBank(words); setChosen([]); setChecked(false); }}><RotateCcw size={17} /> Reset</button>{checked ? <button className="primary-button" onClick={() => onRate(correct ? "good" : "again")}>Continue <ArrowRight size={17} /></button> : <button className="primary-button" onClick={() => setChecked(true)} disabled={bank.length > 0}>Check <Check size={17} /></button>}</div></section>
  );
}

function SpeakingTask({ phrase, onRate }) {
  const [attempted, setAttempted] = useState(false);
  return <section className="session-task-card"><div className="session-task-heading"><span className="eyebrow"><Mic size={14} /> SPEAK</span><h1>Say it naturally, not perfectly</h1><p>Microphone checking is optional. Your self-rating controls the schedule.</p></div><PronunciationCard phrase={phrase} extended onComplete={() => setAttempted(true)} /><button className="secondary-button self-rate-toggle" onClick={() => setAttempted(true)}>I said it aloud</button>{attempted && <RatingButtons onRate={onRate} />}</section>;
}

function SessionComplete({ session, onExit, onRestart, upcomingDue }) {
  const results = session.results ?? [];
  const reviews = results.filter((result) => result.kind === "review");
  const successful = reviews.filter((result) => result.rating !== "again").length;
  const accuracy = reviews.length ? Math.round((successful / reviews.length) * 100) : 100;
  const xp = results.reduce((sum, result) => sum + (result.xp ?? 0), 0);
  const minutes = results.reduce((sum, result) => sum + (result.minutes ?? 0), 0);
  const dialogue = results.find((result) => result.kind === "dialogue");
  return (
    <section className="session-complete-view"><div className="session-complete-card panel"><div className="celebration">🎉</div><span className="eyebrow red">DAILY SESSION COMPLETE</span><h1>Świetna robota!</h1><p>You learned, retrieved, and used Polish in context. The next reviews are already scheduled.</p><div className="session-summary-grid"><div><strong>{accuracy}%</strong><span>review accuracy</span></div><div><strong>+{xp}</strong><span>XP earned</span></div><div><strong>{minutes}</strong><span>minutes</span></div><div><strong>{dialogue?.mistakes ?? 0}</strong><span>dialogue retries</span></div></div><p className="upcoming-reviews"><Sparkles size={18} /> {upcomingDue} phrase{upcomingDue === 1 ? "" : "s"} currently due for your next review.</p><div className="session-complete-actions"><button className="secondary-button" onClick={onRestart}><RotateCcw size={17} /> Build another session</button><button className="primary-button" onClick={onExit}>Back to Today <ArrowRight size={17} /></button></div></div></section>
  );
}
