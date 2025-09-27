console.log("speak.js loaded");

let isSpeaking = false;
let currentReadIndex = 0;
let currentReadSentences = [];
let selectedReadSection = null;
let speakingRate = 1.2;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "read_selected_text") {
    const { text, lang } = message;
    // readTextNow(text, lang);
    speakText1(text);
  }
});

// Detect Bengali or English
function detectLanguage(text) {
  const banglaRegex = /[\u0980-\u09FF]/;
  return banglaRegex.test(text) ? "bn" : "en-US";
}

// Load a voice that supports the detected language
function getVoiceForLang(lang) {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;

    function loadVoices() {
      const voices = synth.getVoices();
      const matchedVoices = voices.filter((voice) =>
        voice.lang.toLowerCase().startsWith(lang.toLowerCase())
      );
      resolve(matchedVoices.length > 0 ? matchedVoices[0] : null);
    }

    if (synth.getVoices().length !== 0) {
      loadVoices();
    } else {
      synth.onvoiceschanged = loadVoices;
    }
  });
}

// Speak the given text in the detected language
async function speakText(text) {
  const lang = detectLanguage(text);
  const voice = await getVoiceForLang(lang);

  if (!voice) {
    alert(`No voice found for language: ${lang}`);
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onerror = (e) => {
    console.error("TTS error:", e.error);
  };

  speechSynthesis.cancel(); // Stop any ongoing speech
  speechSynthesis.speak(utterance);
}

function handleReadingCommand(intent, value, transcript) {
  console.log("handlereading");
  console.log(value);
  switch (intent) {
    case "reading_mode":
      highlightReadableSections();
      break;

    case "read_section":
      readSectionByNumber(value);
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

function highlightReadableSections() {
  const sections = document.querySelectorAll("p, ol, ul");
  let count = 1;

  sections.forEach((el) => {
    const text = el.innerText.trim();
    const visible = el.offsetHeight > 0 && el.offsetParent !== null;
    if (text.length > 40 && visible) {
      el.setAttribute("data-read-id", count);
      el.style.border = "1px dashed #007bff";
      el.style.padding = "6px";
      el.style.marginBottom = "10px";
      const badge = document.createElement("div");
      badge.innerText = count;
      // badge.style.cssText = `
      //   background: #007bff; color: white;
      //   padding: 2px 6px; font-size: 12px;
      //   border-radius: 50%; position: absolute;
      //   top: -8px; left: -8px;
      //   z-index: 99999;
      // `;

      badge.style.cssText = `
        background: #007bff; color: white;
        padding: 2px 6px; font-size: 12px;
        border-radius: 50%; position: absolute;
        margin-left: -24px; margin-top: -12px;
        z-index: 99999;
      `;
      el.style.position = "relative";
      el.insertBefore(badge, el.firstChild);
      count++;
    }
  });

  showBubble("🔢 Numbered readable sections");
}

function clearAllSectionHighlights() {
  document.querySelectorAll("[data-read-id]").forEach((el) => {
    el.removeAttribute("data-read-id");
    el.style.border = "";
    el.style.padding = "";
    el.style.marginBottom = "";
    const badge = el.querySelector("div");
    if (badge && badge.style.zIndex === "99999") {
      // Check badge specific style to ensure it's ours
      badge.remove();
    }
  });
}

function readSectionByNumber(number) {
  console.log(number);
  const el = document.querySelector(`[data-read-id="${number}"]`);
  if (el) {
    selectedReadSection = el;
    const text = el.innerText.trim();
    currentReadSentences = splitIntoSentences(text);
    currentReadIndex = 0;
    isSpeaking = true;
    speakNextSentence();
  } else {
    showBubble(`❌ Section ${number} not found`);
  }
}

function readSectionByPhrase(phrase) {
  phrase = phrase.toLowerCase().trim();
  const sections = document.querySelectorAll("[data-read-id]");
  for (let el of sections) {
    const text = el.innerText.trim().toLowerCase();
    if (text.startsWith(phrase)) {
      selectedReadSection = el;
      const sentences = splitIntoSentences(el.innerText.trim());
      currentReadSentences = sentences;
      currentReadIndex = 0;
      isSpeaking = true;
      speakNextSentence();
      showBubble(`📖 Reading section: "${el.innerText.slice(0, 30)}..."`);
      return;
    }
  }
  showBubble(`❌ No section starts with "${phrase}"`);
}

function splitIntoSentences(text) {
  return text.match(/[^\.!\?]+[\.!\?]+[\])'"`’”]*|\S+/g) || [text];
}

function speakNextSentence() {
  if (!isSpeaking || currentReadIndex >= currentReadSentences.length) {
    stopReading();
    return;
  }

  const sentence = currentReadSentences[currentReadIndex].trim();
  if (!sentence) {
    currentReadIndex++;
    speakNextSentence();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(sentence);
  utterance.lang = selectedLanguageCode;
  utterance.rate = speakingRate;

  utterance.onstart = () => {
    highlightSentence(currentReadIndex);
  };

  utterance.onend = () => {
    currentReadIndex++;
    speakNextSentence();
  };

  window.speechSynthesis.speak(utterance);
}

function highlightSentence(index) {
  if (!selectedReadSection) return;

  const text = selectedReadSection.innerText;
  const sentences = splitIntoSentences(text);
  selectedReadSection.innerHTML = sentences
    .map((s, i) => (i === index ? `<mark>${s.trim()}</mark>` : s.trim()))
    .join(" ");
  scrollToHighlightedSentence();
}

function scrollToHighlightedSentence() {
  const mark = selectedReadSection.querySelector("mark");
  if (mark) {
    mark.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function stopReading() {
  isSpeaking = false;
  window.speechSynthesis.cancel();
  if (selectedReadSection) {
    selectedReadSection.innerHTML = currentReadSentences.join(" ");
  }
  clearAllSectionHighlights();

  showBubble("🛑 Reading stopped");
}
