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
