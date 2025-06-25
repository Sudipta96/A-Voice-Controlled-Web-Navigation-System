let recognition = null;
let bubble = null;
let hideTimer = null;
let isListening = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "start") {
    console.log("🟢 Received START");
    startRecognition();
  } else if (request.action === "stop") {
    console.log("🔴 Received STOP");
    stopRecognition();
  }
});

function startRecognition() {
  if (isListening) {
    console.warn("⚠️ Already listening");
    return;
  }

  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    console.error("🚫 SpeechRecognition not supported");
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true; // ✅ Show live partial results
  recognition.lang = "en-US";

  recognition.onstart = () => {
    isListening = true;
    console.log("✅ Voice recognition started");
    showInBubble("🎤 Listening...");
  };

  // helper: return only the last N words of a string
  function lastWords(text, n = 10) {
    const words = text.trim().split(/\s+/);
    return words.slice(-n).join(" ");
  }

  recognition.onresult = (event) => {
    console.log("🔁 onresult fired:", event.results);

    const lastResult = event.results[event.results.length - 1];
    const transcript = lastResult[0].transcript.trim();
    const isFinal = lastResult.isFinal;

    if (transcript) {
      // ▼▼▼ NEW: show only the last 10 words ▼▼▼
      const displayText = lastWords(transcript, 10);

      // use different prefixes for live vs. final (optional)
      showInBubble(isFinal ? "🗣️ " + displayText : "…" + displayText);
    }
  };

  recognition.onerror = (e) => {
    console.error("❌ Speech recognition error:", e.error);
    showInBubble("⚠️ " + e.error);
    stopRecognition();
  };

  recognition.onend = () => {
    console.warn("🔇 Recognition ended");
    showInBubble("🔇 Stopped");
    isListening = false;
    recognition = null;
  };

  try {
    recognition.start();
    console.log("🎤 Called recognition.start()");
  } catch (err) {
    console.error("⛔ start() failed:", err.message);
  }
}

function stopRecognition() {
  if (recognition) {
    try {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    } catch (e) {
      console.error("⚠️ Error during stop:", e.message);
    }
    recognition = null;
  }

  isListening = false;
  showInBubble("🔇 Voice recognition stopped");
  console.log("🛑 Voice recognition manually stopped");
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
