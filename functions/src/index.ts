import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2";

// Set global options
setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

// Export all functions from their separate files
export { generateStory } from "./generateStory";
export { generateThemeSuggestions } from "./generateThemeSuggestions";
export { getStories } from "./getStories";
export { getStory } from "./getStory";