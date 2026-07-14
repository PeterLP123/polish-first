let cachedPolishVoice = null;

function refreshPolishVoice() {
  cachedPolishVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("pl")) ?? null;
}

// Browsers load voices asynchronously; warm the cache so early utterances get the Polish voice.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshPolishVoice();
  window.speechSynthesis.addEventListener?.("voiceschanged", refreshPolishVoice);
}

export function speakPolish(text, rate = 0.82) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pl-PL";
  utterance.rate = rate;
  if (!cachedPolishVoice) refreshPolishVoice();
  if (cachedPolishVoice) utterance.voice = cachedPolishVoice;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function listenForPolish({ onResult, onError, onStart, onEnd }) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return null;

  const recognition = new Recognition();
  recognition.lang = "pl-PL";
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;
  recognition.onstart = onStart;
  recognition.onend = onEnd;
  recognition.onerror = (event) => onError?.(event.error);
  recognition.onresult = (event) => {
    const alternatives = Array.from(event.results[0]).map((result) => result.transcript).filter(Boolean);
    if (alternatives.length) onResult(alternatives);
    else onError?.("no-speech");
  };
  recognition.start();
  return recognition;
}
