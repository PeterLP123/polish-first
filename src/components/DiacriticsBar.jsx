const POLISH_LETTERS = ["ą", "ć", "ę", "ł", "ń", "ó", "ś", "ź", "ż"];

// Inserts Polish diacritics at the caret of a controlled input, for learners
// whose keyboard has no Polish layout. Pointer activation is prevented from
// shifting focus, so typing flow never breaks; keyboard users are re-focused.
export default function DiacriticsBar({ inputRef, value, onChange, disabled = false }) {
  const insert = (letter) => {
    const input = inputRef.current;
    if (!input || disabled) return;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + letter + value.slice(end));
    const caret = start + letter.length;
    // React commits controlled updates synchronously for click events, so the
    // caret can be set right away. Keyboard activation moved focus to the
    // button; only then return it to the field — a frame callback here would
    // otherwise yank the caret back if the learner keeps typing immediately.
    input.setSelectionRange(caret, caret);
    if (document.activeElement !== input) {
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(caret, caret);
      });
    }
  };

  return (
    <div className="diacritics-bar" role="group" aria-label="Insert Polish letters">
      {POLISH_LETTERS.map((letter) => (
        <button key={letter} type="button" disabled={disabled} onPointerDown={(event) => event.preventDefault()} onClick={() => insert(letter)} aria-label={`Insert ${letter}`}>{letter}</button>
      ))}
    </div>
  );
}
