# Building Standalone Android APK - Article Registry

## ✅ What's Been Prepared

1. ✅ App Icon Created (Blue document with sales badge)
2. ✅ App Name: "Article Registry"
3. ✅ Package: com.aisaco.articleregistry
4. ✅ EAS Build Configuration
5. ✅ Android-only setup

## 📱 Build Instructions

### Option 1: Build Using EAS (Recommended - Cloud Build)

#### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

#### Step 2: Login to Expo
```bash
eas login
```
(Create free account at expo.dev if you don't have one)

#### Step 3: Configure Project
```bash
cd /app/frontend
eas build:configure
```

#### Step 4: Build APK
```bash
eas build --platform android --profile production
```

This will:
- Build in Expo cloud (free tier available)
- Take 10-20 minutes
- Give you a download link for the APK
- No need for Android Studio or dev environment

#### Step 5: Download & Install
- Download APK from the link provided
- Transfer to Android device
- Enable "Install from Unknown Sources"
- Install the APK

---

### Option 2: Local Build (If you have Android Studio)

```bash
cd /app/frontend
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🎯 After Installation

Your standalone APK will:
✅ Work completely offline
✅ Not require Expo Go
✅ Not need dev server running
✅ Include all features:
   - CSV import
   - Article search & filters
   - Pricing calculator
   - Sales tracking
   - Statistics dashboard
   - PDF export

---

## 📋 App Features Summary

### For Your Sales Team:
1. **Article Management**
   - Import CSV from phone storage
   - Search & filter (season, section, supplier, price, sold items)
   - View detailed article information
   - Favorites & recent articles

2. **Pricing Calculator**
   - Market-specific commission rates
   - Transport & sampling costs
   - USD/yrd conversion for USA market
   - Save pricing history
   - Export PDF & email quotes

3. **Sales Tracking**
   - Record customer orders
   - Track quantity, color, price
   - Edit & delete sales records
   - View sales history per article
   - Sales badge on main list

4. **Statistics Dashboard**
   - Overview tab: Sales & revenue data
   - Catalog tab: Article statistics
   - Top selling articles
   - Recent sales
   - Distribution analysis

---

## 🔧 Updating the App

When you need to update:

1. Make changes in the code
2. Update version in `app.json`:
   ```json
   "version": "1.0.1"
   ```
3. Run build again:
   ```bash
   eas build --platform android --profile production
   ```
4. Distribute new APK to team

---

## 💾 Data Storage

All data is stored locally on device:
- Articles (from CSV)
- Sales records
- Pricing history
- Favorites
- Filters

**No cloud storage = Your data stays private**

---

## 📞 Distribution Options

### Internal Distribution (Your Use Case):

**Option A: Direct APK**
- Send APK file via email/WhatsApp
- Team installs manually
- Simple, no accounts needed

**Option B: EAS Updates (Over-the-Air)**
```bash
eas update
```
- Push updates without rebuilding
- Team gets updates automatically
- Requires EAS account (free tier available)

**Option C: Internal Testing Track**
- Upload to Google Play Internal Testing
- Share link with team
- Easy updates via Play Store

---

## 🎨 Customization

If you want to change:

**App Name:**
Edit `/app/frontend/app.json`:
```json
"name": "Your App Name"
```

**App Icon:**
Replace `/app/frontend/assets/icon.svg` with your logo

**Package Name:**
Edit `/app/frontend/app.json`:
```json
"android": {
  "package": "com.yourcompany.appname"
}
```

Then rebuild with `eas build`

---

## ⚡ Quick Start Command

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Navigate to project
cd /app/frontend

# Login to Expo (one time)
eas login

# Build APK (takes 10-20 min)
eas build --platform android --profile production
```

**You'll get a download link when done!**

---

## 📝 Notes

- First build takes ~20 minutes
- Subsequent builds are faster (~10 min)
- Free tier: 30 builds/month (more than enough)
- APK size: ~40-60 MB
- Minimum Android: 6.0 (API 23)
- Works on all Android phones/tablets

---

## 🚀 Ready to Build!

Everything is configured. Just run the EAS build command and you'll have your standalone APK in 20 minutes!

The app will work completely offline and can be distributed to your sales team internally via APK file or Play Store internal testing.
