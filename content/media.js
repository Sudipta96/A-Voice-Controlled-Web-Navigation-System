function handleMediaCommand(intent, value = "") {
  const video = document.querySelector("video");
  if (!video) return showBubble("❌ No video found");

  const startTime = performance.now(); // Track start time
  let actionStatus = "Fail";
  // let endTime;

  switch (intent) {
    case "media_play":
      video.play();
      showBubble("▶️ Playing");
      actionStatus = "Pass";
      // endTime = performance.now(); // Track end time
      logTestResult(intent, actionStatus, startTime);
      break;

    case "media_pause":
      video.pause();
      actionStatus = "Pass";
      // endTime = performance.now(); // Track end time
      logTestResult(intent, actionStatus, startTime);
      showBubble("⏸️ Paused");
      break;

    case "media_volume_up":
      video.volume = Math.min(1, video.volume + 0.1);
      actionStatus = "Pass";
      // endTime = performance.now(); // Track end time
      logTestResult(intent, actionStatus, startTime);
      showBubble("🔊 Volume up");
      break;

    case "media_volume_down":
      video.volume = Math.max(0, video.volume - 0.1);
      actionStatus = "Pass";
      // endTime = performance.now(); // Track end time
      logTestResult(intent, actionStatus, startTime);
      showBubble("🔉 Volume down");
      break;

    case "media_mute":
      video.muted = true;
      actionStatus = "Pass";
      // endTime = performance.now(); // Track end time
      logTestResult(intent, actionStatus, startTime);
      showBubble("🔇 Muted");
      break;

    case "media_unmute":
      video.muted = false;
      actionStatus = "Pass";
      // endTime = performance.now(); // Track end time
      logTestResult(intent, actionStatus, startTime);
      showBubble("🔊 Unmuted");
      break;

    case "media_forward":
      const fSec = parseInt(value);
      if (!isNaN(fSec)) {
        video.currentTime += fSec;
        actionStatus = "Pass";
        // endTime = performance.now(); // Track end time
        logTestResult(intent, actionStatus, startTime);
        showBubble("⏩ Forward " + fSec + " sec");
      }
      break;

    case "media_backward":
      const bSec = parseInt(value);
      if (!isNaN(bSec)) {
        video.currentTime -= bSec;
        actionStatus = "Pass";
        // endTime = performance.now(); // Track end time
        logTestResult(intent, actionStatus, startTime);
        showBubble("⏪ Back " + bSec + " sec");
      }
      break;
  }

  // const endTime = performance.now();
  // const responseTime = Math.round(endTime - startTime); // milliseconds
  // console.log(
  //   `[TEST] ${intent} | Status: ${actionStatus} | Response Time: ${responseTime}ms`
  // );
}

// Send result to background
function logTestResult(feature, status, startTime, endTime) {
  console.log("log");
  const responseTime = ((endTime - startTime) / 1000).toFixed(2);

  const result = {
    feature,
    status,
    responseTime,
    timestamp: new Date().toLocaleString(),
  };

  chrome.runtime.sendMessage({ action: "logTestResult", result });
}
