#!/bin/bash

echo "🔥 Deploying Firestore Rules..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Initialize Firebase project (if not already done)
if [ ! -f ".firebaserc" ]; then
    echo "📝 Setting up Firebase project..."
    echo '{"projects":{"default":"storyapp-3f737"}}' > .firebaserc
fi

echo "🚀 Deploying Firestore rules to project: storyapp-3f737"
echo "📋 Rules file: firestore.rules"

# Deploy only Firestore rules
firebase deploy --only firestore:rules --project storyapp-3f737

echo "✅ Firestore rules deployment complete!"
echo ""
echo "📖 To manually deploy in the future, run:"
echo "   firebase deploy --only firestore:rules"