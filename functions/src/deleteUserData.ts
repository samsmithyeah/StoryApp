import * as admin from "firebase-admin";
import { https } from "firebase-functions/v2";

const db = admin.firestore();
const storage = admin.storage();

export const deleteUserData = https.onCall({
  region: 'us-central1',
  cors: true,
  invoker: 'public'
}, async (request: https.CallableRequest) => {
  console.log('=== deleteUserData function called (v2) ===');
  console.log('Request auth:', request.auth);
  console.log('Request data:', request.data);
  
  const { auth } = request;
  
  if (!auth) {
    console.error('No auth object in request');
    throw new https.HttpsError('unauthenticated', 'User must be authenticated.');
  }
  
  if (!auth.uid) {
    console.error('No uid in auth object:', auth);
    throw new https.HttpsError('unauthenticated', 'User must be authenticated.');
  }
  
  console.log('Authenticated user ID:', auth.uid);
  
  const userId = auth.uid;
  console.log(`Starting data deletion for user: ${userId}`);
  
  try {
    // Create a batch for Firestore operations
    const batch = db.batch();
    
    // Delete user document
    const userDocRef = db.collection("users").doc(userId);
    batch.delete(userDocRef);
    console.log(`Queued user document for deletion: ${userId}`);
    
    // Delete user preferences
    const preferencesDocRef = db.collection("userPreferences").doc(userId);
    batch.delete(preferencesDocRef);
    console.log(`Queued user preferences for deletion: ${userId}`);
    
    // Delete children documents
    const childrenSnapshot = await db.collection("children")
      .where("userId", "==", userId)
      .get();
    
    childrenSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      console.log(`Queued child document for deletion: ${doc.id}`);
    });
    
    // Delete saved characters documents  
    const charactersSnapshot = await db.collection("savedCharacters")
      .where("userId", "==", userId)
      .get();
      
    charactersSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      console.log(`Queued saved character for deletion: ${doc.id}`);
    });
    
    // Delete stories documents
    const storiesSnapshot = await db.collection("stories")
      .where("userId", "==", userId)
      .get();
      
    storiesSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      console.log(`Queued story for deletion: ${doc.id}`);
    });
    
    // Commit all Firestore deletions
    await batch.commit();
    console.log(`Firestore data deleted successfully for user: ${userId}`);
    
    // Delete all user files from Firebase Storage
    try {
      const bucket = storage.bucket();
      const userStoragePrefix = `users/${userId}/`;
      
      // List all files with the user's prefix
      const [files] = await bucket.getFiles({ prefix: userStoragePrefix });
      
      if (files.length > 0) {
        // Delete all files in parallel
        const deletePromises = files.map(async (file) => {
          await file.delete();
          console.log(`Deleted storage file: ${file.name}`);
        });
        
        await Promise.all(deletePromises);
        console.log(`Storage cleanup completed for user: ${userId}`);
      } else {
        console.log(`No storage files found for user: ${userId}`);
      }
    } catch (storageError) {
      console.error(`Storage cleanup failed for user ${userId}:`, storageError);
      // Don't throw here - we want to continue even if storage cleanup fails
    }
    
    // Delete from Firebase Auth
    await admin.auth().deleteUser(userId);
    console.log(`User account deleted from Firebase Auth: ${userId}`);
    
    console.log(`Data deletion completed successfully for user: ${userId}`);
    
    return {
      success: true,
      message: "User data deleted successfully",
      deletedCollections: [
        "users",
        "userPreferences", 
        "children",
        "savedCharacters",
        "stories",
        "storage",
        "auth"
      ]
    };
    
  } catch (error) {
    console.error(`Error deleting user data for ${userId}:`, error);
    throw new https.HttpsError('unknown', 'Failed to delete user account.');
  }
});