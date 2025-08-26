import { creditsService } from "@/services/firebase/credits";
import type { UserCredits } from "@/types/monetization.types";
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { logger } from "../utils/logger";

export const useCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (user) {
      unsubscribe = setupRealtimeCredits();
    } else {
      setCredits(null);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const setupRealtimeCredits = () => {
    if (!user) return;

    // Set up real-time subscription to credits - same as credits.tsx
    const unsubscribe = creditsService.onCreditsChange(
      user.uid,
      (updatedCredits) => {
        if (updatedCredits) {
          setCredits(updatedCredits);
        } else {
          // Initialize credits if they don't exist
          creditsService.initializeUserCredits(user.uid).then(() => {
            logger.debug("Initialized user credits");
          });
        }
        setLoading(false);
      }
    );

    return unsubscribe;
  };

  const loadCredits = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Sync subscription status with RevenueCat first
      const { revenueCatService } = await import("../services/revenuecat");
      await revenueCatService.syncSubscriptionStatus();

      const userCredits = await creditsService.getUserCredits(user.uid);

      if (!userCredits) {
        // Initialize credits if they don't exist
        await creditsService.initializeUserCredits(user.uid);
        const newCredits = await creditsService.getUserCredits(user.uid);
        setCredits(newCredits);
      } else {
        setCredits(userCredits);
      }
    } catch (err) {
      logger.error("Error loading credits", err);
      setError("Failed to load credits");
    } finally {
      setLoading(false);
    }
  };

  const refreshCredits = async () => {
    await loadCredits();
  };

  const hasEnoughCredits = (amount: number): boolean => {
    return credits ? credits.balance >= amount : false;
  };

  // Debug methods for subscription troubleshooting
  const debugSubscription = async () => {
    if (!user) return;

    logger.debug("=== DEBUGGING SUBSCRIPTION ===");

    try {
      const { revenueCatService } = await import("../services/revenuecat");
      await revenueCatService.configure(user.uid);

      // Debug what RevenueCat is reporting
      await revenueCatService.debugCustomerInfo();

      // Force a sync
      await revenueCatService.forceSyncSubscription();

      // Refresh credits to see the result
      await refreshCredits();
    } catch (error) {
      logger.error("Debug failed", error);
    }

    logger.debug("=== DEBUG COMPLETE ===");
  };

  const forceSync = async () => {
    if (!user) return;

    try {
      const { revenueCatService } = await import("../services/revenuecat");
      await revenueCatService.configure(user.uid);
      await revenueCatService.forceSyncSubscription();
      await refreshCredits();
      logger.debug("Force sync completed");
    } catch (error) {
      logger.error("Force sync failed", error);
    }
  };

  return {
    credits,
    balance: credits?.balance || 0,
    loading,
    error,
    refreshCredits,
    hasEnoughCredits,
    subscriptionActive: credits?.subscriptionActive || false,
    // Debug methods
    debugSubscription,
    forceSync,
  };
};
