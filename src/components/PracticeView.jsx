import { useState } from "react";
import { ArrowRight, Brain, Check, Headphones, Languages, Lightbulb, Mic, RotateCcw, Trophy, Volume2, X } from "lucide-react";
import { allPhrases } from "../data/course.js";
import { buildReviewDeck, shuffled, similarity } from "../lib/learning.js";
import { speakPolish } from "../lib/speech.js";
import { AudioButton, PronunciationCard } from "./LearningControls.jsx";

const RATINGS = [
  { id: "again", label: "Again", hint: "Today" },
  { id: "hard", label: "Hard", hint: "1+ day" },
  { id: "good", label: "Good", hint: "2× interval" },
  { id: "easy", label: "Easy", hint: "3× interval" },
];

export default function PracticeView({ progress, award }) {
  const [mode, setMode] = useState("flashcards");
  const modes = [
    { id: "flashcards", label: "Flashcards", icon: RotateCcw, hint: "Recall meanings" },
    { id: "listen", label: "Listen", icon: Headphones, hint: "Train your ear" },
    { id: "builder", label: "Build it", icon: Languages, hint: "Make sentences" },
    { id: "speak", label: "Speak", icon: Mic, hint: "Pronunciation reps" },
  ];

  return (
    <div className="view-stack practice-page">
      <header className="page-header"><div><span className="eyebrow red"><Brain size={15} /> PRACTICE STUDIO</span><h1>Make it stick</h1><p>Choose a drill whenever you want extra practice. Ratings feed the same review schedule as your daily session.</p></div><div className="mastery-chip"><Trophy size={21} /><span><strong>{progress.totalReviews}</strong> reviews</span></div></header>
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

function RatingButtons({ onRate }) {
  return <div className="srs-rating-row" aria-label="Schedule this phrase">{RATINGS.map((rating) => <button key={rating.id} className={`rating-${rating.id}`} onClick={() => onRate(rating.id)}><strong>{rating.label}</strong><small>{rating.hint}</small></button>)}</div>;
}

function Flashcards({ progress, award }) {
  const [deck] = useState(() => buildReviewDeck(progress, 12));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const phrase = deck[index % deck.length];

  const rate = (rating) => {
    const xp = rating === "again" ? 2 : rating === "hard" ? 4 : rating === "good" ? 6 : 8;
    award({ xp, minutes: index % 3 === 0 ? 1 : 0, phraseId: phrase.id, review: true, rating }, `+${xp} XP · Review scheduled`);
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

function ListeningQuiz({ award }) {
  const [round, setRound] = useState(() => makeListeningRound());
  const [answer, setAnswer] = useState(null);
  const choose = (option) => {
    setAnswer(option.id);
    const correct = option.id === round.phrase.id;
    award({ xp: correct ? 8 : 1, minutes: correct ? 1 : 0, phraseId: round.phrase.id, review: true, rating: correct ? "good" : "again" }, correct ? "+8 XP · Review scheduled" : "+1 XP · Back later today");
  };
  const next = () => { setRound(makeListeningRound(round.phrase.id)); setAnswer(null); };
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
  const reset = () => { setTokens(makeTokens(phrase)); setChosen([]); setChecked(false); };
  const next = () => { const nextPhrase = shuffled(candidates.filter((item) => item.id !== phrase.id))[0]; setPhrase(nextPhrase); setTokens(makeTokens(nextPhrase)); setChosen([]); setChecked(false); };
  const check = () => {
    setChecked(true);
    award({ xp: correct ? 10 : 1, minutes: correct ? 1 : 0, phraseId: phrase.id, review: true, rating: correct ? "good" : "again" }, correct ? "+10 XP · Review scheduled" : "+1 XP · Try this again later");
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

function SpeakPractice({ progress, award }) {
  const [deck] = useState(() => buildReviewDeck(progress, 10));
  const [index, setIndex] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const phrase = deck[index % deck.length];
  const rate = (rating) => {
    const xp = rating === "again" ? 2 : rating === "hard" ? 4 : rating === "good" ? 7 : 9;
    award({ xp, minutes: 1, phraseId: phrase.id, review: true, rating }, `+${xp} XP · Speaking review scheduled`);
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
