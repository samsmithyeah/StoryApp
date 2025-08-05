import { useEffect, useRef } from "react";
import { useChildrenStore } from "../store/childrenStore";
import { useAuth } from "./useAuth";

export const useChildren = () => {
  const {
    children,
    loading,
    error,
    loadChildren,
    addChild,
    updateChild,
    deleteChild,
    setError,
    clearChildren,
  } = useChildrenStore();

  const { user } = useAuth();
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Clear children when user changes (including logout)
    if (user?.uid !== lastUserIdRef.current) {
      console.log(
        "[USE_CHILDREN] User changed from",
        lastUserIdRef.current,
        "to",
        user?.uid
      );
      lastUserIdRef.current = user?.uid || null;

      if (!user) {
        // User logged out, clear children
        console.log("[USE_CHILDREN] User logged out, clearing children");
        clearChildren();
      } else {
        // User logged in or switched accounts, clear and reload
        console.log(
          "[USE_CHILDREN] User logged in, clearing and reloading children"
        );
        clearChildren();
        loadChildren();
      }
    }
  }, [user, loadChildren, clearChildren]);

  return {
    children,
    loading,
    error,
    addChild,
    updateChild,
    deleteChild,
    refreshChildren: loadChildren,
    clearError: () => setError(null),
  };
};
