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
  } = useChildrenStore();
  
  const { user } = useAuth();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Only load children once when user is available and we haven't loaded yet
    if (user && !hasLoadedRef.current && !loading && children.length === 0) {
      console.log('[USE_CHILDREN] Loading children for first time');
      hasLoadedRef.current = true;
      loadChildren();
    }
  }, [user, loadChildren, loading, children.length]);

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
