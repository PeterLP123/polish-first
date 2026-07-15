import { useState } from "react";
import { ArrowRight, BookOpen, ChevronRight, Lightbulb, Search } from "lucide-react";
import { grammarGuides } from "../data/course.js";
import { AudioButton } from "./LearningControls.jsx";

export default function GrammarView({ onNavigate }) {
  const PAGE_SIZE = 12;
  const [query, setQuery] = useState("");
  const [openGuide, setOpenGuide] = useState(grammarGuides[0]?.id ?? grammarGuides[0]?.title);
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const normalizedQuery = query.trim().toLocaleLowerCase("pl");
  const visibleGuides = grammarGuides.filter((guide) => `${guide.title} ${guide.example} ${guide.meaning} ${guide.body}`.toLocaleLowerCase("pl").includes(normalizedQuery));
  const shownGuides = normalizedQuery ? visibleGuides : visibleGuides.slice(0, visibleLimit);
  return (
    <div className="view-stack grammar-page">
      <header className="page-header"><div><span className="eyebrow red"><BookOpen size={15} /> FRIENDLY GRAMMAR</span><h1>Patterns, not paperwork</h1><p>Enough grammar to understand what you are saying — explained through phrases you can use today.</p></div></header>
      <div className="grammar-intro"><div className="grammar-intro-icon">ą</div><div><span className="eyebrow light">YOUR LEARNER PROMISE</span><h2>You do not need every ending before you speak.</h2><p>Start with dependable chunks, then connect them into longer ideas. Accuracy will grow around real conversations.</p></div></div>
      <div className="grammar-tools"><label className="course-search"><Search size={19} aria-hidden="true" /><span className="sr-only">Search grammar patterns</span><input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleLimit(PAGE_SIZE); }} placeholder="Search patterns or examples…" type="search" aria-label="Search grammar patterns" /></label><button className="secondary-button" onClick={() => onNavigate("practice", { mode: "grammar", topic: "All" })}>Practise grammar <ArrowRight size={17} /></button></div>
      <p className="grammar-result-count" aria-live="polite">Showing {shownGuides.length} of {visibleGuides.length} pattern{visibleGuides.length === 1 ? "" : "s"}</p>
      <div className="grammar-grid">{shownGuides.map((guide) => { const id = guide.id ?? guide.title; const open = openGuide === id; const panelId = `grammar-detail-${String(id).replace(/[^a-z0-9-]/gi, "-")}`; return <article className={`grammar-card ${open ? "expanded" : ""}`} key={guide.title}><button className="grammar-summary" onClick={() => setOpenGuide(open ? null : id)} aria-expanded={open} aria-controls={panelId}><span className="grammar-number">{String(grammarGuides.indexOf(guide) + 1).padStart(2, "0")}</span><span><strong>{guide.title}</strong><small lang="pl">{guide.example}</small></span><ChevronRight size={19} /></button><div className="grammar-example"><strong lang="pl">{guide.example}</strong><span>{guide.meaning}</span><AudioButton text={guide.example.split("→")[0].replace(/[()]/g, "")} compact /></div>{open && <p id={panelId}>{guide.body}</p>}</article>; })}</div>
      {!normalizedQuery && shownGuides.length < visibleGuides.length && <button className="secondary-button grammar-load-more" onClick={() => setVisibleLimit((limit) => Math.min(limit + PAGE_SIZE, visibleGuides.length))}>Show {Math.min(PAGE_SIZE, visibleGuides.length - shownGuides.length)} more patterns <ArrowRight size={17} /></button>}
      {!visibleGuides.length && <section className="course-empty panel"><Search size={28} /><h2>No matching pattern</h2><p>Try a shorter search or browse every explainer.</p><button className="secondary-button" onClick={() => setQuery("")}>Clear search</button></section>}
      <div className="grammar-reassurance"><Lightbulb size={23} /><div><strong>When in doubt, use the phrase you know.</strong><p>Being understood is the goal. A friendly, imperfect sentence beats a perfect sentence that stays in your head.</p></div></div>
    </div>
  );
}
