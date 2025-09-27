console.log("links.js");
let linkOverlays = [];
let cachedLinks = []; // keep track of links for number + title search

function findAllLinks() {
  cachedLinks = [...document.querySelectorAll("a")].filter(
    (l) => l.offsetParent !== null && l.href
  );
}

function highlightLinks() {
  // Clear existing overlays
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

  setTimeout(() => {
    hideLinkHighlights();
  }, 20000); // auto-hide in 20s
}

function hideLinkHighlights() {
  linkOverlays.forEach((el) => el.remove());
  linkOverlays = [];
}

function clickLinkByNumber(num) {
  const index = parseInt(num) - 1;
  if (!isNaN(index) && cachedLinks[index]) {
    showBubble("🖱️ Clicking link " + num);
    cachedLinks[index].click();
  } else {
    showBubble("❌ Link " + num + " not found");
  }
}

function clickLinkByTitle(title) {
  console.log(title);
  if (!title) return showBubble("❌ No title provided");
  findAllLinks();
  const match = cachedLinks.find((l) =>
    l.innerText.toLowerCase().includes(title.toLowerCase())
  );

  if (match) {
    showBubble("🖱️ Clicking link: " + match.innerText.trim().slice(0, 20));
    match.scrollIntoView({ behavior: "smooth", block: "center" });
    match.style.background = "yellow"; // temporary highlight
    setTimeout(() => match.click(), 600); // click after highlight
  } else {
    showBubble("❌ No link found with title: " + title);
  }
}

// // links.js
// console.log("links.js");
// let linkOverlays = [];

// function highlightLinks() {
//   // Clear existing overlays
//   linkOverlays.forEach(el => el.remove());
//   linkOverlays = [];

//   const links = [...document.querySelectorAll("a")].filter(
//     (l) => l.offsetParent !== null && l.href
//   );

//   links.forEach((link, i) => {
//     const rect = link.getBoundingClientRect();
//     const label = document.createElement("div");
//     label.className = "link-overlay";
//     label.textContent = i + 1;
//     label.style.cssText = `
//       position: absolute;
//       top: ${rect.top + window.scrollY}px;
//       left: ${rect.left + window.scrollX}px;
//       background: red;
//       color: white;
//       font-size: 12px;
//       font-weight: bold;
//       padding: 2px 5px;
//       border-radius: 3px;
//       z-index: 999999;
//     `;
//     document.body.appendChild(label);
//     linkOverlays.push(label);
//   });

//   showBubble("🔢 Links numbered (auto-hide in 15s)");

//   setTimeout(() => {
//     hideLinkHighlights();
//   }, 15000); // 15 seconds
// }

// function hideLinkHighlights() {
//   linkOverlays.forEach((el) => el.remove());
//   linkOverlays = [];
//   showBubble("❎ Link highlights removed");
// }

// function clickLinkByNumber(num) {
//   const links = [...document.querySelectorAll("a")].filter(
//     (l) => l.offsetParent !== null && l.href
//   );
//   const index = parseInt(num) - 1;
//   if (!isNaN(index) && links[index]) {
//     showBubble("🖱️ Clicking link " + num);
//     links[index].click();
//   } else {
//     showBubble("❌ Link " + num + " not found");
//   }
// }
