function isGoogleSearchPage() {
  return (
    location.hostname.includes("google") &&
    document.querySelector("textarea[name='q']")
  );
}

function isYouTubeSearchPage() {
  return (
    location.hostname.includes("youtube") &&
    document.querySelector("input[name='search_query']")
  );
}

function performInlineSearch(query) {
  const startTime = performance.now(); // ✅ start timestamp
  let input;

  if (isGoogleSearchPage()) {
    input = document.querySelector("textarea[name='q']");
  } else if (isYouTubeSearchPage()) {
    input = document.querySelector("input[name='search_query']");
  }

  if (input) {
    input.focus();

    // Clear and set value
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.value = query;
    input.dispatchEvent(new Event("input", { bubbles: true }));

    setTimeout(() => {
      const enterEvent = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        keyCode: 13,
        key: "Enter",
      });
      input.dispatchEvent(enterEvent);

      if (input.form?.submit) {
        input.form.submit();
      }

      logTestResult("inline_Search", "Pass(query)", startTime);
      showBubble("🔍 Inline search submitted");
    }, 300);
  } else {
    const searchUrl =
      "https://www.google.com/search?q=" + encodeURIComponent(query);
    window.open(searchUrl, "_blank");
    logTestResult("Inline Search", "Pass(new tab)", startTime);
    showBubble("🌐 Fallback search");
  }
}
