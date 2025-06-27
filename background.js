let isListening = false;

chrome.action.onClicked.addListener(async (tab) => {
  isListening = !isListening;

  // Change icon
  chrome.action.setIcon({
    tabId: tab.id,
    path: isListening ? "icons/mic-on16.png" : "icons/mic-off16.png",
  });

  // Send command to content script
  chrome.tabs.sendMessage(tab.id, {
    action: isListening ? "start" : "stop",
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "new tab") {
    chrome.tabs.create({ url: "https://www.google.com/" });
  } else if (message.action === "close tab") {
    // Always close the currently active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.remove(tabs[0].id);
      }
    });
  }
});
