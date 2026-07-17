# Design system and UI conventions

This app's visual identity draws on the Polish School of Posters: flat poster crimson, deep granat navy, off-white poster paper, and one oversized expressive letterform. This document records the rules that keep new UI consistent with it, and the maintenance procedures that keep the visual test suite stable.

## Palette

All colours flow from the token block at the top of `src/styles.css`:

| Token | Value | Role |
| --- | --- | --- |
| `--red` | `#d2232a` | Poster crimson — primary actions, brand mark, hero surfaces |
| `--red-dark` | `#a91d22` | Hover state and red text on light tints |
| `--red-soft` | `#f9e1de` | Quiet red tint for secondary CTAs and active states |
| `--navy` | `#223047` | Granat — audio controls, sound-lab hero, reference panels |
| `--ink` | `#1d201f` | Body text |
| `--cream` | `#f4f2ec` | Page background (poster paper) |
| `--paper` | `#fffefb` | Card and panel surfaces |

Prefer the tokens over literal values. The remaining hard-coded colours are tints derived from these (feedback greens/ambers and translucent overlays on crimson surfaces).

## Typography

- **Display:** Bricolage Grotesque, weights 400–800 — all headings, stats, and the brand mark.
- **Body:** Instrument Sans, weights 400–700 — everything else.

Both families are self-hosted as variable woff2 subsets (latin + latin-ext) in `src/fonts/`, declared in `src/fonts.css`. Latin-ext matters: it carries the Polish diacritics (ą ę ś ć ż ź ó ł ń). Do not reintroduce a fonts CDN — Google-served subsets loaded asynchronously, which reflowed pages mid-screenshot in the visual suite and broke offline use.

To regenerate the font files (for example after a version bump upstream), request the css2 endpoint with a Chrome user agent, download each latin/latin-ext woff2 it lists, and update the `@font-face` blocks in `src/fonts.css`:

```
https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap
```

## Signature element

The home hero carries a giant typographic **ę** (`.poster-letter`) — cream `#f6e3c2`, hard offset shadow, rotated −5°. The ogonek tail must stay fully visible; it is the point of the mark. Below 620 px it becomes a 30 %-opacity watermark behind the hero copy. The session-complete screen carries the identity's only other big crimson moment: the rotated **zrobione** stamp (`.session-stamp`).

Spend boldness in one place per screen. One loud crimson CTA leads each page; repeated card CTAs use the quiet `--red-soft` treatment (see `.unit-card .primary-button`).

## Legibility rules

- Minimum UI font size is 10 px. An 8–9 px pass was removed once; do not reintroduce smaller sizes.
- Focus states use the global 3 px outline (`#9c1a1f`); keep it visible on new interactive elements.
- Animations must respect `prefers-reduced-motion` (a global override already handles CSS animations and transitions).

## Interaction conventions

- **Drill keyboard shortcuts** (`src/lib/drill-keys.js`): Space reveals a card or replays its audio; 1–4 select Again/Hard/Good/Easy. The hook ignores key events targeting inputs, selects, textareas, and focused buttons. `.key-hint` badges advertise the keys and render only under `(hover: hover) and (pointer: fine)`, so touch devices never see them. New drill screens should wire the same hook rather than adding bespoke listeners.
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
