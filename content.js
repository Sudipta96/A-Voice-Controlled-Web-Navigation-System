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

// Helper: get last N words from text
function lastWords(text, n = 10) {
  const words = text.trim().split(/\s+/);
  return words.slice(-n).join(" ");
}

// Match command pattern from JSON commands file
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
      } else {
        // exact match pattern
        if (transcript === pattern.toLowerCase()) {
          return { intent, value: transcript };
        }
      }
    }
  }
  return null;
}

// Detect if phrase sounds like a URL
function isSpokenUrl(value) {
  return /(?:dot|www|https)/i.test(value);
}

// Convert spoken text to URL format
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

// Create floating bubble for transcript and messages
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

// Show text in bubble temporarily
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

// Reset the silence timeout timer
function resetSilenceTimer() {
  if (silenceTimer) clearTimeout(silenceTimer);
  silenceTimer = setTimeout(() => {
    console.log("⏰ Silence timeout reached. Stopping recognition.");
    stopRecognition();
    showInBubble("🔇 Stopped due to silence");
  }, SILENCE_TIMEOUT);
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "start") {
    selectedLanguage = request.lang || "en-US";
    startRecognition();
  } else if (request.action === "stop") {
    stopRecognition();
  }
});

// Start voice recognition
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

    // Process all new results starting from event.resultIndex
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      let transcript = result[0].transcript.trim().toLowerCase();
      const isFinal = result.isFinal;

      if (!transcript) continue;

      showInBubble(
        isFinal ? "🗣️ " + lastWords(transcript) : "…" + lastWords(transcript)
      );

      if (transcript.includes("stop listening")) {
        stopRecognition();
        showInBubble("🛑 Voice recognition stopped by command");
        return;
      }

      if (["scroll up", "scroll down", "scroll last", "scroll top"].includes(transcript)) {
        handleScrollCommand(transcript);
        continue;
      }
      
      if (["open new tab", "close tab"].includes(transcript)) {
        chrome.runtime.sendMessage({ action: transcript });
        showInBubble(transcript === "open new tab" ? "🆕 Opening new tab" : "❌ Closing tab");
        return;
      }
      
      if (!transcript.endsWith("done")) continue;

      transcript = transcript.replace(/done$/, "").trim();

      // Find last index of "search" or "google"
      let lastSearchIndex = transcript.lastIndexOf("search");
      let lastGoogleIndex = transcript.lastIndexOf("google");
      let commandIndex = Math.max(lastSearchIndex, lastGoogleIndex);

      if (commandIndex === -1) {
        continue; // no known command prefix found
      }

      // Extract command phrase after last "search" or "google"
      let commandPhrase = transcript.slice(commandIndex).trim();

      // Remove the command word prefix
      if (commandPhrase.startsWith("search")) {
        commandPhrase = commandPhrase.replace(/^search/, "").trim();
      } else if (commandPhrase.startsWith("google")) {
        commandPhrase = commandPhrase.replace(/^google/, "").trim();
      }

      // Prevent duplicate processing
      const now = Date.now();
      if (commandPhrase === lastSpoken && now - lastSpokenTime < 1500) continue;

      lastSpoken = commandPhrase;
      lastSpokenTime = now;

      // Match commands from commandData
      const match = matchCommand(transcript, commandData);

      if (match && match.intent === "search_google") {
        const query = commandPhrase;

        if (isSpokenUrl(query)) {
          const url = "https://" + spokenToUrl(query);
          window.open(url, "_blank");
          showInBubble("🌐 Opening " + url);
        } else {
          const searchUrl =
            "https://www.google.com/search?q=" + encodeURIComponent(query);
          window.open(searchUrl, "_blank");
          showInBubble("🔍 Searching: " + query);
        }
      } else if (
        ["scroll up", "scroll down", "scroll last", "scroll top"].includes(transcript)
      ) {
        handleScrollCommand(transcript);
      }
    }
  };

  recognition.onerror = (e) => {
    console.error("Speech error:", e.error);
    showInBubble("⚠️ " + e.error);
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      stopRecognition();
    }
  };

  recognition.onend = () => {
    isListening = false;
    console.warn("🔇 Recognition ended");
    // Auto-restart recognition unless manually stopped
    if (recognition !== null) {
      console.log("⏩ Restarting recognition for multi-command mode");
      recognition.start();
    }
  };

  recognition.start();
}

// Scroll command handler
function handleScrollCommand(command) {
  console.log("scrolling");
  if (command === "scroll down") {
    console.log("scrolling down");
    window.scrollBy({ top: window.innerHeight * 0.7, behavior: "smooth" });
    showInBubble("⬇️ Scrolling down");
  } else if (command === "scroll up") {
    window.scrollBy({ top: -window.innerHeight * 0.7, behavior: "smooth" });
    showInBubble("⬆️ Scrolling up");
  } else if (command === "scroll last") {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    showInBubble("⏬ Scrolling to bottom");
  }else if (command === "scroll top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    showInBubble("⏫ Scrolling to top");
  }
}

// Stop voice recognition
function stopRecognition() {
  if (recognition) {
    const tempRecognition = recognition;
    recognition = null;
    tempRecognition.stop();
  }
  isListening = false;
  if (silenceTimer) clearTimeout(silenceTimer);
  showInBubble("🔇 Stopped");
}
