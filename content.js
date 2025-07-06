let recognition = null;
let isListening = false;
let commandData = null;
let selectedLang = "en"; // 'en' or 'bn'
let selectedLanguageCode = "en-US";
let silenceTimer = null;
let lastSpoken = "";
let lastSpokenTime = 0;
let lastCommandTime = 0;

// zoom
let currentZoom = 1.0;
const ZOOM_STEP = 0.1;

// form
let mediaMode = false;
let formMode = false;
let formFields = [];
let formFieldMap = []; // indexed list of form fields
let formIndicators = []; // to remove later
let currentFieldIndex = 0;
let passwordSuggestionPending = false;
let suggestedPassword = "";

const LANGUAGES = {
  en: { label: "English", code: "en-US" },
  bn: { label: "বাংলা", code: "bn-BD" },
};

const MIC_ID = "floating-mic";
const LANG_SELECT_ID = "language-select";
const BUBBLE_ID = "voice-feedback-bubble";

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
  eleven: 11,
  twelve: 12,
};

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
        key: "Enter",
      });
      input.dispatchEvent(enterEvent);

      if (input.form && input.form.submit) {
        input.form.submit();
      }

      showBubble("🔍 Inline search submitted");
    }, 300);
  } else {
    // fallback to new tab
    const searchUrl =
      "https://www.google.com/search?q=" + encodeURIComponent(query);
    window.open(searchUrl, "_blank");
    showBubble("🌐 Fallback search");
  }
}

function showFormFieldIndicators() {
  formFieldMap = [];
  formIndicators.forEach(el => el.remove());
  formIndicators = [];

  const allFields = document.querySelectorAll("input, textarea, select");
  let count = 1;

  allFields.forEach(field => {
    if (field.type === "hidden" || field.offsetParent === null) return;

    const rect = field.getBoundingClientRect();
    const indicator = document.createElement("div");
    indicator.textContent = count;
    indicator.style.cssText = `
      position: absolute;
      top: ${rect.top + window.scrollY}px;
      left: ${rect.left + window.scrollX - 25}px;
      background: #ff6347;
      color: white;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 50%;
      z-index: 99999;
      font-weight: bold;
    `;
    document.body.appendChild(indicator);
    formFieldMap.push(field);
    formIndicators.push(indicator);
    count++;
  });

  showBubble("🧾 Numbered fields displayed");
}

