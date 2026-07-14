import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Brain, Check, FilePenLine, Headphones, Languages, Lightbulb, Mic, RotateCcw, Trophy, Volume2, X } from "lucide-react";
import { allPhrases, clozeItems, courseTopics, readings, writingItems } from "../data/course.js";
import { buildReviewDeck, scoreCloze, scoreForRating, scoreReading, scoreWriting, shuffled, similarity } from "../lib/learning.js";
import { speakPolish } from "../lib/speech.js";
import { AudioButton, PronunciationCard } from "./LearningControls.jsx";

const RATINGS = [
  { id: "again", label: "Again", hint: "Today" },
  { id: "hard", label: "Hard", hint: "1+ day" },
  { id: "good", label: "Good", hint: "2× interval" },
  { id: "easy", label: "Easy", hint: "3× interval" },
];

export default function PracticeView({ progress, award, onAttempt = () => {}, initialMode = "flashcards", initialTopic = "All" }) {
  const [mode, setMode] = useState(initialMode);
  const [topic, setTopic] = useState(courseTopics.includes(initialTopic) ? initialTopic : "All");
  useEffect(() => setMode(initialMode), [initialMode]);
  useEffect(() => setTopic(courseTopics.includes(initialTopic) ? initialTopic : "All"), [initialTopic]);
  const modes = [
    { id: "flashcards", label: "Flashcards", icon: RotateCcw, hint: "Recall meanings" },
    { id: "listen", label: "Listen", icon: Headphones, hint: "Train your ear" },
    { id: "builder", label: "Build it", icon: Languages, hint: "Make sentences" },
    { id: "speak", label: "Speak", icon: Mic, hint: "Pronunciation reps" },
    { id: "reading", label: "Reading", icon: BookOpen, hint: "Practical texts" },
    { id: "writing", label: "Write", icon: FilePenLine, hint: "Controlled replies" },
    { id: "grammar", label: "Grammar", icon: Lightbulb, hint: "Complete the gap" },
  ];
  const phrasePool = topic === "All" ? allPhrases : allPhrases.filter((phrase) => phrase.topic === topic);
  const readingPool = topic === "All" ? readings : readings.filter((item) => item.topic === topic);
  const writingPool = topic === "All" ? writingItems : writingItems.filter((item) => item.topic === topic);
  const grammarPool = topic === "All" ? clozeItems : clozeItems.filter((item) => item.topic === topic);
  const updateRoute = (nextMode, nextTopic) => window.history.replaceState(null, "", `#practice?mode=${encodeURIComponent(nextMode)}&topic=${encodeURIComponent(nextTopic)}`);
  const selectMode = (nextMode) => { setMode(nextMode); updateRoute(nextMode, topic); };
  const selectTopic = (nextTopic) => { setTopic(nextTopic); updateRoute(mode, nextTopic); };

  return (
    <div className="view-stack practice-page">
      <header className="page-header"><div><span className="eyebrow red"><Brain size={15} /> PRACTICE STUDIO</span><h1>Make it stick</h1><p>Choose a drill whenever you want extra practice. Ratings feed the same review schedule as your daily session.</p></div><div className="mastery-chip"><Trophy size={21} /><span><strong>{progress.totalReviews}</strong> reviews</span></div></header>
      <div className="mode-tabs" role="tablist" aria-label="Practice mode">
        {modes.map(({ id, label, icon: Icon, hint }) => <button key={id} role="tab" aria-label={label} aria-selected={mode === id} className={mode === id ? "active" : ""} onClick={() => selectMode(id)}><Icon size={20} /><span><strong>{label}</strong><small>{hint}</small></span></button>)}
      </div>
      <label className="practice-filter">Topic <select value={topic} onChange={(event) => selectTopic(event.target.value)}>{courseTopics.map((item) => <option key={item}>{item}</option>)}</select></label>
      {mode === "flashcards" && <Flashcards key={`flashcards-${topic}`} progress={progress} award={award} onAttempt={onAttempt} pool={phrasePool} />}
      {mode === "listen" && <ListeningQuiz key={`listen-${topic}`} award={award} onAttempt={onAttempt} pool={phrasePool} />}
      {mode === "builder" && <SentenceBuilder key={`builder-${topic}`} award={award} onAttempt={onAttempt} pool={phrasePool} />}
      {mode === "speak" && <SpeakPractice key={`speak-${topic}`} progress={progress} award={award} onAttempt={onAttempt} pool={phrasePool} />}
      {mode === "reading" && <ReadingPractice key={`reading-${topic}`} items={readingPool.length ? readingPool : readings} award={award} onAttempt={onAttempt} />}
      {mode === "writing" && <WritingPractice key={`writing-${topic}`} items={writingPool.length ? writingPool : writingItems} award={award} onAttempt={onAttempt} />}
      {mode === "grammar" && <GrammarPractice key={`grammar-${topic}`} items={grammarPool.length ? grammarPool : clozeItems} award={award} onAttempt={onAttempt} />}
    </div>
  );
}

