// Function to show tooltip with Read Aloud and Translate options
function showTooltip(event, selectedText) {
  console.log("Showing tooltip for text:", selectedText);

  // Remove existing tooltip
  let existingTooltip = document.getElementById("read-aloud-tooltip");
  if (existingTooltip) {
    existingTooltip.remove();
  }

  // Create tooltip container
  let tooltip = document.createElement("div");
  tooltip.id = "read-aloud-tooltip";
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
  tooltip.style.display = "flex";
  tooltip.style.gap = "10px";

  // Read Aloud button
  let readAloudBtn = document.createElement("span");
  readAloudBtn.textContent = "🔊 Read Aloud";
  readAloudBtn.style.cursor = "pointer";
  readAloudBtn.onclick = () => {
    speakText(selectedText);
    tooltip.remove();
  };

  // Translate button
  let translateBtn = document.createElement("span");
  translateBtn.textContent = "🔄 Translate";
  translateBtn.style.cursor = "pointer";
  translateBtn.onclick = () => {
    translateText(selectedText);
    tooltip.remove();
  };

  // Append buttons
  tooltip.appendChild(readAloudBtn);
  tooltip.appendChild(translateBtn);
  document.body.appendChild(tooltip);
}

// Function to read text aloud
function speakText(text) {
  let utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  speechSynthesis.speak(utterance);
}

// Function to translate text using API
function translateText(text) {
  let apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=bn&dt=t&q=${encodeURIComponent(
    text
  )}`;

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      let translatedText = data[0].map((item) => item[0]).join("");
      console.log("Translated Text:", translatedText);
      showSidebar(translatedText);
    })
    .catch((error) => console.error("Translation Error:", error));
}

// Function to show translation in right sidebar
function showSidebar(translatedText) {
  let sidebar = document.getElementById("translation-sidebar");

  if (!sidebar) {
    sidebar = document.createElement("div");
    sidebar.id = "translation-sidebar";
    sidebar.style.position = "fixed";
    sidebar.style.top = "0";
    sidebar.style.right = "0";
    sidebar.style.width = "250px";
    sidebar.style.height = "100%";
    sidebar.style.background = "#f9f9f9";
    sidebar.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.2)";
    sidebar.style.padding = "10px";
    sidebar.style.overflowY = "auto";
    sidebar.style.fontSize = "16px";
    sidebar.style.borderLeft = "2px solid #ccc";
    sidebar.style.zIndex = "10000";
    document.body.appendChild(sidebar);
  }

  sidebar.innerHTML = `<h3>Translated Text</h3><p>${translatedText}</p>`;
}

// Function to show translation in right sidebar with close button
function showSidebar(translatedText) {
  let sidebar = document.getElementById("translation-sidebar");

  if (!sidebar) {
    sidebar = document.createElement("div");
    sidebar.id = "translation-sidebar";
    sidebar.style.position = "fixed";
    sidebar.style.top = "0";
    sidebar.style.right = "0";
    sidebar.style.width = "250px";
    sidebar.style.height = "100%";
    sidebar.style.background = "#f9f9f9";
    sidebar.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.2)";
    sidebar.style.padding = "10px";
    sidebar.style.overflowY = "auto";
    sidebar.style.fontSize = "16px";
    sidebar.style.borderLeft = "2px solid #ccc";
    sidebar.style.zIndex = "10000";

    // Create close button
    let closeButton = document.createElement("span");
    closeButton.innerHTML = "✖";
    closeButton.style.position = "absolute";
    closeButton.style.top = "10px";
    closeButton.style.right = "10px";
    closeButton.style.cursor = "pointer";
    closeButton.style.fontSize = "18px";
    closeButton.style.color = "#333";
    closeButton.title = "Close";

    // Close sidebar on click
    closeButton.addEventListener("click", function () {
      sidebar.remove();
    });

    // Append close button and text
    sidebar.innerHTML = "<h3>Translated Text</h3>";
    sidebar.appendChild(closeButton);
    let textPara = document.createElement("p");
    textPara.textContent = translatedText;
    sidebar.appendChild(textPara);

    document.body.appendChild(sidebar);
  } else {
    sidebar.querySelector("p").textContent = translatedText;
  }
}

// Detect text selection and show tooltip
document.addEventListener("mouseup", function (event) {
  setTimeout(() => {
    let selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
      showTooltip(event, selectedText);
    }
  }, 100);
});

// Remove tooltip when clicking outside
document.addEventListener(
  "click",
  function (event) {
    let tooltip = document.getElementById("read-aloud-tooltip");
    if (tooltip && !tooltip.contains(event.target)) {
      tooltip.remove();
    }
  },
  true
);
