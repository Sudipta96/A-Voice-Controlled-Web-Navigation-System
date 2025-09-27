let isSpeaking = false;
let currentReadSentences = [];
let currentReadIndex = 0;
let speakingRate = 1; // default rate
let selectedLanguageCode = "en-US"; // default, adjust dynamically if needed

/**
 * Read section by number → show popup → auto-start reading.
 */
function readSectionByNumber(number) {
  console.log("readSectionByNumber:", number);
  const el = document.querySelector(`[data-read-id="${number}"]`);
  if (!el) {
    showBubble(`❌ Section ${number} not found`);
    return;
  }

  // Exclude the badge number text when grabbing text
  const clone = el.cloneNode(true);
  const badge = clone.querySelector("div");
  if (badge && badge.style.zIndex === "99999") {
    badge.remove();
  }
  const text = clone.innerText.trim();

  if (!text) {
    showBubble(`❌ Section ${number} is empty`);
    return;
  }

  showReadPopup(number, text); // show popup
  startReadingSectionFromPopup(text); // auto start reading
}

/**
 * Popup UI for section text.
 */
function showReadPopup(number, text) {
  // Remove existing popup if present
  const existing = document.getElementById("read-section-popup");
  if (existing) existing.remove();

  const popup = document.createElement("div");
  popup.id = "read-section-popup";
  popup.style.cssText = `
    position: fixed;
    right: 16px;
    top: 80px;
    width: 380px;
    max-height: 70vh;
    overflow-y: auto;
    background: #ffffff;
    border: 2px solid #007bff;
    border-radius: 8px;
    padding: 10px;
    z-index: 2147483647;
    box-shadow: 0 10px 30px rgba(0,0,0,0.12);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    line-height: 1.5;
    font-size: 14px;
    color: #222;
  `;

  const title = document.createElement("div");
  title.innerText = `Section ${number}`;
  title.style.cssText = "font-weight:600; margin-bottom:8px;";

  const content = document.createElement("div");
  content.id = "read-popup-content";
  content.innerText = text;

  popup.appendChild(title);
  popup.appendChild(content);
  document.body.appendChild(popup);
}

/**
 * Start reading sentences inside the popup content.
 */
function startReadingSectionFromPopup(text) {
  // Stop any ongoing speech
  stopReading();

  const content = document.getElementById("read-popup-content");
  if (!content) return;

  currentReadSentences = splitIntoSentences(text);
  currentReadIndex = 0;
  isSpeaking = true;

  // Convert to <span> wrapped sentences for highlighting
  content.innerHTML = "";
  currentReadSentences.forEach((s, i) => {
    const span = document.createElement("span");
    span.innerText = s + " ";
    span.dataset.index = i;
    content.appendChild(span);
  });

  speakNextSentence();
}

// function startReadingSectionFromPopup(text) {
//   try {
//     // Stop any ongoing speech
//     stopReading();

//     const content = document.getElementById("read-section-popup");
//     if (!content) return;

//     currentReadSentences = splitIntoSentences(text);
//     currentReadIndex = 0;
//     isSpeaking = true;

//     // Convert to <span> wrapped sentences for highlighting
//     content.innerHTML = "";
//     currentReadSentences.forEach((s, i) => {
//       const span = document.createElement("span");
//       span.innerText = s + " ";
//       span.dataset.index = i;
//       content.appendChild(span);
//     });

//     // Fail-safe timeout: close popup if speech doesn't start
//     let started = false;
//     const safetyTimer = setTimeout(() => {
//       if (!started) {
//         console.error("❌ Speech did not start, closing popup...");
//         removeReadPopup();
//       }
//     }, 3000); // 3 seconds fail-safe

//     // Wrap speakNextSentence in try/catch to catch speech errors
//     try {
//       const firstUtterance = new SpeechSynthesisUtterance(
//         currentReadSentences[0].trim()
//       );
//       firstUtterance.lang = selectedLanguageCode;
//       firstUtterance.rate = speakingRate;

//       firstUtterance.onstart = () => {
//         started = true;
//         clearTimeout(safetyTimer); // speech started, clear fail-safe
//         highlightSentence(0);
//       };

//       firstUtterance.onend = () => {
//         currentReadIndex = 1;
//         speakNextSentence();
//       };

//       window.speechSynthesis.speak(firstUtterance);
//     } catch (err) {
//       console.error("❌ speakNextSentence failed:", err);
//       clearTimeout(safetyTimer);
//       removeReadPopup();
//     }
//   } catch (err) {
//     console.error("❌ startReadingSectionFromPopup crashed:", err);
//     closeReadPopup(); // fail-safe: remove popup immediately
//   }
// }

/**
 * Highlight sentence in popup while reading.
 */
