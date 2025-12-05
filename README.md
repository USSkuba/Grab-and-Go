
**A Chrome/Edge extension for EVE Online players to quickly copy and share wormhole system information from [wormholes.new-eden.io/maps](https://wormholes.new-eden.io/maps)**

---

## 📋 Features

- 🚀 **One-Click Copy**: Copy system data to clipboard with a single click
- 💬 **Discord Integration**: Send system info directly to Discord via webhook
- 🎨 **Multiple Themes**: Choose from 10+ color themes (EVE factions, custom themes)
- 🔄 **Dynamic Extraction**: Automatically detects user-configured destinations (not hardcoded)
- 📊 **Smart Tab Detection**: Works with both SHORTEST and SECURE routing tabs
- 🎯 **Format**: `System name, Security status, Hub1 Jumps1, Hub2 Jumps2, ...`

---

## 🔧 Installation Guide

### For Google Chrome:
1. Download the [latest release](https://github.com/USSkuba/Grab-and-Go/releases)
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the folder with the downloaded extension files

### For Microsoft Edge:
1. Download the [latest release](https://github.com/USSkuba/Grab-and-Go/releases)
2. Go to `edge://extensions/`
3. Enable **Developer mode** (toggle in left sidebar)
4. Click **Load unpacked**
5. Select the folder with the downloaded extension files

---

## 🎮 How to Use

1. **Navigate to a wormhole system** on [wormholes.new-eden.io/maps](https://wormholes.new-eden.io/maps)
2. **Select a system** on the map
3. **Click the Grab-and-Go extension icon** in your browser toolbar
4. **Choose an action**:
   - Click **"Copy to Clipboard"** to copy the data
   - Click **"Send to Discord"** to send via webhook (requires setup)

### Example Output:
```
Egmur, 0.7, C4, Jita 14, Hek 16, Amarr 5, Rens 16, Dodixie 10
```

---

## 💬 Discord Webhook Setup

To send data directly to Discord:

1. Go to your Discord server
2. Right-click on a channel → **Edit Channel**
3. Go to **Integrations** → **Webhooks** → **New Webhook**
4. Click **Copy Webhook URL**
5. Paste the URL into the **Discord Webhook URL** field in the extension
6. The URL is saved automatically for future use

---

## 🎨 Available Themes

- **Default** - Orange gradient
- **Slate** - Dark theme
- **Glacier** - Light gray
- **Amarr** - Gold/brown (EVE faction)
- **Caldari** - Blue (EVE faction)
- **Gallente** - Green (EVE faction)
- **Minmatar** - Red (EVE faction)
- **Ascendants** - Green/yellow
- **Cotton Candy** - Pink
- **Tyrian** - Purple

---

## 🛠️ Development & Customization

### File Structure:
```
grab-and-go/
├── manifest.json      # Extension configuration
├── popup.html         # User interface
├── popup.js           # Main logic (extensively commented)
├── colors.json        # Theme definitions
├── icon16.png         # Extension icon (16x16)
├── icon48.png         # Extension icon (48x48)
└── icon128.png        # Extension icon (128x128)
```

### Adding a New Theme:

1. **Edit `colors.json`** and add your theme definition:
```json
"mytheme": {
  "backgroundGradient": {
    "start": "#ff0000",
    "end": "#0000ff"
  },
  "titleBox": {
    "backgroundColor": "#ff0000",
    "fontColor": "#ffffff"
  },
  "copyButton": {
    "backgroundGradientStart": "#00ff00",
    "backgroundGradientEnd": "#008800",
    "hoverColor": "#00cc00",
    "fontColor": "#ffffff"
  },
  "headerData": {
    "fontColor": "#ffffff"
  },
  "number": {
    "fontColor": "#ffffff"
  },
  "notification": {
    "backgroundColor": "#00ff00",
    "fontColor": "#ffffff"
  }
}
```

2. **Edit `popup.html`** and add a dropdown option:
```html
<option value="mytheme">My Theme Name</option>
```

### Modifying the Output Format:

The output format is controlled in `popup.js` in the `getSystemData()` function:

```javascript
// Current format: "System name, Security status, Hub1 Jumps1, Hub2 Jumps2, ..."
const header = `${systemName}, ${securityStatus},`;
const destinationText = destinations.map(d => `${d.name} ${d.jumps}`).join(', ');
```

Modify these lines to change how data is formatted.

---

## 🐛 Troubleshooting

### Extension not working?

1. **Check if you're on the correct website**: `wormholes.new-eden.io/maps`
2. **Ensure a system is selected** on the map
3. **Open browser console** (F12) to see debug logs
4. **Check for errors** in the console

### Website structure changed?

The extension uses web scraping, so if the website updates its HTML structure:

1. Open the browser console (F12)
2. Look for error messages starting with "Could not find..."
3. See the [Development Guide](#-development--customization) below

---

## 📝 Maintenance Notes

### If the website structure changes:

The scraping logic is in `popup.js` with extensive comments. The main functions to update are:

1. **`extractSystemName()`** - Finds the system name
   - Update the `headerSelectors` array with new CSS selectors
   
2. **`extractSecurityStatus()`** - Finds security status
   - Update the `.system-type` selector if needed
   
3. **`extractDestinations()`** - Finds jump distances
   - Update the `.route-hub-summary` selector if needed

Each function has multiple fallback strategies, so updating one selector usually fixes issues.

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test your changes thoroughly
4. Submit a pull request with a clear description

---

## 📜 License

This project is open source. Please check the repository for license details.

---

## 🎯 Credits

Originally created as **GalaxyFinder QuickCopy** by [danielobCA](https://github.com/danielobCA)

Rebranded and enhanced as **Grab-and-Go** with improved scraping logic and extensive documentation.

---

## 💡 Tips

- The extension works best when the SHORTEST/SECURE panel is expanded
- You can customize destinations in the wormhole map's Route Settings
- Theme selection is saved and persists across sessions
- Discord webhook URL is saved locally (never sent to any server)

---

## 🔗 Links

- [EVE Online](https://www.eveonline.com/)
- [Wormhole Maps](https://wormholes.new-eden.io/maps)
- [GitHub Repository](https://github.com/USSkuba/Grab-and-Go)

---

**Fly safe! o7**
