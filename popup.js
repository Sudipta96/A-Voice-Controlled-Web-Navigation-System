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

// document.getElementById("exportButton").addEventListener("click", () => {
//   // Send a message to the background script (Service Worker)
//   chrome.runtime.sendMessage({ action: "start_export_test_results" });

//   // Optional: Give feedback or close the popup
//   document.getElementById("exportButton").textContent = "Exporting...";
//   setTimeout(() => { window.close(); }, 500);
// });

// Send a message to the background service worker
