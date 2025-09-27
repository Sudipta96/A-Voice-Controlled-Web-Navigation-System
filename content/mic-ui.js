// import { startRecognition, stopRecognition } from "./core.js";
// import { selectedLang, setLanguage, selectedLanguageCode } from "./utils.js";
console.log("mic-ui.js");
function injectMicButton() {
  console.log("inject mic");
  if (document.getElementById("floating-mic")) return;

  // Mic button
  const micBtn = document.createElement("button");
  micBtn.id = "floating-mic";
  micBtn.style = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #007bff;
    color: white;
    border: none;
    cursor: pointer;
    font-size: 28px;
    z-index: 99999;
  `;
  micBtn.title = "Start/Stop Voice Recognition";
  micBtn.innerHTML = "🎤";

  micBtn.addEventListener("click", () => {
    if (micBtn.style.background === "rgb(40, 167, 69)") {
      stopRecognition();
    } else {
      startRecognition();
    }
  });

  document.body.appendChild(micBtn);

  injectLanguageSelector();
}

function injectLanguageSelector() {
  if (document.getElementById("language-select")) return;

  const select = document.createElement("select");
  select.id = "lang-select";
  select.style = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    z-index: 99999;
    padding: 5px;
    font-size: 14px;
  `;

  const languages = [
    { code: "en-US", label: "English", key: "en" },
    { code: "bn-BD", label: "বাংলা", key: "bn" },
  ];

  languages.forEach(({ code, label }) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = label;
    select.appendChild(option);
  });

  select.value = selectedLanguageCode;

  console.log("inject language");
  console.log(select.value);

  // event listener while changing language
  select.addEventListener("change", (e) => {
    setLanguage(e.target.value); // sets selectedLang & selectedLanguageCode

    loadCommandFile(selectedLang, () => {
      showBubble(
        `🌐 Language changed to ${selectedLang === "bn" ? "বাংলা" : "English"}`
      );
    });

    if (window.isListening) {
      stopRecognition();
      setTimeout(() => {
        startRecognition();
      }, 500);
    }
  });

  document.body.appendChild(select);
}

// function injectLanguageSelector() {
//   if (document.getElementById("lang-select")) return;

//   const select = document.createElement("select");
//   select.id = "lang-select";
//   select.style = `
//     position: fixed;
//     bottom: 80px;
//     right: 20px;
//     z-index: 99999;
//     padding: 5px;
//     font-size: 14px;
//   `;

//   const languages = [
//     { code: "en-US", label: "English" },
//     { code: "bn-BD", label: "Bangla" },
//   ];

//   languages.forEach(({ code, label }) => {
//     const option = document.createElement("option");
//     option.value = code;
//     option.textContent = label;
//     select.appendChild(option);
//   });

//   select.value = selectedLanguageCode;

//   select.addEventListener("change", (e) => {
//     setLanguage(e.target.value);
//     // location.reload(); // Reload to apply new lang (or re-init)

//   });

//   document.body.appendChild(select);
// }
