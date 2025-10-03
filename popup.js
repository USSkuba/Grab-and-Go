/* ============================================================================
   GRAB-AND-GO - EVE Online Wormhole System Data Copier
   ============================================================================
   
   PURPOSE:
   This extension extracts system information from wormholes.new-eden.io/maps
   and formats it for easy sharing via clipboard or Discord webhook.
   
   OUTPUT FORMAT:
   System name, Security status, Hub1 Jumps1, Hub2 Jumps2, ...
   Example: "Queen's Landing, C4, Jita 14, Hek 16, Amarr 5"
   
   MAIN FEATURES:
   - Copy system data to clipboard
   - Send system data directly to Discord
   - Automatically detects which tab (SHORTEST/SECURE) is active
   - Dynamically extracts ALL user-configured destinations (not hardcoded)
   - Theme customization support
   - Automatic button disable when no system is selected
   
   MAINTENANCE NOTES:
   - If the website structure changes, update the selector functions below
   - All scraping logic is in the getSystemData() function and its helpers
   - Theme colors are stored in colors.json
   - Console logs are extensive for debugging (check browser console with F12)
   
   ============================================================================ */

// ============================================================================
// INITIALIZATION - Runs when the extension popup is opened
// ============================================================================

document.addEventListener('DOMContentLoaded', function () {
  console.log('=== Grab-and-Go Extension Loaded ===');
  
  // Get references to UI elements
  const discordButton = document.getElementById('sendToDiscordButton');
  const copyButton = document.getElementById('copyButton');
  const webhookUrlInput = document.getElementById('webhookUrl');
  const themeDropdown = document.getElementById('themeDropdown');
  
  // State management
  let isSendingToDiscord = false;  // Prevents duplicate Discord sends
  let lastRequestId = null;         // Tracks unique Discord requests

  // ============================================================================
  // WEBHOOK URL MANAGEMENT
  // Saves and loads Discord webhook URL from browser local storage
  // ============================================================================
  
  // Load saved webhook URL or use empty string as default
  webhookUrlInput.value = localStorage.getItem('webhookUrl') || '';
  console.log('Webhook URL loaded from storage');

  // Save webhook URL whenever it changes
  webhookUrlInput.addEventListener('change', function () {
    localStorage.setItem('webhookUrl', webhookUrlInput.value);
    console.log('Webhook URL saved to storage');
  });

  // ============================================================================
  // DISCORD BUTTON HANDLER
  // Sends formatted system data to Discord webhook
  // ============================================================================
  
  if (discordButton && !discordButton.dataset.listenerAdded) {
    discordButton.addEventListener('click', function () {
      // Prevent duplicate sends
      if (isSendingToDiscord) {
        console.log('Message is already being sent. Please wait.');
        return;
      }

      // Set flag and create unique request ID
      isSendingToDiscord = true;
      lastRequestId = Date.now();
      console.log('Starting to send message to Discord...', lastRequestId);

      // Get the formatted data from the UI
      const numbers = document.getElementById('number').innerText;
      const header = document.getElementById('headerData').innerText;
      const fullText = numbers ? `${header} ${numbers}` : header;

      // Get webhook URL
      const webhookUrl = webhookUrlInput.value;

      // Validate webhook URL
      if (!webhookUrl || webhookUrl.trim() === '') {
        alert('Please enter a Discord Webhook URL first!');
        isSendingToDiscord = false;
        return;
      }

      // Send to Discord
      sendToDiscord(fullText, webhookUrl, lastRequestId)
        .then(() => {
          console.log('Message sent successfully.', lastRequestId);
          // Optional: Show success notification
        })
        .catch((error) => {
          console.error('Error sending message:', error);
          alert('Failed to send to Discord. Check console for details.');
        })
        .finally(() => {
          // Reset flag after sending is complete
          isSendingToDiscord = false;
          console.log('Sending process finished for request:', lastRequestId);
        });
    });

    // Mark that listener has been added (prevents duplicate listeners)
    discordButton.dataset.listenerAdded = true;
  }

  // ============================================================================
  // THEME MANAGEMENT
  // Handles theme selection and applies colors from colors.json
  // ============================================================================
  
  // Load saved theme or default to 'default' theme
  const savedTheme = localStorage.getItem('theme') || 'default';
  applyTheme(savedTheme);
  themeDropdown.value = savedTheme;
  console.log(`Theme loaded: ${savedTheme}`);

  // Handle theme changes
  themeDropdown.addEventListener('change', function () {
    const selectedTheme = themeDropdown.value;
    applyTheme(selectedTheme);
    localStorage.setItem('theme', selectedTheme);
    console.log(`Theme changed to: ${selectedTheme}`);
  });

  // ============================================================================
  // DATA EXTRACTION FROM WEBPAGE
  // Scrapes system data from wormholes.new-eden.io/maps
  // ============================================================================
  
  console.log('Fetching data from active tab...');
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    // Execute scraping function in the context of the webpage
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: getSystemData  // This function runs on the webpage
    }, (results) => {
      // Handle execution errors
      if (chrome.runtime.lastError) {
        console.error('Chrome Runtime Error:', chrome.runtime.lastError.message);
        document.getElementById('headerData').innerText = 'Error: ' + chrome.runtime.lastError.message;
        disableButtons();
        return;
      }
      
      // Process the scraped data
      const data = results[0].result;
      console.log('Scraped data received:', data);
      
      if (data && data.success) {
        // Data extraction successful
        document.getElementById('headerData').innerText = data.header;
        
        const numberElement = document.getElementById('number');
        if (data.destinations && data.destinations.trim() !== '') {
          numberElement.innerText = data.destinations;
          enableButtons();  // Enable copy and Discord buttons
        } else {
          numberElement.innerText = '';
          disableButtons();  // No data, disable buttons
        }
      } else {
        // Data extraction failed
        console.error('Error from content script:', data ? data.error : 'No data returned');
        document.getElementById('headerData').innerText = data && data.error ? data.error : 'No system selected.';
        document.getElementById('number').innerText = '';
        disableButtons();
      }
    });
  });

  // ============================================================================
  // COPY BUTTON HANDLER
  // Copies formatted system data to clipboard
  // ============================================================================
  
  copyButton.addEventListener('click', function () {
    const numbers = document.getElementById('number').innerText;
    const header = document.getElementById('headerData').innerText;
    const fullText = numbers ? `${header} ${numbers}` : header;
    copyToClipboard(fullText);
  });
});

