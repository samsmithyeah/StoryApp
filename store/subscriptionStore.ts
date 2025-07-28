import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { revenueCatService } from '@/services/revenueCat';

const STORY_COUNT_KEY = 'monthly_story_count';
const MONTH_KEY = 'current_month';
const FREE_TIER_LIMIT = 3;

interface SubscriptionState {
  isPro: boolean;
  expirationDate?: string;
  monthlyStoryCount: number;
  currentMonth: string;
  isLoading: boolean;
  
  // Actions
  checkSubscription: () => Promise<void>;
  incrementStoryCount: () => Promise<boolean>; // Returns true if allowed to generate
  resetMonthlyCount: () => Promise<void>;
  canGenerateStory: () => boolean;
  getRemainingStories: () => number;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  isPro: false,
  expirationDate: undefined,
  monthlyStoryCount: 0,
  currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM format
  isLoading: false,

  checkSubscription: async () => {
    set({ isLoading: true });
    try {
      const status = await revenueCatService.checkSubscriptionStatus();
      set({ 
        isPro: status.isPro, 
        expirationDate: status.expirationDate,
        isLoading: false 
      });

      // Check if we need to reset monthly count
      const currentMonth = new Date().toISOString().slice(0, 7);
      const savedMonth = await AsyncStorage.getItem(MONTH_KEY);
      
      if (savedMonth !== currentMonth) {
        await get().resetMonthlyCount();
      } else {
        // Load existing count
        const savedCount = await AsyncStorage.getItem(STORY_COUNT_KEY);
        if (savedCount) {
          set({ monthlyStoryCount: parseInt(savedCount, 10) });
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      set({ isLoading: false });
    }
  },

  incrementStoryCount: async () => {
    const { isPro, monthlyStoryCount, currentMonth } = get();
    
    // Pro users have unlimited stories
    if (isPro) return true;

    // Check if we're in a new month
    const nowMonth = new Date().toISOString().slice(0, 7);
    if (nowMonth !== currentMonth) {
      await get().resetMonthlyCount();
      return get().incrementStoryCount(); // Recursive call with reset count
    }

    // Check if free tier limit reached
    if (monthlyStoryCount >= FREE_TIER_LIMIT) {
      return false;
    }

    // Increment count
    const newCount = monthlyStoryCount + 1;
    set({ monthlyStoryCount: newCount });
    await AsyncStorage.setItem(STORY_COUNT_KEY, newCount.toString());
    
    return true;
  },

  resetMonthlyCount: async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    set({ monthlyStoryCount: 0, currentMonth });
    await AsyncStorage.setItem(STORY_COUNT_KEY, '0');
    await AsyncStorage.setItem(MONTH_KEY, currentMonth);
  },

  canGenerateStory: () => {
    const { isPro, monthlyStoryCount } = get();
    return isPro || monthlyStoryCount < FREE_TIER_LIMIT;
  },

  getRemainingStories: () => {
    const { isPro, monthlyStoryCount } = get();
    if (isPro) return -1; // Unlimited
    return Math.max(0, FREE_TIER_LIMIT - monthlyStoryCount);
  },
}));