function RatingButtons({ onRate }) {
  return <div className="srs-rating-row" aria-label="Schedule this phrase">{RATINGS.map((rating) => <button key={rating.id} className={`rating-${rating.id}`} onClick={() => onRate(rating.id)}><strong>{rating.label}</strong><small>{rating.hint}</small></button>)}</div>;
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
  const distractors = shuffled(allPhrases.filter((item) => item.id !== phrase.id && item.english !== phrase.english)).slice(0, 3);
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
  return <section className="practice-stage text-practice"><span className="eyebrow">READ A PRACTICAL TEXT</span><h2>{item.text}</h2>{item.questions.map((question, questionIndex) => <fieldset key={question.prompt}><legend>{question.prompt}</legend>{question.options.map((option, optionIndex) => <label key={option}><input type="radio" name={`${item.id}-${questionIndex}`} checked={answers[questionIndex] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))} /> {option}</label>)}</fieldset>)}{result === null ? <button className="primary-button" disabled={Object.keys(answers).length !== item.questions.length} onClick={submit}>Check answers</button> : <div className="quiz-feedback correct" role="status"><strong>{Math.round(result * 100)}% correct</strong><button className="primary-button" onClick={next}>Next reading <ArrowRight size={17} /></button></div>}</section>;
}

function WritingPractice({ items, award, onAttempt }) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState(null);
  const item = items[index % items.length];
  const submit = () => {
    const score = scoreWriting(item, value);
    setResult(score);
    award({ xp: score ? 12 : 2, minutes: 2 }, score ? "Controlled writing complete" : "Review the model answer");
    onAttempt(item.id, "writing", "writing", score);
  };
  const next = () => { setIndex((value) => value + 1); setValue(""); setResult(null); };
  return <section className="practice-stage text-practice"><span className="eyebrow">CONTROLLED WRITING</span><h2>{item.prompt}</h2><label>Your Polish<textarea rows="5" lang="pl" inputMode="text" enterKeyHint="done" autoComplete="off" autoCapitalize="sentences" autoCorrect="on" spellCheck value={value} onChange={(event) => setValue(event.target.value)} placeholder="Write or use your phone keyboard's microphone" /></label>{result === null ? <button className="primary-button" disabled={!value.trim()} onClick={submit}>Check response</button> : <div className={`builder-feedback ${result ? "correct" : "wrong"}`} role="status"><strong>{result ? "Required meaning included." : "Use the model and try another prompt."}</strong><span>Model: {item.acceptedAnswers[0]}</span><button className="primary-button" onClick={next}>Next prompt</button></div>}</section>;
}

function GrammarPractice({ items, award, onAttempt }) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [result, setResult] = useState(null);
  const item = items[index % items.length];
  const submit = () => {
    const score = scoreCloze(item, value);
    setResult(score);
    award({ xp: score ? 10 : 1, minutes: 1 }, score ? "Grammar answer correct" : "Review the accepted answer");
    onAttempt(item.id, "grammar", "grammar", score);
  };
  const next = () => { setIndex((value) => value + 1); setValue(""); setResult(null); };
  return <section className="practice-stage text-practice"><span className="eyebrow">COMPLETE THE GAP</span><h2>{item.prompt}</h2><label>Missing Polish<input lang="pl" inputMode="text" enterKeyHint="done" autoComplete="off" autoCapitalize="sentences" autoCorrect="on" spellCheck value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && value.trim()) { event.preventDefault(); submit(); } }} placeholder="Type or dictate the missing Polish" /></label>{result === null ? <button className="primary-button" disabled={!value.trim()} onClick={submit}>Check answer</button> : <div className={`builder-feedback ${result ? "correct" : "wrong"}`} role="status"><strong>{result ? "Correct." : `Accepted answer: ${item.acceptedAnswers[0]}`}</strong><button className="primary-button" onClick={next}>Next grammar item</button></div>}</section>;
}
