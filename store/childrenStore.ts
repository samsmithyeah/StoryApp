import { create } from "zustand";
import { Child, ChildrenState } from "../types/child.types";
import {
  getChildren,
  addChild as addChildService,
  updateChild as updateChildService,
  deleteChild as deleteChildService,
} from "../services/firebase/children";

interface ChildrenStore extends ChildrenState {
  loadChildren: () => Promise<void>;
  addChild: (child: Omit<Child, "id">) => Promise<void>;
  updateChild: (
    childId: string,
    updates: Partial<Omit<Child, "id">>
  ) => Promise<void>;
  deleteChild: (childId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useChildrenStore = create<ChildrenStore>((set, get) => ({
  children: [],
  loading: false,
  error: null,

  loadChildren: async () => {
    // Prevent concurrent loading calls
    const currentState = get();
    if (currentState.loading) {
      console.log('[CHILDREN_STORE] Already loading children, skipping...');
      return;
    }
    
    try {
      console.log('[CHILDREN_STORE] Starting to load children...');
      set({ loading: true, error: null });
      const children = await getChildren();
      console.log('[CHILDREN_STORE] Children loaded:', children.length, 'children');
      set({ children, loading: false });
    } catch (error) {
      console.log('[CHILDREN_STORE] Error loading children:', error);
      set({
        error:
          error instanceof Error ? error.message : "Failed to load children",
        loading: false,
      });
    }
  },

  addChild: async (child) => {
    try {
      set({ loading: true, error: null });
      const newChild = await addChildService(child);
      const currentChildren = get().children;
      set({
        children: [...currentChildren, newChild],
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to add child",
        loading: false,
      });
    }
  },

  updateChild: async (childId, updates) => {
    try {
      set({ loading: true, error: null });
      await updateChildService(childId, updates);
      const currentChildren = get().children;
      const updatedChildren = currentChildren.map((child) =>
        child.id === childId ? { ...child, ...updates } : child
      );
      set({
        children: updatedChildren,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to update child",
        loading: false,
      });
    }
  },

  deleteChild: async (childId) => {
    try {
      set({ loading: true, error: null });
      await deleteChildService(childId);
      const currentChildren = get().children;
      const filteredChildren = currentChildren.filter(
        (child) => child.id !== childId
      );
      set({
        children: filteredChildren,
        loading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to delete child",
        loading: false,
      });
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
