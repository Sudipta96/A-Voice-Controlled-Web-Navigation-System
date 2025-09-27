// form.js
console.log("form.js");

let formMode = false;
let formFields = [];
let currentFieldIndex = 0;
let finalFormIndex = -1;
let active;

// dropdown handling
// let dropdownPopup = null;
// let dropdownScrollIndex = 0;
// let dropdownScrollLimit = 10;

// password suggestion
let suggestedPassword = "";
let passwordSuggestionPending = false;

/**
 * Main command handler for all form intents
 */
function handleFormCommand(intent, value, transcript) {
  if (!formMode && intent !== "form_start") return;

  switch (intent) {
    case "form_start":
      formFields = Array.from(
        document.querySelectorAll("input, textarea, select")
      ).filter((el) => el.offsetParent !== null && !el.disabled);

      if (formFields.length === 0) {
        return showBubble("⚠️ No form fields found");
      }

      formMode = true;
      currentFieldIndex = 0;
      formFields[currentFieldIndex].focus();
      showBubble("📝 Form mode enabled");
      addFieldBadges();
      showBubble("🔢 Index mode started");
      break;

    case "form_stop":
    case "form_stop_index":
      formMode = false;
      clearFieldBadges();
      showBubble("✅ Form mode stopped");
      break;

    case "form_remove_focus":
      finalFormIndex = currentFieldIndex;
      currentFieldIndex = -1;
      document.activeElement?.blur();
      showBubble("👀 Focus removed");
      break;

    case "form_next":
      if (formFields[currentFieldIndex + 1]) {
        currentFieldIndex++;
        formFields[currentFieldIndex].focus();
        showBubble("➡️ Moved to next field");
      } else {
        showBubble("⚠️ No next field");
      }
      break;

    case "form_back":
      if (currentFieldIndex > 0) {
        currentFieldIndex--;
        formFields[currentFieldIndex].focus();
        showBubble("⬅️ Moved to previous field");
      } else {
        showBubble("⚠️ Already at first field");
      }
      break;

    case "form_clear_field":
      const field = formFields[currentFieldIndex];
      if (field) {
        field.value = "";
        field.focus();
        field.dispatchEvent(new Event("input", { bubbles: true }));
        showBubble("🧹 Cleared field");
      }
      break;

    case "form_go_to_field":
      focusFieldByLabel(value);
      break;

    case "form_start_index":
      addFieldBadges();
      showBubble("🔢 Index mode started");
      break;

    case "form_focus_index":
      focusFormFieldByNumber(value);
      break;

    case "form_select":
      active = formFields[currentFieldIndex];
      if (active && active.tagName === "SELECT") {
        // redirect to dropdown handler
        handleDropdownInput(transcript, active);
      } else {
        // normal radio handling

        const optMatch = transcript.match(/^\s*option\s+(\d+)\s*$/i);
        if (optMatch) {
          const index = parseInt(optMatch[1], 10);
          selectRadioByIndex(index);
        } else if (value && !isNaN(value)) {
          // If parser already gave us a numeric value
          selectRadioByIndex(parseInt(value, 10));
        } else {
          // fallback: label-based matching
          selectRadioByLabelOrIndex(value);
        }
      }
      break;

    case "form_show_options":
      active = formFields[currentFieldIndex];
      if (active && active.tagName === "SELECT") {
        // redirect to dropdown handler
        handleDropdownInput(transcript, active);
      } else {
        // normal radio handling
        selectRadioByLabelOrIndex(value);
      }
      break;

    // } else {

    //   showBubble("⚠️ Current field is not a radio group");
    // }

    case "form_submit":
      handleFormSubmit();
      break;

    default:
      // Free text while in form mode (input dictation)
      if (formMode && !intent.startsWith("form_")) {
        console.log("handle input");
        handleFormInput(transcript);
      }
      break;
  }
}

/**
 * Dictation input handler (normal text, dropdown, password)
 */
