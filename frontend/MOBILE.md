# CreatorX Mobile Apps

This document explains how to build, test, and deploy the CreatorX mobile apps for iOS and Android.

## Overview

CreatorX uses **Capacitor** to wrap the React web app into native iOS and Android applications. The same codebase serves:
- **Web Browser** (PWA enabled)
- **iOS App** (App Store)
- **Android App** (Google Play Store)

### Architecture

```
React + TypeScript + Vite
         ↓
   Build (dist/)
         ↓
    Capacitor
    /        \
  iOS       Android
```

## Setup Complete ✓

The following has been configured:

- ✅ Capacitor core and CLI installed
- ✅ iOS and Android platform projects created
- ✅ Platform detection utilities (`src/utils/platform.ts`)
- ✅ Native features hook (`src/hooks/useNativeFeatures.ts`)
- ✅ Platform-aware API configuration
- ✅ HashRouter for mobile (file:// protocol compatibility)
- ✅ Build scripts for web and mobile
- ✅ 7 Capacitor plugins installed:
  - Splash Screen
  - Status Bar
  - Keyboard
  - App (lifecycle, back button)
  - Haptics
  - Share
  - Network

## Development Workflow

### Web Development (Unchanged)

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The browser version continues to work exactly as before with PWA features enabled.

### Mobile Development

#### Build for Mobile

```bash
# Build web assets for mobile
npm run build:mobile

# Sync web assets to native projects
npm run cap:sync

# Or combine both
npm run mobile:build
```

#### iOS Development

**Prerequisites:**
- Mac with Xcode installed
- Apple Developer account (for device testing and App Store)

**Open in Xcode:**
```bash
npm run ios:dev
```

This will:
1. Build the web app for mobile
2. Sync to iOS project
3. Open Xcode

**In Xcode:**
1. Select a simulator (iPhone 14, 15, etc.)
2. Press the Play button to run
3. Test the app

#### Android Development

**Prerequisites:**
- Android Studio installed
- Android SDK configured

**Open in Android Studio:**
```bash
npm run android:dev
```

This will:
1. Build the web app for mobile
2. Sync to Android project
3. Open Android Studio

**In Android Studio:**
1. Select an emulator or connected device
2. Press Run button
3. Test the app

### Live Reload (Advanced)

For faster development with live reload:

1. Find your local IP: `ifconfig | grep inet`
2. Update `capacitor.config.ts`:
```typescript
server: {
  url: 'http://YOUR_IP:3000',
  cleartext: true,
  allowNavigation: [...]
}
```
3. Start dev server: `npm run dev`
4. Sync: `npm run cap:sync`
5. Run app in native IDE

**Important:** Remove `server.url` before building for production!

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Web development server |
| `npm run build` | Build for web (with PWA) |
| `npm run build:mobile` | Build for mobile (no PWA) |
| `npm run cap:sync` | Sync web build to iOS & Android |
| `npm run cap:sync:ios` | Sync to iOS only |
| `npm run cap:sync:android` | Sync to Android only |
| `npm run cap:open:ios` | Open Xcode |
| `npm run cap:open:android` | Open Android Studio |
| `npm run mobile:build` | Build + sync (both platforms) |
| `npm run mobile:build:ios` | Build + sync iOS |
| `npm run mobile:build:android` | Build + sync Android |
| `npm run ios:dev` | Full iOS workflow (build + open) |
| `npm run android:dev` | Full Android workflow (build + open) |

## Platform Detection

Use the platform utility to conditionally run code:

```typescript
import { platform } from '@/utils/platform'

// Check if running in native app
if (platform.isNative()) {
  // Use native camera
}

// Check specific platform
if (platform.isIOS()) {
  // iOS-specific code
}

if (platform.isAndroid()) {
  // Android-specific code
}

// Web-specific code
if (platform.isWeb()) {
  // Browser-only features
}
```

## API Configuration

The app automatically uses the correct API URL based on the environment:

- **Web Dev**: `http://localhost:8000`
- **Web Prod**: Same origin (nginx proxy at `/api`)
- **Mobile**: `https://api.minimalthreads.in` (from `.env.mobile`)

No code changes needed - this is handled automatically in `src/config.ts`.

## Testing Checklist

Before each release, test:

- [ ] Authentication (login/signup)
- [ ] Dashboard navigation
- [ ] Script generation
- [ ] Title generation
- [ ] Thumbnail ideas
- [ ] Social media captions
- [ ] SEO optimizer
- [ ] Persona management
- [ ] API connectivity
- [ ] Offline behavior
- [ ] Back button (Android)
- [ ] Status bar styling
- [ ] Splash screen
- [ ] Screen rotation
- [ ] Keyboard behavior

## Deployment

### Web Deployment (Unchanged)

```bash
npm run build
# Deploy dist/ to nginx server
```

Web deployment continues to work exactly as before.

### iOS App Store

**Prerequisites:**
- Apple Developer Account ($99/year)
- App Store Connect app created
- App icons and screenshots prepared

**Steps:**
1. Build: `npm run mobile:build:ios`
2. Open Xcode: `npm run cap:open:ios`
3. Select "Any iOS Device (arm64)"
4. Configure signing (Team, Bundle ID)
5. Product → Archive
6. Upload to App Store Connect
7. Complete App Store listing
8. Submit for review

**Before submitting:**
- Set `webContentsDebuggingEnabled: false` in `capacitor.config.ts`
- Update version in `ios/App/App/Info.plist`
- Test on physical device
- Prepare privacy policy URL

### Android Play Store

**Prerequisites:**
- Google Play Developer Account ($25 one-time)
- Play Console app created
- App icons and screenshots prepared

**Steps:**
1. Build: `npm run mobile:build:android`
2. Open Android Studio: `npm run cap:open:android`
3. Build → Generate Signed Bundle/APK
4. Select "Android App Bundle"
5. Create/select keystore
6. Upload AAB to Play Console
7. Complete Play Store listing
8. Submit for review

**Before submitting:**
- Set `webContentsDebuggingEnabled: false` in `capacitor.config.ts`
- Update `versionCode` and `versionName` in `android/app/build.gradle`
- Test on physical Android device
- Prepare privacy policy URL

## Troubleshooting

### Build Errors

**"Cannot find module '@capacitor/core'"**
```bash
npm install
```

**"Missing dist directory"**
```bash
npm run build:mobile
```

### iOS Issues

**"Failed to open project"**
- Ensure Xcode is installed
- Try: `cd ios && pod install`

**"Code signing error"**
- Configure your Apple Developer Team in Xcode
- Signing & Capabilities → Select your team

### Android Issues

**"SDK not found"**
- Open Android Studio → SDK Manager
- Install latest Android SDK

**"Gradle sync failed"**
- File → Invalidate Caches and Restart
- Try: `cd android && ./gradlew clean`

### General Issues

**"White screen on app launch"**
- Check browser console in device inspector
- Verify API URL is correct for mobile
- Check network connectivity

**"App crashes on startup"**
- Check native logs in Xcode/Android Studio
- Verify all plugins are synced: `npm run cap:sync`

## Next Steps

### Phase 1 (Complete) ✓
- Core Capacitor setup
- Platform detection
- Basic native features

### Phase 2 (Optional)
Add native features as needed:
- Camera integration (for image uploads)
- File system access
- Push notifications
- Biometric authentication
- Offline mode

To add a plugin:
```bash
npm install @capacitor/camera
npm run cap:sync
```

Then use in code with platform detection:
```typescript
import { Camera } from '@capacitor/camera'
import { platform } from '@/utils/platform'

if (platform.isNative()) {
  const photo = await Camera.getPhoto({...})
}
```

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [iOS Development Guide](https://capacitorjs.com/docs/ios)
- [Android Development Guide](https://capacitorjs.com/docs/android)
- [Plugin API Reference](https://capacitorjs.com/docs/apis)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Play Store Policy](https://play.google.com/about/developer-content-policy/)

## Support

For issues or questions:
1. Check this documentation
2. Search [Capacitor Discussions](https://github.com/ionic-team/capacitor/discussions)
3. Review [Capacitor Issues](https://github.com/ionic-team/capacitor/issues)
