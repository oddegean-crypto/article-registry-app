# 🚀 Push Your Article Registry App to GitHub

## Step 1: Create a New Repository on GitHub

1. Go to **https://github.com/new**
2. Fill in the details:
   - **Repository name:** `article-registry-app` (or your preferred name)
   - **Description:** "Article Registry mobile app for textile management"
   - **Visibility:** Private or Public (your choice)
   - ⚠️ **DO NOT** check "Add README" or "Add .gitignore" (we already have these)
3. Click **"Create repository"**

---

## Step 2: Get Your Repository URL

After creating, GitHub will show you a page with commands. Copy the **repository URL**:

```
https://github.com/YOUR_USERNAME/article-registry-app.git
```

Or if you use SSH:

```
git@github.com:YOUR_USERNAME/article-registry-app.git
```

---

## Step 3: Push from This Environment

Run these commands in this environment (I've already prepared the git repo):

```bash
cd /app/frontend

# Add your GitHub repository as remote
git remote add origin YOUR_REPOSITORY_URL_HERE

# Push to GitHub
git push -u origin master
```

**Example:**
```bash
git remote add origin https://github.com/yourusername/article-registry-app.git
git push -u origin master
```

You'll be asked for your GitHub credentials:
- **Username:** Your GitHub username
- **Password:** Use a **Personal Access Token** (not your password)

### How to Create a Personal Access Token:

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: "Article Registry App"
4. Select scopes: ✅ **repo** (full control of private repositories)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)
7. Use this token as your password when pushing

---

## Step 4: Clone to Your Local Computer

Once pushed to GitHub, open your local terminal/command prompt:

```bash
# Clone the repository
git clone YOUR_REPOSITORY_URL_HERE

# Go into the folder
cd article-registry-app

# Install dependencies
yarn install

# You're ready to build!
```

---

## Step 5: Build the APK

Now follow the build instructions:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

---

## 🎉 Done!

Your app is now on GitHub and you can:
- ✅ Clone it to any computer
- ✅ Share it with your team
- ✅ Keep track of changes
- ✅ Build the APK locally

---

## 📝 Quick Command Reference

```bash
# View git status
git status

# View commit history
git log --oneline

# Pull latest changes
git pull

# Push new changes
git add .
git commit -m "Your message"
git push
```

---

Need help? Check the other documentation files:
- README.md - Project overview
- BUILD_INSTRUCTIONS.md - Complete build guide
- QUICK_START.txt - 5-step build guide