function hideFormFieldIndicators() {
  formIndicators.forEach(el => el.remove());
  formIndicators = [];
  formFieldMap = [];
  showBubble("❌ Field indicators removed");
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
      showBubble("🔊 Unmuted");
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

let linkOverlays = [];
function highlightLinks() {
  // Clear previous overlays
  linkOverlays.forEach((el) => el.remove());
  linkOverlays = [];

  const links = [...document.querySelectorAll("a")].filter(
    (l) => l.offsetParent !== null && l.href
  );
  links.forEach((link, i) => {
    const rect = link.getBoundingClientRect();
    const label = document.createElement("div");
    label.className = "link-overlay"; // ✅ Add class
    label.textContent = i + 1;
    label.style.cssText = `
      position: absolute;
      top: ${rect.top + window.scrollY}px;
      left: ${rect.left + window.scrollX}px;
      background: red;
      color: white;
      font-size: 12px;
      font-weight: bold;
      padding: 2px 5px;
      border-radius: 3px;
      z-index: 999999;
    `;
    document.body.appendChild(label);
    linkOverlays.push(label);
  });
  // showBubble("🔗 Links highlighted");

  showBubble("🔢 Links numbered (auto-hide in 15s)");
  // ⏳ Auto-hide after 15 seconds
  setTimeout(() => {
    hideLinkHighlights();
  }, 150000);
}

function hideLinkHighlights() {
  document.querySelectorAll(".link-overlay").forEach((el) => el.remove());
  // linkOverlays.forEach((el) => el.remove());
  linkOverlays = [];
  showBubble("❎ Link highlights removed");
}

function clickLinkByNumber(num) {
  const links = [...document.querySelectorAll("a")].filter(
    (l) => l.offsetParent !== null && l.href
  );
  const index = parseInt(num) - 1;
  if (!isNaN(index) && links[index]) {
    showBubble("🖱️ Clicking link " + num);
    links[index].click();
  } else {
    showBubble("❌ Link " + num + " not found");
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

function generateStrongPassword(length = 12) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*!";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}


function showPasswordPreview(field, value) {
  let existing = document.getElementById("password-preview");
  if (!existing) {
    existing = document.createElement("div");
    existing.id = "password-preview";
    existing.style.cssText = `
      position: absolute; background: #eee; color: #000;
      padding: 6px 12px; border-radius: 6px; font-size: 14px;
      box-shadow: 0 0 6px rgba(0,0,0,0.2); margin-top: 4px;
      z-index: 99999;
    `;
    field.parentNode.appendChild(existing);
  }

  existing.innerText = `🔓 ${value}`;
  const rect = field.getBoundingClientRect();
  existing.style.position = "fixed";
  existing.style.left = `${rect.left}px`;
  existing.style.top = `${rect.bottom + 4}px`;
}

let dropdownPopup = null;
let dropdownScrollIndex = 0;
let dropdownScrollLimit = 10;
let dropdownAutoCloseTimer = null;
let finalFormIndex;

function showDropdownPopup(selectField) {
  if (dropdownPopup) dropdownPopup.remove();

  const options = Array.from(selectField.options);
  dropdownPopup = document.createElement("div");
  dropdownPopup.style.cssText = `
    position: fixed; top: 100px; left: 50%;
    transform: translateX(-50%);
    background: white; color: black;
    border: 2px solid #007bff; border-radius: 10px;
    padding: 10px; max-height: 300px;
    overflow-y: auto; z-index: 100000; font-size: 16px;
    width: 300px;
  `;

  dropdownPopup.className = "voice-dropdown-popup";

  const visibleOptions = options.slice(dropdownScrollIndex, dropdownScrollIndex + dropdownScrollLimit);
  visibleOptions.forEach((opt, i) => {
    const item = document.createElement("div");
    item.textContent = `${dropdownScrollIndex + i + 1}. ${opt.text}`;
    dropdownPopup.appendChild(item);
  });

  document.body.appendChild(dropdownPopup);

  // Auto-close after 2 min
  if (dropdownAutoCloseTimer) clearTimeout(dropdownAutoCloseTimer);
  dropdownAutoCloseTimer = setTimeout(() => {
    hideDropdownPopup();
    showBubble("⌛ Dropdown closed due to inactivity");
  }, 2 * 60 * 1000);
}

function hideDropdownPopup() {
  if (dropdownPopup) {
    dropdownPopup.remove();
    dropdownPopup = null;
  }
  if (dropdownAutoCloseTimer) clearTimeout(dropdownAutoCloseTimer);
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
      // if (!match) continue;
      console.log("Match command");
      console.log(match);
      
      if (match) {
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

      if (intent === "zoom_in") {
        currentZoom = Math.min(currentZoom + ZOOM_STEP, 2); // Max zoom 200%
        document.body.style.zoom = currentZoom;
        showBubble(`🔍 Zoomed in to ${Math.round(currentZoom * 100)}%`);
        return;
      }

      if (intent === "zoom_out") {
        currentZoom = Math.max(currentZoom - ZOOM_STEP, 0.5); // Min zoom 50%
        document.body.style.zoom = currentZoom;
        showBubble(`🔎 Zoomed out to ${Math.round(currentZoom * 100)}%`);
        return;
      }

      if (intent === "reset_zoom") {
        currentZoom = 1.0;
        document.body.style.zoom = currentZoom;
        showBubble("🔁 Zoom reset to 100%");
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

      if (intent === "start_media") {
        mediaMode = true;
        showBubble("🎬 Media mode enabled");
        return;
      }

      if (intent === "stop_media") {
        mediaMode = false;
        showBubble("⛔ Media mode disabled");
        return;
      }
     
      if (mediaMode && intent.startsWith("media_")) {
        console.log("media mode"); 
        console.log(mediaMode);
        handleMediaCommand(intent, value);
        continue;
      }

      if (intent === "show_links") {
        highlightLinks();
        continue;
      }

      if (intent === "hide_links") {
        hideLinkHighlights();
        continue;
      }

      if (intent === "click_link") {
        let num = value.match(/\d+/)?.[0];
        // console.log("click link");
        if (!num) num = wordMap[value.trim()];
        console.log("click");
        console.log(num);
        if (num) clickLinkByNumber(num);
        continue;
      }



      // form start from here
      if (intent === "start_form") {
        formFields = Array.from(
          document.querySelectorAll("input, textarea, select")
        ).filter((el) => el.offsetParent !== null && !el.disabled);
        if (formFields.length === 0)
          return showBubble("⚠️ No form fields found");

        formMode = true;
        currentFieldIndex = 0;
        formFields[currentFieldIndex].focus();
        showBubble("📝 Form mode enabled");
        return;
      }

      if (intent === "stop_form") {
            formMode = false;
            showBubble("✅ Form mode stopped");
            return;
      }
      
      
      if (formMode && intent === "form_remove_focus"){
          finalFormIndex = currentFieldIndex;
          currentFieldIndex = -1;
          document.activeElement?.blur();
          
      }

      if (formMode && intent.startsWith("form_")) {
        handleFormCommand(intent, value);
        continue;
      }

      function handleFormCommand(intent, value=""){

        if (intent === "form_submit") {
          handleFormSubmit(transcript, currentFieldIndex);
        }
          
        if (intent === "form_next") {
              if (formFields[currentFieldIndex + 1]) {
                currentFieldIndex++;
                formFields[currentFieldIndex].focus();
                showBubble("➡️ Moved to next field");
              }
              return;
        }

        if (intent === "form_back") {
              if (currentFieldIndex > 0) {
                currentFieldIndex--;
                formFields[currentFieldIndex].focus();
                showBubble("⬅️ Moved to previous field");
              }
              return;
        }

        if (intent === "form_clear_field") {
              const field = formFields[currentFieldIndex];
              if (field) {
                field.value = "";
                field.focus();
                showBubble("🧹 Cleared current field");

                // show dropdown suggestions if available
                field.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "ArrowDown" })
                );
              }
              return;
        }


        if (intent === "form_start_index") {
          showFormFieldIndicators();
          return;
        }

        if (intent === "form_stop_index") {
          hideFormFieldIndicators();
          return;
        }

        if (intent === "form_focus_index") {
            let numberMap = { one: 1, two: 2, three: 3, four: 4, five: 5,
                              six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
            let number = parseInt(value);
            if (isNaN(number)) number = numberMap[value.toLowerCase()];
            if (number) focusFormFieldByNumber(number);
            return;
          }

        // Handle: go to [label] (e.g., "go to username")
        if (intent === "form_go_to_field" && value) {
          focusFieldByLabel(value);
          return;
        }


        if (intent === "form_select_radio" && value) {
            selectRadioByLabel(value);
            return;
          }

        function selectRadioByLabel(labelText) {
          labelText = labelText.toLowerCase();
          const labels = document.querySelectorAll("label");
          for (const label of labels) {
            if (label.innerText.toLowerCase().includes(labelText)) {
              const input = label.control;
              if (input && input.type === "radio") {
                input.checked = true;
                showBubble(`🔘 Selected "${label.innerText}"`);
                return;
              }
            }
          }
          showBubble("❌ No matching radio found");
        }

        function focusFormFieldByNumber(index) {
          const field = formFieldMap[index - 1];
          if (field) {
            currentFieldIndex = index - 1;  // ✅ Fix: update current index
            field.focus();
            const currentField = formFields[currentFieldIndex];
            if (formMode && currentField?.tagName === "SELECT") {
               showDropdownPopup(currentField);
            }

            showBubble(`🎯 Focused field ${index}`);
          } else {
            showBubble("❓ Field not found");
          }
        }

        function focusFieldByLabel(labelText) {
          console.log("inside");
  labelText = labelText.trim().toLowerCase();

  // 1. Match <label for="">
  const labels = document.querySelectorAll("label[for]");
  console.log(labels);
  if(labels){
      for (const label of labels) {
        if (label.innerText.trim().toLowerCase().includes(labelText)) {
          const id = label.getAttribute("for");
          const field = document.getElementById(id);
          if (field) {
            field.focus();
            showBubble(`🔍 Focused field for label "${labelText}"`);
            return true;
          }
        }
      }
    }

  // 2. Match placeholder
  const inputs = document.querySelectorAll("input, textarea, select");
  console.log(inputs);
  for (const input of inputs) {
    console.log(input.placeholder ? input.placeholder: "");
    if (input.placeholder && input.placeholder.trim().toLowerCase().includes(labelText)) {
      input.focus();
      showBubble(`🪄 Focused field with placeholder "${input.placeholder}"`);
      return true;
    }
  }

  // 3. Match nearby text content (div/span/td/strong etc.)
  const texts = document.querySelectorAll("div, span, td, strong, b, p");
  for (const el of texts) {
    const text = el.innerText.trim().toLowerCase();
    if (text.includes(labelText)) {
      const field = el.querySelector("input, textarea, select") || el.nextElementSibling?.querySelector("input, textarea, select") || el.nextElementSibling;
      if (field && (field.tagName === "INPUT" || field.tagName === "TEXTAREA" || field.tagName === "SELECT")) {
        field.focus();
        showBubble(`✨ Focused field near "${text}"`);
        return true;
      }
    }
  }

  showBubble(`❓ Field for "${labelText}" not found`);
  return false;
        }


        if (intent === "gon_to_label") {
              const label = value.toLowerCase();
              const labels = document.querySelectorAll("label[for]");
              let found = false;

              labels.forEach((lbl) => {
                if (lbl.textContent.trim().toLowerCase().includes(label)) {
                  const inputId = lbl.getAttribute("for");
                  const input = document.getElementById(inputId);
                  if (input) {
                    input.focus();
                    currentFieldIndex = Array.from(formFields).indexOf(input);
                    showBubble(`🎯 Focused on "${label}"`);
                    found = true;
                  }
                }
              });

              if (!found) showBubble(`❓ No label found for "${label}"`);
              return;
        }
      }

      

      // inline search
      if (intent === "search") {
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
      /* --- end inline search */

      if (!formMode) return;

    }

     if (formMode && formFields[currentFieldIndex]) {
      const currentField = formFields[currentFieldIndex];

      if (handlePasswordInput(transcript, currentField)) return;
      if (handleDropdownInput(transcript, currentField)) return;
      if (handleFormSubmit(transcript, currentField)) return; 
      if (handleGeneralInput(transcript, currentField)) return;

    }



    }
  };

  recognition.start();
}

function handleFormSubmit(transcript, currentFieldIndex){

  if (transcript === "submit") {
          formMode = false;
          submitActiveForm();
          return;
      }

    function submitActiveForm() {
      console.log("submitting");
      const field = formFields[finalFormIndex];
      const form = field?.form;
      console.log(form);
      // ⛔ Clear current index so no text is inserted
      //currentFieldIndex = -1;
      // ⛔ Blur the current field
      //document.activeElement?.blur();

      if (form) {
        const submitButton = form.querySelector("button[type='submit'], input[type='submit']");
        console.log("submit button");
        console.log(submitButton);
        if (submitButton) {
          submitButton.click();
          showBubble("✅ Form submitted");
          formMode = false;
          finalFormIndex = -1;
        } else {
          form.submit(); // fallback
          showBubble("✅ Form submitted via fallback");
        }
      } else {
        showBubble("⚠️ No form detected");
      }
      
    }
  }

function handlePasswordInput(transcript, field) {
  if (field.type !== "password") return false;

  if (transcript === "yes" && passwordSuggestionPending) {
    field.value = suggestedPassword;
    passwordSuggestionPending = false;
    showPasswordPreview(field, suggestedPassword);
    showBubble("✅ Password set.");
    return true;
  }

  if (transcript === "no" && passwordSuggestionPending) {
    passwordSuggestionPending = false;
    showBubble("❌ You can type your password by voice.");
    return true;
  }

  if (!passwordSuggestionPending) {
    suggestedPassword = generateStrongPassword();
    passwordSuggestionPending = true;
    showBubble(`🔐 Suggestion: ${suggestedPassword}. Say 'yes' to accept or 'no' to skip.`);
    return true;
  }

  return true; // block regular input during password suggestion
}

function handleDropdownInput(transcript, field) {
  if (field.tagName !== "SELECT") return false;

  if (transcript === "down") {
    dropdownScrollIndex = Math.min(
      dropdownScrollIndex + dropdownScrollLimit,
      field.options.length - dropdownScrollLimit
    );
    showDropdownPopup(field);
    return true;
  }

  if (transcript === "up") {
    dropdownScrollIndex = Math.max(dropdownScrollIndex - dropdownScrollLimit, 0);
    showDropdownPopup(field);
    return true;
  }

  if (transcript.match(/^option\s+\d+/i)) {
    const num = parseInt(transcript.match(/\d+/)[0]);
    const options = Array.from(field.options);
    const selectedOption = options[num - 1];
    if (selectedOption) {
      field.value = selectedOption.value;
      hideDropdownPopup();
      showBubble(`✅ Selected: ${selectedOption.text}`);
    } else {
      showBubble("❌ Invalid option number");
    }
    return true;
  }

  // Show dropdown options if no specific command matched
  showDropdownPopup(field);
  return true;
}

function handleGeneralInput(transcript, field) {
  if (field.tagName === "SELECT" || field.type === "password") return false;

  field.value = transcript;
  showBubble("✏️ Typed: " + transcript);
  return true;
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
