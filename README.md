# 📊 Productivity Tracker

![License](https://img.shields.io/badge/License-MIT-green.svg)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Chrome-blue)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)
[![Download Desktop App](https://img.shields.io/badge/Desktop_App-Download-orange)](./rwatch_application/main.exe)
[![Download Extension](https://img.shields.io/badge/Browser_Extension-Download-yellow)](./rwatch_extension/)

This project helps students and users monitor their productivity by tracking time spent on educational tools and websites. It consists of:

- 🧩 A browser extension  
- 🖥 A desktop application (Python-based, packaged as an `.exe`)

---

## 🔧 Setup Instructions

### 📥 1. Download Components

#### 🧩 Browser Extension
- [Download ZIP](./rwatch_extension/) and load it as an unpacked extension:
  1. Open Chrome and go to `chrome://extensions/`
  2. Enable **Developer mode**
  3. Click **Load unpacked**
  4. Select the `rwatch_extension/` folder

#### 🖥 Desktop App
- [Download the `.exe`](./rwatch_application/main.exe)
- Double-click to run the application. No installation needed.

> 💡 If blocked by Windows, right-click → **Properties** → **Unblock**, or click **More Info > Run Anyway**.

---

## 🧠 How It Works

- The **extension** monitors browser activity on study-related sites (e.g., online IDEs, documentation).
- The **desktop app** logs time spent in apps like VS Code or Jupyter Notebook.
- Both components will sync with a backend (coming soon!) and generate visual productivity stats.

---

## 📄 License

This project is licensed under the **MIT License**.  
See the [LICENSE](./LICENSE) file for details.
