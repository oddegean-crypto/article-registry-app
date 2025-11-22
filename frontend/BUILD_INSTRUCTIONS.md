# Article Registry - APK Build Instructions

## 📦 Package Contents

This package contains your complete Article Registry app, ready to build into an Android APK.

## 🚀 Quick Start Guide

### Prerequisites

1. **Node.js** (v18 or later)
   - Download: https://nodejs.org/
   
2. **Expo Account** (Free)
   - Sign up: https://expo.dev/signup

### Method 1: Build with EAS (Recommended - Easiest)

#### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

#### Step 2: Navigate to Project
```bash
cd frontend
```

#### Step 3: Login to EAS
```bash
eas login
```
- Enter your Expo email and password
- Or sign up at https://expo.dev/signup if you don't have an account

#### Step 4: Configure Project (First Time Only)
```bash
eas build:configure
```
- Select "Android" when prompted
- This will link your project to EAS

#### Step 5: Build the APK
```bash
eas build --platform android --profile preview
```

#### What Happens Next:
- ✅ Code is uploaded to EAS servers
- ✅ Build starts automatically (takes 10-15 minutes)
- ✅ You'll get a notification when done
- ✅ Download link for APK will be provided
- ✅ Install APK on your Android device

---

### Method 2: Build Locally (Advanced)

If you prefer to build on your own machine:

#### Step 1: Install Dependencies
```bash
cd frontend
npm install -g eas-cli
yarn install
```

#### Step 2: Install Android Studio
- Download: https://developer.android.com/studio
- Install Android SDK
- Set up environment variables

#### Step 3: Build Locally
```bash
eas build --platform android --profile preview --local
```

**Note:** Local builds require significant setup and disk space (~20GB)

---

## 📱 Installing the APK on Your Device

### After Build Completes:

1. **Download the APK** from the link provided by EAS
2. **Transfer to your Android device** (via USB, email, or cloud)
3. **Enable "Install from Unknown Sources"** in Android settings
4. **Open the APK file** and install
5. **Launch "Article Registry"** from your app drawer

---

## 🔧 App Configuration

### App Details:
- **Name:** Article Registry
- **Package:** com.aisaco.articleregistry
- **Version:** 1.0.0
- **Icon:** AISA & CO logo

### Permissions Required:
- **Storage:** For importing CSV files and exporting PDFs
- **No internet required** - App works completely offline!

---

## ✨ Features Included

✅ Article Registry Management
✅ CSV Import/Export
✅ Search, Filter, Sort
✅ Color Swatches & Hex Codes
✅ Sales Tracking
✅ Pricing Calculator
✅ PDF Export
✅ Dark Mode
✅ Contacts Management
✅ Offline Functionality

---

## 📂 Important Files

- `app.json` - App configuration
- `eas.json` - Build profiles
- `package.json` - Dependencies
- `assets/icon.png` - App icon (AISA logo)
- `app/` - All app screens and logic

---

## 🆘 Troubleshooting

### Build Failed?

**Issue:** "Project ID not set"
**Solution:** Run `eas build:configure` first

**Issue:** "Not logged in"
**Solution:** Run `eas login` and enter credentials

**Issue:** "Dependency version mismatch"
**Solution:** 
```bash
npx expo install --fix
npx expo-doctor
```

### Installation Issues?

**Issue:** "App not installed"
**Solution:** 
- Enable "Unknown sources" in Android settings
- Uninstall any previous versions
- Make sure you have enough storage space (>100MB)

**Issue:** "App crashes on startup"
**Solution:** 
- Ensure Android version is 6.0 or higher
- Clear app cache and reinstall

---

## 🔄 Updating the App

To build a new version:

1. Update version in `app.json`:
   ```json
   "version": "1.0.1",
   "versionCode": 2
   ```

2. Run build command again:
   ```bash
   eas build --platform android --profile preview
   ```

---

## 💡 Tips

- **First build takes longer** - EAS needs to set up environment
- **Subsequent builds are faster** - ~10 minutes
- **Save the APK file** - You can reinstall without rebuilding
- **Share with team** - Send APK file to anyone who needs the app

---

## 📞 Support

If you encounter issues:
1. Check EAS build logs for errors
2. Visit Expo documentation: https://docs.expo.dev
3. Expo forums: https://forums.expo.dev

---

## ✅ Build Checklist

Before building:
- [ ] Installed Node.js
- [ ] Installed EAS CLI (`npm install -g eas-cli`)
- [ ] Created Expo account
- [ ] Logged in (`eas login`)
- [ ] In correct directory (`cd frontend`)
- [ ] Run `eas build --platform android --profile preview`

That's it! Your app will be ready in 10-15 minutes. 🎉
