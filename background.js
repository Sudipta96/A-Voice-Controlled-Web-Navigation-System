let lastTabId = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("background js");
  console.log(sender.tab.id);
  if (msg.action === "new tab") {
    chrome.tabs.create({ url: "https://www.google.com" });
  }

  if (msg.action === "close tab") {
    // Always close the currently active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.remove(tabs[0].id);
      }
    });

  }

  // if (msg.action === "close tab" && sender.tab?.id) {
  //   console.log("background js");
  //   console.log(sender.tab.id);
  //   chrome.tabs.remove(sender.tab.id);
  // }

  if (msg.action === "switch_tab" && typeof msg.index === "number") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const idx = msg.index - 1;
      if (idx >= 0 && idx < tabs.length) {
        lastTabId = sender.tab.id;
        chrome.tabs.update(tabs[idx].id, { active: true });
      }
    });
  }

  if (msg.action === "next_tab" || msg.action === "prev_tab") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const currentTab = tabs.find((tab) => tab.active);
      const idx = tabs.findIndex((t) => t.id === currentTab.id);
      let newIndex = msg.action === "next_tab" ? idx + 1 : idx - 1;

      if (newIndex < 0) newIndex = tabs.length - 1;
      if (newIndex >= tabs.length) newIndex = 0;

      lastTabId = currentTab.id;
      chrome.tabs.update(tabs[newIndex].id, { active: true });
    });
  }

  if (msg.action === "go_back_tab" && lastTabId) {
    chrome.tabs.get(lastTabId, (tab) => {
      if (chrome.runtime.lastError) return; // tab closed
      chrome.tabs.update(tab.id, { active: true });
    });
  }
});
