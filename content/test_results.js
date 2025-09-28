console.log("test results.js");
// --- Test logging helper ---
window.testResults = window.testResults || [];



function logTestResult(intent, status = "Pass", startTime) {
  console.log("logtest");
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


function showTestResults() {
  chrome.storage.local.get({ testResults: [] }, (data) => {
    if (!data.testResults || data.testResults.length === 0) {
      console.log("No test results found.");
      return;
    }

    console.table(data.testResults);
  });
}

function deleteTestResultsByIndexes(indexesToDelete) {
  chrome.storage.local.get({ testResults: [] }, (data) => {
    let results = data.testResults;

    // Sort indexes descending so deletion doesn’t shift earlier indexes
    indexesToDelete.sort((a, b) => b - a);

    indexesToDelete.forEach((index) => {
      if (index >= 0 && index < results.length) {
        results.splice(index, 1);
      }
    });

    chrome.storage.local.set({ testResults: results }, () => {
      console.log("✅ Deleted entries at indexes:", indexesToDelete);
      console.table(results);
    });
  });
}

// to generate test_results.json file
// chrome.runtime.sendMessage({ action: "start_export_test_results" });