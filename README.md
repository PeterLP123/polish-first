# Cześć! — Polish for real life

A conversational, pronunciation-first Polish course that grows from complete-beginner survival language through confident B1 communication and towards a practical B2 bridge. It runs entirely in the browser and saves learning progress locally.

## Start the app

```bash
npm install
npm run dev
```

Open the local address Vite prints, normally [http://localhost:5173](http://localhost:5173).

The current production version is available at [https://peterlp123.github.io/polish-first/](https://peterlp123.github.io/polish-first/). On a phone, use the browser's **Add to Home Screen** option for an app-like launch and offline access after the first visit.

## Included

- 938 useful words and phrases across 81 practical conversation units
- Polish audio through the browser's `pl-PL` speech voice, with a persisted voice picker in the Sound Lab
- English-friendly pronunciation guides alongside browser-spoken Polish audio
- Optional microphone practice, phone-dictation fallback, and approximate speech-match feedback
- Forty-two five-turn branching dialogues with three response options per turn, from first introductions to presentations, contract questions, negotiations, and public consultations
- Flashcard, listening, sentence-building, and speaking drills that prioritise your weakest phrases
- Finite daily sessions that mix new phrases, due reviews, and a real-life dialogue
- Due-date spaced repetition with Again, Hard, Good, and Easy ratings
- Twenty-four Polish sound lessons and sixty-six grammar explainers spanning beginner foundations through a B2 bridge
- Thirty-six practical readings and thirty-six controlled-writing tasks, including extended texts, proposals, formal correspondence, reflective narratives, evidence evaluation, and argument-building
- Ten stage checks covering listening, reading, grammar, recall, writing, dialogue, and speaking
- XP, streaks, an adjustable daily goal, weekly activity, phrase mastery, and dialogue records saved in `localStorage`
- Validated progress export/import plus a privacy-safe tester diagnostics summary
- Keyboard shortcuts in drills: Space reveals or replays a card, 1–4 rate it
- Responsive desktop, tablet, and mobile layouts with self-hosted fonts, so the installed app works fully offline

Chrome and Edge provide the broadest support for microphone speech recognition. Audio playback and all non-microphone learning modes work in other current browsers.

## Checks

```bash
npm test
npm run build
npm run test:e2e
```

Pushes to `main` deploy automatically to GitHub Pages. The deployment workflow supplies the `/polish-first/` base path while local development continues to use `/`.

## Design

The visual identity, typography, and the conventions for keeping new UI and the visual regression suite consistent are documented in [docs/design.md](docs/design.md).
