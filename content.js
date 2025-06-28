let recognition = null;
let isListening = false;
let commandData = null;
let selectedLang = "en"; // 'en' or 'bn'
let selectedLanguageCode = "en-US";
let silenceTimer = null;
let lastSpoken = "";
let lastSpokenTime = 0;
let lastCommandTime = 0;

const LANGUAGES = {
  en: { label: "English", code: "en-US" },
  bn: { label: "বাংলা", code: "bn-BD" },
};

const MIC_ID = "floating-mic";
const LANG_SELECT_ID = "language-select";
const BUBBLE_ID = "voice-feedback-bubble";

chrome.runtime.onMessage.addListener((req) => {
  if (req.action === "start") startRecognition();
  if (req.action === "stop") stopRecognition();
});

function loadCommandFile(lang, callback) {
  fetch(chrome.runtime.getURL(`commands/${lang}.json`))
    .then((res) => res.json())
    .then((data) => {
      commandData = data;
      selectedLang = lang;
      selectedLanguageCode = LANGUAGES[lang].code;
      console.log(`✅ Loaded ${lang}.json`);
      callback();
    })
    .catch((err) => {
      console.error("❌ Failed to load commands:", err);
      showBubble(`Failed to load ${lang}.json`);
    });
}

function injectMicButton() {
  if (document.getElementById(MIC_ID)) return;
  const btn = document.createElement("button");
  btn.id = MIC_ID;
  btn.textContent = "🎤";
  btn.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    z-index: 99999; font-size: 20px; padding: 12px;
    border: none; border-radius: 50%;
    background: #007bff; color: white; cursor: pointer;
  `;
  btn.onclick = () => (isListening ? stopRecognition() : startRecognition());
  document.body.appendChild(btn);
}

function injectLanguageSelector() {
  if (document.getElementById(LANG_SELECT_ID)) return;

  const sel = document.createElement("select");
  sel.id = LANG_SELECT_ID;
  sel.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    z-index: 99999; padding: 5px 10px; font-size: 14px;
  `;

  for (const [key, info] of Object.entries(LANGUAGES)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.text = info.label;
    sel.appendChild(opt);
  }

  sel.value = selectedLang;

  sel.onchange = () => {
    stopRecognition();
    loadCommandFile(sel.value, () => {
      if (isListening) startRecognition();
      showBubble(`🌐 Switched to ${LANGUAGES[sel.value].label}`);
    });
  };

  document.body.appendChild(sel);
}

function showBubble(text) {
  let bubble = document.getElementById(BUBBLE_ID);
  if (!bubble) {
    bubble = document.createElement("div");
    bubble.id = BUBBLE_ID;
    bubble.style.cssText = `
      position: fixed; bottom: 80px; right: 20px;
      background: #000; color: #fff;
      padding: 10px 20px; border-radius: 20px;
      font-size: 14px; z-index: 99999; opacity: 0.9;
    `;
    document.body.appendChild(bubble);
  }

  bubble.innerText = text;
  bubble.style.display = "block";
  clearTimeout(bubble.hideTimeout);
  bubble.hideTimeout = setTimeout(() => (bubble.style.display = "none"), 2000);
}

// determine if current page is Google or YouTube
function isGoogleSearchPage() {
  return (
    location.hostname.includes("google") &&
    document.querySelector("textarea[name='q']")
  );
}

function isYouTubeSearchPage() {
  return (
    location.hostname.includes("youtube") &&
    document.querySelector("input[name='search_query']")
  );
}

function performInlineSearch(query) {
  let input;

  // Correct selectors
  if (location.hostname.includes("google")) {
    input = document.querySelector("textarea[name='q']");
  } else if (location.hostname.includes("youtube")) {
    input = document.querySelector("input[name='search_query']");
  }

  if (input) {
    input.focus();

    // Clear existing value properly
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    // Set entire value
    input.value = query;
    input.dispatchEvent(new Event("input", { bubbles: true }));

    setTimeout(() => {
      const enterEvent = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        keyCode: 13,
        key: "Enter"
      });
      input.dispatchEvent(enterEvent);

      if (input.form && input.form.submit) {
        input.form.submit();
      }

      showBubble("🔍 Inline search submitted");
    }, 300);
  } else {
    // fallback to new tab
    const searchUrl = "https://www.google.com/search?q=" + encodeURIComponent(query);
    window.open(searchUrl, "_blank");
    showBubble("🌐 Fallback search");
  }
}

function handleMediaCommand(intent, value = "") {
  const video = document.querySelector("video");
  if (!video) return showBubble("❌ No video found");

  switch (intent) {
    case "media_play":
      video.play();
      showBubble("▶️ Playing");
      break;

    case "media_pause":
      video.pause();
      showBubble("⏸️ Paused");
      break;

    case "media_volume_up":
      video.volume = Math.min(1, video.volume + 0.1);
      showBubble("🔊 Volume up");
      break;

    case "media_volume_down":
      video.volume = Math.max(0, video.volume - 0.1);
      showBubble("🔉 Volume down");
      break;

    case "media_volume_set":
      const vol = parseInt(value);
      if (!isNaN(vol) && vol >= 0 && vol <= 100) {
        video.volume = vol / 100;
        showBubble("🔈 Volume " + vol + "%");
      }
      break;

    case "media_mute":
      video.muted = true;
      showBubble("🔇 Muted");
      break;
    
    case "media_unmute":
      video.muted = false;
      showBubble("🔇 Unmuted");
      break;

    case "media_forward":
      const fSec = parseInt(value);
      if (!isNaN(fSec)) {
        video.currentTime += fSec;
        showBubble("⏩ Forward " + fSec + " sec");
      }
      break;

    case "media_backward":
      const bSec = parseInt(value);
      if (!isNaN(bSec)) {
        video.currentTime -= bSec;
        showBubble("⏪ Back " + bSec + " sec");
      }
      break;
  }
}



