import { selectedLanguageCode } from "./language.js";
import { setCommandData, matchCommand } from "./commands.js";
import { showBubble } from "./bubble.js";
import { handleCommand } from "./actions.js";

let recognition = null;
let isListening = false;
let silenceTimer = null;

function resetSilenceTimer() {
  if (silenceTimer) clearTimeout(silenceTimer);
  silenceTimer = setTimeout(() => stopRecognition(), 10000);
}

export function startRecognition() {
  if (
    isListening ||
    (!window.SpeechRecognition && !window.webkitSpeechRecognition)
  )
    return;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = selectedLanguageCode;
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isListening = true;
    document.getElementById("floating-mic").style.background = "#28a745";
    showBubble("🎤 Listening...");
    resetSilenceTimer();
  };

  recognition.onerror = (e) => {
    stopRecognition();
    showBubble("❌ " + e.error);
  };

  recognition.onend = () => {
    isListening = false;
    document.getElementById("floating-mic").style.background = "#007bff";
  };

  recognition.onresult = (event) => {
    resetSilenceTimer();
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim().toLowerCase();
      if (!transcript) continue;

      showBubble(transcript);
      const match = matchCommand(transcript);
      if (match) handleCommand(match.intent, match.value);
    }
  };

  recognition.start();
}

export function stopRecognition() {
  if (recognition) recognition.stop();
  isListening = false;
  clearTimeout(silenceTimer);
  document.getElementById("floating-mic").style.background = "#007bff";
  showBubble("🔇 Stopped");
}

// Event Listeners
window.addEventListener("toggle-mic", () => {
  isListening ? stopRecognition() : startRecognition();
});

window.addEventListener("force-stop", () => stopRecognition());
window.addEventListener("lang-changed", (e) => {
  stopRecognition();
});
window.addEventListener("commands-loaded", (e) => {
  setCommandData(e.detail.commands);
});
