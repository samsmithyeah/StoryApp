import { doc, getDoc, updateDoc } from "@react-native-firebase/firestore";
import { authService, db } from "./config";
import { Child } from "../../types/child.types";

// Get children for the current user
export const getChildren = async (): Promise<Child[]> => {
  const user = authService.currentUser;
  if (!user) throw new Error("User not authenticated");

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
};

// Add a new child
export const addChild = async (child: Omit<Child, "id">): Promise<Child> => {
  const user = authService.currentUser;
  if (!user) throw new Error("User not authenticated");

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
};

// Update an existing child
export const updateChild = async (
  childId: string,
  updates: Partial<Omit<Child, "id">>
): Promise<void> => {
  const user = authService.currentUser;
  if (!user) throw new Error("User not authenticated");

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
};

// Delete a child
export const deleteChild = async (childId: string): Promise<void> => {
  const user = authService.currentUser;
  if (!user) throw new Error("User not authenticated");

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
};
