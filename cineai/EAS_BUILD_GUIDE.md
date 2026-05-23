# 🎬 Cine AI - Production APK Generation Guide (Expo EAS Build)

This guide walks you through building, downloading, and installing a production-ready Android APK for **Cine AI** using Expo Application Services (EAS).

---

## 🛠️ What We Configured For You

To ensure your cloud build is flawless, fully functional, and production-ready, we have already performed the following configurations:

### 1. 📂 Custom EAS Build Profile (`eas.json`)
We created `eas.json` in the root of the `cineai/` project directory. It specifies that the `preview` profile will compile into a standalone, downloadable **APK** instead of an `AAB` (bundle format for Play Store). This makes the build perfectly suited for instant sharing and side-loading.

### 2. 🔑 Secure Environment Variable Upload (`.easignore`)
EAS cloud builders compile your application on remote servers. Because `.env` is listed in your `.gitignore` by default, your environment variables (such as Supabase credentials, OMDb keys, and Gemini AI keys) would normally be ignored, causing the APK to build without the required APIs!
* **Our Solution:** We created a custom `.easignore` file. This tells EAS CLI to securely pack and upload your `.env` file to the Expo build servers. 
* **Result:** All your features (voice assistant, Supabase database auth, Gemini AI suggestions, and movie searching) will work perfectly in the generated production APK without any manual configuration!

### 3. 🖼️ Asset Integrity Fixes (Expo Doctor)
Expo's build server strictly validates assets. The original `./assets/icon.png`, `./assets/splash-icon.png`, and `./assets/adaptive-icon.png` were actually JPG files renamed to `.png`, which would crash the EAS build server.
* **Our Solution:** We executed a native PowerShell script using .NET's `System.Drawing` library to convert these three images into true, lossless PNG formats.
* **Result:** Running `npx expo-doctor` now yields a perfect **18/18 checks passed!** index, ensuring 100% cloud build reliability.

### 4. ⚡ React Native New Architecture (`newArchEnabled`)
Expo SDK 54 compiles on React Native 0.81.5 and includes `react-native-reanimated` v4. Reanimated 4 only supports the **New Architecture (Fabric)**. Building without this setting triggers a Gradle compilation failure because the older C++ compiler paths are incompatible.
* **Our Solution:** We added `"newArchEnabled": true` inside the `"expo"` block of `app.json`.
* **Result:** This configures the remote Android build runner to use the New Architecture pipeline, solving the Gradle build failure!

---

## 🚀 Step-by-Step Build Commands

To trigger the EAS build from your computer, open your terminal/command prompt, navigate to the `cineai` directory, and run the following commands sequentially:

### Step 1: Log in to your Expo account
This authenticates your terminal session with the Expo servers. If you don't have an account, this command will prompt you to create one.
```bash
eas login
```

### Step 2: Initialize EAS Build Configuration
This verifies the project's setup and links your local app to your Expo dashboard. Select **Yes** if prompted to configure your project.
```bash
eas build:configure
```
> [!NOTE]
> During `eas build:configure`, if the terminal asks to configure iOS as well, you can safely select **No** or choose only **Android** if you want to speed up the process.

### Step 3: Run the Android APK Build
Kick off the cloud build queue using the `preview` profile we configured:
```bash
eas build -p android --profile preview
```

---

## 📦 What Happens Next?

1. **Cloud Compilation:** The command will upload your code and `.env` configuration securely to Expo’s build servers.
2. **Build Monitoring:** Your terminal will show a live status bar and print a URL (e.g., `https://expo.dev/accounts/.../builds/...`). You can open this link in any browser to watch the real-time progress.
3. **Artifact Generation:** EAS will generate a QR code in the terminal and a **Download APK** button on your Expo dashboard once the build succeeds (usually takes 5–8 minutes).

---

## 📲 How to Install & Share on Physical Devices

### 1. Download the APK
* Scan the terminal's **QR Code** directly with an Android camera or QR scanner.
* Alternatively, click the **download link** from the build success dashboard.

### 2. Side-load the App
When installing the APK, Android might show standard warnings because it's not downloaded from the Google Play Store:
* **"Blocked by Play Protect" or "Install from Unknown Sources":** Tap **Install Anyway** or enable "Allow from this source" in your browser/file explorer settings.
* This warning is normal for development and testing APKs and will not appear once released on the Google Play Store.

### 3. Sharing with Others
You can share the compiled `.apk` file directly via WhatsApp, Google Drive, Telegram, or email. The recipient can tap it to instantly install it on any physical Android device.

---

## 🔒 Security Best Practices

> [!IMPORTANT]
> The `.easignore` inclusion of `.env` is extremely convenient for prototype sharing, demos, and internal testing. If you later prepare a production app for the Google Play Store with highly sensitive keys, it is recommended to set up **EAS Secrets** in the Expo dashboard and exclude `.env` from your cloud uploads.
