# Building RoofMaster 360 for App Stores

This guide explains how to build native iOS and Android apps from this Expo project for submission to the Apple App Store and Google Play Store.

## Prerequisites

### For iOS (App Store)
- Mac computer with macOS
- Xcode 15 or later (free from Mac App Store)
- Apple Developer Account ($99/year) - https://developer.apple.com
- CocoaPods installed: `sudo gem install cocoapods`

### For Android (Google Play)
- Windows, Mac, or Linux computer
- Android Studio (free) - https://developer.android.com/studio
- Google Play Developer Account ($25 one-time) - https://play.google.com/console

### For Both
- Node.js 18 or later
- Git

## Step 1: Download and Setup

1. Download this project from Replit (three dots menu → Download as zip)
2. Extract the zip file
3. Open Terminal/Command Prompt and navigate to the project folder:
   ```bash
   cd RoofMaster360
   ```
4. Install dependencies:
   ```bash
   npm install
   ```

## Step 2: Generate Native Projects

Run the Expo prebuild command to generate native iOS and Android folders:

```bash
npx expo prebuild --clean
```

This creates:
- `ios/` folder - Xcode project
- `android/` folder - Android Studio project

## Step 3: Building for iOS

1. Navigate to the ios folder and install CocoaPods:
   ```bash
   cd ios
   pod install
   cd ..
   ```

2. Open the project in Xcode:
   ```bash
   open ios/RoofMaster360.xcworkspace
   ```
   
   **Important**: Open `.xcworkspace`, NOT `.xcodeproj`

3. In Xcode:
   - Select your development team (Signing & Capabilities)
   - Select a connected iPhone or "Any iOS Device" as build target
   - Product → Archive to create a release build
   - Distribute App → App Store Connect

4. Upload to App Store Connect and submit for review

## Step 4: Building for Android

1. Open Android Studio

2. Select "Open" and navigate to the `android/` folder

3. Wait for Gradle sync to complete

4. Generate a signed APK or App Bundle:
   - Build → Generate Signed Bundle / APK
   - Choose Android App Bundle (recommended for Play Store)
   - Create or select your keystore file
   - Choose release build variant

5. Upload the .aab file to Google Play Console

## Environment Variables for Production

Before building, ensure these environment variables are set in your native project:

For iOS, add to `ios/RoofMaster360/Info.plist` or use Xcode build settings.
For Android, add to `android/app/build.gradle` or `gradle.properties`.

Required variables:
- `EXPO_PUBLIC_DOMAIN` - Your production domain (e.g., your-app.replit.app)

## App Store Submission Checklist

### iOS App Store
- [ ] App icon (1024x1024 PNG, no transparency)
- [ ] Screenshots for required device sizes
- [ ] App description and keywords
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Age rating questionnaire completed

### Google Play Store
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots for phone and tablet
- [ ] Short and full description
- [ ] Privacy policy URL
- [ ] Content rating questionnaire completed

## Alternative: EAS Build (Cloud-based)

If you prefer not to build locally, you can use Expo's cloud build service:

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Configure build:
   ```bash
   eas build:configure
   ```

4. Build for stores:
   ```bash
   eas build --platform ios
   eas build --platform android
   ```

This builds in Expo's cloud and provides download links for your .ipa and .aab files.

## Troubleshooting

### iOS Build Errors
- "No signing certificate" - Add your Apple Developer account in Xcode Preferences → Accounts
- Pod install fails - Run `pod repo update` then try again

### Android Build Errors
- "SDK not found" - Open SDK Manager in Android Studio and install required SDK versions
- Gradle sync fails - File → Invalidate Caches and Restart

## Support

For issues with this app, visit: https://lionshareanimation.com
