import { reviewedAudioForText } from "../data/audio-manifest.js";

const POLISH_LANGUAGE = "pl-PL";
const LISTENING_TIMEOUT_MS = 12_000;
const VOICE_PREFERENCE_KEY = "czesc-polish-voice";

let cachedPolishVoice = null;
let activeUtterance = null;
let cancelActiveUtterance = null;
let activeAudio = null;
let cancelActiveAudio = null;
let sessionVoicePreference = null;

function synthesis() {
  return typeof window !== "undefined" ? window.speechSynthesis : null;
}

function voiceScore(voice) {
  const language = String(voice?.lang ?? "").toLowerCase();
  let score = language === "pl-pl" ? 100 : language.startsWith("pl") ? 60 : 0;
  if (voice?.localService) score += 20;
  if (voice?.default) score += 2;
  return score;
}

export function listPolishVoices() {
  const voices = synthesis()?.getVoices?.() ?? [];
  return voices
    .filter((voice) => String(voice.lang ?? "").toLowerCase().startsWith("pl"))
    .sort((left, right) => voiceScore(right) - voiceScore(left) || String(left.name).localeCompare(String(right.name), "pl"));
}

export function preferredPolishVoiceName() {
  try {
    return window.localStorage?.getItem(VOICE_PREFERENCE_KEY) ?? sessionVoicePreference;
  } catch {
    return sessionVoicePreference;
  }
}

export function setPreferredPolishVoice(name) {
  sessionVoicePreference = name || null;
  try {
    if (name) window.localStorage?.setItem(VOICE_PREFERENCE_KEY, name);
    else window.localStorage?.removeItem(VOICE_PREFERENCE_KEY);
  } catch {
    // Storage unavailable; the session-level preference above still applies.
  }
  refreshPolishVoice();
}

function refreshPolishVoice() {
  const polishVoices = listPolishVoices();
  const preferred = preferredPolishVoiceName();
  cachedPolishVoice = (preferred && polishVoices.find((voice) => voice.name === preferred)) || polishVoices[0] || null;
  return cachedPolishVoice;
}

// Voice lists are often populated after page load, especially on iOS.
if (synthesis()) {
  refreshPolishVoice();
  synthesis().addEventListener?.("voiceschanged", refreshPolishVoice);
}

export function stopPolishSpeech() {
  const engine = synthesis();
  const finishUtterance = cancelActiveUtterance;
  const finishAudio = cancelActiveAudio;
  const audio = activeAudio;
  activeUtterance = null;
  cancelActiveUtterance = null;
  activeAudio = null;
  cancelActiveAudio = null;
  engine?.cancel?.();
  audio?.pause?.();
  if (audio) audio.currentTime = 0;
  finishUtterance?.();
  finishAudio?.();
  return Boolean(engine || audio);
}

export function speakPolish(text, rateOrOptions = 0.82) {
  const cleanText = String(text ?? "").trim();
  if (!cleanText) return false;
  const options = typeof rateOrOptions === "number" ? { rate: rateOrOptions } : (rateOrOptions ?? {});
  const rate = Math.min(1.2, Math.max(0.5, Number(options.rate) || 0.82));
  const reviewedAudio = reviewedAudioForText(cleanText);
  if (reviewedAudio && playReviewedAudio(reviewedAudio, rate, options)) return true;

  const engine = synthesis();
  const Utterance = typeof window !== "undefined" ? window.SpeechSynthesisUtterance : null;
  if (!engine || !Utterance) return false;

  stopPolishSpeech();
  const utterance = new Utterance(cleanText);
  utterance.lang = POLISH_LANGUAGE;
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 1;
  const voice = refreshPolishVoice();
  if (voice) utterance.voice = voice;

  let settled = false;
  const finish = (kind, error = null) => {
    if (settled) return;
    settled = true;
    if (activeUtterance === utterance) {
      activeUtterance = null;
      cancelActiveUtterance = null;
    }
    if (kind === "error") options.onError?.(error ?? "synthesis-failed");
    else options.onEnd?.();
  };

  utterance.onstart = () => {
    if (activeUtterance === utterance) options.onStart?.();
  };
  utterance.onend = () => {
    finish("end");
  };
  utterance.onerror = (event) => {
    finish("error", event?.error);
  };

  activeUtterance = utterance; // Prevent mobile Safari from collecting it mid-playback.
  cancelActiveUtterance = () => finish("end");
  if (engine.paused) engine.resume?.();
  engine.speak(utterance);
  return true;
}

