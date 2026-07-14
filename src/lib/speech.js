export function speakPolish(text, rate = 0.82) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pl-PL";
  utterance.rate = rate;
  const polishVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith("pl"));
  if (polishVoice) utterance.voice = polishVoice;
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
    const alternatives = Array.from(event.results[0]).map((result) => result.transcript);
    onResult(alternatives);
  };
  recognition.start();
  return recognition;
}
