

export function injectMicButton() {
  console.log("mic.js");
  if (document.getElementById("floating-mic")) return;

  const btn = document.createElement("button");
  btn.id = "floating-mic";
  btn.textContent = "🎤";
  btn.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    z-index: 99999; font-size: 20px; padding: 12px;
    border: none; border-radius: 50%;
    background: #007bff; color: white; cursor: pointer;
  `;

  btn.onclick = () => {
    const event = new CustomEvent("toggle-mic");
    window.dispatchEvent(event);
  };

  document.body.appendChild(btn);
}
