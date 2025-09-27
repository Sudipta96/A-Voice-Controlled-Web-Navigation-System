// import { injectMicButton } from "./mic-ui.js";
// import { startRecognition } from "./core.js";
console.log("content.js");
function initialize() {
  console.log("initialize");
  injectLanguageSelector();
  loadCommandFile("en", () => {});
  injectMicButton();
  startRecognition();
}

initialize();
