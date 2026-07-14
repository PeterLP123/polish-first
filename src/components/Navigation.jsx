import { useEffect, useState } from "react";
import { Award, BookOpen, Brain, Check, ChevronRight, Ellipsis, Flame, GraduationCap, Home, Menu, MessageCircle, Mic, X, Zap } from "lucide-react";
import { effectiveStreak, weekActivity } from "../lib/learning.js";

export const NAV_ITEMS = [
  { id: "home", label: "Today", icon: Home },
  { id: "course", label: "Course", icon: GraduationCap },
  { id: "practice", label: "Practice", icon: Brain },
  { id: "sounds", label: "Sounds", icon: Mic },
  { id: "dialogues", label: "Dialogues", icon: MessageCircle },
  { id: "grammar", label: "Grammar", icon: BookOpen },
  { id: "data", label: "Progress & Data", icon: Award },
];

const BOTTOM_NAV_IDS = ["home", "course", "practice", "dialogues"];

export function Sidebar({ view, progress, dueCount = 0, open, onNavigate, onClose }) {
  return (
    <aside id="main-sidebar" className={`sidebar ${open ? "open" : ""}`} aria-label="Learning navigation">
      <div className="sidebar-topline"><button className="brand" onClick={() => onNavigate("home")}><span className="brand-mark">Cz</span><span><strong>Cześć!</strong><small>Polish for real life</small></span></button><button className="sidebar-close icon-button" onClick={onClose} aria-label="Close navigation"><X size={21} /></button></div>
      <nav aria-label="Main navigation"><span className="nav-label">LEARN</span>{NAV_ITEMS.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} aria-current={view === id ? "page" : undefined} onClick={() => onNavigate(id)}><Icon size={20} /><span>{label}</span>{id === "practice" && dueCount > 0 && <small className="nav-badge" aria-label={`${dueCount} reviews due`}>{dueCount}</small>}</button>)}</nav>
      <div className="sidebar-card"><div className="sidebar-card-top"><Flame size={23} /><span><strong>{effectiveStreak(progress)} day streak</strong><small>{effectiveStreak(progress) ? "Keep showing up" : "Start today"}</small></span></div><div className="week-dots">{weekActivity(progress.studyDates).map(({ label, done, today }, index) => <span key={`${label}-${index}`} className={done ? "active" : today ? "today" : ""}>{done ? <Check size={12} /> : label}</span>)}</div></div>
      <p className="sidebar-footnote">Mów od pierwszego dnia.<br />Speak from day one.</p>
    </aside>
  );
}

export function MobileHeader({ label, xp, navOpen, onOpen }) {
  return <header className="mobile-header"><button className="icon-button" onClick={onOpen} aria-label="Open navigation" aria-expanded={navOpen} aria-controls="main-sidebar"><Menu /></button><div className="mobile-brand"><span>Cz</span><strong>{label}</strong></div><span className="mobile-xp"><Zap size={16} /> {xp}</span></header>;
}

export function BottomNav({ view, dueCount = 0, onNavigate }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = NAV_ITEMS.filter((item) => BOTTOM_NAV_IDS.includes(item.id));
  const overflow = NAV_ITEMS.filter((item) => !BOTTOM_NAV_IDS.includes(item.id));
  const overflowActive = overflow.some((item) => item.id === view);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const handler = (event) => { if (event.key === "Escape") setMoreOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [moreOpen]);

  const go = (id) => {
    setMoreOpen(false);
    onNavigate(id);
  };

  return (
    <>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {primary.map(({ id, label, icon: Icon }) => (
          <button key={id} className={view === id ? "active" : ""} aria-current={view === id ? "page" : undefined} onClick={() => go(id)}>
            <Icon size={20} /><span>{label}</span>
            {id === "practice" && dueCount > 0 && <small className="bottom-badge" aria-label={`${dueCount} reviews due`}>{dueCount > 99 ? "99+" : dueCount}</small>}
          </button>
        ))}
        <button className={overflowActive ? "active" : ""} aria-expanded={moreOpen} aria-haspopup="menu" onClick={() => setMoreOpen((open) => !open)}>
          <Ellipsis size={20} /><span>More</span>
        </button>
      </nav>
      {moreOpen && (
        <>
          <button className="sheet-scrim" onClick={() => setMoreOpen(false)} aria-label="Close menu" />
          <div className="more-sheet" role="menu" aria-label="More sections">
            {overflow.map(({ id, label, icon: Icon }) => (
              <button key={id} role="menuitem" className={view === id ? "active" : ""} onClick={() => go(id)}>
                <Icon size={20} /><span>{label}</span><ChevronRight size={17} aria-hidden="true" />
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