function handleFormInput(transcript) {
  console.log("handleforminput");
  if (!formMode || !formFields[currentFieldIndex]) return;

  const field = formFields[currentFieldIndex];
  if (handlePasswordInput(transcript, field)) return;
  if (handleDropdownInput(transcript, field)) return;
  if (handleGeneralInput(transcript, field)) return;
  if (selectRadioByLabelOrIndex(transcript)) return;
}

/**
 * Submit current form
 */
function handleFormSubmit() {
  console.log("here");
  const field =
    formFields[finalFormIndex >= 0 ? finalFormIndex : currentFieldIndex];
  const form = field?.form;

  formMode = false;
  clearFieldBadges();

  if (form) {
    const btn = form.querySelector(
      "button[type='submit'], input[type='submit']"
    );
    if (btn) {
      btn.click();
      showBubble("✅ Form submitted");
    } else {
      form.submit();
      showBubble("✅ Form submitted via fallback");
    }
  } else {
    showBubble("⚠️ No form detected");
  }
}

// utility function to generate a strong random password
function generateStrongPassword(length = 12) {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()-_=+[]{};:,.<>?";
  const allChars = upper + lower + numbers + symbols;

  let password = "";
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

// handle password input via voice with popup
let passwordPopup = null;

// show popup when password field is focused
function promptPasswordSuggestion(field) {
  if (passwordPopup) passwordPopup.remove(); // remove old popup

  suggestedPassword = generateStrongPassword();
  passwordSuggestionPending = true;

  passwordPopup = document.createElement("div");
  passwordPopup.id = "password-popup";
  passwordPopup.style.cssText = `
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    border: 2px solid #007bff;
    border-radius: 8px;
    padding: 20px;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    text-align: center;
    font-family: sans-serif;
  `;
  passwordPopup.innerHTML = `
    <p>🔐 Suggested Password:</p>
    <p style="font-weight:bold; margin: 10px 0;">${suggestedPassword}</p>
    <p>Say "yes" to accept or "no" to skip.</p>
  `;

  document.body.appendChild(passwordPopup);
}

function handlePasswordInput(transcript, field) {
  if (field.type !== "password") return false;
  if (!passwordSuggestionPending) {
    promptPasswordSuggestion(field);
    return true;
  }

  transcript = transcript.trim().toLowerCase();

  if (transcript === "yes") {
    field.value = suggestedPassword;
    copyToClipboard(suggestedPassword);
    showBubble(`✅ Password set and copied: ${suggestedPassword}`);
    passwordSuggestionPending = false;
    if (passwordPopup) passwordPopup.remove();
    return true;
  }

  if (transcript === "no") {
    showBubble("❌ Password skipped");
    passwordSuggestionPending = false;
    if (passwordPopup) passwordPopup.remove();
    return true;
  }

  return true; // do nothing for other words
}

// helper to copy to clipboard
function copyToClipboard(text) {
  const tempInput = document.createElement("input");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  tempInput.remove();
}

// attach focus event to all password fields dynamically
document.querySelectorAll("input[type='password']").forEach((field) => {
  field.addEventListener("focus", () => promptPasswordSuggestion(field));
});

/**
 * Password field handler
 */

/**
 * Dropdown (select field) handler
 */

/**
 * General text input handler
 */
function handleGeneralInput(transcript, field) {
  if (field.tagName === "SELECT" || field.type === "password") return false;

  // Clear field before input
  field.value = "";
  field.placeholder = ""; // optional: remove placeholder if needed
  field.removeAttribute("aria-label");
  field.focus();

  field.value = transcript;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  showBubble("✏️ Typed: " + transcript);
  return true;
}

/**
 * Radio button selector
 */
function showRadioOptions(groupName) {
  const radios = document.querySelectorAll(
    `input[type="radio"][name="${groupName}"]`
  );
  if (radios.length === 0) {
    showBubble("⚠️ No radio options found for group: " + groupName);
    return;
  }

  let optionsText = "Available options: ";
  radios.forEach((radio) => {
    const label = document.querySelector(`label[for="${radio.id}"]`);
    const optionName = label ? label.innerText : radio.value;
    optionsText += optionName + ", ";
  });

  showBubble(optionsText);
}

function selectRadioByLabelOrIndex(value) {
  if (!formFields[currentFieldIndex]) return;
  const field = formFields[currentFieldIndex];

  // Only handle if it's a radio group
  if (field.type !== "radio") {
    // find nearest radio group if focus is inside one
    const radios = document.querySelectorAll(
      `input[type="radio"][name="${field.name}"]`
    );
    if (!radios.length) return;

    let selected = null;

    // 🔹 1. Try label-based match
    radios.forEach((radio) => {
      const label = document.querySelector(`label[for="${radio.id}"]`);
      if (
        label &&
        label.innerText.toLowerCase().includes(value.toLowerCase())
      ) {
        selected = radio;
      }
    });
    console.log("options");
    console.log(value);
    // 🔹 2. If no label match, try index-based match
    if (!selected) {
      const words = value.toLowerCase().split(" ");
      const numWordToDigit = {
        one: 1,
        two: 2,
        three: 3,
        four: 4,
        five: 5,
        six: 6,
        seven: 7,
        eight: 8,
        nine: 9,
        ten: 10,
      };

      let index = null;

      // Check if "option <number>" spoken
      const match = words.find((w) => !isNaN(parseInt(w)));
      if (match) {
        index = parseInt(match) - 1;
      } else {
        // Match number words like "option two"
        for (let w of words) {
          if (numWordToDigit[w]) {
            index = numWordToDigit[w] - 1;
            break;
          }
        }
      }

      if (index !== null && radios[index]) {
        selected = radios[index];
      }
    }

    // 🔹 Select the found radio button
    if (selected) {
      selected.checked = true;
      selected.dispatchEvent(new Event("change", { bubbles: true }));
      showBubble(`✅ Selected: ${selected.value}`);
    } else {
      showBubble("⚠️ No matching radio option found");
    }
  }
}

function selectRadioByIndex(index) {
  // badges are 1-based, formFields[] is 0-based
  const field = formFields[index - 1];
  if (!field) {
    showBubble(`❌ No field for option ${index}`);
    return;
  }
  active = formFields[currentFieldIndex];
  if (field) {
    // fallback: if not radio, just focus like normal field
    field.focus();
    showBubble(`🎯 Focused field ${index}`);
  }

  if (active.type === "radio") {
    active.checked = true;
    active.dispatchEvent(new Event("change", { bubbles: true }));
    showBubble(`🔘 Selected ${getLabelText(field) || "option " + index}`);
  }
}

/**
 * Index badges for form fields
 */
function addFieldBadges() {
  clearFieldBadges();
  formFields.forEach((field, i) => {
    const badge = document.createElement("span");
    badge.innerText = i + 1;
    badge.style.cssText = `
      position: absolute;
      background: #ff0;
      color: #000;
      font-size: 12px;
      padding: 2px 5px;
      border-radius: 50%;
      z-index: 9999;
    `;
    const rect = field.getBoundingClientRect();
    badge.style.top = rect.top + window.scrollY + "px";
    badge.style.left = rect.left + window.scrollX - 20 + "px";
    badge.classList.add("form-field-badge");
    document.body.appendChild(badge);
  });
}

function clearFieldBadges() {
  document.querySelectorAll(".form-field-badge").forEach((el) => el.remove());
}

function getLabelText(field) {
  if (!field || !field.id) return "";
  const label = document.querySelector(`label[for='${field.id}']`);
  return label ? label.innerText.trim() : "";
}

function focusFormFieldByNumber(input) {
  const number = parseInt(input);
  const field = isNaN(number) ? null : formFields[number - 1];
  if (!field) return;

  // if (field) {
  //   currentFieldIndex = number - 1;
  //   field.focus();
  //   showBubble(`🎯 Focused field ${number}`);
  //   return;
  // }
  currentFieldIndex = number - 1;
  active = formFields[currentFieldIndex];
  if (active.type === "radio") {
    // Auto-select radio when focusing
    active.checked = true;
    active.dispatchEvent(new Event("change", { bubbles: true }));
    active.focus();
    showBubble(
      `🔘 Auto-selected radio: ${getLabelText(field) || "option " + number}`
    );
  } else {
    // Normal focus for other fields
    field.focus();
    showBubble(`🎯 Focused field ${number}`);
  }
  showBubble("❓ Invalid field number");
}

function focusFieldByLabel(labelText) {
  labelText = labelText.trim().toLowerCase();

  const labels = document.querySelectorAll("label[for]");
  for (const label of labels) {
    if (label.innerText.trim().toLowerCase().includes(labelText)) {
      const id = label.getAttribute("for");
      const field = document.getElementById(id);
      if (field) {
        field.focus();
        showBubble(`🔍 Focused on "${labelText}"`);
        return true;
      }
    }
  }

  const inputs = document.querySelectorAll("input, textarea, select");
  for (const input of inputs) {
    if (
      input.placeholder &&
      input.placeholder.trim().toLowerCase().includes(labelText)
    ) {
      input.focus();
      showBubble(`🪄 Focused field with placeholder "${input.placeholder}"`);
      return true;
    }
  }

  showBubble(`❓ Field for "${labelText}" not found`);
  return false;
}

// ===== Dropdown Handling =====
let dropdownPopup = null;
let dropdownScrollIndex = 0;
let dropdownScrollLimit = 10; // show 5 at a time

function handleDropdownInput(transcript, field) {
  if (field.tagName !== "SELECT") return false;

  const command = transcript.toLowerCase().trim();

  // --- Show dropdown options
  if (command === "show options" || command === "show option") {
    dropdownScrollIndex = 0;
    showDropdownPopup(field);
    return true;
  }

  // --- Navigate down
  if (command === "down" || command === "next options") {
    dropdownScrollIndex = Math.min(
      dropdownScrollIndex + dropdownScrollLimit,
      field.options.length - dropdownScrollLimit
    );
    showDropdownPopup(field);
    return true;
  }

  // --- Navigate up
  if (command === "up" || command === "previous options") {
    dropdownScrollIndex = Math.max(
      dropdownScrollIndex - dropdownScrollLimit,
      0
    );
    showDropdownPopup(field);
    return true;
  }

  // --- Select option by number
  const matchNum = command.match(/^option\s+(\d+)/i);
  if (matchNum) {
    const num = parseInt(matchNum[1]);
    const visibleOptions = getVisibleOptions(field);
    const opt = visibleOptions[num - 1];
    if (opt) {
      field.value = opt.value;
      hideDropdownPopup();
      showBubble(`✅ Selected: ${opt.text}`);
    } else {
      showBubble("❌ Invalid option number");
    }
    return true;
  }

  // --- Select option by label
  const matchLabel = command.match(/^select\s+(.+)/i);
  if (matchLabel) {
    const label = matchLabel[1].toLowerCase();
    const option = Array.from(field.options).find((o) =>
      o.text.toLowerCase().includes(label)
    );
    if (option) {
      field.value = option.value;
      hideDropdownPopup();
      showBubble(`✅ Selected: ${option.text}`);
    } else {
      showBubble("❌ No matching option found");
    }
    return true;
  }

  // --- Close popup
  if (command === "close options" || command === "hide options") {
    hideDropdownPopup();
    showBubble("❌ Closed dropdown preview");
    return true;
  }

  return false;
}

// ===== Helpers =====

// Show popup with current page of options
function showDropdownPopup(field) {
  hideDropdownPopup(); // remove if exists

  dropdownPopup = document.createElement("div");
  dropdownPopup.id = "voice-dropdown-popup";
  dropdownPopup.style.position = "absolute";
  dropdownPopup.style.background = "#fff";
  dropdownPopup.style.border = "1px solid #ccc";
  dropdownPopup.style.padding = "10px";
  dropdownPopup.style.zIndex = 999999;
  dropdownPopup.style.maxHeight = "200px";
  dropdownPopup.style.overflowY = "auto";
  dropdownPopup.style.fontSize = "14px";
  dropdownPopup.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";

  const rect = field.getBoundingClientRect();
  dropdownPopup.style.left = rect.left + "px";
  dropdownPopup.style.top = rect.bottom + window.scrollY + "px";

  const visibleOptions = getVisibleOptions(field);
  visibleOptions.forEach((opt, i) => {
    const div = document.createElement("div");
    div.textContent = `${i + 1}. ${opt.text}`;
    div.style.padding = "4px 6px";
    dropdownPopup.appendChild(div);
  });

  document.body.appendChild(dropdownPopup);
}

// Hide popup safely
function hideDropdownPopup() {
  if (dropdownPopup) {
    dropdownPopup.remove();
    dropdownPopup = null;
  }
}

// Get visible chunk of options
function getVisibleOptions(field) {
  return Array.from(field.options).slice(
    dropdownScrollIndex,
    dropdownScrollIndex + dropdownScrollLimit
  );
}

// // form.js
// console.log("form.js");
// let formMode = false;
// let formFields = [];
// let currentFieldIndex = 0;
// let finalFormIndex = -1;
// let passwordSuggestionPending = false;
// let suggestedPassword = "";
// let dropdownPopup = null;
// let dropdownScrollIndex = 0;
// let dropdownScrollLimit = 10;
// let dropdownAutoCloseTimer = null;

// function handleFormCommand(intent, value, transcript) {
//   console.log("inside");
//   console.log(intent);
//   // if (!formMode && !["start_form"].includes(intent)) return;
//   // handle input filling up in form field
//   if (!intent.startsWith("form_")) {
//     console.log("handle input");
//     handleFormInput(transcript);
//   }

//   switch (intent) {
//     case "form_start":
//       console.log("matched");
//       formFields = Array.from(
//         document.querySelectorAll("input, textarea, select")
//       ).filter((el) => el.offsetParent !== null && !el.disabled);

//       if (formFields.length === 0) return showBubble("⚠️ No form fields found");

//       formMode = true;
//       currentFieldIndex = 0;
//       formFields[currentFieldIndex].focus();
//       showBubble("📝 Form mode enabled");
//       break;

//     case "form_stop":
//       formMode = false;
//       showBubble("✅ Form mode stopped");
//       break;

//     case "form_remove_focus":
//       finalFormIndex = currentFieldIndex;
//       currentFieldIndex = -1;
//       document.activeElement?.blur();
//       break;

//     case "form_submit":
//       handleFormSubmit(transcript);
//       break;

//     case "form_next":
//       if (formFields[currentFieldIndex + 1]) {
//         currentFieldIndex++;
//         formFields[currentFieldIndex].focus();
//         showBubble("➡️ Moved to next field");
//       }
//       break;

//     case "form_back":
//       if (currentFieldIndex > 0) {
//         currentFieldIndex--;
//         formFields[currentFieldIndex].focus();
//         showBubble("⬅️ Moved to previous field");
//       }
//       break;

//     case "form_clear_field":
//       const field = formFields[currentFieldIndex];
//       if (field) {
//         field.value = "";
//         field.focus();
//         showBubble("🧹 Cleared field");
//         field.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
//       }
//       break;

//     case "form_go_to_field":
//       focusFieldByLabel(value);
//       break;

//     case "form_focus_index":
//       focusFormFieldByNumber(value);
//       break;

//     case "form_select_radio":
//       selectRadioByLabel(value);
//       break;

//     default:
//       break;
//   }
// }

// function handleFormInput(transcript) {
//   if (!formMode || !formFields[currentFieldIndex]) return;

//   const field = formFields[currentFieldIndex];

//   if (handlePasswordInput(transcript, field)) return;
//   if (handleDropdownInput(transcript, field)) return;
//   if (handleGeneralInput(transcript, field)) return;
// }

// function handleFormSubmit(transcript) {
//   if (transcript !== "submit") return;

//   formMode = false;
//   const field = formFields[finalFormIndex];
//   const form = field?.form;

//   if (form) {
//     const btn = form.querySelector(
//       "button[type='submit'], input[type='submit']"
//     );
//     if (btn) {
//       btn.click();
//       showBubble("✅ Form submitted");
//     } else {
//       form.submit();
//       showBubble("✅ Form submitted via fallback");
//     }
//   } else {
//     showBubble("⚠️ No form detected");
//   }
// }

// function handlePasswordInput(transcript, field) {
//   if (field.type !== "password") return false;

//   if (transcript === "yes" && passwordSuggestionPending) {
//     field.value = suggestedPassword;
//     passwordSuggestionPending = false;
//     showPasswordPreview(field, suggestedPassword);
//     showBubble("✅ Password set.");
//     return true;
//   }

//   if (transcript === "no" && passwordSuggestionPending) {
//     passwordSuggestionPending = false;
//     showBubble("❌ You can type your password by voice.");
//     return true;
//   }

//   if (!passwordSuggestionPending) {
//     suggestedPassword = generateStrongPassword();
//     passwordSuggestionPending = true;
//     showBubble(
//       `🔐 Suggestion: ${suggestedPassword}. Say 'yes' to accept or 'no' to skip.`
//     );
//     return true;
//   }

//   return true;
// }

// function handleDropdownInput(transcript, field) {
//   if (field.tagName !== "SELECT") return false;

//   if (transcript === "down") {
//     dropdownScrollIndex = Math.min(
//       dropdownScrollIndex + dropdownScrollLimit,
//       field.options.length - dropdownScrollLimit
//     );
//     showDropdownPopup(field);
//     return true;
//   }

//   if (transcript === "up") {
//     dropdownScrollIndex = Math.max(
//       dropdownScrollIndex - dropdownScrollLimit,
//       0
//     );
//     showDropdownPopup(field);
//     return true;
//   }

//   const match = transcript.match(/^option\s+(\d+)/i);
//   if (match) {
//     const num = parseInt(match[1]);
//     const opt = field.options[num - 1];
//     if (opt) {
//       field.value = opt.value;
//       hideDropdownPopup();
//       showBubble(`✅ Selected: ${opt.text}`);
//     } else {
//       showBubble("❌ Invalid option number");
//     }
//     return true;
//   }

//   showDropdownPopup(field);
//   return true;
// }

// function handleGeneralInput(transcript, field) {
//   if (field.tagName === "SELECT" || field.type === "password") return false;
//   field.value = transcript;
//   showBubble("✏️ Typed: " + transcript);
//   return true;
// }

// function selectRadioByLabel(labelText) {
//   labelText = labelText.toLowerCase();
//   const labels = document.querySelectorAll("label");
//   for (const label of labels) {
//     if (label.innerText.toLowerCase().includes(labelText)) {
//       const input = label.control;
//       if (input && input.type === "radio") {
//         input.checked = true;
//         showBubble(`🔘 Selected "${label.innerText}"`);
//         return;
//       }
//     }
//   }
//   showBubble("❌ No matching radio found");
// }

// function focusFormFieldByNumber(input) {
//   const number = parseInt(input);
//   const field = isNaN(number) ? null : formFields[number - 1];
//   if (field) {
//     currentFieldIndex = number - 1;
//     field.focus();
//     showBubble(`🎯 Focused field ${number}`);
//     return;
//   }
//   showBubble("❓ Invalid field number");
// }

// function focusFieldByLabel(labelText) {
//   labelText = labelText.trim().toLowerCase();

//   const labels = document.querySelectorAll("label[for]");
//   for (const label of labels) {
//     if (label.innerText.trim().toLowerCase().includes(labelText)) {
//       const id = label.getAttribute("for");
//       const field = document.getElementById(id);
//       if (field) {
//         field.focus();
//         showBubble(`🔍 Focused on "${labelText}"`);
//         return true;
//       }
//     }
//   }

//   const inputs = document.querySelectorAll("input, textarea, select");
//   for (const input of inputs) {
//     if (
//       input.placeholder &&
//       input.placeholder.trim().toLowerCase().includes(labelText)
//     ) {
//       input.focus();
//       showBubble(`🪄 Focused field with placeholder "${input.placeholder}"`);
//       return true;
//     }
//   }

//   showBubble(`❓ Field for "${labelText}" not found`);
//   return false;
// }