function playReviewedAudio(entry, rate, options) {
  const AudioPlayer = typeof window !== "undefined" ? window.Audio : null;
  if (!AudioPlayer) return false;
  stopPolishSpeech();
  const audio = new AudioPlayer(entry.src);
  audio.preload = "auto";
  audio.playbackRate = Math.min(1.25, Math.max(0.65, rate / 0.82));
  let settled = false;
  const finish = (kind, error = null) => {
    if (settled) return;
    settled = true;
    if (activeAudio === audio) {
      activeAudio = null;
      cancelActiveAudio = null;
    }
    if (kind === "error") options.onError?.(error ?? "reviewed-audio-failed");
    else options.onEnd?.();
  };
  audio.onplay = () => { if (activeAudio === audio) options.onStart?.(); };
  audio.onended = () => finish("end");
  audio.onerror = () => finish("error", "reviewed-audio-failed");
  activeAudio = audio;
  cancelActiveAudio = () => finish("end");
  try {
    audio.play()?.catch?.(() => finish("error", "reviewed-audio-blocked"));
  } catch {
    finish("error", "reviewed-audio-failed");
    return false;
  }
  return true;
}

export function polishAudioSource(text) {
  return reviewedAudioForText(text) ? "reviewed-recording" : "device-voice";
}

export function supportsSpeechRecognition() {
  return typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function speechRecognitionMessage(code) {
  if (code === "not-allowed" || code === "service-not-allowed") return "Microphone access is blocked. Allow it in your browser settings, or use phone dictation below.";
  if (code === "audio-capture") return "No microphone is available. Check your device input, or use phone dictation below.";
  if (code === "network") return "Speech checking could not reach the browser's recognition service. Phone dictation still works.";
  if (code === "aborted") return "Listening stopped. Tap the microphone when you are ready.";
  if (code === "no-speech") return "I didn't catch any speech. Move a little closer and try once more.";
  return "I couldn't hear that clearly. Try again, or use phone dictation below.";
}

export function listenForPolish({ onResult, onError, onStart, onEnd }) {
  if (!supportsSpeechRecognition()) return null;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new Recognition();
  let timeout = null;
  let reportedError = false;

  stopPolishSpeech();
  recognition.lang = POLISH_LANGUAGE;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 5;
  recognition.onstart = () => {
    timeout = window.setTimeout(() => recognition.stop?.(), LISTENING_TIMEOUT_MS);
    onStart?.();
  };
  recognition.onend = () => {
    window.clearTimeout(timeout);
    onEnd?.({ hadError: reportedError });
  };
  recognition.onerror = (event) => {
    reportedError = true;
    window.clearTimeout(timeout);
    onError?.(event?.error ?? "recognition-failed");
  };
  recognition.onresult = (event) => {
    const alternatives = [];
    for (let resultIndex = event.resultIndex ?? 0; resultIndex < event.results.length; resultIndex += 1) {
      for (const candidate of Array.from(event.results[resultIndex])) {
        const transcript = candidate.transcript?.trim();
        if (transcript && !alternatives.includes(transcript)) alternatives.push(transcript);
      }
    }
    if (alternatives.length) onResult?.(alternatives);
    else onError?.("no-speech");
  };

  try {
    recognition.start();
  } catch (error) {
    onError?.(error?.name === "NotAllowedError" ? "not-allowed" : "recognition-failed");
    return null;
  }
  return recognition;
}
