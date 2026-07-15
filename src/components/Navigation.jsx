import { useEffect, useRef, useState } from "react";
import { Award, BookOpen, Brain, Check, ChevronRight, Ellipsis, Flame, GraduationCap, Home, MessageCircle, Mic, Zap } from "lucide-react";
import { effectiveStreak, weekActivity } from "../lib/learning.js";

export const NAV_ITEMS = [
  { id: "home", label: "Today", icon: Home, group: "Learn" },
  { id: "course", label: "Course", icon: GraduationCap, group: "Learn" },
  { id: "practice", label: "Practice", icon: Brain, group: "Learn" },
  { id: "dialogues", label: "Dialogues", icon: MessageCircle, group: "Learn" },
  { id: "sounds", label: "Sounds", icon: Mic, group: "Reference" },
  { id: "grammar", label: "Grammar", icon: BookOpen, group: "Reference" },
  { id: "data", label: "Progress & Data", icon: Award, group: "Progress" },
];

const BOTTOM_NAV_IDS = ["home", "course", "practice", "dialogues"];
const NAV_GROUPS = ["Learn", "Reference", "Progress"];

function StreakCard({ progress, compact = false }) {
  const streak = effectiveStreak(progress);
  return (
    <div className={`sidebar-card ${compact ? "compact" : ""}`}>
      <div className="sidebar-card-top"><Flame size={23} /><span><strong>{streak} day streak</strong><small>{streak ? "Keep showing up" : "Start today"}</small></span></div>
      {!compact && <div className="week-dots">{weekActivity(progress.studyDates).map(({ label, done, today }, index) => <span key={`${label}-${index}`} className={done ? "active" : today ? "today" : ""}>{done ? <Check size={12} /> : label}</span>)}</div>}
    </div>
  );
}

export function Sidebar({ view, progress, dueCount = 0, onNavigate }) {
  return (
    <aside className="sidebar" aria-label="Learning navigation">
      <div className="sidebar-topline"><button className="brand" onClick={() => onNavigate("home")}><span className="brand-mark">Cz</span><span><strong>Cześć!</strong><small>Polish for real life</small></span></button></div>
      <nav aria-label="Main navigation">
        {NAV_GROUPS.map((group) => (
          <div className="nav-group" key={group}>
            <span className="nav-label">{group.toUpperCase()}</span>
            {NAV_ITEMS.filter((item) => item.group === group).map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} aria-current={view === id ? "page" : undefined} onClick={() => onNavigate(id)}><Icon size={20} /><span>{label}</span>{id === "practice" && dueCount > 0 && <small className="nav-badge" aria-label={`${dueCount} reviews due`}>{dueCount > 99 ? "99+" : dueCount}</small>}</button>)}
          </div>
        ))}
      </nav>
      <StreakCard progress={progress} />
      <p className="sidebar-footnote">Mów od pierwszego dnia.<br />Speak from day one.</p>
    </aside>
  );
}

export function MobileHeader({ label, xp }) {
  return <header className="mobile-header"><div className="mobile-brand"><span>Cz</span><strong>{label}</strong></div><span className="mobile-xp"><Zap size={16} /> {xp}</span></header>;
}

export function BottomNav({ view, dueCount = 0, progress, onNavigate }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButtonRef = useRef(null);
  const sheetRef = useRef(null);
  const primary = NAV_ITEMS.filter((item) => BOTTOM_NAV_IDS.includes(item.id));
  const overflow = NAV_ITEMS.filter((item) => !BOTTOM_NAV_IDS.includes(item.id));
  const overflowActive = overflow.some((item) => item.id === view);

  useEffect(() => setMoreOpen(false), [view]);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = () => [...(sheetRef.current?.querySelectorAll("button") ?? [])];
    controls()[0]?.focus();
    const handler = (event) => {
      if (event.key === "Escape") {
        setMoreOpen(false);
        moreButtonRef.current?.focus();
      }
      if (event.key === "Tab") {
        const items = controls();
        if (!items.length) return;
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handler);
    };
  }, [moreOpen]);

  const closeMore = (restoreFocus = false) => {
    setMoreOpen(false);
    if (restoreFocus) window.setTimeout(() => moreButtonRef.current?.focus(), 0);
  };
  const go = (id) => { closeMore(); onNavigate(id); };

  return (
    <>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {primary.map(({ id, label, icon: Icon }) => (
          <button key={id} className={view === id ? "active" : ""} aria-current={view === id ? "page" : undefined} onClick={() => go(id)}>
            <Icon size={20} /><span>{label}</span>
            {id === "practice" && dueCount > 0 && <small className="bottom-badge" aria-label={`${dueCount} reviews due`}>{dueCount > 99 ? "99+" : dueCount}</small>}
          </button>
        ))}
        <button ref={moreButtonRef} className={overflowActive ? "active" : ""} aria-expanded={moreOpen} aria-haspopup="dialog" onClick={() => setMoreOpen((open) => !open)}>
          <Ellipsis size={20} /><span>More</span>
        </button>
      </nav>
      {moreOpen && (
        <>
          <button className="sheet-scrim" onClick={() => closeMore(true)} aria-label="Close more sections" />
          <section ref={sheetRef} className="more-sheet" role="dialog" aria-modal="true" aria-label="More sections">
            <div className="sheet-handle" aria-hidden="true" />
            <div className="more-sheet-heading"><div><span className="eyebrow red">MORE</span><h2>Reference & progress</h2></div><StreakCard progress={progress} compact /></div>
            <nav aria-label="Additional navigation">
              {overflow.map(({ id, label, icon: Icon }) => (
                <button key={id} aria-current={view === id ? "page" : undefined} className={view === id ? "active" : ""} onClick={() => go(id)}>
                  <Icon size={20} /><span>{label}</span><ChevronRight size={17} aria-hidden="true" />
                </button>
              ))}
            </nav>
          </section>
        </>
      )}
    </>
  );
}
