# 🚀 METHOD 1: Build Your Android APK - Complete Guide

## 📦 What You Need to Download from This Environment

### Required Files (Download these from /app/frontend/):

```
/app/frontend/
├── app/                    (entire folder - all your screens)
├── assets/                 (entire folder - icons, images)
├── node_modules/          (can skip - will reinstall)
├── app.json               ✅ CRITICAL
├── eas.json               ✅ CRITICAL
├── package.json           ✅ CRITICAL
├── tsconfig.json          ✅ CRITICAL
├── metro.config.js        ✅ CRITICAL
├── .env                   ✅ CRITICAL
├── .gitignore
├── babel.config.js
└── yarn.lock
```

### Your CSV Files to Include:
```
/app/
├── registry-new.csv              (your articles)
├── suppliers.csv                 (your suppliers)
├── customers.csv                 (your customers)
```

---

## 🛠️ Step-by-Step Build Instructions

### Prerequisites Installation:

#### 1. Install Node.js (if not installed):
- Download from: https://nodejs.org/
- Version: 18.x or 20.x (latest LTS)
- Verify: `node --version`

#### 2. Install EAS CLI globally:
```bash
npm install -g eas-cli
```

Verify installation:
```bash
eas --version
```

Should show: `eas-cli/X.X.X`

---

## 📥 Download & Setup Process

### Step 1: Download Project Files

**Option A: Use Emergent Download Feature**
- Download the entire `/app/frontend` folder from this environment

**Option B: Manual File Download**
Download these files one by one:
1. All files in `/app/frontend/app/` folder
2. `app.json`
3. `eas.json`
4. `package.json`
5. `tsconfig.json`
6. `metro.config.js`
7. `.env`

### Step 2: Setup on Your Computer

```bash
# Create project folder
mkdir article-registry-app
cd article-registry-app

# Place all downloaded files here
# Your structure should look like:
# article-registry-app/
#   ├── app/
#   ├── assets/
#   ├── app.json
#   ├── eas.json
#   ├── package.json
#   └── ...
```

### Step 3: Install Dependencies

```bash
# Install project dependencies
npm install
# or
yarn install
```

This will:
- Download all required packages
- Set up Expo Router
- Configure build tools
- Takes ~3-5 minutes

---

## 🏗️ Building the APK

### Step 1: Create Expo Account

1. Go to: https://expo.dev/signup
2. Sign up (free account)
3. Verify your email
4. Remember your credentials

### Step 2: Login to EAS

```bash
eas login
```

Enter:
- Your Expo email
- Your Expo password

You'll see: `✔ Logged in as [your-email]`

### Step 3: Configure Build (First Time Only)

```bash
eas build:configure
```

This will:
- Link project to your Expo account
- Setup build profiles
- Generate credentials

**Important**: When asked questions, choose:
- Platform: `Android`
- Build profile: `preview`
- Auto credentials: `Yes`

### Step 4: Start the Build

```bash
eas build -p android --profile preview
```

You'll see:
```
✔ Build started
✔ Build in progress...
✔ Project: article-registry-app
✔ Build ID: [some-id]
✔ Track progress: https://expo.dev/...
```

**Build Time**: 5-15 minutes

### Step 5: Monitor Build Progress

**Option A: Terminal**
- Watch progress in your terminal
- Shows: Uploading → Building → Finishing

**Option B: Web Dashboard**
- Open: https://expo.dev/accounts/[your-username]/projects/article-registry-app
- See real-time build status
- View build logs

### Step 6: Download APK

When build completes, you'll see:
```
✔ Build finished!
✔ Download URL: https://expo.dev/artifacts/eas/[build-id].apk
```

**Two ways to download:**

1. **Direct link** (from terminal output)
2. **Web dashboard** → Click "Download" button

---

## 📲 Installing APK on Android Phone

### Method A: Direct Download on Phone

1. Open the download URL on your Android phone
2. Download the APK file
3. Tap notification → Install
4. If blocked:
   - Settings → Security
   - Enable "Install from Unknown Sources"
   - Try again

### Method B: Transfer from Computer

1. Download APK on computer
2. Connect phone via USB
3. Copy APK to phone's Download folder
4. On phone:
   - Open Files app
   - Navigate to Downloads
   - Tap APK file → Install

### Method C: Cloud Transfer

1. Upload APK to Google Drive/Dropbox
2. Open on phone
3. Download and install

---

## ✅ First Launch Setup

After installing:

