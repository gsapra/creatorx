# CI/CD Guide for CreatorX

## Overview

This guide explains the Continuous Integration and Continuous Deployment (CI/CD) setup for CreatorX across web, iOS, and Android platforms.

---

## GitHub Actions Workflow

### Current Setup

**File**: `.github/workflows/frontend-ci.yml`

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Only when frontend files change

**Jobs**:
1. **Test & Lint** - TypeScript check + ESLint
2. **Build Web** - Production web build
3. **Build Mobile** - Mobile app build
4. **Deploy Web** - Auto-deploy to production (main branch only)

### Required GitHub Secrets

Add these in: `Settings → Secrets and variables → Actions`

**For web deployment** (if using SSH):
- `SSH_PRIVATE_KEY` - Private SSH key for server access
- `SERVER_HOST` - Server hostname or IP
- `SERVER_USER` - SSH username

**For alternative deployments**:
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

---

## Web Deployment

### Option 1: SSH to Your Server (Current)

**Prerequisites**:
- Server with nginx installed
- SSH access configured
- Directory `/var/www/creatorx/` exists

**Setup**:
```bash
# On your server
sudo mkdir -p /var/www/creatorx
sudo chown $USER:$USER /var/www/creatorx

# Generate SSH key locally (if not exists)
ssh-keygen -t rsa -b 4096 -C "ci@creatorx.app"

# Copy public key to server
ssh-copy-id user@your-server.com

# Add private key to GitHub Secrets
cat ~/.ssh/id_rsa
# Copy output and add as SSH_PRIVATE_KEY secret
```

**Manual Deployment**:
```bash
cd frontend
npm run build
rsync -avz --delete dist/ user@server:/var/www/creatorx/
ssh user@server 'sudo systemctl reload nginx'
```

### Option 2: Vercel (Recommended for Easy Deployment)

**Setup**:
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `cd frontend && vercel`
3. Link to project
4. Get tokens: `vercel --token` and from Vercel dashboard
5. Add tokens to GitHub Secrets

**Deployment Command**:
```bash
cd frontend
vercel --prod
```

### Option 3: Netlify

**Setup**:
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run: `cd frontend && netlify init`
3. Connect to Git repository
4. Auto-deploys on push to main

**Deployment Command**:
```bash
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

### Option 4: AWS S3 + CloudFront

**Setup**:
```bash
# Install AWS CLI
aws configure

# Create S3 bucket
aws s3 mb s3://creatorx-web

# Enable static website hosting
aws s3 website s3://creatorx-web --index-document index.html --error-document index.html

# Upload build
aws s3 sync dist/ s3://creatorx-web --delete

# Invalidate CloudFront cache (if using CloudFront)
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

---

## iOS Deployment

### Fastlane Setup (Recommended for Automation)

**Install**:
```bash
cd frontend/ios
gem install fastlane
fastlane init
```

**Fastfile Example**:
```ruby
# frontend/ios/fastlane/Fastfile

platform :ios do
  desc "Build and upload to TestFlight"
  lane :beta do
    # Increment build number
    increment_build_number

    # Build app
    build_app(
      scheme: "App",
      workspace: "App.xcworkspace",
      export_method: "app-store"
    )

    # Upload to TestFlight
    upload_to_testflight(
      skip_waiting_for_build_processing: true
    )
  end

  desc "Release to App Store"
  lane :release do
    # Build and upload
    build_app(
      scheme: "App",
      workspace: "App.xcworkspace",
      export_method: "app-store"
    )

    upload_to_app_store(
      submit_for_review: true,
      automatic_release: true,
      skip_screenshots: true
    )
  end
end
```

**Required Secrets** (add to GitHub):
- `APPLE_ID` - Apple Developer email
- `FASTLANE_PASSWORD` - Apple ID password
- `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD` - App-specific password
- `MATCH_PASSWORD` - Password for certificate encryption (if using match)

**Deploy Commands**:
```bash
# TestFlight
cd frontend/ios
fastlane beta

# Production
fastlane release
```

### Manual iOS Deployment

```bash
cd frontend

# Build web assets
npm run mobile:build:ios

# Open Xcode
npm run cap:open:ios

# In Xcode:
# 1. Select "Any iOS Device (arm64)"
# 2. Product → Archive
# 3. Window → Organizer
# 4. Upload to App Store Connect
```

---

## Android Deployment

### Fastlane Setup

**Fastfile Example**:
```ruby
# frontend/android/fastlane/Fastfile

platform :android do
  desc "Build and upload to Play Store Beta"
  lane :beta do
    # Build release bundle
    gradle(
      task: "bundle",
      build_type: "Release",
      project_dir: "android/"
    )

    # Upload to Play Store Beta track
    upload_to_play_store(
      track: "beta",
      aab: "android/app/build/outputs/bundle/release/app-release.aab",
      skip_upload_screenshots: true,
      skip_upload_images: true
    )
  end

  desc "Deploy to Play Store Production"
  lane :production do
    gradle(
      task: "bundle",
      build_type: "Release",
      project_dir: "android/"
    )

    upload_to_play_store(
      track: "production",
      rollout: "0.1", # Start with 10% rollout
      aab: "android/app/build/outputs/bundle/release/app-release.aab"
    )
  end

  desc "Promote beta to production"
  lane :promote do
    upload_to_play_store(
      track: "beta",
      track_promote_to: "production",
      rollout: "1.0"
    )
  end
end
```

**Required Secrets**:
- `PLAY_STORE_JSON_KEY` - Service account JSON key

**Deploy Commands**:
```bash
# Beta
cd frontend/android
fastlane beta

# Production
fastlane production

# Promote beta to prod
fastlane promote
```

### Manual Android Deployment

