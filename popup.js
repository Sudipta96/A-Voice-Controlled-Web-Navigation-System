let isListening = false;

document.getElementById("toggle-btn").addEventListener("click", () => {
  const selectedLang = document.getElementById("language-select").value;

  if (!isListening) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "start",
        lang: selectedLang,
      });
    });
    document.getElementById("toggle-btn").innerText = "🔇 Stop";
    isListening = true;
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "stop" });
    });
    document.getElementById("toggle-btn").innerText = "🎤 Start";
    isListening = false;
  }
});