1. **Open the app** (icon: "Article Registry")
2. **Grant permissions** (storage access for CSV import)
3. **Import your data**:
   - Tap "Import CSV" → Select articles CSV
   - Tap "Contacts" → Import Suppliers
   - Switch to Customers → Import Customers
4. **Test offline**:
   - Turn off WiFi/Mobile data
   - Browse, search, add sales
   - Everything works!

---

## 🔧 Troubleshooting

### Build Fails?

**"Credentials error":**
```bash
eas credentials
```
Follow prompts to regenerate.

**"Project not found":**
```bash
eas build:configure
```
Re-link project.

**"Build timeout":**
- Just retry: `eas build -p android --profile preview`

### APK Won't Install?

**"App not installed":**
- Uninstall old version first
- Free up storage space
- Enable unknown sources

**"Parse error":**
- Re-download APK (might be corrupted)
- Check Android version (need 5.0+)

### Dependencies Issues?

```bash
# Clear and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

---

## 📊 Build Profiles Explained

Your `eas.json` has 3 profiles:

### `preview` (Recommended for testing):
```bash
eas build -p android --profile preview
```
- Quick build (~5-10 min)
- APK format (easy install)
- Good for testing

### `production` (For final version):
```bash
eas build -p android --profile production
```
- Optimized build (~15 min)
- APK format
- Best performance

### `development` (For debugging):
```bash
eas build -p android --profile development
```
- Dev mode enabled
- Slower performance
- Useful for debugging

**Use `preview` for now!**

---

## 🎯 Quick Command Reference

```bash
# Login
eas login

# Check login status
eas whoami

# Build APK
eas build -p android --profile preview

# Check build status
eas build:list

# View specific build
eas build:view [build-id]

# Cancel ongoing build
eas build:cancel

# View logs
eas build:view [build-id] --logs
```

---

## 💡 Tips & Best Practices

### Before Building:

1. ✅ Test app in browser first
2. ✅ Verify all features work
3. ✅ Update version in `app.json` if rebuilding
4. ✅ Check `package.json` dependencies

### During Build:

1. ⏱️ Don't close terminal
2. 📊 Monitor progress online
3. ☕ Wait patiently (5-15 min)
4. 💾 Save build ID/URL

### After Build:

1. 📲 Test on real device
2. ✅ Verify offline mode
3. 📝 Note any issues
4. 🔄 Rebuild if needed (free!)

---

## 🆘 Getting Help

### Expo Documentation:
- General: https://docs.expo.dev/
- EAS Build: https://docs.expo.dev/build/introduction/
- Troubleshooting: https://docs.expo.dev/build-reference/troubleshooting/

### Common Issues:
- Expo Forums: https://forums.expo.dev/
- Stack Overflow: [expo] tag
- Discord: Expo Community

### Or Ask Me:
- Share error message
- Show build logs
- I'll help debug!

---

## 🎉 Success Checklist

After successful build:

- [ ] APK downloaded
- [ ] Installed on phone
- [ ] App opens
- [ ] CSV import works
- [ ] Articles browse works
- [ ] Contacts imported
- [ ] Sales recording works
- [ ] Offline mode confirmed
- [ ] Dark mode toggles
- [ ] All features tested

**You're done! Professional offline mobile app ready!** 🚀

---

## 📁 Files to Download Summary

**Minimum Required:**
1. `/app/frontend/app/` (entire folder)
2. `/app/frontend/assets/` (entire folder)
3. `/app/frontend/app.json`
4. `/app/frontend/eas.json`
5. `/app/frontend/package.json`
6. `/app/frontend/tsconfig.json`
7. `/app/frontend/metro.config.js`
8. `/app/frontend/.env`

**Optional but Recommended:**
9. `/app/frontend/babel.config.js`
10. `/app/frontend/.gitignore`
11. `/app/frontend/yarn.lock`

**Your Data:**
12. `/app/registry-new.csv`
13. `/app/suppliers.csv`
14. `/app/customers.csv`

---

## ⚡ Ultra-Quick Start

For experienced developers:

```bash
# 1. Download project
# 2. Extract to folder
cd article-registry-app

# 3. Install & build
npm install && eas login && eas build -p android --profile preview

# 4. Wait for build
# 5. Download APK
# 6. Install on phone
# 7. Done!
```

**Total time: ~20 minutes (including build time)**

---

Ready to build? Download the files and follow the steps above! Let me know if you need help with any step! 🚀