```bash
cd frontend

# Build web assets
npm run mobile:build:android

# Open Android Studio
npm run cap:open:android

# In Android Studio:
# 1. Build → Generate Signed Bundle/APK
# 2. Select "Android App Bundle"
# 3. Choose keystore
# 4. Build
# 5. Upload to Play Console
```

---

## Environment Variables

### Development
```bash
# frontend/.env
VITE_API_BASE_URL=http://localhost:8000
```

### Production Web
```bash
# frontend/.env.production
VITE_API_BASE_URL=  # Uses nginx proxy
```

### Mobile
```bash
# frontend/.env.mobile
VITE_API_BASE_URL=https://api.minimalthreads.in
VITE_PLATFORM=mobile
```

---

## Automated Workflows

### GitHub Actions for iOS (Advanced)

```yaml
# .github/workflows/ios-deploy.yml
name: iOS Deploy

on:
  push:
    tags:
      - 'v*-ios'

jobs:
  deploy:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build for mobile
        working-directory: ./frontend
        run: npm run build:mobile

      - name: Sync to iOS
        working-directory: ./frontend
        run: npm run cap:sync:ios

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'
          bundler-cache: true

      - name: Install Fastlane
        run: gem install fastlane

      - name: Deploy to TestFlight
        working-directory: ./frontend/ios
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          FASTLANE_PASSWORD: ${{ secrets.FASTLANE_PASSWORD }}
        run: fastlane beta
```

### GitHub Actions for Android

```yaml
# .github/workflows/android-deploy.yml
name: Android Deploy

on:
  push:
    tags:
      - 'v*-android'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build for mobile
        working-directory: ./frontend
        run: npm run build:mobile

      - name: Sync to Android
        working-directory: ./frontend
        run: npm run cap:sync:android

      - name: Setup Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'

      - name: Install Fastlane
        run: gem install fastlane

      - name: Deploy to Play Store
        working-directory: ./frontend/android
        env:
          PLAY_STORE_JSON_KEY: ${{ secrets.PLAY_STORE_JSON_KEY }}
        run: fastlane beta
```

---

## Version Management

### Semantic Versioning

Follow semver: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (2.0.0)
- **MINOR**: New features (1.1.0)
- **PATCH**: Bug fixes (1.0.1)

### Updating Versions

**Package.json**:
```bash
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.1 → 1.1.0
npm version major  # 1.1.0 → 2.0.0
```

**iOS** (Info.plist):
```xml
<key>CFBundleShortVersionString</key>
<string>1.0.1</string>
<key>CFBundleVersion</key>
<string>2</string>
```

**Android** (build.gradle):
```gradle
versionCode 2  // Increment by 1 each release
versionName "1.0.1"  // Semver
```

---

## Release Process

### 1. Prepare Release

```bash
# Update version
npm version minor

# Update CHANGELOG.md
# - New features
# - Bug fixes
# - Breaking changes

# Commit
git add .
git commit -m "Release v1.1.0"
git tag v1.1.0
git push origin main --tags
```

### 2. Web Deployment

Automatically deployed via GitHub Actions on push to main.

**Manual**:
```bash
npm run build
# Deploy dist/ to server
```

### 3. Mobile Deployment

**iOS**:
```bash
cd frontend/ios
fastlane beta  # TestFlight
# or
fastlane release  # Production
```

**Android**:
```bash
cd frontend/android
fastlane beta  # Play Store Beta
# or
fastlane production  # Production
```

### 4. Verify Deployment

- [ ] Web app loads at https://minimalthreads.in
- [ ] TestFlight build available
- [ ] Play Store Beta build available
- [ ] No critical errors in logs
- [ ] Monitoring dashboards green

### 5. Monitor & Rollout

- Watch crash reports for 24 hours
- Monitor user feedback
- Gradually increase Android rollout
- Promote to 100% if stable

---

## Troubleshooting

### Build Fails on CI

**Check**:
- Node version matches (18)
- Dependencies installed correctly
- TypeScript compiles locally
- Lint passes locally

**Fix**:
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Test locally
npm run build
```

### Deployment Fails

**SSH Issues**:
- Verify SSH key added to GitHub Secrets
- Test SSH access: `ssh user@server`
- Check server permissions

**Vercel/Netlify Issues**:
- Check token validity
- Verify project linked correctly
- Review build logs

### iOS Build Fails

**Common Issues**:
- Provisioning profile expired
- Certificate invalid
- Wrong Xcode version
- Missing dependencies

**Fix**:
- Run `pod install` in `ios/` directory
- Update certificates in Xcode
- Clean build: Product → Clean Build Folder

### Android Build Fails

**Common Issues**:
- Gradle sync failed
- Keystore not found
- Wrong build tools version

**Fix**:
```bash
cd android
./gradlew clean
./gradlew build
```

---

## Best Practices

1. **Never commit secrets** - Use GitHub Secrets
2. **Test locally first** - Don't rely on CI to catch errors
3. **Incremental rollouts** - Start with 5-10% on Android
4. **Monitor closely** - Watch crash reports after each release
5. **Automate everything** - Reduce human error
6. **Document changes** - Keep CHANGELOG.md updated
7. **Use feature flags** - Enable/disable features remotely
8. **Rollback plan** - Know how to revert quickly

---

## Summary

**Current Status**:
- ✅ GitHub Actions CI configured
- ✅ Automated web deployment ready
- ⚠️ Manual mobile deployment (Fastlane optional)

**Next Steps**:
1. Configure GitHub Secrets
2. Test CI pipeline
3. Optional: Setup Fastlane for mobile
4. Optional: Add automated testing

**Quick Commands**:
```bash
# Web deploy
git push origin main

# iOS deploy
cd frontend/ios && fastlane beta

# Android deploy
cd frontend/android && fastlane beta
```
