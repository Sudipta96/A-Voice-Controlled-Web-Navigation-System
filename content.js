let recognition = null;
let isListening = false;
let bubble = null;
let hideTimer = null;
let selectedLanguage = "en-US";
let commandData = null;

let lastSpoken = "";
let lastSpokenTime = 0;
let silenceTimer = null;
const SILENCE_TIMEOUT = 10000; // 10 seconds silence timeout

function lastWords(text, n = 10) {
  const words = text.trim().split(/\s+/);
  return words.slice(-n).join(" ");
}

function matchCommand(transcript, commandData) {
  transcript = transcript.trim().toLowerCase();
  for (const intent in commandData) {
    const patterns = commandData[intent];
    for (const pattern of patterns) {
      if (pattern.includes("*")) {
        const prefix = pattern.split("*")[0].trim();
        if (transcript.startsWith(prefix)) {
          const value = transcript.slice(prefix.length).trim();
          return { intent, value };
        }
      }
    }
  }
  return null;
}

function isSpokenUrl(value) {
  return /(?:dot|www|https)/i.test(value);
}

function spokenToUrl(text) {
  return text
    .replace(/\s+dot\s+/gi, ".")
    .replace(/\s+slash\s+/gi, "/")
    .replace(/\s+colon\s+/gi, ":")
    .replace(/\s+/g, "")
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .trim();
}

function createBubble() {
  if (bubble) return;
  bubble = document.createElement("div");
  bubble.style.position = "fixed";
  bubble.style.bottom = "20px";
  bubble.style.left = "50%";
  bubble.style.transform = "translateX(-50%)";
  bubble.style.background = "#000";
  bubble.style.color = "#fff";
  bubble.style.padding = "10px 20px";
  bubble.style.borderRadius = "20px";
  bubble.style.fontSize = "14px";
  bubble.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
  bubble.style.zIndex = "99999";
  bubble.style.opacity = "0.9";
  bubble.style.transition = "opacity 0.4s ease";
  document.body.appendChild(bubble);
}

function showInBubble(text) {
  if (!bubble) createBubble();
  bubble.innerText = text;
  bubble.style.display = "block";
  bubble.style.opacity = "0.9";
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    bubble.style.opacity = "0";
    setTimeout(() => {
      bubble.style.display = "none";
    }, 500);
  }, 2000);
}

function resetSilenceTimer() {
  if (silenceTimer) clearTimeout(silenceTimer);
  silenceTimer = setTimeout(() => {
    console.log("⏰ Silence timeout reached. Stopping recognition.");
    stopRecognition();
    showInBubble("🔇 Stopped due to silence");
  }, SILENCE_TIMEOUT);
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "start") {
    selectedLanguage = request.lang || "en-US";
    startRecognition();
  } else if (request.action === "stop") {
    stopRecognition();
  }
});

function startRecognition() {
  if (isListening) return;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.error("SpeechRecognition not supported");
    showInBubble("⚠️ SpeechRecognition not supported");
    return;
  }

  if (!commandData) {
    fetch(chrome.runtime.getURL("commands/en.json"))
      .then((res) => res.json())
      .then((data) => {
        commandData = data;
        startRecognition(); // Retry after loading commands
      })
      .catch(() => {
        showInBubble("❌ Failed to load commands");
      });
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = selectedLanguage;
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isListening = true;
    showInBubble("🎤 Listening...");
    console.log("Voice recognition started");
    resetSilenceTimer();
  };

  recognition.onresult = (event) => {
    resetSilenceTimer();

    const lastResult = event.results[event.results.length - 1];
    let transcript = lastResult[0].transcript.trim().toLowerCase();
    const isFinal = lastResult.isFinal;

    if (!transcript) return;

    showInBubble(
      isFinal ? "🗣️ " + lastWords(transcript) : "…" + lastWords(transcript)
    );

    if (transcript.includes("stop listening")) {
      stopRecognition();
      showInBubble("🛑 Voice recognition stopped by command");
      return;
    }

    if (!transcript.endsWith("done")) return;

    // Remove the trailing "done"
    transcript = transcript.replace(/done$/, "").trim();

    // Find last index of "search" or "google"
    let lastSearchIndex = transcript.lastIndexOf("search");
    let lastGoogleIndex = transcript.lastIndexOf("google");

    // Choose the later one of search/google
    let commandIndex = Math.max(lastSearchIndex, lastGoogleIndex);

    if (commandIndex === -1) {
      // No command found, ignore
      return;
    }

    // Extract the command phrase after the last "search" or "google"
    let commandPhrase = transcript.slice(commandIndex).trim();

    // Now remove "search" or "google" keyword from start
    if (commandPhrase.startsWith("search")) {
      commandPhrase = commandPhrase.replace(/^search/, "").trim();
    } else if (commandPhrase.startsWith("google")) {
      commandPhrase = commandPhrase.replace(/^google/, "").trim();
    }

    // Prevent duplicate processing
    const now = Date.now();
    if (commandPhrase === lastSpoken && now - lastSpokenTime < 1500) return;
    lastSpoken = commandPhrase;
    lastSpokenTime = now;

    const match = matchCommand("search *", {
      search_google: ["search *", "google *"],
    });
    // matchCommand expects whole commandData, but we can shortcut:
    // Or simply process commandPhrase here directly:

    if (isSpokenUrl(commandPhrase)) {
      const url = "https://" + spokenToUrl(commandPhrase);
      window.open(url, "_blank");
      showInBubble("🌐 Opening " + url);
    } else {
      const searchUrl =
        "https://www.google.com/search?q=" + encodeURIComponent(commandPhrase);
      window.open(searchUrl, "_blank");
      showInBubble("🔍 Searching: " + commandPhrase);
    }
  };

  recognition.onerror = (e) => {
    console.error("Speech error:", e.error);
    showInBubble("⚠️ " + e.error);
    // Only stop if critical error like 'not-allowed'
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      stopRecognition();
    }
  };

  recognition.onend = () => {
    isListening = false;
    console.warn("🔇 Recognition ended");
    // Auto restart to enable continuous listening (multi-command)
    // But only if user didn’t manually stop (recognition != null)
    if (recognition !== null) {
      console.log("⏩ Restarting recognition for multi-command mode");
      recognition.start();
    }
  };

  recognition.start();
}

function stopRecognition() {
  if (recognition) {
    // Set recognition to null first to prevent auto restart in onend
    const tempRecognition = recognition;
    recognition = null;
    tempRecognition.stop();
  }
  isListening = false;
  if (silenceTimer) clearTimeout(silenceTimer);
  showInBubble("🔇 Stopped");
}
