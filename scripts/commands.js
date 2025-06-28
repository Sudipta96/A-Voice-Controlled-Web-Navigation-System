let commandData = null;

export function setCommandData(data) {
  commandData = data;
}

export function matchCommand(transcript) {
  transcript = transcript.trim().toLowerCase();
  for (const intent in commandData) {
    const patterns = commandData[intent];
    for (const pattern of patterns) {
      if (pattern.includes("*")) {
        const prefix = pattern.split("*")[0].trim();
        if (transcript.startsWith(prefix)) {
          const value = transcript.slice(prefix.length).trim();
          return { intent, value };
        }
      } else {
        if (transcript === pattern.toLowerCase()) {
          return { intent, value: transcript };
        }
      }
    }
  }
  return null;
}
