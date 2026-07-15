import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Volume2, X } from "lucide-react";
import { ContentCatalog, allPhrases } from "../data/course.js";
import { normalisePolish, scoreCloze, scoreForRating, scoreReading, scoreWriting, shuffled } from "../lib/learning.js";
import { speakPolish } from "../lib/speech.js";

const SKILLS = { listening: "listening", reading: "reading", grammar: "grammar", builder: "recall", writing: "writing", dialogue: "recall", speaking: "speaking" };

export default function MilestoneRunner({ milestone, onClose, onComplete, onAttempt }) {
  const dialogRef = useRef(null);
  const [taskIndex, setTaskIndex] = useState(0);
  const [autoScores, setAutoScores] = useState([]);
  const [finished, setFinished] = useState(null);
  const task = milestone.tasks[taskIndex];
  const item = task ? ContentCatalog.byId.get(task.itemId) : null;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector("button")?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const controls = [...(dialogRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? [])];
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
      if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey, true);
      previousFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    dialogRef.current?.querySelector(".milestone-task h2, .milestone-result h2")?.focus({ preventScroll: true });
  }, [taskIndex, finished]);

  const completeTask = (score, rating = null) => {
    onAttempt(task.itemId, SKILLS[task.kind], "milestone", rating ? scoreForRating(rating) : score);
    if (task.kind === "speaking") {
      const mean = autoScores.reduce((sum, value) => sum + value, 0) / autoScores.length;
      onComplete(milestone.id, autoScores, rating);
      setFinished({ mean, passed: mean >= 0.8 && rating !== "again" });
      return;
    }
    setAutoScores((current) => [...current, score]);
    setTaskIndex((current) => current + 1);
  };

  const retry = () => { setTaskIndex(0); setAutoScores([]); setFinished(null); };

  return <section ref={dialogRef} className="milestone-runner panel" role="dialog" aria-modal="true" aria-label={`${milestone.title} milestone`}>
    <button className="icon-button milestone-close" onClick={onClose} aria-label="Close milestone"><X size={18} /></button>
    <span className="eyebrow red">SCENARIO READINESS · {milestone.stage.toUpperCase()}</span>
    {!finished ? <>
      <div className="practice-topline"><span>Task {taskIndex + 1} of 10</span><div className="mini-progress"><span style={{ width: `${(taskIndex / 10) * 100}%` }} /></div><span>{task.kind}</span></div>
      <MilestoneTask key={`${milestone.id}-${taskIndex}`} task={task} item={item} onComplete={completeTask} />
    </> : <div className="milestone-result"><span className="celebration">{finished.passed ? "🎉" : "🌱"}</span><h2 tabIndex="-1">{finished.passed ? "Scenario ready" : "Keep building"}</h2><p>Your automatic score was <strong>{Math.round(finished.mean * 100)}%</strong>. Passing requires 80% plus the speaking self-check.</p><div><button className="secondary-button" onClick={retry}>Try again</button><button className="primary-button" onClick={onClose}>Back to insights</button></div></div>}
  </section>;
}

function MilestoneTask({ task, item, onComplete }) {
  if (task.kind === "listening") return <ListeningTask item={item} onComplete={onComplete} />;
  if (task.kind === "reading") return <ReadingTask item={item} onComplete={onComplete} />;
  if (task.kind === "grammar") return <TextTask title="Complete the grammar gap" prompt={item.prompt} accepted={item.acceptedAnswers} scorer={(value) => scoreCloze(item, value)} onComplete={onComplete} />;
  if (task.kind === "builder") return <TextTask title="Build the Polish sentence" prompt={item.english} accepted={[item.polish]} scorer={(value) => normalisePolish(value) === normalisePolish(item.polish) ? 1 : 0} onComplete={onComplete} />;
  if (task.kind === "writing") return <TextTask title="Write a controlled response" prompt={item.prompt} accepted={item.acceptedAnswers} scorer={(value) => scoreWriting(item, value)} onComplete={onComplete} multiline />;
  if (task.kind === "dialogue") return <DialogueTask item={item} onComplete={onComplete} />;
  return <SpeakingTask item={item} onComplete={onComplete} />;
}

