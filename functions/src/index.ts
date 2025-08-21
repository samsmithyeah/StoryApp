import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";

// Set global options
setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

// Export all functions from their separate files
export { generateSingleImage } from "./generateSingleImage";
export { generateCoverImage } from "./generateCoverImage";
export { generateStory } from "./generateStory";
export { generateThemeSuggestions } from "./generateThemeSuggestions";
export { getStories } from "./getStories";
export { getStory } from "./getStory";
export { deleteUserData } from "./deleteUserData";
export { deleteStory } from "./deleteStory";
export { reportStory } from "./reportStory";

// Credit and purchase management functions
export { revenueCatWebhook } from "./revenueCatWebhook";
export {
  useCreditsReliable,
  checkCreditsAvailable,
  repairUserCredits,
} from "./creditOperations";