function highlightSentence(index) {
  const content = document.getElementById("read-popup-content");
  if (!content) return;

  [...content.querySelectorAll("span")].forEach((span, i) => {
    span.style.background = i === index ? "yellow" : "transparent";
  });
  // Auto-scroll to keep highlighted word visible
  //   currentSpan.scrollIntoView({ behavior: "smooth", block: "center" });

  const active = content.querySelector(`span[data-index="${index}"]`);
  if (active) {
    active.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

/**
 * Speak next sentence (popup-based).
 */
function speakNextSentence() {
  if (!isSpeaking || currentReadIndex >= currentReadSentences.length) {
    stopReading(true); // auto close popup after finish
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
    // small delay makes reading smoother between sentences
    setTimeout(() => speakNextSentence(), 120);
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Stop reading immediately.
 * @param {boolean} finished Whether reading finished naturally.
 */
function stopReading(finished = false) {
  isSpeaking = false;
  window.speechSynthesis.cancel();

  if (finished) {
    showBubble("✅ Finished reading");
    removeReadPopup();
  } else {
    showBubble("🛑 Reading stopped");
  }
}

/**
 * Utility: remove popup if exists.
 */
function removeReadPopup() {
  console.log("canceling");
  const popup = document.getElementById("read-popup-content");
  if (popup && popup.parentNode) {
    popup.remove();
  }
  stopReading(); // cancel speech safely
  //   if (p) p.remove();
}

/**
 * Split text into sentences (keeps punctuation).
 */
function splitIntoSentences(text) {
  return text.match(/[^\.!\?]+[\.!\?]+[\])'"`’”]*|\S+/g) || [text];
}

// let isSpeaking = false;
// let currentReadIndex = 0;
// let currentReadSentences = [];
// let selectedReadSection = null;
// let speakingRate = 1.2;

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

// function readSectionByNumber(number) {
//   console.log("readSectionByNumber:", number);
//   const el = document.querySelector(`[data-read-id="${number}"]`);
//   if (!el) {
//     showBubble(`❌ Section ${number} not found`);
//     return;
//   }

//   const text = el.innerText.trim();
//   if (!text) {
//     showBubble(`❌ Section ${number} is empty`);
//     return;
//   }

//   showReadPopup(number, text);
// }

// /**
//  * Create a popup on the right side that displays the section text.
//  * - id: read-section-popup
//  * - Close button removes popup.
//  * - Start Reading button will call startReadingSectionFromPopup() if available.
//  */
// function showReadPopup(number, text) {
//   // Remove existing popup if present
//   const existing = document.getElementById("read-section-popup");
//   if (existing) existing.remove();

//   // Popup container
//   const popup = document.createElement("div");
//   popup.id = "read-section-popup";
//   popup.style.cssText = `
//     position: fixed;
//     right: 16px;
//     top: 80px;
//     width: 380px;
//     max-height: 70vh;
//     overflow-y: auto;
//     background: #ffffff;
//     color: #111;
//     border: 2px solid #007bff;
//     border-radius: 8px;
//     padding: 10px;
//     z-index: 2147483647;
//     box-shadow: 0 10px 30px rgba(0,0,0,0.12);
//     font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
//   `;

//   // Header: title + controls
//   const header = document.createElement("div");
//   header.style.cssText =
//     "display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px;";

//   const title = document.createElement("div");
//   title.innerText = `Section ${number}`;
//   title.style.cssText = "font-weight:600;";

//   const controls = document.createElement("div");
//   controls.style.cssText = "display:flex; gap:6px;";

//   // Start Reading button (optional — will call startReadingSectionFromPopup if defined)
//   const readBtn = document.createElement("button");
//   readBtn.type = "button";
//   readBtn.innerText = "Start Reading";
//   readBtn.style.cssText =
//     "padding:4px 8px; border-radius:4px; border:1px solid #007bff; background:#007bff; color:white; cursor:pointer;";
//   readBtn.addEventListener("click", () => {
//     // Prefer an explicit global helper if you define it later:
//     if (typeof startReadingSectionFromPopup === "function") {
//       startReadingSectionFromPopup(number, text);
//     } else {
//       // Fallback: set a window var (so other code can pick it up) and notify
//       window._readSectionQueued = { number, text };
//       showBubble(
//         "▶️ Section queued for reading. Say 'start reading' to begin."
//       );
//     }
//   });

//   // Close button
//   const closeBtn = document.createElement("button");
//   closeBtn.type = "button";
//   closeBtn.innerText = "Close";
//   closeBtn.style.cssText =
//     "padding:4px 8px; border-radius:4px; border:1px solid #ccc; background:#fff; cursor:pointer;";
//   closeBtn.addEventListener("click", () => {
//     popup.remove();
//   });

//   controls.appendChild(readBtn);
//   controls.appendChild(closeBtn);
//   header.appendChild(title);
//   header.appendChild(controls);

//   // Content area (preserve paragraphs; allow scrolling)
//   const content = document.createElement("div");
//   content.style.cssText =
//     "white-space: pre-wrap; line-height:1.5; font-size:14px; color:#222;";
//   content.innerText = text;

//   // Append header + content
//   popup.appendChild(header);
//   popup.appendChild(content);

//   document.body.appendChild(popup);

//   // Inform user
//   showBubble(`📖 Section ${number} loaded in popup`);
// }

// /**
//  * Remove popup (useful from other code)
//  */
// function removeReadPopup() {
//   const p = document.getElementById("read-section-popup");
//   if (p) p.remove();
// }

// /**
//  * Optional helper: start reading the popup's text (if TTS functions exist).
//  * - Uses existing functions if present: splitIntoSentences(), speakNextSentence(), stopReading(), etc.
//  * Add this if you want a programmatic way to start reading from popup (and keep UI Start Reading button functional).
//  */
// function startReadingSectionFromPopup(number, text) {
//   // Try to gracefully stop any existing reading
//   if (typeof stopReading === "function") {
//     try {
//       stopReading();
//     } catch (e) {}
//   }

//   // Prepare reading state using existing helpers if present
//   if (
//     typeof splitIntoSentences === "function" &&
//     typeof speakNextSentence === "function"
//   ) {
//     selectedReadSection =
//       document.querySelector(`[data-read-id="${number}"]`) || null;
//     currentReadSentences = splitIntoSentences(text);
//     currentReadIndex = 0;
//     isSpeaking = true;
//     speakNextSentence();
//     showBubble(`🔊 Reading section ${number}...`);
//   } else {
//     // If the existing speak helpers are not present yet, queue the text
//     window._readSectionQueued = { number, text };
//     showBubble(
//       "⚠️ Reading helper not available; section queued. Say 'start reading' once helpers are loaded."
//     );
//   }
// }
