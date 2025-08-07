import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { creditsService } from "@/services/firebase/credits";
import type { UserCredits } from "@/types/monetization.types";

export const useCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadCredits();
    } else {
      setCredits(null);
      setLoading(false);
    }
  }, [user]);

  const loadCredits = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
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
      console.error("Error loading credits:", err);
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

  return {
    credits,
    balance: credits?.balance || 0,
    loading,
    error,
    refreshCredits,
    hasEnoughCredits,
    subscriptionActive: credits?.subscriptionActive || false,
  };
};
