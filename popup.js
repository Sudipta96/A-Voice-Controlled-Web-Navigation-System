document.getElementById("start-btn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const recognition = new (window.SpeechRecognition ||
        window.webkitSpeechRecognition)();
      recognition.lang = "en-US";
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        console.log("Heard:", transcript);
        chrome.runtime.sendMessage({ command: transcript });
      };

      recognition.onerror = (event) => {
        alert("Speech recognition error: " + event.error);
      };
    },
  });
});
