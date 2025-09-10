import { Animated } from "react-native";
import { create } from "zustand";
import { Story } from "../types/story.types";

interface LibraryState {
  // Scroll position management
  scrollPosition: number;
  setScrollPosition: (position: number) => void;
  restoreScrollPosition: (flatListRef: Animated.FlatList<Story> | null) => void;

  // Story data persistence
  stories: Story[];
  setStories: (stories: Story[]) => void;

  // Loading states
  loading: boolean;
  setLoading: (loading: boolean) => void;

  // Preserve component state
  shouldPreserveState: boolean;
  setShouldPreserveState: (preserve: boolean) => void;

  // Reset methods
  resetStore: () => void;
}

const initialState = {
  scrollPosition: 0,
  stories: [],
  loading: true,
  shouldPreserveState: false,
};

export const useLibraryStore = create<LibraryState>()((set, get) => ({
  ...initialState,

  setScrollPosition: (position: number) => set({ scrollPosition: position }),

  restoreScrollPosition: (flatListRef: Animated.FlatList<Story> | null) => {
    const { scrollPosition } = get();
    if (flatListRef && scrollPosition > 0) {
      // Use requestAnimationFrame to ensure the list has been painted
      requestAnimationFrame(() => {
        flatListRef?.scrollToOffset({
          offset: scrollPosition,
          animated: false,
        });
      });
    }
  },

  setStories: (stories: Story[]) => set({ stories }),

  setLoading: (loading: boolean) => set({ loading }),

  setShouldPreserveState: (preserve: boolean) =>
    set({ shouldPreserveState: preserve }),

  resetStore: () => set(initialState),
}));
