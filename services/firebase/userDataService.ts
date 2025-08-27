import { doc, getDoc } from "@react-native-firebase/firestore";
import { db } from "./config";
import { FirestoreUserData } from "../../types/firestore.types";
import { logger } from "../../utils/logger";

/**
 * Pure data fetching service for user data from Firestore
 * This service doesn't depend on any other auth services to avoid circular dependencies
 */
export const fetchUserData = async (
  uid: string
): Promise<FirestoreUserData | null> => {
  logger.debug("Fetching user data from Firestore", { uid });
  const userRef = doc(db, "users", uid);
  const userDoc = await getDoc(userRef);
  return userDoc.exists() ? (userDoc.data() as FirestoreUserData) : null;
};
