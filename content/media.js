// media.js
console.log("media.js");
let mediaMode = false;

function handleMediaCommand(intent, value = "") {
  const video = document.querySelector("video");
  if (!video) return showBubble("❌ No video found");

  switch (intent) {
    case "media_play":
      video.play();
      showBubble("▶️ Playing");
      break;

    case "media_pause":
      video.pause();
      showBubble("⏸️ Paused");
      break;

    case "media_volume_up":
      video.volume = Math.min(1, video.volume + 0.1);
      showBubble("🔊 Volume up");
      break;

    case "media_volume_down":
      video.volume = Math.max(0, video.volume - 0.1);
      showBubble("🔉 Volume down");
      break;

    case "media_volume_set":
      const vol = parseInt(value);
      if (!isNaN(vol) && vol >= 0 && vol <= 100) {
        video.volume = vol / 100;
        showBubble("🔈 Volume " + vol + "%");
      }
      break;

    case "media_mute":
      video.muted = true;
      showBubble("🔇 Muted");
      break;

    case "media_unmute":
      video.muted = false;
      showBubble("🔊 Unmuted");
      break;

    case "media_forward":
      const fSec = parseInt(value);
      if (!isNaN(fSec)) {
        video.currentTime += fSec;
        showBubble("⏩ Forward " + fSec + " sec");
      }
      break;

    case "media_backward":
      const bSec = parseInt(value);
      if (!isNaN(bSec)) {
        video.currentTime -= bSec;
        showBubble("⏪ Back " + bSec + " sec");
      }
      break;
  }
}
