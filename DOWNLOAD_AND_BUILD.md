# 📦 Download & Build Instructions

## Step 1: Download Project Files

Your project is packaged in: **article-registry-build.tar.gz** (1.2 MB)

### How to Download from Emergent:

**Option 1: Via Emergent File Browser**
1. Navigate to `/app/` folder
2. Find `article-registry-build.tar.gz`
3. Download to your computer

**Option 2: Direct Command (if you have terminal access)**
```bash
# Download using curl
curl https://[your-emergent-url]/app/article-registry-build.tar.gz -o article-registry-build.tar.gz
```

---

## Step 2: Extract Files

On your computer:

**macOS/Linux:**
```bash
tar -xzf article-registry-build.tar.gz
cd frontend
```

**Windows:**
- Use 7-Zip or WinRAR to extract
- Navigate to the `frontend` folder

---

## Step 3: Install Dependencies

```bash
npm install
```

This will take 3-5 minutes.

---

## Step 4: Build the APK

### Login to Expo:
```bash
npx eas-cli login
```
Enter your Expo.dev credentials.

### Configure (first time only):
```bash
npx eas-cli build:configure
```
Choose:
- Platform: Android
- Auto credentials: Yes

### Build:
```bash
npx eas-cli build -p android --profile preview
```

**Watch the terminal** - build takes 5-15 minutes.

---

## Step 5: Download & Install APK

When build completes, you'll see:
```
✅ Build finished!
📥 Download: https://expo.dev/artifacts/eas/xxxxx.apk
```

1. Open that URL
2. Download APK (50-70 MB)
3. Transfer to phone
4. Install!

---

## 📋 What's Included:

✅ All app screens (8 screens)
✅ Dark mode (complete)
✅ Supplier & customer contacts
✅ Sales tracking
✅ Pricing calculator
✅ Stats dashboard
✅ Offline-first architecture
✅ Ready to build configuration

---

## 🆘 Troubleshooting:

**"Cannot find module":**
```bash
rm -rf node_modules package-lock.json
npm install
```

**"EAS not found":**
```bash
npm install -g eas-cli
```

**Build fails:**
- Check you're logged in: `npx eas-cli whoami`
- Re-run: `npx eas-cli build -p android --profile preview`

---

## ⚡ Quick Reference:

```bash
# Extract
tar -xzf article-registry-build.tar.gz
cd frontend

# Install
npm install

# Login
npx eas-cli login

# Build
npx eas-cli build -p android --profile preview

# Download APK when done
# Install on phone
```

**Total time: ~20-30 minutes (including build time)**

---

Ready to build! 🚀
