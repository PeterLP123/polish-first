import { useRef, useState } from "react";
import { Award, BarChart3, Check, ChevronRight, Clipboard, Download, FileUp, ShieldCheck, Target, X } from "lucide-react";
import { allPhrases, units } from "../data/course.js";
import { diagnosticsSummary, dueForecast, masterySummary, milestoneOverview, nextRecommendation, parseProgressImport, performanceTrend, serializeProgress, skillOverview, topicOverview } from "../lib/learning.js";
import MilestoneRunner from "./MilestoneRunner.jsx";

export default function ProgressDataView({ progress, onReplaceProgress, onNavigatePractice = () => {}, onOpenUnit = () => {}, onCompleteMilestone = () => {}, onAttempt = () => {} }) {
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const mastery = masterySummary(progress);
  const recommendation = nextRecommendation(progress);
  const skills = skillOverview(progress);
  const topics = topicOverview(progress);
  const trend = performanceTrend(progress);
  const forecast = dueForecast(progress);
  const milestoneStates = milestoneOverview(progress);
  const [activeMilestone, setActiveMilestone] = useState(null);

  const followRecommendation = () => {
    if (recommendation.kind === "practice") onNavigatePractice(recommendation.mode, recommendation.topic);
    if (recommendation.kind === "unit") onOpenUnit(units.find((unit) => unit.id === recommendation.unitId));
    if (recommendation.kind === "milestone") setActiveMilestone(milestoneStates.find((item) => item.id === recommendation.milestoneId));
  };

  const exportProgress = () => {
    const blob = new Blob([serializeProgress(progress)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `polish-first-progress-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Progress export created.");
  };

  const readImport = async (event) => {
    setError("");
    setMessage("");
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = parseProgressImport(await file.text());
      setPreview(imported);
    } catch (caught) {
      setPreview(null);
      setError(caught.message);
    } finally {
      event.target.value = "";
    }
  };

  const confirmImport = () => {
    onReplaceProgress(preview);
    setPreview(null);
    setMessage("Progress imported successfully.");
  };

  const copyDiagnostics = async () => {
    const summary = diagnosticsSummary(progress, {
      speechSynthesis: "speechSynthesis" in window,
      speechRecognition: Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    });
    try {
      await navigator.clipboard.writeText(summary);
      setMessage("Diagnostics copied. It contains counts and browser capabilities, not answer history.");
    } catch {
      setError("Clipboard access is unavailable. Try again from a secure or local page.");
    }
  };

  return (
    <div className="view-stack data-page">
      <header className="page-header"><div><span className="eyebrow red"><Award size={15} /> PROGRESS & DATA</span><h1>Your learning stays yours</h1><p>See what is due, move progress between devices, or share a privacy-safe diagnostic summary with a tester.</p></div></header>
      <section className="next-action panel"><span className="next-action-icon"><Target /></span><div><span className="eyebrow red">BEST NEXT ACTION</span><h2>{recommendation.kind === "unit" ? "Continue the course" : recommendation.kind === "milestone" ? "Check scenario readiness" : `Practise ${recommendation.mode}`}</h2><p>{recommendation.reason}</p></div><button className="primary-button" onClick={followRecommendation}>Start <ChevronRight size={17} /></button></section>
      <section className="mastery-overview panel">
        <div><span className="eyebrow">LEARNING SNAPSHOT</span><h2>{progress.learnedPhrases.length} phrases in your memory system</h2><p>Mastered means the phrase has reached a review interval of at least 30 days.</p></div>
        <div className="mastery-metrics"><article><strong>{mastery.due}</strong><span>Due now</span></article><article><strong>{mastery.learning}</strong><span>Learning</span></article><article><strong>{mastery.mastered}</strong><span>Mastered</span></article><article><strong>{progress.completedUnits.length}/{units.length}</strong><span>Units complete</span></article></div>
      </section>
      <section><div className="section-heading-row"><div><span className="eyebrow">SKILL EVIDENCE</span><h2>Six ways your Polish is growing</h2></div>{progress.analyticsSince && <small>Detailed insights tracked since {progress.analyticsSince}</small>}</div><div className="skill-grid">{skills.map((skill) => <article className="skill-card panel" key={skill.skill}><span>{skill.skill}</span><strong>{skill.mean === null ? "—" : `${Math.round(skill.mean * 100)}%`}</strong><small>{skill.label} · {skill.attempts} attempts</small></article>)}</div></section>
      <section className="insight-grid">
        <article className="panel trend-card"><span className="eyebrow"><BarChart3 size={15} /> 30-DAY PERFORMANCE</span><MiniTrend values={trend} /><p>{trend.reduce((sum, day) => sum + day.attempts, 0)} scored attempts in the last 30 days.</p></article>
        <article className="panel forecast-card"><span className="eyebrow">SEVEN-DAY DUE FORECAST</span><div className="forecast-bars" role="img" aria-label={forecast.map((day) => `${day.date}: ${day.due} due`).join(", ")}>{forecast.map((day) => <div key={day.date}><span style={{ height: `${Math.max(4, Math.min(100, day.due * 7))}%` }} /><strong>{day.due}</strong><small>{day.date.slice(5)}</small></div>)}</div><p>{forecast.reduce((sum, day) => sum + day.due, 0)} reviews scheduled across these dates.</p></article>
      </section>
      <section className="panel topic-panel"><span className="eyebrow">TOPIC COVERAGE</span><div className="table-scroll"><table><thead><tr><th>Topic</th><th>Seen</th><th>Due</th><th>Mean interval</th></tr></thead><tbody>{topics.map((topic) => <tr key={topic.topic}><th>{topic.topic}</th><td>{topic.seen}/{topic.total}</td><td>{topic.due}</td><td>{topic.meanInterval.toFixed(1)} days</td></tr>)}</tbody></table></div></section>
      <section><div className="section-heading-row"><div><span className="eyebrow">SCENARIO READINESS</span><h2>Stage milestones</h2></div><small>Practice evidence, not CEFR certification</small></div><div className="milestone-grid">{milestoneStates.map((milestone) => <article className={`milestone-card panel ${milestone.passed ? "passed" : ""}`} key={milestone.id}><span>{milestone.passed ? "Passed" : milestone.ready ? "Ready" : "Locked"}</span><h3>{milestone.title}</h3><p>{milestone.result ? `Best automatic score ${Math.round(milestone.result.bestAutoScore * 100)}%` : `Complete every ${milestone.stage} unit to unlock.`}</p><button className="secondary-button" disabled={!milestone.ready} onClick={() => setActiveMilestone(milestone)}>{milestone.passed ? "Try again" : "Start check"}</button></article>)}</div></section>
      <div className="data-tools-grid">
        <article className="data-tool-card panel"><span className="data-tool-icon"><Download /></span><h2>Back up progress</h2><p>Download a readable JSON file containing your local learning record and current session.</p><button className="primary-button" onClick={exportProgress}><Download size={17} /> Export progress</button></article>
        <article className="data-tool-card panel"><span className="data-tool-icon"><FileUp /></span><h2>Import progress</h2><p>Restore this app's export format. Nothing changes until you review and confirm it.</p><input ref={fileRef} className="visually-hidden" type="file" accept="application/json,.json" aria-hidden="true" tabIndex={-1} onChange={readImport} /><button className="secondary-button" onClick={() => fileRef.current?.click()}><FileUp size={17} /> Choose export file</button></article>
        <article className="data-tool-card panel"><span className="data-tool-icon"><Clipboard /></span><h2>Tester diagnostics</h2><p>Copy app version, progress counts, and speech capability flags. Individual answers are excluded.</p><button className="secondary-button" onClick={copyDiagnostics}><Clipboard size={17} /> Copy diagnostics</button></article>
      </div>
      {preview && <section className="import-preview panel" role="dialog" aria-modal="true" aria-label="Confirm progress import"><button className="icon-button import-close" onClick={() => setPreview(null)} aria-label="Cancel import"><X size={18} /></button><span className="eyebrow red">IMPORT PREVIEW</span><h2>Replace current progress?</h2><p>This file contains <strong>{preview.learnedPhrases.length} of {allPhrases.length} phrases</strong>, <strong>{preview.completedUnits.length} completed units</strong>, and <strong>{preview.xp} XP</strong>.</p><div className="import-warning"><ShieldCheck size={20} /><span>Your current browser progress will be replaced. Export it first if you may need it later.</span></div><div className="import-actions"><button className="secondary-button" onClick={() => setPreview(null)}>Cancel</button><button className="primary-button" onClick={confirmImport}><Check size={17} /> Confirm import</button></div></section>}
      {message && <p className="data-message success" role="status"><Check size={17} /> {message}</p>}
      {error && <p className="data-message error" role="alert"><X size={17} /> {error}</p>}
      {activeMilestone && <MilestoneRunner milestone={activeMilestone} onClose={() => setActiveMilestone(null)} onComplete={onCompleteMilestone} onAttempt={onAttempt} />}
    </div>
  );
}

function MiniTrend({ values }) {
  const points = values.map((day, index) => `${(index / Math.max(1, values.length - 1)) * 300},${90 - (day.mean ?? 0) * 80}`).join(" ");
  const attempted = values.filter((day) => day.attempts > 0);
  const label = attempted.length ? attempted.map((day) => `${day.date}: ${day.attempts} attempts at ${Math.round((day.mean ?? 0) * 100)} percent`).join(", ") : "No scored attempts in the last 30 days";
  return <div className="trend-visual"><svg viewBox="0 0 300 100" role="img" aria-label={label}><line x1="0" y1="90" x2="300" y2="90" /><polyline points={points} /></svg><span>{attempted.length ? `Latest active day: ${attempted.at(-1).date}` : "Your trend will appear after scored practice."}</span></div>;
}
