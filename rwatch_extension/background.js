// Debug flag
const DEBUG = true;

// Tracking variables
let activeTabId = null;
let startTime = null;
let siteUsage = {};
let currentSite = null;
let sessionData = {};
let siteStartTimes = {};
let username = ""; // Store the user's name

// Backend API URL (Render deployment)
const BACKEND_URL = "https://r-watch.onrender.com"; // Replace with actual URL

// Log helper function
function debugLog(message) {
  if (DEBUG) {
    console.log(`[Usage Tracker] ${message}`);
  }
}

// Initialize
debugLog("Background script loaded");

// Check if username is already set, otherwise prompt user
chrome.storage.local.get("username", (data) => {
  if (data.username) {
    username = data.username;
    debugLog(`User identified as: ${username}`);
  } else {
    promptForUsername();
  }
});

// Function to prompt for username
function promptForUsername() {
  chrome.tabs.create({ url: chrome.runtime.getURL("username_setup.html") });
}

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "setUsername") {
    username = message.username;
    chrome.storage.local.set({ username }, () => {
      debugLog(`Username set to: ${username}`);
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === "resetData") {
    siteUsage = {};
    sessionData = {};
    siteStartTimes = {};
    chrome.storage.local.remove(["siteUsage", "siteStartTimes"], () => {
      debugLog("Usage data reset");
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === "getData") {
    sendResponse({ siteUsage, siteStartTimes, username });
    return false;
  }
});

// Track active tab
chrome.tabs.onActivated.addListener(activeInfo => {
  debugLog(`Tab activated: ${activeInfo.tabId}`);
  trackTime();
  activeTabId = activeInfo.tabId;

  chrome.tabs.get(activeTabId, tab => {
    if (chrome.runtime.lastError) return;

    if (tab?.url) {
      try {
        const newSite = new URL(tab.url).hostname;

        if (currentSite && currentSite !== newSite && sessionData[currentSite]) {
          sendDataToServer(currentSite, sessionData[currentSite]);
          sessionData[currentSite] = 0;
        }

        if (!siteStartTimes[newSite]) siteStartTimes[newSite] = new Date().toISOString();
        currentSite = newSite;
      } catch (error) {
        debugLog(`Invalid URL: ${tab.url}`);
      }
    }
  });

  startTime = Date.now();
});

// Track tab URL updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    debugLog(`URL changed: ${changeInfo.url}`);
    trackTime();

    try {
      const newSite = new URL(changeInfo.url).hostname;

      if (currentSite && currentSite !== newSite && sessionData[currentSite]) {
        sendDataToServer(currentSite, sessionData[currentSite]);
        sessionData[currentSite] = 0;
      }

      if (!siteStartTimes[newSite]) siteStartTimes[newSite] = new Date().toISOString();
      currentSite = newSite;
    } catch (error) {
      debugLog(`Invalid URL: ${changeInfo.url}`);
    }

    startTime = Date.now();
  }
});

// Track when browser loses focus
chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    trackTime();

    if (currentSite && sessionData[currentSite]) {
      sendDataToServer(currentSite, sessionData[currentSite]);
      sessionData[currentSite] = 0;
    }

    activeTabId = null;
    startTime = null;
    currentSite = null;
  } else {
    chrome.tabs.query({ active: true, windowId }, tabs => {
      if (tabs.length > 0) {
        debugLog(`Active tab in window: ${tabs[0].id}`);
        trackTime();
        activeTabId = tabs[0].id;

        try {
          if (tabs[0].url) {
            const site = new URL(tabs[0].url).hostname;
            currentSite = site;

            if (!siteStartTimes[site]) siteStartTimes[site] = new Date().toISOString();
          }
        } catch (error) {
          debugLog(`Invalid URL: ${tabs[0].url}`);
        }

        startTime = Date.now();
      }
    });
  }
});

// Save usage data every minute
setInterval(() => {
  trackTime();

  if (currentSite && sessionData[currentSite]) {
    sendDataToServer(currentSite, sessionData[currentSite]);
    sessionData[currentSite] = 0;
  }

  saveUsageData();
}, 60000);

// Track time spent on the current site
function trackTime() {
  if (!activeTabId || !startTime || !currentSite) return;

  const elapsedTime = (Date.now() - startTime) / 1000;
  if (elapsedTime < 1 || elapsedTime > 3600) return;

  try {
    chrome.tabs.get(activeTabId, tab => {
      if (chrome.runtime.lastError) return;

      if (tab?.url) {
        let hostname = new URL(tab.url).hostname;

        siteUsage[hostname] = (siteUsage[hostname] || 0) + elapsedTime;
        sessionData[hostname] = (sessionData[hostname] || 0) + elapsedTime;

        debugLog(`Tracked: ${hostname} for ${elapsedTime.toFixed(2)} seconds`);
        startTime = Date.now();
      }
    });
  } catch (error) {
    debugLog(`Error in trackTime: ${error.message}`);
    startTime = Date.now();
  }
}

// Send data to the new backend server
function sendDataToServer(hostname, timeSpent) {
  if (timeSpent < 1) return;

  if (!username) {
    debugLog("Username not set, storing data locally");
    saveUsageData();
    return;
  }

  const currentTime = new Date().toISOString();
  const startTimeForSite = siteStartTimes[hostname] || currentTime;

  fetch(`${BACKEND_URL}/log-usage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      site: hostname,
      timeSpent: timeSpent.toFixed(2),
      startTime: startTimeForSite,
      endTime: currentTime
    })
  })
    .then(response => {
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      return response.text();
    })
    .then(data => {
      debugLog(`Server response: ${data}`);
      delete siteStartTimes[hostname];
    })
    .catch(error => {
      debugLog(`Error sending data: ${error.message}`);
      saveUsageData(); // Store locally if API fails
    });
}

// Save data locally
function saveUsageData() {
  chrome.storage.local.set({ siteUsage, siteStartTimes }, () => {
    if (chrome.runtime.lastError) {
      debugLog(`Error saving data: ${chrome.runtime.lastError.message}`);
    } else {
      debugLog("Usage data saved successfully");
    }
  });
}
