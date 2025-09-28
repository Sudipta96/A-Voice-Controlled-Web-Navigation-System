console.log("core.js");

let recognition = null;
let isListening = false;
let lastSpoken = "";
let lastSpokenTime = 0;
let lastCommandTime = 0;
let silenceTimer;

let currentZoom = 1.0;
const ZOOM_STEP = 0.1;
let mediaMode = false;
let startTime;
let intent;

// const knownSites = {
//   youtube: "https://www.youtube.com",
//   gmail: "https://mail.google.com",
//   facebook: "https://www.facebook.com",
//   // add more if needed
// };

function startRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showBubble("⚠️ Speech recognition not supported");
    return;
  }

  // Always recreate recognition object to apply latest language
  recognition = new SpeechRecognition();
  recognition.lang = window.selectedLanguageCode || "en-US";
  console.log("🎤Curr Language:", window.selectedLanguageCode);
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    isListening = true;
    document.getElementById("floating-mic").style.background = "#28a745";
    resetSilenceTimer();
    showBubble("🎤 Listening...");
    console.log("🎤 Language:", recognition.lang);
  };

  recognition.onerror = (e) => {
    stopRecognition();
    showBubble("❌ Error: " + e.error);
  };

  recognition.onend = () => {
    isListening = false;
    document.getElementById("floating-mic").style.background = "#007bff";
  };

  recognition.onresult = handleRecognitionResult;

  recognition.start();
}

function stopRecognition() {
  if (!recognition) return;
  recognition.stop();
  recognition = null;
  isListening = false;
  clearTimeout(silenceTimer);
  document.getElementById("floating-mic").style.background = "#007bff";
  showBubble("🔇 Stopped listening");
}

function resetSilenceTimer() {
  clearTimeout(silenceTimer);
  silenceTimer = setTimeout(() => {
    stopRecognition();
    showBubble("🔕 Auto-stopped due to silence");
  }, 100000000);
}

// facebook, gmail section
let settingsLinks = {};

// Load settingsLinks.json once at startup or before recognition
fetch(chrome.runtime.getURL("commands/links.json"))
  .then((res) => res.json())
  .then((data) => {
    settingsLinks = data;
    console.log("Settings links loaded", settingsLinks);
  })
  .catch((err) => console.error("Failed to load settingsLinks.json", err));
// facebook, gmail section

