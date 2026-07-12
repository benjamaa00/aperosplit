# AperoSplit Mobile App Setup

This guide explains how to build and run the AperoSplit mobile app using Capacitor.

## Prerequisites

- Node.js and pnpm installed
- Android Studio (for Android) or Xcode (for iOS)
- A deployed backend server

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Build the app:**
   ```bash
   pnpm build
   ```

3. **Sync with Capacitor:**
   ```bash
   npx cap sync
   ```

## Building for Android

1. **Add Android platform (if not already added):**
   ```bash
   npx cap add android
   ```

2. **Sync and build:**
   ```bash
   pnpm cap:build:android
   ```

3. **Open Android Studio:**
   ```bash
   pnpm cap:android
   ```

4. **In Android Studio:**
   - Wait for Gradle sync to complete
   - Connect your Android device via USB or start an emulator
   - Click the "Run" button (green triangle)

## Building for iOS

1. **Add iOS platform (if not already added):**
   ```bash
   npx cap add ios
   ```

2. **Sync and build:**
   ```bash
   pnpm cap:build:ios
   ```

3. **Open Xcode:**
   ```bash
   pnpm cap:ios
   ```

4. **In Xcode:**
   - Select your team in the Signing & Capabilities tab
   - Connect your iOS device via USB or start a simulator
   - Click the "Run" button (play icon)

## Configuration

### Backend URL

The mobile app needs to connect to your backend server. Set the `VITE_API_URL` environment variable:

1. Create a `.env` file in the project root:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

2. For local development with a local backend:
   ```
   VITE_API_URL=http://YOUR_LOCAL_IP:3000
   ```
   (Replace `YOUR_LOCAL_IP` with your computer's IP address)

### Environment Variables

Required environment variables for the backend:
- `DATABASE_URL` - PostgreSQL connection string
- `GROUP_ACCESS_PIN` - Access code for group authentication
- `OAUTH_SERVER_URL` - OAuth server URL (optional)

## Real-time Sync

The mobile app automatically syncs data every 5 seconds when the app is active. This ensures that:
- When someone adds an expense, all other phones see it within 5 seconds
- When someone requests a payment, everyone is notified
- Payment confirmations are instantly synced

## Testing on Device

### Android
1. Enable USB debugging on your phone
2. Connect via USB
3. Run from Android Studio

### iOS
1. Connect your iPhone via USB
2. Trust the computer on your phone
3. Run from Xcode

## Troubleshooting

### "Connection refused" error
- Make sure your backend server is running
- Check that `VITE_API_URL` is set correctly
- For local testing, use your computer's IP address instead of localhost

### Build fails
- Make sure you've run `pnpm build` before `npx cap sync`
- Clear Capacitor cache: `npx cap sync android --clean`

### App crashes on startup
- Check the backend logs for errors
- Verify that `DATABASE_URL` and `GROUP_ACCESS_PIN` are set correctly

## Publishing

### Android
1. Build a release APK or AAB in Android Studio
2. Upload to Google Play Store

### iOS
1. Archive the app in Xcode
2. Upload to App Store Connect
3. Submit for review
