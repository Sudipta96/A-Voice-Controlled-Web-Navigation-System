chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "voice-channel") {
    port.onMessage.addListener((request) => {
      const command = request.command;

      if (command.startsWith("search ")) {
        const query = command.replace("search ", "").trim();

        const sites = {
          facebook: "https://www.facebook.com",
          youtube: "https://www.youtube.com",
          twitter: "https://www.twitter.com",
        };

        if (sites[query]) {
          chrome.tabs.create({ url: sites[query] });
        } else if (query.startsWith("wikipedia ")) {
          const topic = query
            .replace("wikipedia ", "")
            .trim()
            .replace(/ /g, "_");
          chrome.tabs.create({ url: `https://en.wikipedia.org/wiki/${topic}` });
        } else if (query.startsWith("google ")) {
          const topic = query.replace("google ", "").trim().replace(/ /g, "+");
          chrome.tabs.create({
            url: `https://www.google.com/search?q=${topic}`,
          });
        } else {
          const defaultQuery = query.replace(/ /g, "+");
          chrome.tabs.create({
            url: `https://www.google.com/search?q=${defaultQuery}`,
          });
        }
      }
    });
  }
});