function handleRecognitionResult(event) {
  resetSilenceTimer();

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    const transcript = result[0].transcript.trim().toLowerCase();
    const isFinal = result.isFinal;

    if (!transcript) continue;

    showBubble(isFinal ? "🗣️ " + transcript : "…" + transcript);

    const now = Date.now();
    if (transcript === lastSpoken && now - lastSpokenTime < 2000) continue;
    lastSpoken = transcript;
    lastSpokenTime = now;

    console.log(formMode);

    // startTime = performance.now(); // ✅ start timestamp
    const match = matchCommand(transcript);
    // Recognition accuracy test

    console.log(match);

    if (!match && formMode) {
      handleFormCommand("", "", transcript);
      return;
    }
    if (!match) continue;

    const { intent, value } = match;

    // Uncomment this to test recognition accuracy
    // intent
    //   ? logAccuracyTestResult("Acurracy", "Pass", startTime)
    //   : logAccuracyTestResult("Acurracy", "Fail", startTime);

    if (intent === "stop_listening") {
      stopRecognition();
      showBubble("🛑 Stopped listening");
      return;
    }

    // SCROLL
    if (intent.startsWith("scroll_")) {
      const startTime = performance.now();
      if (intent === "scroll_up") {
        window.scrollBy(0, -400);
        logTestResult(intent, "Pass", startTime);
        return;
      }
      if (intent === "scroll_down") {
        window.scrollBy(0, 400);
        logTestResult(intent, "Pass", startTime);
        return;
      }
      if (intent === "scroll_top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        logTestResult(intent, "Pass", startTime);
        return;
      }
      if (intent === "scroll_last") {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
        logTestResult(intent, "Pass", startTime);
        return;
      }
    }

    // ZOOM
    if (intent.startsWith("zoom_")) {
      const startTime = performance.now();

      if (intent === "zoom_in") {
        currentZoom = Math.min(currentZoom + ZOOM_STEP, 2);
        document.body.style.zoom = currentZoom;
        logTestResult(intent, "Pass", startTime);
        return showBubble(`🔍 Zoomed in to ${Math.round(currentZoom * 100)}%`);
      }
      if (intent === "zoom_out") {
        currentZoom = Math.max(currentZoom - ZOOM_STEP, 0.5);
        document.body.style.zoom = currentZoom;
        logTestResult(intent, "Pass", startTime);
        return showBubble(`🔎 Zoomed out to ${Math.round(currentZoom * 100)}%`);
      }
      if (intent === "zoom_reset") {
        currentZoom = 1;
        document.body.style.zoom = currentZoom;
        logTestResult(intent, "Pass", startTime);
        return showBubble("🔁 Zoom reset to 100%");
      }
    }

    // ---------- TABS ----------
    // OPEN NEW TAB
    if (intent === "open_site" && now - lastCommandTime > 2000) {
      handleTabCommand(transcript, intent);
      lastCommandTime = now;
      return;
    }

    if (intent === "tab_display") {
      return handleTabCommand(transcript, intent);
    }
    if (intent === "tab_next" && now - lastCommandTime > 2000) {
      handleTabCommand(transcript, "tab_next");
      lastCommandTime = now;
      return;
    }
    if (intent === "tab_previous" && now - lastCommandTime > 2000) {
      handleTabCommand(transcript, "tab_previous");
      lastCommandTime = now;
      return;
    }
    if (intent === "tab_switch" && value.length > 0) {
      return handleTabCommand(transcript, "tab_switch", value);
    }
    if (intent === "tab_close" && now - lastCommandTime > 2000) {
      handleTabCommand(transcript, "tab_close");
      lastCommandTime = now;
      return;
    }

    

    // ---------- Media ----------
    if (intent === "start_media") {
      mediaMode = true;
      return showBubble("🎬 Media mode enabled");
    }
    if (intent === "stop_media") {
      mediaMode = false;
      return showBubble("⛔ Media mode disabled");
    }
    if (mediaMode && intent.startsWith("media_"))
      return handleMediaCommand(intent, value);

    // LINKS
    if (
      intent === "show_links" ||
      transcript.includes("show link") ||
      transcript.includes("display links")
    ) {
      return highlightLinks();
    }
    if (intent === "hide_links") return hideLinkHighlights();

    if (intent === "click_link") {
      let num = value.match(/\d+/)?.[0] || window.wordMap?.[value.trim()];
      if (num) return clickLinkByNumber(num);
      else return clickLinkByTitle(value); // fallback: try by text
    }

    // FORM HANDLING
    if (
      intent.startsWith("form_") ||
      intent === "start_form" ||
      intent === "stop_form" ||
      intent === "form_submit"
    ) {
      return handleFormCommand(intent, value, transcript);
    }
    console.log(formMode);

    // INLINE SEARCH
    if (intent === "search") {
      const phrase = transcript.replace(/^(search|google)/, "").trim();
      if (phrase.length > 3) {
        if (isGoogleSearchPage() || isYouTubeSearchPage()) {
          performInlineSearch(phrase);
        } else {
          const url =
            "https://www.google.com/search?q=" + encodeURIComponent(phrase);
          if (now - lastCommandTime > 2000) {
            window.open(url, "_blank");
            lastCommandTime = now;
            logTestResult("Inline Search", "Pass(new tab)", startTime);
          }
        }
      }
      return;
    }

    // ===============================================================
    // 📌 👉 ADD THE NEW BLOCK BELOW HERE
    // fetch(chrome.runtime.getURL("commands/settingsLinks.json"))
    //   .then((res) => res.json())
    //   .then((settingsLinks) => {
    //     const words = transcript.toLowerCase().split(" ");
    //     const platform = words.find(word => Object.keys(settingsLinks).includes(word));
    //     if (!platform) return;

    //     const command = words.slice(words.indexOf(platform) + 1).join(" ");
    //     const link = settingsLinks[platform][command];
    //     if (link) {
    //       chrome.runtime.sendMessage({ action: "openNewTab", url: link });
    //     }
    //   });

    // ===============================================================

    // LANGUAGE TOGGLE (for reading)
    if (intent === "toggle_lang") {
      toggleLangForReader();
    }

    // READ MODE
    if (
      intent.startsWith("reading_mode") ||
      intent.startsWith("read_section") ||
      intent === "stop_reading"
    ) {
      handleReadingCommand(intent, value, transcript);
      return;
    }

    // READ SPEED
    if (["read_faster", "read_slower", "read_speed_reset"].includes(intent)) {
      handleReadingSpeedCommand(intent);
      return;
    }

  }
}

function handleReadingCommand(intent, value, transcript) {
  switch (intent) {
    case "reading_mode":
      highlightReadableSections();
      break;
    case "read_section":
      let num = value.match(/\d+/)?.[0];
      readSectionByNumber(num);
      break;
    case "close_window":
      removeReadPopup();
      showBubble("Closing window");
      break;
    case "stop_reading":
      stopReading();
      showBubble("🛑 Reading stopped");
      break;
    default:
      return false;
  }
  return true;
}

function toggleLangForReader() {
  startTime = performance.now(); // ✅ start timestamp
  old_lang = selectedLang;
  if (selectedLang === "en") {
    selectedLang = "bn";
    selectedLanguageCode = "bn-BD";
    setLanguage(selectedLang);
    showBubble("🌐 ভাষা পরিবর্তন: বাংলা");
  } else {
    selectedLang = "en";
    selectedLanguageCode = "en-US";
    setLanguage(selectedLang);
    showBubble("🌐 Language switched to English");
  }

  old_lang !== selectedLang
    ? logAccuracyTestResult("Language Toggle", "Pass", startTime)
    : logAccuracyTestResult("Language Toggle", "Fail", startTime);

  if (isListening) {
    stopRecognition();
    startRecognition(); // restart with new language
  }

  loadCommandFile(selectedLang, () => {
    showBubble("✅ Commands updated for: " + selectedLang);
  });
}
