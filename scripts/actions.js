import { showBubble } from "./bubble.js";

export function handleCommand(intent, value) {
  if (intent === "stop_listening") {
    window.dispatchEvent(new CustomEvent("force-stop"));
    showBubble("🛑 Stopped");
    return;
  }

  if (intent === "scroll_up") return window.scrollBy(0, -400);
  if (intent === "scroll_down") return window.scrollBy(0, 400);
  if (intent === "scroll_last") return window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  if (intent === "scroll_top") return window.scrollTo({ top: 0, behavior: "smooth" });

  if (intent === "new_tab") {
    chrome.runtime.sendMessage({ action: "new tab" });
    showBubble("🆕 Opening tab");
    return;
  }

  if (intent === "close_tab") {
    chrome.runtime.sendMessage({ action: "close tab" });
    showBubble("❌ Closing tab");
    return;
  }

  if (intent === "open_site") {
    let siteMap = {
      "open youtube": "https://www.youtube.com",
      "open gmail": "https://mail.google.com",
      "open facebook": "https://facebook.com"
    };
    const url = siteMap[value];
    if (url) {
      window.open(url, "_blank");
      showBubble(`🌐 Opening ${value}`);
    }
  }
}
