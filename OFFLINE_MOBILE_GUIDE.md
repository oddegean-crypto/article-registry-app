# 📱 Building Android APK for Offline Use

## Your App is Already Offline-Capable! ✅

All data in your app is stored locally:
- Articles → Local storage (FileSystem)
- Suppliers → Local storage
- Customers → Local storage
- Sales History → Local storage
- Favorites, Recent, Filters → Local storage
- Dark Mode preference → Local storage

**No internet connection needed after initial setup!**

---

## 🏗️ Build Android APK

### Step 1: Install EAS CLI (if not already installed)

```bash
cd /app/frontend
npm install -g eas-cli
```

### Step 2: Login to Expo (if needed)

```bash
eas login
```

### Step 3: Build Android APK

```bash
eas build -p android --profile preview
```

This will:
1. Create a build in the cloud
2. Generate an APK file
3. Provide a download link

**Build time: ~5-10 minutes**

### Step 4: Download & Install

1. Once build completes, you'll get a download URL
2. Download the APK to your Android phone
3. Enable "Install from Unknown Sources" in Android settings
4. Install the APK
5. Open the app!

---

## 📦 Alternative: Quick Local Build

If you want to build locally (faster but requires Android Studio):

```bash
cd /app/frontend
npx expo run:android
```

---

## 💾 How Offline Mode Works

### Initial Setup (requires internet):
1. Install the APK
2. Import your CSV files:
   - Articles CSV
   - Suppliers CSV
   - Customers CSV

### After Setup (NO internet needed):
✅ Browse all articles
✅ View article details
✅ Record sales
✅ Calculate pricing
✅ View statistics
✅ Search & filter
✅ Contact suppliers/customers (email/call uses phone's apps)
✅ Export PDFs
✅ Switch dark mode

### Data Persistence:
- All data saved locally in app storage
- Survives app restarts
- No cloud sync (fully offline)
- Backup: Export data via sharing/email

---

## 🔄 Alternative: PWA (Progressive Web App)

If you prefer not to build an APK, you can use the web version offline:

### On Android Chrome/Samsung Internet:

1. Open: https://textile-manager-4.preview.emergentagent.com
2. Tap **Menu (⋮)** → **"Add to Home Screen"**
3. Name it "Article Registry"
4. An app icon appears on your home screen
5. Open from home screen (works like native app)

**Limitations:**
- Requires initial internet connection
- Limited offline caching (browser-dependent)
- APK is better for full offline use

---

## 📋 What to Prepare Before Going Offline

### Export These Files to Your Phone:

1. **Articles CSV** - Your main registry
2. **Suppliers CSV** - Updated_Suppliers_v3 (10).csv
3. **Customers CSV** - Updated_Customers_v3 (1).csv

### Import Them in Order:

1. Open app
2. Import Articles → Browse all articles
3. Tap "Contacts" → Import Suppliers
4. Switch to Customers tab → Import Customers

**Now you're 100% offline-ready!**

---

## 🎯 Offline Features Checklist

✅ **Browse Articles** - All articles available
✅ **Article Details** - View full specs
✅ **Variant Grouping** - Expand color ways
✅ **Hex Colors** - Color swatches visible
✅ **Sales Tracking** - Record & view sales
✅ **Pricing Calculator** - Calculate prices
✅ **Stats Dashboard** - View analytics
✅ **Advanced Filters** - Filter by season/section/etc
✅ **Search** - Search articles/contacts
✅ **Dark Mode** - Toggle anytime
✅ **Suppliers Contact** - View & call/email
✅ **Customers Contact** - View & call/email
✅ **PDF Export** - Generate PDFs
✅ **Favorites** - Save favorite articles
✅ **Recent History** - Track recently viewed

---

## ⚡ Quick Start Commands

### Build APK (Cloud - Easiest):
```bash
cd /app/frontend
eas build -p android --profile preview
```

### Check Build Status:
```bash
eas build:list
```

### View Build Details:
```bash
eas build:view [build-id]
```

---

## 📲 After Installing APK

### First Launch:
1. Open the app
2. Grant storage permissions (for CSV import)
3. Import your 3 CSV files
4. Start using offline!

### Daily Use:
- No internet needed
- All features work
- Data persists
- Updates only via new APK installs

---

## 🆘 Troubleshooting

**Q: Build fails?**
- Check eas.json is valid
- Ensure app.json has correct package name
- Try: `eas build:cancel` then rebuild

**Q: APK won't install?**
- Enable "Unknown Sources" in Android settings
- Check available storage space
- Uninstall old version first

**Q: CSV import not working?**
- Grant storage permissions
- Use device's file picker
- Ensure CSV format is correct

**Q: Data disappeared?**
- Check app wasn't uninstalled
- Don't clear app data in Android settings
- Regular exports recommended

---

## 🎉 You're Ready!

Your app is designed for offline field work:
- Trade shows ✅
- Customer visits ✅
- Supplier meetings ✅
- Warehouse checks ✅
- No internet? No problem! ✅

Build the APK and take your entire fabric registry with you everywhere! 🚀
