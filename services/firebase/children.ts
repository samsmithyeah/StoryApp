import { doc, getDoc, updateDoc } from "@react-native-firebase/firestore";
import { Child } from "../../types/child.types";
import { authService, db } from "./config";
import { handleAuthStateMismatch } from "./utils";

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
      dateOfBirth: child.dateOfBirth
        ? child.dateOfBirth.toDate
          ? child.dateOfBirth.toDate()
          : new Date(child.dateOfBirth)
        : undefined,
      createdAt: child.createdAt
        ? child.createdAt.toDate
          ? child.createdAt.toDate()
          : new Date(child.createdAt)
        : undefined,
      updatedAt: child.updatedAt
        ? child.updatedAt.toDate
          ? child.updatedAt.toDate()
          : new Date(child.updatedAt)
        : undefined,
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
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // More robust ID generation
      createdAt: child.createdAt || new Date(),
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
      child.id === childId
        ? { ...child, ...updates, updatedAt: new Date() }
        : child
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
