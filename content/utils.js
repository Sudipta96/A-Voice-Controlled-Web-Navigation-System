console.log("utlis.js");
const wordMap = {
  one: 1,
  two: 2,
  to: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  এক: 1,
  দুই: 2,
  তিন: 3,
  চার: 4,
  পাঁচ: 5,
  ছয়: 6,
  সাত: 7,
  আট: 8,
  নয়: 9,
  দশ: 10,
};

const LANGUAGES = {
  en: { label: "English", code: "en-US" },
  bn: { label: "বাংলা", code: "bn-BD" },
};

//  let selectedLang = "en";
//  let selectedLanguageCode = "en-US";

window.selectedLang = "en";
window.selectedLanguageCode = "en-US";

function setLanguage(langCode) {
  window.selectedLanguageCode = langCode;
  if (langCode.startsWith("bn")) {
    window.selectedLang = "bn";
  } else {
    window.selectedLang = "en";
  }
  console.log("🔁 Language set to:", window.selectedLanguageCode);
}

function showBubble(text) {
  let bubble = document.getElementById("speech-bubble");
  if (!bubble) {
    bubble = document.createElement("div");
    bubble.id = "speech-bubble";
    bubble.style = `
      position: fixed;
      bottom: 90px;
      right: 20px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 6px 12px;
      border-radius: 15px;
      font-size: 28px;
      max-width: 250px;
      z-index: 999999;
      pointer-events: none;
      user-select: none;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(bubble);
  }
  bubble.textContent = text;
  bubble.style.opacity = 1;
  setTimeout(() => {
    bubble.style.opacity = 0;
  }, 3000);
}
