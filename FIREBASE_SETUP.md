# Firebase Setup Instructions

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name your project (e.g., "dreamweaver-app")
4. Enable Google Analytics (optional)
5. Create the project

## 2. Configure Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Go to **Sign-in method** tab
4. Enable the following providers:
   - **Email/Password**: Enable and save
   - **Google**: Enable and save
   - **Apple**: Enable and save (for iOS)

## 3. Create Mobile Apps

### Android App

1. Click **Add app** → **Android**
2. Enter package name: `com.samlovesit.StoryApp`
3. Download `google-services.json`
4. **Replace** the placeholder file in the project root directory

### iOS App

1. Click **Add app** → **iOS**
2. Enter bundle ID: `com.samlovesit.StoryApp`
3. Download `GoogleService-Info.plist`
4. **Replace** the placeholder file in the project root directory

## 4. Update app.json Configuration

Update your `app.json` with the correct paths and client IDs:

The app.json is already configured with the correct bundle identifiers. You just need to:

1. Replace the placeholder Firebase config files with the real ones from Firebase Console
2. Update the iOS URL scheme in the Google Sign-In plugin configuration

Find this section in app.json and replace `YOUR_IOS_CLIENT_ID`:

```json
[
  "@react-native-google-signin/google-signin",
  {
    "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
  }
]
```

## 5. Environment Variables

Create a `.env` file in the project root:

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
```

To get your Google Web Client ID:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** → **Credentials**
4. Find the "Web client (auto created by Google Service)" entry
5. Copy the Client ID

## 6. Configure Google Sign-In

### For Android:

1. Get your SHA-1 certificate fingerprint:

   ```bash
   # For development
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

   # For production (use your actual keystore)
   keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
   ```

2. In Firebase Console:
   - Go to **Project Settings** → **Your apps** → **Android app**
   - Click **Add fingerprint**
   - Add your SHA-1 fingerprint

### For iOS:

1. In Firebase Console, go to **Project Settings** → **Your apps** → **iOS app**
2. Copy the **iOS URL scheme** from the GoogleService-Info.plist
3. Update your `app.json` with the correct iOS URL scheme

## 7. Firestore Database Setup

1. Go to **Firestore Database** in Firebase Console
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your preferred location
5. Click **Done**

## 8. Security Rules (Production)

Update Firestore security rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can only read/write their own stories
    match /stories/{storyId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

## 9. Build and Test

1. Create a development build:

   ```bash
   npx expo run:ios
   # or
   npx expo run:android
   ```

2. Test authentication flows:
   - Email/Password sign up and sign in
   - Google Sign-In
   - Apple Sign-In (iOS only)

## Troubleshooting

### Common Issues:

1. **Google Sign-In not working**:
   - Verify SHA-1 fingerprint is correct
   - Check that Web Client ID is correct in .env
   - Ensure google-services.json is in the right location

2. **Firebase not initializing**:
   - Check that config files are in the root directory
   - Verify app.json configuration
   - Run `npx expo run:ios` or `npx expo run:android` to rebuild

3. **iOS issues**:
   - Ensure iOS URL scheme is correct in app.json
   - Check that GoogleService-Info.plist is included
   - Verify bundle identifier matches Firebase configuration

4. **Build issues**:
   - Make sure all plugins are installed
   - Check that expo-build-properties is configured correctly
   - Clear cache: `npx expo start --clear`
