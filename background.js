let lastTabId = null;
let lastActiveTabId = null;
let currentActiveTabId = null;

chrome.tabs.onActivated.addListener((activeInfo) => {
  if (currentActiveTabId !== null && activeInfo.tabId !== currentActiveTabId) {
    lastActiveTabId = currentActiveTabId;
  }
  currentActiveTabId = activeInfo.tabId;
});



chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("background js");
  console.log(sender.tab.id);

  if (msg.action === "start_export_test_results") {
    chrome.storage.local.get({ testResults: [] }, (data) => {
      // Convert object to a string.
      var result = JSON.stringify(data);

      // Save as file
      var url = "data:application/json;base64," + btoa(result);
      chrome.downloads.download({
        url: url,
        filename: "filename_of_exported_file.json",
      });
    });
  }

  if (msg.action === "logTestResult") {
    chrome.storage.local.get({ testResults: [] }, (data) => {
      const results = data.testResults;
      results.push(message.result);
      chrome.storage.local.set({ testResults: results }, () => {
        console.log("✅ Test logged:", message.result);
      });
    });
  }

  if (msg.action === "downloadTestResults") {
    const blob = new Blob([msg.data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
      url: url,
      filename: "test_results.txt",
      saveAs: true,
    });

    sendResponse({ success: true });
  }

  if (msg.action === "openNewTab" && msg.url) {
    chrome.tabs.create({ url: msg.url });
  }

  if (msg.action === "switch_tab") {
    const query = msg.query;
    chrome.tabs.query({ currentWindow: true }, function (tabs) {
      for (let i = 0; i < tabs.length; i++) {
        // Check if the tab title contains the query
        console.log(tabs[i].title.toLowerCase());
        console.log(query);
        if (tabs[i].title.toLowerCase().includes(query.toLowerCase())) {
          // Switch to the found tab
          chrome.tabs.update(tabs[i].id, { active: true });
          break; // Stop after the first match
        }
      }
    });
  }

  if (msg.action === "close_tab") {
    // Find the currently active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        // Remove the tab by its ID
        chrome.tabs.remove(tabs[0].id);
      }
    });
  }

  // Send all open tabs back to content script
  if (msg.action === "get_all_tabs") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      sendResponse(tabs);
    });
    return true; // keep message channel open
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

  if (msg.action === "go_back_tab" && lastActiveTabId !== null) {
    chrome.tabs.get(lastActiveTabId, (tab) => {
      if (chrome.runtime.lastError || !tab) return; // tab might be closed
      chrome.tabs.update(tab.id, { active: true });
    });
  }

  if (msg.action === "go_back_tab" && lastTabId) {
    chrome.tabs.get(lastTabId, (tab) => {
      if (chrome.runtime.lastError) return; // tab closed
      chrome.tabs.update(tab.id, { active: true });
    });
  }
});

function splitTextIntoChunks(text, lang, maxLength = 200) {
  // let sentences;
  const sentences = text.match(/[^।!?\.]+[।!?\.]+|[^।!?\.]+$/g) || [text];
  // if (lang = "en"){
  //  sentences = text.match(/[^\.!\?]+[\.!\?]+|[^\.!\?]+$/g) || [text];
  // }
  // if(lang="bn"){
  //  sentences = text.match(/[^\|!\?]+[\|!\?]+|[^\|!\?]+$/g) || [text];
  // }
  let chunks = [];
  let chunk = "";

  for (const sentence of sentences) {
    if ((chunk + sentence).length <= maxLength) {
      chunk += sentence;
    } else {
      if (chunk) chunks.push(chunk.trim());
      chunk = sentence;
    }
  }
  if (chunk) chunks.push(chunk.trim());
  return chunks;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "readAloud",
    title: "🔊 Read Aloud (Bangla & English)",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "readAloud") {
    const text = info.selectionText.trim();
    const lang = /[\u0980-\u09FF]/.test(text) ? "bn" : "en";
    const chunks = splitTextIntoChunks(text, lang);

    let base64Audios = [];

    for (const chunk of chunks) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        chunk
      )}&tl=${lang}&client=tw-ob`;
      try {
        const response = await fetch(url, {
          headers: {
            Referer: "https://translate.google.com/",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/116.0.0.0 Safari/537.36",
          },
        });

        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (s, b) => s + String.fromCharCode(b),
            ""
          )
        );
        base64Audios.push(base64Audio);
      } catch (error) {
        console.error("TTS fetch failed for chunk:", chunk, error);
      }
    }

    // Send all chunks for sequential playback
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: playAudioChunks,
      args: [base64Audios],
    });
  }
});

// Injected into page to play audio chunks one by one
function playAudioChunks(base64Audios) {
  const playNext = (index) => {
    if (index >= base64Audios.length) return;

    const audio =
      document.getElementById("context-tts-audio") ||
      (() => {
        const a = document.createElement("audio");
        a.id = "context-tts-audio";
        document.body.appendChild(a);
        return a;
      })();

    const blob = new Blob(
      [Uint8Array.from(atob(base64Audios[index]), (c) => c.charCodeAt(0))],
      { type: "audio/mpeg" }
    );
    audio.src = URL.createObjectURL(blob);
    audio.onended = () => playNext(index + 1);
    audio.onerror = () => console.error("Error playing chunk:", index);
    audio.play().catch((err) => console.error("Playback error:", err));
  };

  playNext(0);
}

