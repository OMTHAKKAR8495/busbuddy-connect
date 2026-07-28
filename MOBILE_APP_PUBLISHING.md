# 📱 GSFCU Transit — Native Mobile App Build & Publishing Guide

This guide details how to build and upload **GSFCU Transit** to the **Google Play Store** and **Apple App Store** using **Capacitor**.

---

## 🛠️ Step 1: Install Native Capacitor Platforms

Run the following commands inside your terminal:

```bash
# 1. Install Capacitor Core & CLI
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

# 2. Initialize Capacitor Project
npx cap init "GSFCU Transit" "in.ac.gsfcuniversity.transit" --web-dir dist

# 3. Add Android and iOS Native Projects
npx cap add android
npx cap add ios
```

---

## 🤖 Step 2: Build & Upload to Google Play Store (Android)

1. **Build Production Web Bundle**:
   ```bash
   npx vite build
   npx cap sync android
   ```

2. **Open Android Studio**:
   ```bash
   npx cap open android
   ```

3. **Generate Signed Android App Bundle (.aab)**:
   - In Android Studio, go to **Build** &rarr; **Generate Signed Bundle / APK...**
   - Select **Android App Bundle (.aab)**.
   - Choose your Upload Keystore certificate.
   - Click **Build**.

4. **Publish to Google Play Console**:
   - Log into [Google Play Console](https://play.google.com/console).
   - Create a new application: **GSFCU Transit**.
   - Go to **Production** &rarr; **Create new release**.
   - Upload the generated `.aab` file and submit for Google Play Store review!

---

## 🍎 Step 3: Build & Upload to Apple App Store (iOS)

1. **Build Production Web Bundle**:
   ```bash
   npx vite build
   npx cap sync ios
   ```

2. **Open Xcode on Mac**:
   ```bash
   npx cap open ios
   ```

3. **Configure Signing & Archive**:
   - Select your Apple Developer Signing Team under **Signing & Capabilities**.
   - Select **Any iOS Device (arm64)** as the target.
   - Go to **Product** &rarr; **Archive**.

4. **Publish to App Store Connect**:
   - In the Xcode Organizer window, click **Distribute App**.
   - Select **App Store Connect** &rarr; **Upload**.
   - Log into [App Store Connect](https://appstoreconnect.apple.com) and submit for Apple App Store review!

---

### 🌐 Instant Web PWA Mobile Installation

Your web deployment on Vercel is also an **installable Progressive Web App (PWA)**:
- **Web App URL**: [https://busbuddy-connect.vercel.app](https://busbuddy-connect.vercel.app)
- Users can open the URL on mobile and tap **`Add to Home Screen`** to install it immediately without going through store approvals!
