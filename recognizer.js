let recognition = new (window.SpeechRecognition ||
  window.webkitSpeechRecognition)();
recognition.lang = "en-US";
recognition.continuous = true;
recognition.interimResults = false;

let keepListening = true;

function startListening() {
  try {
    recognition.start();
    console.log("🎤 Voice recognition started");
  } catch (e) {
    console.warn("Recognition already started or failed:", e.message);
  }
}

recognition.onresult = (event) => {
  const transcript =
    event.results[event.results.length - 1][0].transcript.toLowerCase();
  document.getElementById("log").innerText = "Heard: " + transcript;

  // Process command directly here — no messaging
  handleCommand(transcript);
};

recognition.onerror = (e) => {
  console.error("Speech recognition error:", e.error);
  document.getElementById("log").innerText = "Error: " + e.error;
  recognition.stop();
};

recognition.onend = () => {
  console.log("🎤 Voice recognition ended");
  if (keepListening) {
    startListening();
  }
};

startListening();

function handleCommand(command) {
  if (!command.startsWith("search ")) return;

  const query = command.replace("search ", "").trim();
  const sites = {
    facebook: "https://www.facebook.com",
    youtube: "https://www.youtube.com",
    twitter: "https://www.twitter.com",
  };

  if (sites[query]) {
    chrome.tabs.create({ url: sites[query] });
  } else if (query.startsWith("wikipedia ")) {
    const topic = query.replace("wikipedia ", "").trim().replace(/ /g, "_");
    chrome.tabs.create({ url: `https://en.wikipedia.org/wiki/${topic}` });
  } else if (query.startsWith("google ")) {
    const topic = query.replace("google ", "").trim().replace(/ /g, "+");
    chrome.tabs.create({ url: `https://www.google.com/search?q=${topic}` });
  } else {
    const defaultQuery = query.replace(/ /g, "+");
    chrome.tabs.create({
      url: `https://www.google.com/search?q=${defaultQuery}`,
    });
  }
}