// ============================================================================
// BUTTON STATE MANAGEMENT
// Enable/disable buttons based on whether system data is available
// ============================================================================

/**
 * Disables copy and Discord buttons when no system is selected
 */
function disableButtons() {
  const copyButton = document.getElementById('copyButton');
  const discordButton = document.getElementById('sendToDiscordButton');
  
  copyButton.disabled = true;
  discordButton.disabled = true;
  copyButton.style.opacity = '0.5';
  discordButton.style.opacity = '0.5';
  copyButton.style.cursor = 'not-allowed';
  discordButton.style.cursor = 'not-allowed';
  
  console.log('Buttons disabled - no system data available');
}

/**
 * Enables copy and Discord buttons when system data is available
 */
function enableButtons() {
  const copyButton = document.getElementById('copyButton');
  const discordButton = document.getElementById('sendToDiscordButton');
  
  copyButton.disabled = false;
  discordButton.disabled = false;
  copyButton.style.opacity = '1';
  discordButton.style.opacity = '1';
  copyButton.style.cursor = 'pointer';
  discordButton.style.cursor = 'pointer';
  
  console.log('Buttons enabled - system data available');
}

// ============================================================================
// DISCORD INTEGRATION
// Sends formatted data to Discord webhook
// ============================================================================

/**
 * Sends data to Discord webhook using HTTP POST
 * 
 * IMPORTANT: Discord webhooks return HTTP 204 (No Content) on success,
 * which means there's no response body to parse. Don't try to parse JSON!
 * 
 * @param {string} data - The formatted system data to send
 * @param {string} webhookUrl - Discord webhook URL
 * @param {number} requestId - Unique request identifier for logging
 * @returns {Promise} - Resolves when message is sent
 */