function matchCommand(transcript) {
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
        if (transcript === pattern.toLowerCase()) {
          return { intent, value: transcript };
        }
      }
    }
  }
  return null;
}

function startRecognition() {
  if (isListening) return;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return showBubble("⚠️ Not supported");

  if (!commandData) {
    loadCommandFile(selectedLang, startRecognition);
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = selectedLanguageCode;
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isListening = true;
    document.getElementById(MIC_ID).style.background = "#28a745";
    resetSilenceTimer();
    showBubble("🎤 Listening...");
  };

  recognition.onerror = (e) => {
    stopRecognition();
    console.error("Speech error:", e.error);
    showBubble("❌ " + e.error);
  };

  recognition.onend = () => {
    isListening = false;
    document.getElementById(MIC_ID).style.background = "#007bff";
  };

  recognition.onresult = (event) => {
    resetSilenceTimer();

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript.trim().toLowerCase();
      const isFinal = result.isFinal;

      if (!transcript) continue;
      showBubble(isFinal ? "🗣️ " + transcript : "…" + transcript);

      const now = Date.now();
      if (transcript === lastSpoken && now - lastSpokenTime < 2000) return;
      lastSpoken = transcript;
      lastSpokenTime = now;

      const match = matchCommand(transcript);
      if (!match) continue;

      const { intent, value } = match;

      if (intent === "stop_listening") {
        stopRecognition();
        showBubble("🛑 Stopped");
        return;
      }

      if (intent === "enable") {
        startRecognition();
        return;
      }

      if (intent === "scroll_up") return window.scrollBy(0, -400);
      if (intent === "scroll_down") return window.scrollBy(0, 400);
      if (intent === "scroll_last")
        return window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      if (intent === "scroll_top")
        return window.scrollTo({ top: 0, behavior: "smooth" });

      if (intent === "new_tab" && now - lastCommandTime > 2000) {
        chrome.runtime.sendMessage({ action: "new tab" });
        lastCommandTime = now;
        return;
      }

      if (intent === "close_tab" && now - lastCommandTime > 2000) {
        chrome.runtime.sendMessage({ action: "close tab" });
        lastCommandTime = now;
        return;
      }

      if (intent === "next_tab") {
        chrome.runtime.sendMessage({ action: "next_tab" });
        showBubble("➡️ Switching to next tab");
        return;
      }

      if (intent === "prev_tab") {
        chrome.runtime.sendMessage({ action: "prev_tab" });
        showBubble("⬅️ Switching to previous tab");
        return;
      }

      if (intent === "go_back_tab") {
        chrome.runtime.sendMessage({ action: "go_back_tab" });
        showBubble("↩️ Going back to last tab");
        return;
      }

      if (intent === "switch_tab") {
        let tabNumber = value.match(/\d+/)?.[0];
        const wordMap = {
          one: 1,
          to: 2,
          two: 2,
          three: 3,
          four: 4,
          five: 5,
          six: 6,
          seven: 7,
          eight: 8,
          nine: 9,
          ten: 10,
        };
        if (!tabNumber) tabNumber = wordMap[value.trim()];
        if (!isNaN(tabNumber)) {
          chrome.runtime.sendMessage({
            action: "switch_tab",
            index: parseInt(tabNumber),
          });
          showBubble(`🌀 Switching to tab ${tabNumber}`);
        }
        return;
      }

      if (intent === "open_site") {
        const siteMap = {
          "open youtube": "https://www.youtube.com",
          "open gmail": "https://mail.google.com",
          "open facebook": "https://www.facebook.com",
        };
        const url = siteMap[value];
        if (url) {
          window.open(url, "_blank");
          showBubble(`🌐 Opening ${value}`);
        }
        return;
      }
      console.log("test");

      if (intent.startsWith("media_")) {
          handleMediaCommand(intent, value);
          continue;
        }

      // inline search
      if (transcript.startsWith("search") || transcript.startsWith("google")) {
        spokenPhrase = transcript.replace(/^(search|google)/, "").trim();
        console.log("searching");
        console.log(isGoogleSearchPage());
        console.log(spokenPhrase.length);
        if (spokenPhrase.length > 3) {
          if (isGoogleSearchPage() || isYouTubeSearchPage()) {
            console.log("is it true");
            performInlineSearch(spokenPhrase);
          } else {
            const url =
              "https://www.google.com/search?q=" +
              encodeURIComponent(spokenPhrase);
            window.open(url, "_blank");
          }
          spokenPhrase = "";
        }
      }
    }
  };

  recognition.start();
}

function stopRecognition() {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  isListening = false;
  clearTimeout(silenceTimer);
  document.getElementById(MIC_ID).style.background = "#007bff";
  showBubble("🔇 Stopped");
}

function resetSilenceTimer() {
  if (silenceTimer) clearTimeout(silenceTimer);
  silenceTimer = setTimeout(() => {
    stopRecognition();
    showBubble("🔕 Auto-stopped due to silence");
  }, 10000);
}

// 🚀 INIT
injectMicButton();
// console.log(isGoogleSearchPage());
console.log(location.hostname);
console.log(isYouTubeSearchPage());
injectLanguageSelector();
loadCommandFile("en", () => {});
