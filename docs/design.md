# Design system and UI conventions

This app's visual identity draws on the Polish School of Posters: flat poster crimson, deep granat navy, off-white poster paper, and one oversized expressive letterform — executed with contemporary craft (tonal layering, lacquered gradients, print grain, confident display type). This document records the rules that keep new UI consistent with it, and the maintenance procedures that keep the visual test suite stable.

## Palette

All colours flow from the token block at the top of `src/styles.css`:

| Token | Value | Role |
| --- | --- | --- |
| `--red` | `#d2242b` | Poster crimson — primary actions, brand mark, hero surfaces |
| `--red-dark` | `#aa171e` | Hover state and red text on light tints |
| `--red-deep` | `#931218` | Gradient base for crimson poster surfaces |
| `--red-soft` | `#f9e2de` | Quiet red tint for secondary CTAs and active states |
| `--navy` | `#213049` | Granat — audio controls, sound-lab hero, reference panels |
| `--navy-deep` | `#162238` | Gradient base for navy ink blocks, toasts |
| `--ink` | `#26211b` | Body text (warm near-black) |
| `--muted` | `#6e6860` | Secondary text |
| `--paper` | `#f7f4ec` | Page background (poster paper) |
| `--surface` | `#fffdf8` | Card and panel surfaces |
| `--wash` | `#f2ede2` | Inset tonal surfaces (chat window, hover states) |
| `--line` / `--line-strong` | `#e8e1d3` / `#d7cebd` | Hairline borders, quiet → hover |
| `--gold` / `--gold-soft` | `#eba83e` / `#fdf2d7` | XP and amber accents |

Prefer the tokens over literal values. The remaining hard-coded colours are tints derived from these (feedback greens/ambers and translucent overlays on crimson/navy surfaces).

## Depth and surface

- Shadows are a layered warm scale: `--shadow-soft` (resting panels), `--shadow` (raised/hover), `--shadow-float` (overlays), `--shadow-red` (crimson surfaces). Never introduce cool grey shadows.
- Panels are `--surface` cards with a 1 px `--line` border, 17–26 px radii, and `--shadow-soft`; interactive cards lift (`translateY(-2/3px)`), deepen to `--shadow`, and warm their border to `--line-strong` on hover.
- Primary buttons are a lacquered crimson gradient (`#dd3037 → --red → #b81a21`) with an inset top highlight and a coloured ambient shadow; they lift 1 px on hover and settle on press. Quiet CTAs (e.g. `.unit-card .primary-button`) stay `--red-soft` until hover.

## Typography

- **Display:** Bricolage Grotesque, weights 400–800 — all headings, stats, and the brand mark. Page-level headings run at weight 800 with −0.02/−0.03 em tracking; hero phrases clamp up to ~56 px.
- **Body:** Instrument Sans, weights 400–700 — everything else.

Both families are self-hosted as variable woff2 subsets (latin + latin-ext) in `src/fonts/`, declared in `src/fonts.css`. Latin-ext matters: it carries the Polish diacritics (ą ę ś ć ż ź ó ł ń). Do not reintroduce a fonts CDN — Google-served subsets loaded asynchronously, which reflowed pages mid-screenshot in the visual suite and broke offline use.

To regenerate the font files (for example after a version bump upstream), request the css2 endpoint with a Chrome user agent, download each latin/latin-ext woff2 it lists, and update the `@font-face` blocks in `src/fonts.css`:

```
https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap
```

## Signature elements

- **The poster hero.** The home hero (`.continue-card`) and the session-complete poster card are crimson radial gradients (`#e3363e → --red → --red-deep`) with an inset top highlight and a fine **print grain** — an SVG `feTurbulence` data URI held in the `--grain` token, blended as `mix-blend-mode: overlay` at ~0.3 opacity. The grain is deterministic across renders, so the visual suite stays stable; keep it off small components and reserve it for the big ink moments (hero, session poster). The hero still carries the giant typographic **ę** (`.poster-letter`) — cream `#f8e7c4`, hard offset shadow, rotated −5°, ogonek tail fully visible. Below 620 px it becomes a 30 %-opacity watermark.
- **The zrobione stamp.** The session-complete screen keeps the rotated stamp (`.session-stamp`) — the identity's only other big crimson moment.
- **Navy ink blocks.** The sound-lab hero (`.sound-hero`) and grammar promise bar (`.grammar-intro`) share a granat radial gradient (`#2e4468 → --navy → --navy-deep`) with the faint ring decoration.
- **Floating pill nav (mobile).** Below 820 px the bottom navigation leaves the screen edge: a blurred floating pill (`26 px` radius, `--line` border, soft shadow) whose active item is a `--red-soft` capsule. Anchored elements (more sheet, frontier chip) sit above it — keep their bottom offsets ≥ 86 px + safe-area when adjusting.

