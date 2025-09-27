console.log("test results.js");
// --- Test logging helper ---
window.testResults = window.testResults || [];

// function logTestResult(feature, status, startTime, endTime = null) {
//   if (!endTime) endTime = performance.now();
//   const responseTime = Math.round(endTime - startTime);
//   const result = {
//     feature,
//     status,
//     responseTime,
//     timestamp: new Date().toLocaleString(),
//   };

//   console.log(`✅ Test logged: ${feature} - ${status} - ${responseTime}s`);
//   chrome.runtime.sendMessage({ action: "logTestResult", result });
// }

function logTestResult(intent, status = "Pass", startTime) {
  const endTime = performance.now();
  const responseTimeMs = Math.round(endTime - startTime);
  console.log(
    `[TEST] ${intent} | Status: ${status} | Response Time: ${responseTimeMs}ms`
  );

  // Optional: store in chrome.storage for persistent logging
    chrome.storage.local.get({ testResults: [] }, (data) => {
      const results = data.testResults;
      results.push({ intent, status, responseTimeMs });
      chrome.storage.local.set({ testResults: results });
    });
}

function logAccuracyTestResult(intent, status = "Pass", startTime) {
  const endTime = performance.now();
  const responseTimeMs = Math.round(endTime - startTime);
  console.log(
    `[TEST] ${intent} | Status: ${status} | Response Time: ${responseTimeMs}ms`
  );

  // Optional: store in chrome.storage for persistent logging
  chrome.storage.local.get({ testResults: [] }, (data) => {
    const results = data.testResults;
    results.push({ intent, status, responseTimeMs });
    chrome.storage.local.set({ testResults: results });
  });
}


// function logTestResult(feature, status, startTime, endTime = null) {
//   if (!endTime) endTime = performance.now();
//   const responseTime = ((endTime - startTime) / 1000).toFixed(2);

//   chrome.storage.local.get({ testResults: [] }, (data) => {
//     const results = data.testResults;
//     results.push({
//       feature,
//       status,
//       responseTime,
//       timestamp: new Date().toLocaleString(),
//     });
//     chrome.storage.local.set({ testResults: results }, () => {
//       console.log(`✅ Test logged: ${feature} - ${status} - ${responseTime}s`);
//     });
//   });
// }

// function logTestResult(testName, status, startTime) {
//   console.log("log results");
//   const endTime = performance.now();
//   const responseTime = ((endTime - startTime) / 1000).toFixed(2); // in seconds

//   // Create a new test result object
//   const newResult = { testName, status, responseTime };

//   // Save in chrome.storage.local
//   chrome.storage.local.get({ testResults: [] }, (data) => {
//     const results = data.testResults;
//     results.push(newResult);
//     chrome.storage.local.set({ testResults: results }, () => {
//       console.log("✅ Test result saved:", newResult);
//     });
//   });
// }

// chrome.storage.local.set({ testResults: [] }, () => {
//   console.log("✅ Test results cleared");
// });

function showTestResults() {
  chrome.storage.local.get({ testResults: [] }, (data) => {
    if (!data.testResults || data.testResults.length === 0) {
      console.log("No test results found.");
      return;
    }

    console.table(data.testResults);
  });
}

// function logTestResult(feature, status, startTime) {
//   const endTime = performance.now();
//   const responseTime = (endTime - startTime).toFixed(2);

//   const result = {
//     feature,
//     status,
//     responseTime,
//     timestamp: new Date().toISOString(),
//   };

//   window.testResults.push(result);

//   console.log(
//     `[TEST] ${feature} | Status: ${status} | Response Time: ${responseTime} ms`
//   );
//   showBubble(`✅ ${feature}: ${status} (⏱ ${responseTime} ms)`);
// }
