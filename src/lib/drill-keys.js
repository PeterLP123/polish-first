import { useEffect, useRef } from "react";

const RATING_KEYS = { 1: "again", 2: "hard", 3: "good", 4: "easy" };

// Desktop shortcuts for drill screens: Space to reveal or replay audio,
// 1–4 for the Again/Hard/Good/Easy ratings. Handlers return true when they
// consumed the key so unhandled presses keep their native behaviour.
export function useDrillKeys(handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(input|textarea|select)$/i.test(target.tagName))) return;
      if (event.key === " ") {
        // A focused button or link should keep its native Space activation.
        if (target instanceof HTMLElement && /^(button|a)$/i.test(target.tagName)) return;
        if (handlersRef.current.onSpace?.()) event.preventDefault();
        return;
      }
      const rating = RATING_KEYS[event.key];
      if (rating && handlersRef.current.onRate?.(rating)) event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