function sendToDiscord(data, webhookUrl, requestId) {
  console.log('Request to send message initiated:', requestId);

  return fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: data
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Discord API returned status ${response.status}`);
    }
    console.log('Message sent successfully for requestId:', requestId);
    
    // Discord returns 204 No Content on success - no JSON to parse
    // Only try to parse JSON if there's actually content
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null;  // Success, but no content to return
    }
    
    // If there is content (error responses), parse it
    return response.json();
  })
  .catch(error => {
    console.error('Error sending to Discord (requestId:', requestId, '):', error);
    throw error;  // Re-throw to be caught by the button handler
  });
}

// ============================================================================
// THEME SYSTEM
// Loads and applies color schemes from colors.json
// ============================================================================

/**
 * Applies a theme by loading colors from colors.json
 * Themes available: default, dark, glacier, amarr, caldari, gallente, 
 *                   minmatar, SEND, pink, tyrian, nebula
 * 
 * TO ADD A NEW THEME:
 * 1. Add theme definition to colors.json
 * 2. Add option to HTML dropdown in popup.html
 * 
 * @param {string} theme - Theme name to apply
 */
function applyTheme(theme) {
  fetch('colors.json')
    .then(response => response.json())
    .then(colors => {
      // Get theme colors, fallback to default if theme not found
      const themeColors = colors[theme] || colors.default;
      console.log(`Applying theme: ${theme}`);

      // Apply background gradient
      document.body.style.background = `linear-gradient(135deg, ${themeColors.backgroundGradient.start}, ${themeColors.backgroundGradient.end})`;

      // Apply title box colors
      const titleBox = document.getElementById('titleBox');
      titleBox.style.backgroundColor = themeColors.titleBox.backgroundColor;
      titleBox.style.color = themeColors.titleBox.fontColor;

      // Apply copy button colors
      const copyButton = document.getElementById('copyButton');
      copyButton.style.background = `linear-gradient(135deg, ${themeColors.copyButton.backgroundGradientStart}, ${themeColors.copyButton.backgroundGradientEnd})`;
      copyButton.style.color = themeColors.copyButton.fontColor;

      // Add hover effect for copy button
      copyButton.addEventListener('mouseenter', () => {
        if (!copyButton.disabled) {
          copyButton.style.background = themeColors.copyButton.hoverColor;
        }
      });
      copyButton.addEventListener('mouseleave', () => {
        copyButton.style.background = `linear-gradient(135deg, ${themeColors.copyButton.backgroundGradientStart}, ${themeColors.copyButton.backgroundGradientEnd})`;
      });

      // Apply text colors
      const headerData = document.getElementById('headerData');
      headerData.style.color = themeColors.headerData.fontColor;

      const number = document.getElementById('number');
      number.style.color = themeColors.number.fontColor;

      // Apply notification colors
      const notification = document.getElementById('copyNotification');
      notification.style.backgroundColor = themeColors.notification.backgroundColor;
      notification.style.color = themeColors.notification.fontColor;
    })
    .catch(error => console.error('Error loading colors.json:', error));
}

// ============================================================================
// WEB SCRAPING FUNCTIONS
// These functions run in the context of the wormholes.new-eden.io webpage
// ============================================================================

/**
 * MAIN SCRAPING FUNCTION
 * Extracts system data from wormholes.new-eden.io/maps
 * 
 * RETURNS: {
 *   success: boolean,
 *   header: string,        // "System name, Security rating, Connection type,"
 *   destinations: string,  // "Hub1 Jumps1, Hub2 Jumps2, ..."
 *   error: string          // Error message if failed
 * }
 * 
 * OUTPUT FORMAT:
 * "System name, Security rating, Connection type, Hub1 Jumps1, Hub2 Jumps2, ..."
 * Example: "Bairshir, 0.4, C3, Jita 31, Hek 22, Amarr 21, ..."
 * 
 * Note: Connection type (C1-C6) is only included for wormhole connections
 * 
 * SCRAPING STRATEGY:
 * 1. Extract system name from page header
 * 2. Extract security rating (0.0-1.0 for K-space, or negative for null)
 * 3. Extract wormhole connection type (C1-C6) if applicable
 * 4. Detect which tab is active (SHORTEST or SECURE)
 * 5. Extract all destinations from active tab
 * 6. Format and return data
 * 
 * IF THIS BREAKS:
 * - Check console logs (F12) to see which step failed
 * - Inspect the webpage HTML to find new selectors
 * - Update the extraction functions below
 * 
 * NOTE: All helper functions are defined INSIDE this function to ensure
 * they're available when Chrome injects this code into the webpage
 */
function getSystemData() {
  console.log('=== Starting System Data Extraction ===');
  
  // ============================================================================
  // HELPER FUNCTION: Extract system name from the page header
  // ============================================================================
  function extractSystemName() {
    console.log('Extracting system name...');
    
    // Strategy 1: Look for header elements in the main content area
    const headerSelectors = [
      'main header h6',           // Most specific - main area header
      'header h6',                 // Any header
      '.MuiPaper-root header h6',  // Material-UI paper component header
      '[class*="header"] h6'       // Any element with "header" in class name
    ];
    
    for (const selector of headerSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const text = element.textContent.trim();
        // System names are typically short (1-30 characters) and don't contain newlines
        if (text && text.length > 0 && text.length < 30 && !text.includes('\n')) {
          console.log(`Found system name using selector "${selector}": ${text}`);
          return text;
        }
      }
    }
    
    // Strategy 2: Look for any h6 that might contain the system name
    const allH6 = document.querySelectorAll('h6');
    for (const h6 of allH6) {
      const text = h6.textContent.trim();
      if (text && text.length > 0 && text.length < 30 && !text.includes('\n')) {
        // Exclude common UI text that's not a system name
        if (!text.includes('SHORTEST') && 
            !text.includes('SECURE') && 
            !text.includes('Settings') &&
            !text.includes('Route')) {
          console.log(`Found system name in h6: ${text}`);
          return text;
        }
      }
    }
    
    console.log('Could not find system name');
    return null;
  }
  
  // ============================================================================
  // HELPER FUNCTION: Extract security rating and connection type
  // ============================================================================
  /**
   * Extracts both security rating and wormhole connection type
   * 
   * SECURITY RATINGS (K-space):
   * - High Sec: 1.0, 0.9, 0.8, 0.7, 0.6, 0.5
   * - Low Sec: 0.4, 0.3, 0.2, 0.1
   * - Null Sec: 0.0, -0.1 to -1.0
   * 
   * WORMHOLE CONNECTION TYPES:
   * - C1, C2, C3, C4, C5, C6 (represents the destination wormhole class)
   * 
   * @param {string} systemName - The system name
   * @returns {Object} - {securityRating: string, connectionType: string|null}
   */
  function extractSecurityAndConnection(systemName) {
    console.log('Extracting security rating and connection type...');
    
    let securityRating = null;
    let connectionType = null;
    
    // STRATEGY 1: Look for the selected system node on the map
    // The map node should contain both security rating and connection type
    const mapNodes = document.querySelectorAll('[class*="node"], [class*="system"]');
    
    for (const node of mapNodes) {
      const nodeText = node.textContent;
      
      // Check if this node contains the system name
      if (nodeText.includes(systemName)) {
        console.log('Found system node on map:', nodeText);
        
        // Look for security rating (0.0 to 1.0 or negative for null sec)
        const securityMatch = nodeText.match(/-?\d\.\d/);
        if (securityMatch) {
          securityRating = securityMatch[0];
          console.log(`Found security rating on node: ${securityRating}`);
        }
        
        // Look for wormhole connection class (C1-C6)
        const connectionMatch = nodeText.match(/C[1-6]/);
        if (connectionMatch) {
          connectionType = connectionMatch[0];
          console.log(`Found connection type on node: ${connectionType}`);
        }
        
        break;
      }
    }
    
    // STRATEGY 2: Look for system-type elements (class indicators)
    if (!securityRating && !connectionType) {
      const systemTypeElements = document.querySelectorAll('.system-type, [class*="system-type"]');
      
      for (const element of systemTypeElements) {
        const text = element.textContent.trim();
        
        // Check if it's a wormhole class
        if (/C[1-6]/.test(text)) {
          connectionType = text.match(/C[1-6]/)[0];
          console.log(`Found connection type in system-type: ${connectionType}`);
        }
        // Check if it's a security rating
        else if (/-?\d\.\d/.test(text)) {
          securityRating = text.match(/-?\d\.\d/)[0];
          console.log(`Found security rating in system-type: ${securityRating}`);
        }
      }
    }
    
    // STRATEGY 3: Search in header area
    if (!securityRating || !connectionType) {
      const headerArea = document.querySelector('main header, header');
      if (headerArea) {
        const headerText = headerArea.textContent;
        
        if (!securityRating) {
          const secMatch = headerText.match(/-?\d\.\d/);
          if (secMatch) {
            securityRating = secMatch[0];
            console.log(`Found security rating in header: ${securityRating}`);
          }
        }
        
        if (!connectionType) {
          const connMatch = headerText.match(/C[1-6]/);
          if (connMatch) {
            connectionType = connMatch[0];
            console.log(`Found connection type in header: ${connectionType}`);
          }
        }
      }
    }
    
    // Set defaults if not found
    if (!securityRating) {
      securityRating = 'Unknown';
      console.log('Could not find security rating');
    }
    
    // Connection type is optional (only for wormhole connections)
    if (connectionType) {
      console.log(`Using connection type: ${connectionType}`);
    } else {
      console.log('No wormhole connection type found (system may be direct K-space)');
    }
    
    return { securityRating, connectionType };
  }
  
  // ============================================================================
  // HELPER FUNCTION: Detect which tab (SHORTEST or SECURE) is currently active
  // ============================================================================
  function detectActiveTab() {
    console.log('Detecting active tab...');
    
    // Look for tab buttons or indicators
    const tabButtons = document.querySelectorAll('button, [role="tab"]');
    
    for (const button of tabButtons) {
      const text = button.textContent.trim().toUpperCase();
      
      // Check if this button contains SHORTEST or SECURE
      if (text === 'SHORTEST' || text === 'SECURE') {
        // Check if it's selected/active using common selection indicators
        const isActive = 
          button.getAttribute('aria-selected') === 'true' ||
          button.classList.contains('Mui-selected') ||
          button.classList.contains('active') ||
          button.hasAttribute('data-selected');
        
        if (isActive) {
          console.log(`Active tab detected: ${text}`);
          return text;
        }
      }
    }
    
    // Default to SHORTEST if we can't determine
    console.log('Could not detect active tab, defaulting to SHORTEST');
    return 'SHORTEST';
  }
  
  // ============================================================================
  // HELPER FUNCTION: Extract a single destination from an element
  // ============================================================================
  function extractDestinationFromElement(element) {
    try {
      // Look for the hub name and jump count in text elements
      const textElements = element.querySelectorAll('p, span, [class*="Typography"]');
      
      let hubName = null;
      let jumps = null;
      
      for (const textEl of textElements) {
        const text = textEl.textContent.trim();
        
        // Check if it's a number (jump count)
        const number = parseInt(text);
        if (!isNaN(number) && text.length <= 3) {
          jumps = text;
        }
        // Check if it's a hub name (text, not a number)
        else if (text && text.length > 0 && text.length < 30 && isNaN(text)) {
          // Exclude common UI text
          if (!text.includes('from') && 
              !text.includes('jumps') && 
              !text.toLowerCase().includes('route')) {
            hubName = text;
          }
        }
      }
      
      if (hubName && jumps) {
        console.log(`  Found: ${hubName} - ${jumps} jumps`);
        return { name: hubName, jumps: jumps };
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting destination from element:', error);
      return null;
    }
  }
  
  // ============================================================================
  // HELPER FUNCTION: Extract all destinations from a container element
  // ============================================================================
  function extractAllDestinationsFromContainer(container) {
    const destinations = [];
    
    // Common trade hub names (but remember, users can configure ANY systems!)
    const commonHubs = ['Jita', 'Hek', 'Amarr', 'Rens', 'Dodixie', 'Stacmon'];
    
    // Get all text content
    const allElements = container.querySelectorAll('*');
    
    for (const element of allElements) {
      const text = element.textContent.trim();
      
      // Check if this element contains a hub name
      for (const hub of commonHubs) {
        if (text === hub) {
          // Look for a number nearby
          let jumps = null;
          
          // Check siblings
          if (element.previousElementSibling) {
            const siblingText = element.previousElementSibling.textContent.trim();
            const number = parseInt(siblingText);
            if (!isNaN(number)) {
              jumps = siblingText;
            }
          }
          
          if (!jumps && element.nextElementSibling) {
            const siblingText = element.nextElementSibling.textContent.trim();
            const number = parseInt(siblingText);
            if (!isNaN(number)) {
              jumps = siblingText;
            }
          }
          
          // Check parent's children
          if (!jumps && element.parentElement) {
            const parentChildren = Array.from(element.parentElement.children);
            for (const child of parentChildren) {
              const childText = child.textContent.trim();
              const number = parseInt(childText);
              if (!isNaN(number) && childText.length <= 3) {
                jumps = childText;
                break;
              }
            }
          }
          
          // Add if we found both name and jumps, and it's not a duplicate
          if (jumps && !destinations.find(d => d.name === hub)) {
            destinations.push({ name: hub, jumps: jumps });
            console.log(`  Found: ${hub} - ${jumps} jumps`);
          }
        }
      }
    }
    
    return destinations;
  }
  
  // ============================================================================
  // HELPER FUNCTION: Extract all destinations from the active tab
  // ============================================================================
  function extractDestinations(activeTab) {
    console.log(`Extracting destinations from ${activeTab} tab...`);
    
    const destinations = [];
    
    // STRATEGY 1: Look for route-hub-summary elements
    const hubSummaries = document.querySelectorAll('.route-hub-summary, [class*="route-hub-summary"]');
    console.log(`Found ${hubSummaries.length} route-hub-summary elements`);
    
    for (const summary of hubSummaries) {
      const destination = extractDestinationFromElement(summary);
      if (destination) {
        destinations.push(destination);
      }
    }
    
    // STRATEGY 2: Look for MuiAccordion structures
    if (destinations.length === 0) {
      console.log('Trying MuiAccordion strategy...');
      const accordions = document.querySelectorAll('[class*="MuiAccordion"]');
      
      for (const accordion of accordions) {
        const destination = extractDestinationFromElement(accordion);
        if (destination) {
          destinations.push(destination);
        }
      }
    }
    
    // STRATEGY 3: Look in the visible panel area
    if (destinations.length === 0) {
      console.log('Trying panel area strategy...');
      const panels = document.querySelectorAll('[role="tabpanel"], [class*="panel"]');
      
      for (const panel of panels) {
        // Check if this panel is visible
        const style = window.getComputedStyle(panel);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          const panelDestinations = extractAllDestinationsFromContainer(panel);
          destinations.push(...panelDestinations);
        }
      }
    }
    
    console.log(`Extracted ${destinations.length} destinations:`, destinations);
    return destinations;
  }
  
  // ============================================================================
  // MAIN EXECUTION STARTS HERE
  // ============================================================================
  
  try {
    // STEP 1: Get system name
    const systemName = extractSystemName();
    if (!systemName) {
      console.log('No system name found - no system selected');
      return {
        success: false,
        error: 'No system selected.',
        header: 'No system selected',
        destinations: ''
      };
    }
    console.log('✓ System name:', systemName);
    
    // STEP 2: Get security rating and connection type
    const { securityRating, connectionType } = extractSecurityAndConnection(systemName);
    console.log('✓ Security rating:', securityRating);
    console.log('✓ Connection type:', connectionType || 'None');
    
    // STEP 3: Detect which tab is active (SHORTEST or SECURE)
    const activeTab = detectActiveTab();
    console.log('✓ Active tab:', activeTab);
    
    // STEP 4: Extract all destinations from the active tab
    const destinations = extractDestinations(activeTab);
    console.log('✓ Destinations:', destinations);
    
    // Check if we got any destinations
    if (!destinations || destinations.length === 0) {
      console.log('No destinations found');
      return {
        success: false,
        error: 'Could not extract destination data. Please ensure the tab is expanded.',
        header: connectionType 
          ? `${systemName}, ${securityRating}, ${connectionType}`
          : `${systemName}, ${securityRating}`,
        destinations: ''
      };
    }
    
    // STEP 5: Format the output
    // Format: "System name, Security rating, Connection type, Hub1 Jumps1, Hub2 Jumps2, ..."
    // Connection type is optional (only included if present)
    const header = connectionType 
      ? `${systemName}, ${securityRating}, ${connectionType},`
      : `${systemName}, ${securityRating},`;
    
    const destinationText = destinations.map(d => `${d.name} ${d.jumps}`).join(', ');
    
    console.log('=== Extraction Complete ===');
    return {
      success: true,
      header: header,
      destinations: destinationText
    };
    
  } catch (error) {
    console.error('Error in getSystemData:', error);
    return {
      success: false,
      error: 'Error: ' + error.message,
      header: 'Error extracting data',
      destinations: ''
    };
  }
}

// All helper functions have been moved inside getSystemData() above
// to ensure they're available when Chrome injects the code into the webpage

// ============================================================================
// CLIPBOARD FUNCTIONALITY
// ============================================================================

/**
 * Copies text to clipboard and shows a "Copied!" notification
 * 
 * @param {string} text - Text to copy to clipboard
 */
function copyToClipboard(text) {
  // Create temporary textarea element
  const tempInput = document.createElement('textarea');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  
  // Select and copy the text
  tempInput.select();
  document.execCommand('copy');
  
  // Remove temporary element
  document.body.removeChild(tempInput);
  
  console.log('Copied to clipboard:', text);

  // Show the "Copied!" notification
  const notification = document.getElementById('copyNotification');
  notification.classList.add('show');

  // Hide the notification after 2 seconds
  setTimeout(() => {
    notification.classList.remove('show');
  }, 2000);
}