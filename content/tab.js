console.log("tabs.js");

let tabMode = false;
let allTabs = [];

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


function handleTabCommand(intent, value = "") {
  switch (intent) {
    case "tab_next":
      chrome.runtime.sendMessage({ action: "next_tab" });
      break;

    case "tab_previous":
      chrome.runtime.sendMessage({ action: "prev_tab" });
      break;

    case "tab_switch":
      chrome.runtime.sendMessage({ action: "switch_tab", query: value });
      break;

    case "tab_close":
      chrome.runtime.sendMessage({ action: "close_tab" });
      break;

    case "tab_display":
      chrome.runtime.sendMessage({ action: "get_all_tabs" }, (tabs) => {
        allTabs = tabs;
        showTabPopup(allTabs); // function to display popup
        return;
      });

    case "stop_tabs":
      const popup = document.getElementById("tab-popup");
      if (popup) popup.remove();
      break;
  }
}

