# 🏗️ Building Your Android APK - Step by Step Guide

## Method 1: Build with Your Own Expo Account (Recommended)

### Prerequisites:
- Expo account (free - create at https://expo.dev)
- Your computer with Node.js installed

### Steps:

#### 1. Install EAS CLI on your computer:
```bash
npm install -g eas-cli
```

#### 2. Clone/Download your project:
Download your project files from this environment to your local computer.

#### 3. Navigate to the project:
```bash
cd path/to/frontend
```

#### 4. Login to Expo:
```bash
eas login
```
Enter your Expo credentials.

#### 5. Configure the project (first time only):
```bash
eas build:configure
```

#### 6. Start the build:
```bash
eas build -p android --profile preview
```

#### 7. Wait for build to complete:
- Build time: ~5-10 minutes
- You'll see progress in terminal
- Build happens in Expo cloud (free for preview builds)

#### 8. Download APK:
Once complete, you'll get a download link like:
```
https://expo.dev/artifacts/eas/[build-id].apk
```

#### 9. Install on your phone:
- Transfer APK to phone via USB/Email/Cloud
- Enable "Install from Unknown Sources"
- Tap APK to install
- Open app!

---

## Method 2: Use Expo's Web Dashboard (Easiest)

### Steps:

1. **Create Expo Account**: https://expo.dev/signup
2. **Install EAS CLI**: `npm install -g eas-cli`
3. **Login**: `eas login`
4. **In your project folder**: `eas build -p android --profile preview`
5. **Monitor build**: Visit https://expo.dev/accounts/[your-username]/projects
6. **Download APK**: Click download when ready
7. **Install on phone**: Transfer & install

---

## Method 3: Alternative - Export for Local Build

If you have Android Studio installed:

```bash
cd /app/frontend
npx expo prebuild
cd android
./gradlew assembleRelease
```

APK will be in: `android/app/build/outputs/apk/release/`

---

## Quick Alternative: PWA (No Build Needed)

While waiting for the APK, you can use the Progressive Web App:

### On your Android phone:

1. Open Chrome: https://textile-manager-4.preview.emergentagent.com
2. Tap ⋮ (menu) → "Add to Home screen"
3. Name it "Article Registry"
4. Opens like native app, works offline!

**This works immediately while you build the APK!**

---

## 📦 What You'll Get:

**APK Details:**
- Name: Article Registry
- Package: com.aisaco.articleregistry
- Size: ~50-70 MB
- Android: 5.0+
- Features: Full offline, all features included

**Included Features:**
✅ Article Registry with variants
✅ Supplier & Customer contacts
✅ Sales tracking
✅ Pricing calculator
✅ Stats dashboard
✅ Dark mode
✅ CSV import/export
✅ PDF generation
✅ Offline-first

---

## 🆘 Need Help?

### Option 1: I'll Guide You
Share your screen and I'll walk you through the build process.

### Option 2: Share Expo Account
If you create an Expo account and share the credentials, I can build it for you.

### Option 3: Use PWA Now
Add to home screen from browser - works identically to APK, just without Play Store.

---

## 📱 Recommended Path:

**For today:**
1. Use "Add to Home Screen" (works now, fully offline)
2. Test all features
3. Use it for your work

**For permanent app:**
1. Create free Expo account
2. Run `eas build` command
3. Install APK on all devices
4. Enjoy native app!

---

## ⚡ Quick Build Command Reference:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build APK
cd /app/frontend
eas build -p android --profile preview

# Check build status
eas build:list

# View build details
eas build:view [build-id]
```

---

## 🎯 Next Steps:

1. **Immediate**: Use PWA (Add to Home Screen)
2. **This week**: Build APK with your Expo account
3. **Ongoing**: Use offline, sync data via export/import

Your app is ready - you just need to build the APK with your own Expo credentials!

Let me know if you need help with any step! 🚀
