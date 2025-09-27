
let commandData = null;

/*** 
 loadCommandFile() loads the commands from selected lang.json(bn.json, en.json)
 ***/
function loadCommandFile(lang, callback) {
  console.log(`load commands: ${lang}`);
  fetch(chrome.runtime.getURL(`commands/${lang}.json`))
    .then((res) => res.json())
    .then((data) => {
      commandData = data;
      selectedLang = lang;
      console.log(`lang: ${LANGUAGES}`);
      selectedLanguageCode = LANGUAGES[lang].code;
      console.log(`✅ Loaded ${lang}.json`);
      callback();
    })
    .catch((err) => {
      console.error("❌ Failed to load commands:", err);
      showBubble(`Failed to load ${lang}.json`);
    });
  

}

/*** 
 matchCommand() matches the accurate command by matching pattern with transcript.
 ***/
function matchCommand(transcript) {
  transcript = transcript.trim().toLowerCase();

  // 🔹 1. Exact match first
  for (const intent in commandData) {
    const patterns = commandData[intent];
    if (!Array.isArray(patterns)) continue;

    for (const pattern of patterns) {
      if (!pattern.includes("*")) {
        if (transcript === pattern.toLowerCase()) {
          return { intent, value: transcript };
        }
      }
    }
  }

  // 🔹 2. Wildcard match second (less priority)
  for (const intent in commandData) {
    const patterns = commandData[intent];
    if (!Array.isArray(patterns)) continue;

    for (const pattern of patterns) {
      if (pattern.includes("*")) {
        const prefix = pattern.split("*")[0].trim();
        if (transcript.startsWith(prefix)) {
          const value = transcript.slice(prefix.length).trim();
          return { intent, value };
        }
      }
    }
  }
  
  return null;
}
