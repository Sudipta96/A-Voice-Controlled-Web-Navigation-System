console.log("tabs.js");

let tabMode = false;
let allTabs = [];

const knownSites = {
  youtube: "https://www.youtube.com",
  gmail: "https://mail.google.com",
  facebook: "https://www.facebook.com",
  // add more if needed
};

// Popup to display open tabs
function showTabPopup(tabs) {
  let popup = document.getElementById("voice-tab-popup");
  if (!popup) {
    popup = document.createElement("div");
    popup.id = "voice-tab-popup";
    popup.style.cssText = `
      position: fixed; top: 50%; left: 50%; width: 300px; max-height: 400px;
      overflow-y: auto; background: white; border: 2px solid #444;
      padding: 10px; z-index: 999999; font-size: 14px; font-family: sans-serif;
    `;
    document.body.appendChild(popup);
  }

  popup.innerHTML =
    "<b>🔖 Open Tabs:</b><br>" +
    tabs.map((t, i) => `${i + 1}. ${t.title}`).join("<br>");

  popup.style.display = "block";

  // Auto-dismiss after 20 seconds
  setTimeout(() => {
    if (popup) popup.style.display = "none";
  }, 20000);
}

// Core tab handler
function handleTabCommand(transcript, intent, value = "", callback) {
  const startTime = performance.now(); // start timestamp

  switch (intent) {
    case "open_site":
      const siteKey = Object.keys(knownSites).find((site) =>
        transcript.toLowerCase().includes(site)
      );
      const url = siteKey ? knownSites[siteKey] : "https://www.google.com";

      chrome.runtime.sendMessage({ action: "openNewTab", url }, () => {
        logTestResult(intent, "Pass", startTime);
      });

      showBubble("🆕 Opening new tab: " + url);
      break;

    case "tab_next":
      chrome.runtime.sendMessage({ action: "next_tab" }, () => {
        logTestResult(intent, "Pass", startTime);
        if (callback) callback();
      });
      break;

    case "tab_previous":
      chrome.runtime.sendMessage({ action: "prev_tab" }, () => {
        logTestResult(intent, "Pass", startTime);
        if (callback) callback();
      });
      break;

    case "tab_switch":
      chrome.runtime.sendMessage({ action: "switch_tab", query: value }, () => {
        logTestResult(intent, "Pass", startTime);
        if (callback) callback();
      });
      break;

    case "tab_close":
      chrome.runtime.sendMessage({ action: "close_tab" }, () => {
        logTestResult(intent, "Pass", startTime);
        if (callback) callback();
      });
      break;

    case "tab_display":
      chrome.runtime.sendMessage({ action: "get_all_tabs" }, (tabs) => {
        allTabs = tabs;
        showTabPopup(allTabs);
        logTestResult(intent, startTime);
        if (callback) callback();
      });
      break;

    case "stop_tabs":
      const popup = document.getElementById("voice-tab-popup");
      if (popup) popup.remove();
      break;
  }
}

// Test logger for tab management
// function logTestResult(intent, status = "Pass", startTime) {
//   const endTime = performance.now();
//   const responseTimeMs = Math.round(endTime - startTime);

//   console.log(
//     `[TEST] ${intent} | Status: ${status} | Response Time: ${responseTimeMs}ms`
//   );

//   // Optional: store in chrome.storage for persistent logging
//   chrome.storage.local.get({ testResults: [] }, (data) => {
//     const results = data.testResults;
//     results.push({ intent, status, responseTimeMs });
//     chrome.storage.local.set({ testResults: results });
//   });
// }

// Optional helper for inline testing
function testTabCommand(intent, value = "") {
  handleTabCommand(transcript, intent, value);
}