Spend boldness in one place per screen. One loud crimson CTA leads each page; repeated card CTAs use the quiet `--red-soft` treatment (see `.unit-card .primary-button`).

## Iconography

Units, scenes, and celebrations use a custom icon family (`src/components/AppIcon.jsx`) instead of system emoji — flat 24×24 poster marks drawn in `currentColor` with a 42%-opacity duotone pass, so one definition adapts to light chips, dark surfaces, and crimson accents. Icons size from the parent's `font-size` (`1em`). Data files keep their original emoji strings as lookup keys; unknown keys fall back to rendering the raw emoji, so new content never breaks. When adding an icon, favour two or three bold geometric shapes over outline detail — the marks are read at 21–34 px.

## Theming (night gallery)

The app ships a light default and a dark "night gallery" theme. `index.html` applies the saved choice (`localStorage` key `czesc-theme`, falling back to `prefers-color-scheme`) in a pre-paint script, so there is no flash of the wrong theme; `src/lib/theme.js` persists changes and syncs the `theme-color` meta. Toggles live in the sidebar footer and the mobile header.

The dark theme works by inverting the tokens (`[data-theme="dark"]` at the end of `src/styles.css`): `--paper` becomes warm near-black, `--surface` a lifted brown-black, `--red-soft` a translucent crimson tint, and text-on-tint colours (`--red-dark`, `--muted`, feedback hues) lighten to stay readable. The crimson hero, print grain, navy ink blocks, and gradients are shared between themes — do not fork them. Warm literal tints (tip cards, amber notes) have explicit dark overrides beside the token block. When adding a new surface, use tokens and check both themes; new literal tints need a dark override.

## Legibility rules

- Minimum UI font size is 10 px. An 8–9 px pass was removed once; do not reintroduce smaller sizes.
- Focus states use the global 3 px outline (`#9c1a1f`); keep it visible on new interactive elements.
- Animations must respect `prefers-reduced-motion` (a global override already handles CSS animations and transitions).

## Interaction conventions

- **Drill keyboard shortcuts** (`src/lib/drill-keys.js`): Space reveals a card or replays its audio; 1–4 select Again/Hard/Good/Easy. The hook ignores key events targeting inputs, selects, textareas, and focused buttons. `.key-hint` badges advertise the keys and render only under `(hover: hover) and (pointer: fine)`, so touch devices never see them. New drill screens should wire the same hook rather than adding bespoke listeners.
- **Diacritics entry** (`src/components/DiacriticsBar.jsx`): every Polish typing surface (dictation, controlled writing, grammar gaps, milestone writing tasks) offers the nine Polish letters for tap-to-insert at the caret. Pointer activation is prevented from stealing input focus, and the caret is restored after insertion; wire the same component rather than adding bespoke pickers.
- **Polish voice preference** (`src/lib/speech.js`): `setPreferredPolishVoice` persists a voice name to `localStorage` (`czesc-polish-voice`) with an in-memory fallback; `listPolishVoices` returns the device's Polish voices best-first. The Sound Lab's voice bar is the only UI that writes this preference. When no Polish voice exists, show guidance rather than hiding the concept.

## Visual regression suite

`e2e/visual.spec.js` snapshots every primary view at desktop (Chromium) and mobile (WebKit) widths. Two pins keep it deterministic — keep both when editing the spec:

1. **Fonts:** the settle step preloads both families with a sample string containing Polish diacritics, forcing the latin-ext subsets to load before the screenshot.
2. **Speech voices:** an init script pins `SpeechSynthesis.prototype.getVoices` to return `[]`, because real voice lists arrive asynchronously and differ per machine.

After any intentional visual change, regenerate baselines and confirm stability with a second plain run:

```bash
npx playwright test --update-snapshots
npx playwright test
```
