document.getElementById("start-btn").addEventListener("click", () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("recognizer.html")
  });
});
