# Cześć! — Polish for real life

A conversational, pronunciation-first Polish course for complete beginners. It runs entirely in the browser and saves learning progress locally.

## Start the app

```bash
npm install
npm run dev
```

Open the local address Vite prints, normally [http://localhost:5173](http://localhost:5173).

The current production version is available at [https://peterlp123.github.io/polish-first/](https://peterlp123.github.io/polish-first/). On a phone, use the browser's **Add to Home Screen** option for an app-like launch and offline access after the first visit.

## Included

- 362 useful words and phrases across 33 practical conversation units
- Polish audio through the browser's `pl-PL` speech voice
- English-friendly pronunciation guides with marked word stress
- Optional microphone practice and approximate speech-match feedback
- Sixteen five-turn branching dialogues with three response options per turn, covering cafés, introductions, travel, health, errands, sightseeing, and home problems
- Flashcard, listening, sentence-building, and speaking drills that prioritise your weakest phrases
- Finite daily sessions that mix new phrases, due reviews, and a real-life dialogue
- Due-date spaced repetition with Again, Hard, Good, and Easy ratings
- Twenty-four Polish sound lessons and thirty beginner grammar explainers
- XP, streaks, an adjustable daily goal, weekly activity, phrase mastery, and dialogue records saved in `localStorage`
- Validated progress export/import plus a privacy-safe tester diagnostics summary
- Responsive desktop, tablet, and mobile layouts

Chrome and Edge provide the broadest support for microphone speech recognition. Audio playback and all non-microphone learning modes work in other current browsers.

## Checks

```bash
npm test
npm run build
npm run test:e2e
```

Pushes to `main` deploy automatically to GitHub Pages. The deployment workflow supplies the `/polish-first/` base path while local development continues to use `/`.
