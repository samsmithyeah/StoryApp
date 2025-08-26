import { useEffect, useRef } from "react";
import { useChildrenStore } from "../store/childrenStore";
import { useAuth } from "./useAuth";
import { logger } from "../utils/logger";

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
      const previousUserId = lastUserIdRef.current;
      lastUserIdRef.current = user?.uid || null;

      if (!user) {
        // User logged out, clear children
        if (previousUserId) {
          // Only log if there was a previous user
          logger.debug("User logged out, clearing children", {
            previousUserId,
          });
        }
        clearChildren();
      } else if (!previousUserId) {
        // Fresh login (no previous user)
        logger.debug("User logged in, loading children", { userId: user.uid });
        clearChildren();
        loadChildren();
      } else {
        // User switch (shouldn't happen in normal flow)
        logger.debug("User switched, reloading children", {
          previousUserId,
          newUserId: user.uid,
        });
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
