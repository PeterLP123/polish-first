import { useRef, useState } from "react";
import { Award, Check, Clipboard, Download, FileUp, ShieldCheck, X } from "lucide-react";
import { allPhrases, units } from "../data/course.js";
import { diagnosticsSummary, masterySummary, parseProgressImport, serializeProgress } from "../lib/learning.js";

export default function ProgressDataView({ progress, onReplaceProgress }) {
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const mastery = masterySummary(progress);

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
      <section className="mastery-overview panel">
        <div><span className="eyebrow">LEARNING SNAPSHOT</span><h2>{progress.learnedPhrases.length} phrases in your memory system</h2><p>Mastered means the phrase has reached a review interval of at least 30 days.</p></div>
        <div className="mastery-metrics"><article><strong>{mastery.due}</strong><span>Due now</span></article><article><strong>{mastery.learning}</strong><span>Learning</span></article><article><strong>{mastery.mastered}</strong><span>Mastered</span></article><article><strong>{progress.completedUnits.length}/{units.length}</strong><span>Units complete</span></article></div>
      </section>
      <div className="data-tools-grid">
        <article className="data-tool-card panel"><span className="data-tool-icon"><Download /></span><h2>Back up progress</h2><p>Download a readable JSON file containing your local learning record and current session.</p><button className="primary-button" onClick={exportProgress}><Download size={17} /> Export progress</button></article>
        <article className="data-tool-card panel"><span className="data-tool-icon"><FileUp /></span><h2>Import progress</h2><p>Restore this app's export format. Nothing changes until you review and confirm it.</p><input ref={fileRef} className="visually-hidden" type="file" accept="application/json,.json" aria-hidden="true" tabIndex={-1} onChange={readImport} /><button className="secondary-button" onClick={() => fileRef.current?.click()}><FileUp size={17} /> Choose export file</button></article>
        <article className="data-tool-card panel"><span className="data-tool-icon"><Clipboard /></span><h2>Tester diagnostics</h2><p>Copy app version, progress counts, and speech capability flags. Individual answers are excluded.</p><button className="secondary-button" onClick={copyDiagnostics}><Clipboard size={17} /> Copy diagnostics</button></article>
      </div>
      {preview && <section className="import-preview panel" role="dialog" aria-modal="true" aria-label="Confirm progress import"><button className="icon-button import-close" onClick={() => setPreview(null)} aria-label="Cancel import"><X size={18} /></button><span className="eyebrow red">IMPORT PREVIEW</span><h2>Replace current progress?</h2><p>This file contains <strong>{preview.learnedPhrases.length} of {allPhrases.length} phrases</strong>, <strong>{preview.completedUnits.length} completed units</strong>, and <strong>{preview.xp} XP</strong>.</p><div className="import-warning"><ShieldCheck size={20} /><span>Your current browser progress will be replaced. Export it first if you may need it later.</span></div><div className="import-actions"><button className="secondary-button" onClick={() => setPreview(null)}>Cancel</button><button className="primary-button" onClick={confirmImport}><Check size={17} /> Confirm import</button></div></section>}
      {message && <p className="data-message success" role="status"><Check size={17} /> {message}</p>}
      {error && <p className="data-message error" role="alert"><X size={17} /> {error}</p>}
    </div>
  );
}
