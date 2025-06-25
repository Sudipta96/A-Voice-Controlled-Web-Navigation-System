let recognition = null;
let isListening = false;
let bubble = null;
let hideTimer = null;
let selectedLanguage = "en-US";
let commandData = null;

// Helper: get last N words
function lastWords(text, n = 10) {
  const words = text.trim().split(/\s+/);
  return words.slice(-n).join(" ");
}

// Match command pattern from JSON
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

// Spoken URL parser
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

// Voice UI bubble
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

// Start/Stop voice
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
    return;
  }

  if (!commandData) {
    fetch(chrome.runtime.getURL("commands/en.json"))
      .then((res) => res.json())
      .then((data) => {
        commandData = data;
        startRecognition(); // Retry after loading
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
  };

  let lastSpoken = "";
  let lastSpokenTime = 0;

  recognition.onresult = (event) => {
    const lastResult = event.results[event.results.length - 1];
    let transcript = lastResult[0].transcript.trim().toLowerCase();
    const isFinal = lastResult.isFinal;

    if (!transcript) return;

    const now = Date.now();

    // Show live transcript
    showInBubble(
      isFinal ? "🗣️ " + lastWords(transcript) : "…" + lastWords(transcript)
    );

    // ✅ Only trigger if "done" is said at the end
    if (!transcript.endsWith("done")) return;

    // 🧼 Remove "done" from end
    transcript = transcript.replace(/done$/, "").trim();

    // Avoid reprocessing same command
    if (transcript === lastSpoken && now - lastSpokenTime < 1500) return;
    lastSpoken = transcript;
    lastSpokenTime = now;

    const match = matchCommand(transcript, commandData);
    if (match && match.intent === "search_google") {
      const query = match.value;

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

      stopRecognition();
    }
  };

  recognition.onerror = (e) => {
    console.error("Speech error:", e.error);
    stopRecognition();
    showInBubble("⚠️ " + e.error);
  };

  recognition.onend = () => {
    isListening = false;
    console.warn("🔇 Recognition ended");
  };

  recognition.start();
}

function stopRecognition() {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  isListening = false;
  showInBubble("🔇 Stopped");
}
