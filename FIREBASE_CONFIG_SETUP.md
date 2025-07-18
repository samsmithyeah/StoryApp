# Firebase Configuration Setup

## Important Security Notice

The Firebase configuration files (`GoogleService-Info.plist` and `google-services.json`) are not included in this repository for security reasons as they contain API keys.

## Setup Instructions

### 1. Get Firebase Configuration Files

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to Project Settings (gear icon)

#### For iOS (GoogleService-Info.plist):

1. In Project Settings, select the iOS app
2. Download the `GoogleService-Info.plist` file
3. Place it in the root directory of this project

#### For Android (google-services.json):

1. In Project Settings, select the Android app
2. Download the `google-services.json` file
3. Place it in the root directory of this project

### 2. Regenerate Native Code

After adding the configuration files, regenerate the native iOS and Android code:

```bash
npx expo prebuild --clean
```

This will:

- Generate the `ios/` and `android/` folders
- Copy the Firebase configuration files to the correct locations
- Configure the native projects with your Firebase settings

### 3. Verify Setup

The files should be placed as follows:

```
/
├── GoogleService-Info.plist          # iOS Firebase config
├── google-services.json              # Android Firebase config
├── GoogleService-Info.plist.example  # Template (in repo)
└── google-services.json.example      # Template (in repo)
```

After `expo prebuild`, they'll also be copied to:

```
ios/StoryApp/GoogleService-Info.plist
android/app/google-services.json
```

## Security Notes

- ✅ Configuration files are in `.gitignore` to prevent accidental commits
- ✅ Example files show the required structure without exposing real keys
- ✅ Always use your own Firebase project's configuration files
- ⚠️ Never commit the actual configuration files to version control
