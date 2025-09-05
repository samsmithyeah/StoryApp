import { doc, getDoc, updateDoc } from "@react-native-firebase/firestore";
import { authService, db } from "./config";
import { Child } from "../../types/child.types";
import { logger } from "../../utils/logger";

// Helper function to handle auth state mismatch
const handleAuthStateMismatch = async (error: any, operation: string) => {
  if (error.code === "firestore/permission-denied") {
    logger.error(`Authentication state mismatch detected during ${operation}`, {
      errorCode: error.code,
      errorMessage: error.message,
    });

    // Import signOut dynamically to avoid circular dependency
    try {
      const { useAuthStore } = await import("../../store/authStore");
      const { signOut } = useAuthStore.getState();
      logger.warn(
        `Forcing sign out due to auth state mismatch in ${operation}`
      );
      await signOut();
    } catch (signOutError) {
      logger.error(
        "Failed to sign out during auth state mismatch recovery",
        signOutError
      );
    }

    // Re-throw with a more user-friendly message
    throw new Error("Authentication session expired. Please sign in again.");
  }
  throw error;
};

// Get children for the current user
export const getChildren = async (): Promise<Child[]> => {
  const user = authService.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();

    const children = userData?.children || [];

    // Convert Firestore timestamps back to Date objects
    return children.map((child: any) => ({
      ...child,
      dateOfBirth: child.dateOfBirth?.toDate
        ? child.dateOfBirth.toDate()
        : new Date(child.dateOfBirth),
      createdAt: child.createdAt?.toDate
        ? child.createdAt.toDate()
        : child.createdAt || new Date(),
      updatedAt: child.updatedAt?.toDate
        ? child.updatedAt.toDate()
        : child.updatedAt,
    }));
  } catch (error) {
    await handleAuthStateMismatch(error, "getChildren");
    return []; // This line will never be reached due to the throw above, but keeps TypeScript happy
  }
};

// Add a new child
export const addChild = async (child: Omit<Child, "id">): Promise<Child> => {
  const user = authService.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const newChild: Child = {
      ...child,
      id: Date.now().toString(), // Simple ID generation
    };

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    const currentChildren = userData?.children || [];

    await updateDoc(userDocRef, {
      children: [...currentChildren, newChild],
    });

    return newChild;
  } catch (error) {
    await handleAuthStateMismatch(error, "addChild");
    throw error; // Re-throw after handling auth mismatch
  }
};

// Update an existing child
export const updateChild = async (
  childId: string,
  updates: Partial<Omit<Child, "id">>
): Promise<void> => {
  const user = authService.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    const currentChildren = userData?.children || [];

    const updatedChildren = currentChildren.map((child: Child) =>
      child.id === childId ? { ...child, ...updates } : child
    );

    await updateDoc(userDocRef, {
      children: updatedChildren,
    });
  } catch (error) {
    await handleAuthStateMismatch(error, "updateChild");
    throw error; // Re-throw after handling auth mismatch
  }
};

// Delete a child
export const deleteChild = async (childId: string): Promise<void> => {
  const user = authService.currentUser;
  if (!user) throw new Error("User not authenticated");

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    const currentChildren = userData?.children || [];

    const filteredChildren = currentChildren.filter(
      (child: Child) => child.id !== childId
    );

    await updateDoc(userDocRef, {
      children: filteredChildren,
    });
  } catch (error) {
    await handleAuthStateMismatch(error, "deleteChild");
    throw error; // Re-throw after handling auth mismatch
  }
};
