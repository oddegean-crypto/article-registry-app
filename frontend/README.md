# 📱 Article Registry - AISA & CO

Professional textile article management app for Android.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Android-green)
![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020)

---

## 🎯 Quick Start

**Want to build the APK right now?**

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Go to project
cd frontend

# 3. Login to Expo
eas login

# 4. Build APK
eas build --platform android --profile preview
```

⏱️ **Wait 10-15 minutes** → Download APK → Install on Android device!

---

## 📖 Documentation

- **QUICK_START.txt** - 5-step quick reference guide
- **BUILD_INSTRUCTIONS.md** - Complete build guide with troubleshooting
- **BUILD_CHECKLIST.md** - Pre-build verification checklist
- **PACKAGE_CONTENTS.md** - Full package details and features

---

## ✨ Features

### Article Management
- Import articles from CSV files
- Search, filter, and sort capabilities
- Group articles by code with color variants
- Display color hex codes as visual swatches

### Sales Tracking
- Record sales by customer
- Track quantities and prices
- Edit and delete sales history
- View sales statistics dashboard

### Pricing Calculator
- Calculate prices with custom margins
- Add market-specific commissions
- Currency conversion (EUR/USD)
- Export calculations to PDF

### Data Export
- Generate branded PDF reports
- Export article details with color swatches
- Share via email or save locally
- All data stored offline

### User Experience
- 🌓 Full dark mode support
- 📱 Mobile-optimized interface
- 🔄 Works completely offline
- 💾 Automatic data persistence

---

## 🔧 Technical Info

**Built with:**
- React Native + Expo SDK 54
- TypeScript
- Expo Router (file-based routing)
- Local storage (expo-file-system)

**App Details:**
- Name: Article Registry
- Package: com.aisaco.articleregistry
- Icon: AISA & CO diamond logo
- Minimum Android: 6.0+

---

## 📦 What's Included

```
frontend/
├── app/                      # All app screens
│   ├── index.tsx            # Main article list
│   ├── article/[id].tsx     # Article details
│   ├── pricing/[id].tsx     # Pricing calculator
│   ├── stats.tsx            # Statistics
│   ├── contacts.tsx         # Contacts
│   └── filter.tsx           # Filters
├── assets/                  # Icons & images
│   └── icon.png            # AISA logo
├── app.json                # App config
├── eas.json                # Build profiles
└── package.json            # Dependencies
```

---

## 🚀 Build Options

### Option 1: EAS Build (Recommended)
- Cloud-based build
- No local setup required
- Takes 10-15 minutes
- Free for personal use

### Option 2: Local Build
- Requires Android Studio
- ~20GB disk space needed
- Full control over build process

📖 See **BUILD_INSTRUCTIONS.md** for both methods

---

## 📱 Installation

1. Build APK using EAS or locally
2. Download APK file to your device
3. Enable "Install from Unknown Sources"
4. Open APK and install
5. Launch "Article Registry"

No Google Play account needed!

---

## ✅ Status

| Component | Status |
|-----------|--------|
| ✅ Source Code | Complete |
| ✅ Dependencies | Verified (expo-doctor) |
| ✅ Configuration | Ready |
| ✅ Icons | AISA logo set |
| ✅ Documentation | Complete |
| ✅ Testing | Verified |

**Ready to build!** 🎉

---

## 💡 Pro Tips

- Save the APK file after building - you can reinstall without rebuilding
- Share APK with team members - no app store needed
- First build takes longer (~15 min), subsequent builds are faster (~10 min)
- Keep this source code as backup

---

## 📞 Support

- 📖 Read BUILD_INSTRUCTIONS.md for troubleshooting
- 🌐 Expo Documentation: https://docs.expo.dev
- 💬 Expo Forums: https://forums.expo.dev

---

## 📝 Version History

**v1.0.0** (Current)
- Initial release
- Complete article registry functionality
- Sales tracking and pricing calculator
- PDF export capabilities
- Dark mode support
- Offline functionality

---

**Developed for AISA & CO** | Textile Article Management
**Last Updated:** November 2024