function ListeningTask({ item, onComplete }) {
  const [answer, setAnswer] = useState(null);
  const [options] = useState(() => shuffled([item, ...allPhrases.filter((phrase) => phrase.id !== item.id && phrase.english !== item.english).slice(0, 2)]));
  const selected = answer === null ? null : options[answer];
  return <div className="milestone-task"><h2 tabIndex="-1">What did you hear?</h2><button className="big-listen" onClick={() => speakPolish(item.polish)}><Volume2 /> Play Polish</button><div className="answer-grid">{options.map((option, index) => <button key={option.id} className={answer === index ? (option.id === item.id ? "correct" : "wrong") : ""} onClick={() => setAnswer(index)}>{option.english}</button>)}</div><button className="primary-button" disabled={answer === null} onClick={() => onComplete(selected?.id === item.id ? 1 : 0)}>Continue <ArrowRight size={17} /></button></div>;
}

function ReadingTask({ item, onComplete }) {
  const [answers, setAnswers] = useState({});
  return <div className="milestone-task text-practice"><h2 lang="pl" tabIndex="-1">{item.text}</h2>{item.questions.map((question, questionIndex) => <fieldset key={question.prompt}><legend>{question.prompt}</legend>{question.options.map((option, optionIndex) => <label key={option}><input type="radio" name={`${item.id}-${questionIndex}`} onChange={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))} /> {option}</label>)}</fieldset>)}<button className="primary-button" disabled={Object.keys(answers).length !== item.questions.length} onClick={() => onComplete(scoreReading(item, item.questions.map((_, index) => answers[index])))}>Check and continue</button></div>;
}

function TextTask({ title, prompt, accepted, scorer, onComplete, multiline = false }) {
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(null);
  const score = scorer(value);
  const polishInputProps = { lang: "pl", inputMode: "text", enterKeyHint: "done", autoComplete: "off", autoCapitalize: "sentences", autoCorrect: "on", spellCheck: true };
  const input = multiline ? <textarea {...polishInputProps} rows="4" value={value} disabled={checked !== null} onChange={(event) => setValue(event.target.value)} placeholder="Write or use your phone keyboard's microphone" /> : <input {...polishInputProps} value={value} disabled={checked !== null} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && value.trim()) { event.preventDefault(); setChecked(score); } }} placeholder="Type or dictate your Polish answer" />;
  return <div className="milestone-task text-practice"><h2 tabIndex="-1">{title}</h2><p>{prompt}</p><label>Your answer{input}</label>{checked !== null && <div className={`builder-feedback ${checked ? "correct" : "wrong"}`} role="status"><strong>{checked ? "Correct." : `Model: ${accepted[0]}`}</strong></div>}{checked === null ? <button className="primary-button" disabled={!value.trim()} onClick={() => setChecked(score)}>Check answer</button> : <button className="primary-button" onClick={() => onComplete(checked)}>Continue <ArrowRight size={17} /></button>}</div>;
}

function DialogueTask({ item, onComplete }) {
  const [answers, setAnswers] = useState({});
  const submit = () => {
    const score = item.lines.reduce((sum, line, index) => sum + (line.choices[answers[index]]?.good ? 1 : 0), 0) / item.lines.length;
    onComplete(score);
  };
  return <div className="milestone-task dialogue-check"><h2 tabIndex="-1">{item.title}</h2>{item.lines.map((line, index) => <fieldset key={`${line.polish}-${index}`}><legend><strong>{line.speaker}:</strong> {line.polish}</legend>{line.choices.map((option, optionIndex) => <label key={option.polish}><input type="radio" name={`${item.id}-${index}`} onChange={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))} /> {option.polish}</label>)}</fieldset>)}<button className="primary-button" disabled={Object.keys(answers).length !== item.lines.length} onClick={submit}>Complete dialogue</button></div>;
}

function SpeakingTask({ item, onComplete }) {
  const [spoken, setSpoken] = useState(false);
  return <div className="milestone-task speaking-check"><h2 tabIndex="-1">Say this aloud</h2><p className="milestone-speaking-phrase" lang="pl">{item.polish}</p><p className="phonetic">{item.phonetic}</p><button className="secondary-button" onClick={() => speakPolish(item.polish)}><Volume2 /> Listen first</button><button className="primary-button" onClick={() => setSpoken(true)}><Check /> I said it aloud</button>{spoken && <div className="srs-rating-row">{["again", "hard", "good", "easy"].map((rating) => <button key={rating} onClick={() => onComplete(scoreForRating(rating), rating)}><strong>{rating[0].toUpperCase() + rating.slice(1)}</strong></button>)}</div>}</div>;
}
