# Firestore Security Rules Setup

## Option 1: Manual Deployment via Firebase Console (Recommended)

1. **Go to Firebase Console**: https://console.firebase.google.com/project/storyapp-3f737/firestore/rules

2. **Replace the existing rules** with this content:

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
      // Allow creation (resource.data won't exist yet)
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. **Click "Publish"**

## Option 2: CLI Deployment (If you have Firebase CLI access)

1. **Login to Firebase CLI**:
   ```bash
   firebase login
   ```

2. **Deploy the rules**:
   ```bash
   ./deploy-firestore.sh
   ```

   Or manually:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Temporary Development Rules (For Testing Only)

If you need broader access during development, you can temporarily use these rules (⚠️ **NOT for production**):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Security Explanation

The production rules ensure:
- ✅ **Users can only access their own data**
- ✅ **Stories are tied to the user who created them**
- ✅ **Authenticated users only**
- ✅ **No unauthorized access to other users' children or stories**

## Files Created

- `firestore.rules` - Security rules
- `firebase.json` - Firebase configuration
- `firestore.indexes.json` - Database indexes
- `.firebaserc` - Project configuration
- `deploy-firestore.sh` - Deployment script