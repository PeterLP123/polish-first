// Flat poster-style marks in the app's visual identity, replacing system emoji.
// 24×24, currentColor with a 42%-opacity duotone pass so they adapt to any chip.
// Unknown keys fall back to the raw emoji so legacy data still renders.

const ICONS = {
  // Greetings — raised open hand
  "👋": (
    <>
      <rect x="6.6" y="10.4" width="10.8" height="8.2" rx="3.6" />
      <rect x="7.5" y="4.6" width="1.9" height="6.9" rx=".95" />
      <rect x="10.1" y="3.9" width="1.9" height="7.6" rx=".95" />
      <rect x="12.7" y="4.6" width="1.9" height="6.9" rx=".95" />
      <rect x="15.3" y="5.7" width="1.9" height="5.8" rx=".95" />
      <rect x="4.4" y="10.1" width="5" height="2" rx="1" transform="rotate(32 6 10.8)" />
    </>
  ),
  // Meeting someone — clasped hands abstract
  "🤝": (
    <>
      <rect x="2.2" y="8.6" width="11.2" height="6.8" rx="3.4" />
      <rect x="10.6" y="8.6" width="11.2" height="6.8" rx="3.4" opacity=".55" />
    </>
  ),
  // Café
  "☕": (
    <>
      <path d="M4.5 9.5h12V14a4.5 4.5 0 0 1-4.5 4.5H9A4.5 4.5 0 0 1 4.5 14V9.5Z" />
      <path d="M16.5 10.6h1.3a2.7 2.7 0 0 1 0 5.4h-1.3v-1.7h1.1a1 1 0 0 0 0-2h-1.1v-1.7Z" />
      <rect x="7.8" y="3" width="1.6" height="4.2" rx=".8" opacity=".42" />
      <rect x="11.4" y="3" width="1.6" height="4.2" rx=".8" opacity=".42" />
    </>
  ),
  // Finding your way — compass
  "🧭": (
    <>
      <circle cx="12" cy="12" r="8.6" opacity=".42" />
      <path d="M15.9 8.1 12.9 13.2 8.1 15.9l3-5.1 4.8-2.7Z" />
    </>
  ),
  // Shops and money — bag
  "🛍️": (
    <>
      <path d="M5 8.5h14l-1.1 10.6a2 2 0 0 1-2 1.9H8.1a2 2 0 0 1-2-1.9L5 8.5Z" />
      <path d="M9 11V7.8a3 3 0 0 1 6 0V11h-1.8V7.8a1.2 1.2 0 0 0-2.4 0V11H9Z" opacity=".42" />
    </>
  ),
  // Making plans — wall calendar
  "🗓️": (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h12a2.5 2.5 0 0 1 2.5 2.5V10h-17V7.5Z" opacity=".42" />
      <circle cx="8" cy="13.6" r="1.25" opacity=".42" />
      <circle cx="12" cy="13.6" r="1.25" opacity=".42" />
      <circle cx="16" cy="13.6" r="1.25" opacity=".42" />
      <circle cx="8" cy="17.1" r="1.25" opacity=".42" />
      <circle cx="12" cy="17.1" r="1.25" opacity=".42" />
    </>
  ),
  // Home and family
  "🏠": (
    <>
      <path d="M12 3.5 2.8 11.4l1.5 1.7L12 6.3l7.7 6.8 1.5-1.7L12 3.5Z" />
      <path d="M5.6 11.6h12.8v7.9a1.5 1.5 0 0 1-1.5 1.5H7.1a1.5 1.5 0 0 1-1.5-1.5v-7.9Z" opacity=".42" />
      <rect x="10.2" y="14.4" width="3.6" height="6.6" rx="1" />
    </>
  ),
  // Food — pierogi dumpling
  "🥟": (
    <>
      <path d="M12 6.5c-5 0-9 3.6-9 8 0 .6.1 1.1.3 1.6C4.7 17.9 8 19 12 19s7.3-1.1 8.7-2.9c.2-.5.3-1 .3-1.6 0-4.4-4-8-9-8Z" />
      <circle cx="6.2" cy="9.8" r="1.05" opacity=".42" />
      <circle cx="9.1" cy="7.7" r="1.05" opacity=".42" />
      <circle cx="12" cy="7" r="1.05" opacity=".42" />
      <circle cx="14.9" cy="7.7" r="1.05" opacity=".42" />
      <circle cx="17.8" cy="9.8" r="1.05" opacity=".42" />
    </>
  ),
  // Health help — bandage
  "🩹": (
    <>
      <rect x="2.5" y="9" width="19" height="7" rx="3.5" transform="rotate(-25 12 12.5)" />
      <circle cx="8.9" cy="13.9" r=".85" opacity=".42" />
      <circle cx="10.5" cy="13.2" r=".85" opacity=".42" />
      <circle cx="13.5" cy="11.8" r=".85" opacity=".42" />
      <circle cx="15.1" cy="11.1" r=".85" opacity=".42" />
    </>
  ),
  // Day and weather — sun and cloud
  "🌤️": (
    <>
      <circle cx="8.5" cy="8.5" r="4.2" />
      <path d="M8 20.5h9.3a4.2 4.2 0 0 0 .6-8.3A5.8 5.8 0 0 0 6.6 14 3.4 3.4 0 0 0 8 20.5Z" opacity=".42" />
    </>
  ),
  // Work — laptop
  "💻": (
    <>
      <rect x="4" y="4.5" width="16" height="11" rx="1.8" />
      <rect x="5.8" y="6.3" width="12.4" height="7.4" rx=".8" opacity=".42" />
      <path d="M2.5 18h19v1a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 19v-1Z" opacity=".42" />
    </>
  ),
  // Improving — sparkles
  "✨": (
    <>
      <path d="M11 3.5 12.9 9l5.6 1.9-5.6 1.9L11 18.4l-1.9-5.6L5.5 10.9 9.1 9 11 3.5Z" />
      <path d="M18 14.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6Z" opacity=".42" />
    </>
  ),
  // Numbers — counting blocks
  "🔢": (
    <>
      <rect x="3.5" y="3.5" width="8" height="8" rx="2.2" />
      <rect x="12.5" y="3.5" width="8" height="8" rx="2.2" opacity=".42" />
      <rect x="8" y="12.5" width="8" height="8" rx="2.2" />
      <circle cx="7.5" cy="7.5" r="1.2" opacity=".42" />
      <circle cx="12" cy="16.5" r="1.2" opacity=".42" />
    </>
  ),
  // Dates — calendar page
  "📅": (
    <>
      <rect x="4" y="4.5" width="16" height="16" rx="2.5" />
      <path d="M4 7a2.5 2.5 0 0 1 2.5-2.5h11A2.5 2.5 0 0 1 20 7v1.5H4V7Z" opacity=".42" />
      <circle cx="12" cy="14" r="3.4" opacity=".42" />
    </>
  ),
  // Hotel
  "🏨": (
    <>
      <rect x="5.5" y="3" width="13" height="18" rx="1.8" />
      <rect x="8" y="6" width="2.8" height="2.2" rx=".6" opacity=".42" />
      <rect x="13.2" y="6" width="2.8" height="2.2" rx=".6" opacity=".42" />
      <rect x="8" y="10" width="2.8" height="2.2" rx=".6" opacity=".42" />
      <rect x="13.2" y="10" width="2.8" height="2.2" rx=".6" opacity=".42" />
      <rect x="10.6" y="17.2" width="2.8" height="3.8" rx=".7" opacity=".42" />
    </>
  ),
  // Train
  "🚆": (
    <>
      <rect x="5.5" y="3" width="13" height="14.5" rx="3.5" />
      <rect x="7.8" y="5.8" width="8.4" height="4.6" rx="1.2" opacity=".42" />
      <circle cx="8.8" cy="13.7" r="1.1" opacity=".42" />
      <circle cx="15.2" cy="13.7" r="1.1" opacity=".42" />
      <path d="M8 21l1.2-3.5h5.6L16 21h-1.7l-.8-2.3h-3L9.7 21H8Z" opacity=".42" />
    </>
  ),
  // Plane
  "✈️": (
    <path d="M21.2 12c0-1-.9-1.6-2-1.6h-3.6L10.2 4.4c-.3-.3-.7-.4-1.1-.4H7.6l2.2 6h-3L5.2 8.4c-.2-.3-.6-.4-1-.4H3l1.1 4-1.1 4h1.2c.4 0 .8-.1 1-.4l1.6-1.6h3l-2.2 6h1.5c.4 0 .8-.1 1.1-.4l5.4-6h3.6c1.1 0 2-.6 2-1.6Z" />
  ),
  // Laundry basket
  "🧺": (
    <>
      <path d="M4 10.5h16l-1.4 8.3a2.3 2.3 0 0 1-2.3 2H7.7a2.3 2.3 0 0 1-2.3-2L4 10.5Z" />
      <rect x="5.2" y="13.4" width="13.6" height="1.3" rx=".65" opacity=".42" />
      <rect x="5.9" y="16.4" width="12.2" height="1.3" rx=".65" opacity=".42" />
      <path d="M8.5 10.5C8.5 6.9 9.9 4 12 4s3.5 2.9 3.5 6.5h-1.7c0-2.8-.8-4.8-1.8-4.8s-1.8 2-1.8 4.8H8.5Z" opacity=".42" />
    </>
  ),
  // Clinic — cross badge
  "🩺": (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <path d="M10.2 7.5h3.6v2.7h2.7v3.6h-2.7v2.7h-3.6v-2.7H7.5v-3.6h2.7V7.5Z" opacity=".42" />
    </>
  ),
  // Phone
  "📱": (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.6" />
      <rect x="8.8" y="5" width="6.4" height="11.5" rx=".8" opacity=".42" />
      <circle cx="12" cy="18.8" r="1" opacity=".42" />
    </>
  ),
  // Conversation — speech bubble
  "💬": (
    <>
      <path d="M12 3.5c-5.2 0-9.5 3.2-9.5 7.2 0 2.3 1.3 4.3 3.3 5.7-.1 1.3-.9 2.9-2.1 3.9 1.7.2 3.8-.4 5.1-1.3 1 .2 2.1.4 3.2.4 5.2 0 9.5-3.2 9.5-7.2S17.2 3.5 12 3.5Z" />
      <rect x="7.5" y="9.2" width="9" height="1.5" rx=".75" opacity=".42" />
      <rect x="7.5" y="12.2" width="6" height="1.5" rx=".75" opacity=".42" />
    </>
  ),
  // Home life — sofa
  "🛋️": (
    <>
      <path d="M4 11V8.8A2.8 2.8 0 0 1 6.8 6h10.4A2.8 2.8 0 0 1 20 8.8V11h-1.5a2.5 2.5 0 0 0-2.5 2.5V14H8v-.5A2.5 2.5 0 0 0 5.5 11H4Z" />
      <path d="M3 13.5A1.5 1.5 0 0 1 4.5 12h15a1.5 1.5 0 0 1 1.5 1.5v3.3a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 16.8v-3.3Z" opacity=".42" />
      <rect x="5" y="19" width="1.4" height="2" rx=".7" opacity=".42" />
      <rect x="17.6" y="19" width="1.4" height="2" rx=".7" opacity=".42" />
    </>
  ),
  // Clock
  "⏰": (
    <>
      <circle cx="12" cy="13" r="7.8" />
      <path d="M11.2 9.5h1.7v4l2.8 1.7-.9 1.4-3.6-2.2V9.5Z" opacity=".42" />
      <circle cx="5.6" cy="5.2" r="1.9" opacity=".42" />
      <circle cx="18.4" cy="5.2" r="1.9" opacity=".42" />
    </>
  ),
  // Time passing — hourglass
  "⏳": (
    <>
      <path d="M6 3h12v1.8c0 3-2.3 4.7-3.9 5.7 1.6 1 3.9 2.7 3.9 5.7V18H6v-1.8c0-3 2.3-4.7 3.9-5.7C8.3 9.5 6 7.8 6 4.8V3Z" />
      <path d="M9.2 15.8h5.6L12 13.2l-2.8 2.6Z" opacity=".42" />
      <rect x="5" y="2" width="14" height="1.8" rx=".9" opacity=".42" />
      <rect x="5" y="18.4" width="14" height="1.8" rx=".9" opacity=".42" />
    </>
  ),
  // Celebration — cake
  "🎂": (
    <>
      <rect x="3.5" y="12" width="17" height="7.5" rx="1.8" />
      <rect x="5.5" y="8" width="13" height="4" rx="1.2" opacity=".42" />
      <rect x="11.2" y="4.4" width="1.6" height="3.6" rx=".8" />
      <circle cx="12" cy="3" r="1.1" opacity=".42" />
    </>
  ),
  // Repairs — crossed tools
  "🛠️": (
    <>
      <rect x="4" y="10.9" width="16" height="2.3" rx="1.15" transform="rotate(-45 12 12)" />
      <rect x="4" y="10.9" width="16" height="2.3" rx="1.15" transform="rotate(45 12 12)" opacity=".42" />
      <rect x="14.2" y="2.6" width="5.6" height="3" rx="1.2" transform="rotate(45 17 4.1)" />
      <rect x="4.2" y="15.4" width="5.6" height="3" rx="1.2" transform="rotate(-45 7 16.9)" opacity=".42" />
    </>
  ),
  // Changeable weather — sun, cloud, rain
  "🌦️": (
    <>
      <circle cx="8" cy="7.6" r="3.4" opacity=".42" />
      <path d="M7.5 16.8h9a3.6 3.6 0 0 0 .5-7.2A4.9 4.9 0 0 0 7.7 11 2.9 2.9 0 0 0 7.5 16.8Z" />
      <circle cx="9" cy="19.8" r=".9" opacity=".42" />
      <circle cx="12.5" cy="19.8" r=".9" opacity=".42" />
      <circle cx="16" cy="19.8" r=".9" opacity=".42" />
    </>
  ),
  // Package
  "📦": (
    <>
      <path d="M12 2.8 3.5 7v10L12 21.2 20.5 17V7L12 2.8Z" />
      <path d="M12 2.8 3.5 7l8.5 4.2L20.5 7 12 2.8Z" opacity=".42" />
      <rect x="11" y="11.2" width="2" height="9.6" opacity=".42" />
    </>
  ),
  // Bank
  "🏦": (
    <>
      <path d="M12 2.5 2.8 7.5h18.4L12 2.5Z" />
      <rect x="5" y="9.5" width="2.2" height="7" opacity=".42" />
      <rect x="9" y="9.5" width="2.2" height="7" opacity=".42" />
      <rect x="13" y="9.5" width="2.2" height="7" opacity=".42" />
      <rect x="17" y="9.5" width="2.2" height="7" opacity=".42" />
      <rect x="3.5" y="18" width="17" height="2.2" rx="1.1" />
    </>
  ),
  // Car
  "🚗": (
    <>
      <path d="M3 12.2c0-.7.5-1.2 1.2-1.2h1.6l1.7-3.9a2.3 2.3 0 0 1 2.1-1.5h4.8c.9 0 1.7.5 2.1 1.5l1.7 3.9h1.6c.7 0 1.2.5 1.2 1.2v3.6h-2.1a2.6 2.6 0 0 0-5.2 0h-3.4a2.6 2.6 0 0 0-5.2 0H3v-3.6Z" />
      <circle cx="7.7" cy="16.4" r="1.8" opacity=".42" />
      <circle cx="16.3" cy="16.4" r="1.8" opacity=".42" />
    </>
  ),
  // Civic building — museum
  "🏛️": (
    <>
      <path d="M12 2.5a5.5 5.5 0 0 1 5.5 5.5H6.5A5.5 5.5 0 0 1 12 2.5Z" />
      <rect x="5" y="9.3" width="14" height="1.7" rx=".85" opacity=".42" />
      <rect x="6.2" y="12" width="1.9" height="6" opacity=".42" />
      <rect x="11" y="12" width="1.9" height="6" opacity=".42" />
      <rect x="15.8" y="12" width="1.9" height="6" opacity=".42" />
      <rect x="4.5" y="19" width="15" height="1.8" rx=".9" />
    </>
  ),
  // Friends — warm smile
  "🤗": (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="9" cy="10.3" r="1.15" opacity=".42" />
      <circle cx="15" cy="10.3" r="1.15" opacity=".42" />
      <path d="M7.6 13.2c1.1 2.1 2.7 3.2 4.4 3.2s3.3-1.1 4.4-3.2l-1.4-.9c-.9 1.5-1.9 2.3-3 2.3s-2.1-.8-3-2.3l-1.4.9Z" opacity=".42" />
    </>
  ),
  // Puzzle
  "🧩": (
    <>
      <rect x="4" y="8.5" width="16" height="12" rx="2.5" />
      <circle cx="12" cy="8.5" r="3.2" />
      <circle cx="8.2" cy="14.5" r="2.2" opacity=".42" />
    </>
  ),
  // Ticket
  "🎫": (
    <>
      <path d="M2.5 8a1.5 1.5 0 0 1 1.5-1.5h16A1.5 1.5 0 0 1 21.5 8v1.7a2.3 2.3 0 0 0 0 4.6V16a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 16v-1.7a2.3 2.3 0 0 0 0-4.6V8Z" />
      <rect x="13.6" y="8" width="1.2" height="2.2" rx=".6" opacity=".42" />
      <rect x="13.6" y="11" width="1.2" height="2.2" rx=".6" opacity=".42" />
      <rect x="13.6" y="14" width="1.2" height="2.2" rx=".6" opacity=".42" />
    </>
  ),
  // Pharmacy — capsule
  "💊": (
    <>
      <path d="M10.6 3.9a4.8 4.8 0 0 1 6.8 6.8l-4.7 4.7a4.8 4.8 0 0 1-6.8-6.8l4.7-4.7Z" />
      <path d="M10.6 3.9a4.8 4.8 0 0 1 6.8 6.8l-2.3 2.3-6.8-6.8 2.3-2.3Z" opacity=".42" />
    </>
  ),
  // Party popper
  "🎉": (
    <>
      <path d="M4.5 19.5 9 10.8l4.2 4.2-8.7 4.5Z" />
      <path d="M4.5 19.5 9 10.8l2.1 2.1-6.6 6.6Z" opacity=".42" />
      <path d="M14.5 6.5c.8-1.2 2.3-1.5 3.6-.9-.6-1.3-.2-2.8 1-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="17.5" cy="9.5" r="1" opacity=".42" />
      <circle cx="20" cy="6.5" r="1" opacity=".42" />
      <circle cx="14" cy="3.6" r="1" opacity=".42" />
    </>
  ),
  // Seedling — keep growing
  "🌱": (
    <>
      <path d="M12 21v-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 13c0-3.6-2.9-6.5-6.5-6.5H4v1c0 3.6 2.9 6.5 6.5 6.5H12Z" />
      <path d="M12 13c0-3.6 2.9-6.5 6.5-6.5H20v1c0 3.6-2.9 6.5-6.5 6.5H12Z" opacity=".42" />
    </>
  ),
  // Mouth — pronunciation cue
  "👄": (
    <>
      <path d="M12 8.5c-1.6 0-2.9.8-3.9 1.6C6.7 11.4 5 12.5 3.5 13c1.9 3.4 4.9 5.5 8.5 5.5s6.6-2.1 8.5-5.5c-1.5-.5-3.2-1.6-4.6-2.9-1-.8-2.3-1.6-3.9-1.6Z" />
      <path d="M3.5 13c2.5.6 5.5.9 8.5.9s6-.3 8.5-.9c-1.5-.5-3.2-1.6-4.6-2.9-.4.9-1.9 1.6-3.9 1.6s-3.5-.7-3.9-1.6c-1 1.3-3.1 2.4-4.6 2.9Z" opacity=".42" />
    </>
  ),
};

export default function AppIcon({ icon, size = "1em", title = null }) {
  const mark = ICONS[icon];
  if (!mark) return <span aria-hidden={title ? undefined : true}>{icon}</span>;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title ?? undefined} focusable="false" style={{ display: "block" }}>
      {title ? <title>{title}</title> : null}
      {mark}
    </svg>
  );
}
