export let selectedLang = "en";
export let selectedLanguageCode = "en-US";
const LANG_SELECT_ID = "language-select";

const LANGUAGES = {
  en: { label: "English", code: "en-US" },
  bn: { label: "বাংলা", code: "bn-BD" }
};

export function injectLanguageSelector() {
  if (document.getElementById(LANG_SELECT_ID)) return;

  const sel = document.createElement("select");
  sel.id = LANG_SELECT_ID;
  sel.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    z-index: 99999; padding: 5px 10px; font-size: 14px;
  `;

  for (const [key, info] of Object.entries(LANGUAGES)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.text = info.label;
    sel.appendChild(opt);
  }

  sel.value = selectedLang;

  sel.onchange = () => {
    selectedLang = sel.value;
    selectedLanguageCode = LANGUAGES[selectedLang].code;
    const event = new CustomEvent("lang-changed", { detail: selectedLang });
    window.dispatchEvent(event);
  };

  document.body.appendChild(sel);
}

export function loadCommandFile(lang, callback) {
  fetch(chrome.runtime.getURL(`commands/${lang}.json`))
    .then(res => res.json())
    .then(data => {
      const event = new CustomEvent("commands-loaded", {
        detail: { lang, commands: data }
      });
      window.dispatchEvent(event);
      callback();
    })
    .catch((err) => {
      console.error("🛑 Command file load error:", err);
    });
}
