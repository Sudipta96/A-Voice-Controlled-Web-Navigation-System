// Function to show a tooltip when text is selected
function showTooltip(event, selectedText) {
  console.log("Showing tooltip for text:", selectedText);

  // Remove existing tooltip (if any)
  let existingTooltip = document.getElementById("read-aloud-tooltip");
  if (existingTooltip) {
    existingTooltip.remove();
  }

  // Create tooltip element
  let tooltip = document.createElement("div");
  tooltip.id = "read-aloud-tooltip";
  tooltip.textContent = "🔊 Read Aloud";
  tooltip.style.position = "absolute";
  tooltip.style.background = "black";
  tooltip.style.color = "white";
  tooltip.style.padding = "5px 10px";
  tooltip.style.borderRadius = "5px";
  tooltip.style.cursor = "pointer";
  tooltip.style.top = `${event.pageY + 10}px`;
  tooltip.style.left = `${event.pageX + 10}px`;
  tooltip.style.zIndex = "10000";
  tooltip.style.fontSize = "14px";
  tooltip.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
  tooltip.style.transition = "opacity 0.2s";
  tooltip.style.opacity = "1";

  // Tooltip click event (read text aloud)
  tooltip.addEventListener("click", function () {
    console.log("Tooltip clicked, speaking text:", selectedText);
    speakText(selectedText);
    tooltip.remove(); // Remove tooltip after clicking
  });

  // Add tooltip to page
  document.body.appendChild(tooltip);
}

// Function to speak text using Chrome's built-in Speech API
function speakText(text) {
  let utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US"; // Set English language
  speechSynthesis.speak(utterance);
}

// Detect text selection and show tooltip
document.addEventListener("mouseup", function (event) {
  setTimeout(() => {
    let selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
      showTooltip(event, selectedText);
    }
  }, 100); // Delay ensures selection is detected
});

// Remove tooltip when clicking outside
document.addEventListener(
  "click",
  function (event) {
    let tooltip = document.getElementById("read-aloud-tooltip");
    if (tooltip && !tooltip.contains(event.target)) {
      console.log("Hiding tooltip");
      tooltip.remove();
    }
  },
  true
);
