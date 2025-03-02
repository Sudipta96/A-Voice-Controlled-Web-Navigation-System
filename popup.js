document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("readText").addEventListener("click", function () {
        // Send a message to content.js to get text
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "getText" }, function (response) {
                if (response && response.text) {
                    document.getElementById("output").innerText = response.text;
                } else {
                    document.getElementById("output").innerText = "Failed to extract text.";
                }
            });
        });
    });
});
