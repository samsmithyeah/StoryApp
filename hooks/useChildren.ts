import { useEffect } from 'react';
import { useChildrenStore } from '../store/childrenStore';

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

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

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