console.log("links.js");
let linkOverlays = [];
let cachedLinks = []; // keep track of links for number + title search

function findAllLinks() {
  cachedLinks = [...document.querySelectorAll("a")].filter(
    (l) => l.offsetParent !== null && l.href
  );
}

// ---------------- Highlight Links ----------------
function highlightLinks() {
  const startTime = performance.now(); // track response time
  hideLinkHighlights();
  findAllLinks();

  cachedLinks.forEach((link, i) => {
    const rect = link.getBoundingClientRect();
    const label = document.createElement("div");
    label.className = "link-overlay";
    label.textContent = i + 1;
    label.style.cssText = `
      position: absolute;
      top: ${rect.top + window.scrollY}px;
      left: ${rect.left + window.scrollX}px;
      background: #e63946;
      color: white;
      font-size: 12px;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 4px;
      z-index: 999999;
    `;
    document.body.appendChild(label);
    linkOverlays.push(label);
  });

  showBubble(`🔢 ${cachedLinks.length} links numbered (auto-hide in 20s)`);

  setTimeout(() => hideLinkHighlights(), 20000);

  // Log test result
  logTestResult("show_links", "Pass", startTime);
}

// ---------------- Hide Links ----------------
function hideLinkHighlights() {
  const startTime = performance.now();
  linkOverlays.forEach((el) => el.remove());
  linkOverlays = [];

  // Log test result
  logTestResult("hide_links", "Pass", startTime);
}

// ---------------- Click Link by Number ----------------
function clickLinkByNumber(num) {
  const startTime = performance.now();
  const index = parseInt(num) - 1;

  if (!isNaN(index) && cachedLinks[index]) {
    showBubble("🖱️ Clicking link " + num);
    cachedLinks[index].click();
    logTestResult("click_link_number", "Pass", startTime);
  } else {
    showBubble("❌ Link " + num + " not found");
    logTestResult("click_link_number", "Fail", startTime);
  }
}

// ---------------- Click Link by Title ----------------
function clickLinkByTitle(title) {
  const startTime = performance.now();
  if (!title) {
    showBubble("❌ No title provided");
    logTestResult("click_link_title", "Fail", startTime);
    return;
  }

  findAllLinks();
  const match = cachedLinks.find((l) =>
    l.innerText.toLowerCase().includes(title.toLowerCase())
  );

  if (match) {
    showBubble("🖱️ Clicking link: " + match.innerText.trim().slice(0, 20));
    match.scrollIntoView({ behavior: "smooth", block: "center" });
    match.style.background = "yellow"; // temporary highlight
    setTimeout(() => match.click(), 600);

    logTestResult("click_link_title", "Pass", startTime);
  } else {
    showBubble("❌ No link found with title: " + title);
    logTestResult("click_link_title", "Fail", startTime);
  }
}

// ---------------- Logging Test Result ----------------
// function logLinkTestResult(feature, status, startTime) {
//   const endTime = performance.now();
//   const responseTimeMs = Math.round(endTime - startTime);
//   console.log(`[TEST] ${feature} | Status: ${status} | Response Time: ${responseTimeMs}ms`);
//   // Later, you can push this into testResults storage if needed
// }
