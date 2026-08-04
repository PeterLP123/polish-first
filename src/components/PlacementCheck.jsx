import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Target, X } from "lucide-react";
import { allPhrases } from "../data/course.js";

const GOALS = [
  { id: "conversation", label: "Everyday conversation", topic: "Social", detail: "Meet people and keep ordinary conversations moving." },
  { id: "travel", label: "Travel confidently", topic: "Travel", detail: "Handle transport, directions, hotels, and problems." },
  { id: "family", label: "Family and daily life", topic: "Daily life", detail: "Join home life, plans, visits, and celebrations." },
  { id: "work", label: "Polish for work", topic: "Next steps", detail: "Build towards meetings, explanations, and professional situations." },
];

const LEVELS = [
  { id: "new", label: "I am starting from zero", detail: "Begin with sounds and survival phrases." },
  { id: "some", label: "I know some useful Polish", detail: "Use the check to find a sensible frontier." },
  { id: "returning", label: "I have studied before", detail: "Test whether an A2 or early-B1 start is realistic." },
];

const CHECK_STAGES = ["Starter", "Everyday", "A2 bridge", "B1 foundations", "B1 confidence"];

function buildQuestions() {
  const targets = CHECK_STAGES.map((stage) => allPhrases.find((phrase) => phrase.stage === stage)).filter(Boolean);
  return targets.map((phrase, index) => {
    const distractors = targets.filter((candidate) => candidate.id !== phrase.id).map((candidate) => candidate.english);
    const options = [phrase.english, ...distractors.slice(index % 2, index % 2 + 3)];
    while (options.length < 4) {
      const fallback = allPhrases[(index * 17 + options.length * 11) % allPhrases.length].english;
      if (!options.includes(fallback)) options.push(fallback);
    }
    return { phrase, options: options.sort((left, right) => left.localeCompare(right)) };
  });
}

export function placementStage(score, selfLevel) {
  const adjusted = score + (selfLevel === "returning" ? 0.12 : selfLevel === "new" ? -0.08 : 0);
  if (adjusted >= 0.88) return "B1 in action";
  if (adjusted >= 0.68) return "B1 foundations";
  if (adjusted >= 0.48) return "A2 bridge";
  if (adjusted >= 0.28) return "Everyday";
  return "Starter";
}

export default function PlacementCheck({ onComplete, onClose }) {
  const questions = useMemo(buildQuestions, []);
  const [step, setStep] = useState("goal");
  const [goal, setGoal] = useState(null);
  const [selfLevel, setSelfLevel] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correct, setCorrect] = useState(0);

  const finish = (correctAnswers = correct) => {
    const placementScore = correctAnswers / questions.length;
    onComplete({
      goal: goal.id,
      primaryTopic: goal.topic,
      selfLevel,
      placementScore,
      startingStage: placementStage(placementScore, selfLevel),
    });
  };

  const answer = (option) => {
    const nextCorrect = correct + (option === questions[questionIndex].phrase.english ? 1 : 0);
    setCorrect(nextCorrect);
    if (questionIndex === questions.length - 1) finish(nextCorrect);
    else setQuestionIndex((current) => current + 1);
  };

  const skipToStarter = () => onComplete({ goal: goal?.id ?? "conversation", primaryTopic: goal?.topic ?? "Social", selfLevel: selfLevel ?? "new", placementScore: 0, startingStage: "Starter" });

  return (
    <div className="lesson-overlay placement-overlay" role="dialog" aria-modal="true" aria-label="Personalise your Polish path">
      <section className="placement-dialog panel">
        <button className="icon-button placement-close" onClick={onClose} aria-label="Close placement check"><X size={19} /></button>
        <span className="eyebrow red"><Target size={15} /> PERSONALISE YOUR PATH</span>
        {step === "goal" && <>
          <h1>What do you want Polish for?</h1>
          <p>Your answer changes which topics appear first. Nothing becomes locked.</p>
          <div className="placement-options">{GOALS.map((item) => <button key={item.id} onClick={() => { setGoal(item); setStep("level"); }}><strong>{item.label}</strong><span>{item.detail}</span><ArrowRight size={18} /></button>)}</div>
        </>}
        {step === "level" && <>
          <button className="placement-back" onClick={() => setStep("goal")}><ArrowLeft size={16} /> Back</button>
          <h1>Where are you starting?</h1>
          <p>The five-question check takes about 90 seconds and does not mark earlier units complete.</p>
          <div className="placement-options">{LEVELS.map((item) => <button key={item.id} onClick={() => { setSelfLevel(item.id); setStep("quiz"); }}><strong>{item.label}</strong><span>{item.detail}</span><ArrowRight size={18} /></button>)}</div>
          <button className="text-button placement-skip" onClick={skipToStarter}>Skip the check and start at Starter</button>
        </>}
        {step === "quiz" && <>
          <div className="placement-progress"><span>Question {questionIndex + 1} of {questions.length}</span><div className="mini-progress"><span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div></div>
          <h1 lang="pl">{questions[questionIndex].phrase.polish}</h1>
          <p>Choose the closest meaning. Do not look it up; this is a baseline, not a test you need to pass.</p>
          <div className="placement-answers">{questions[questionIndex].options.map((option) => <button key={option} onClick={() => answer(option)}>{option}<Check size={17} /></button>)}</div>
        </>}
      </section>
    </div>
  );
}
