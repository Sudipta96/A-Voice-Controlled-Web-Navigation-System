const BUBBLE_ID = "voice-feedback-bubble";

export function showBubble(text) {
  let bubble = document.getElementById(BUBBLE_ID);
  if (!bubble) {
    bubble = document.createElement("div");
    bubble.id = BUBBLE_ID;
    bubble.style.cssText = `
      position: fixed; bottom: 80px; right: 20px;
      background: #000; color: #fff;
      padding: 10px 20px; border-radius: 20px;
      font-size: 14px; z-index: 99999; opacity: 0.9;
    `;
    document.body.appendChild(bubble);
  }

  bubble.innerText = text;
  bubble.style.display = "block";
  clearTimeout(bubble.hideTimeout);
  bubble.hideTimeout = setTimeout(() => (bubble.style.display = "none"), 2000);
}
