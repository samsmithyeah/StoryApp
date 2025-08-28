import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  runTransaction,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  increment,
  deleteField,
} from "@react-native-firebase/firestore";
import { logger } from "../../utils/logger";
import type {
  UserCredits,
  CreditTransaction,
  PurchaseHistory,
} from "../../types/monetization.types";

const INITIAL_FREE_CREDITS = 10;
const db = getFirestore();

export const creditsService = {
  // Type validation helper - keeps security fix
  validateUserCredits(data: any): UserCredits {
    if (typeof data !== "object" || data === null) {
      throw new Error("Invalid credits data structure");
    }

    const requiredFields = [
      "balance",
      "lifetimeUsed",
      "subscriptionActive",
      "freeCreditsGranted",
    ];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (typeof data.balance !== "number") {
      throw new Error("Field balance must be a number");
    }

    if (data.balance < 0) {
      throw new Error("Field balance cannot be negative");
    }

    if (typeof data.lifetimeUsed !== "number") {
      throw new Error("Field lifetimeUsed must be a number");
    }

    if (data.lifetimeUsed < 0) {
      throw new Error("Field lifetimeUsed cannot be negative");
    }

    if (typeof data.subscriptionActive !== "boolean") {
      throw new Error("Field subscriptionActive must be a boolean");
    }

    if (typeof data.freeCreditsGranted !== "boolean") {
      throw new Error("Field freeCreditsGranted must be a boolean");
    }

    // Check for unsafe integers - keeps security fix
    if (!Number.isSafeInteger(data.balance)) {
      throw new Error("Field balance exceeds maximum safe integer");
    }

    if (!Number.isSafeInteger(data.lifetimeUsed)) {
      throw new Error("Field lifetimeUsed exceeds maximum safe integer");
    }

    return {
      ...data,
      subscriptionRenewsAt: data.subscriptionRenewsAt?.toDate?.(),
      lastUpdated: data.lastUpdated?.toDate?.(),
    } as UserCredits;
  },

  async getUserCredits(userId: string): Promise<UserCredits | null> {
    try {
      const creditsDoc = await getDoc(doc(db, "userCredits", userId));

      if (!creditsDoc.exists()) {
        return null;
      }

      const data = creditsDoc.data();
      if (!data) return null;

      return this.validateUserCredits(data);
    } catch (error) {
      logger.error("Error fetching user credits", error);
      throw error;
    }
  },

  async initializeUserCredits(userId: string): Promise<void> {
    try {
      const creditsDoc = await getDoc(doc(db, "userCredits", userId));

      if (!creditsDoc.exists()) {
        const initialCredits = {
          userId,
          balance: INITIAL_FREE_CREDITS,
          lifetimeUsed: 0,
          subscriptionActive: false,
          freeCreditsGranted: true,
          lastUpdated: serverTimestamp(),
        };

        await setDoc(doc(db, "userCredits", userId), initialCredits);

        await this.recordTransaction({
          id: `${userId}_initial_${Date.now()}`,
          userId,
          amount: INITIAL_FREE_CREDITS,
          type: "initial",
          description: "Welcome bonus credits",
        });
      }
    } catch (error) {
      logger.error("Error initializing user credits", error);
      throw error;
    }
  },

  async createEmptyUserCredits(userId: string): Promise<void> {
    try {
      const creditsDoc = await getDoc(doc(db, "userCredits", userId));

      if (!creditsDoc.exists()) {
        const emptyCredits = {
          userId,
          balance: 0,
          lifetimeUsed: 0,
          subscriptionActive: false,
          freeCreditsGranted: false,
          lastUpdated: serverTimestamp(),
        };

        await setDoc(doc(db, "userCredits", userId), emptyCredits);
        logger.debug("Empty credits document created", { userId });
      }
    } catch (error) {
      logger.error("Error creating empty user credits", error);
      throw error;
    }
  },

  // Fixed race condition by keeping transaction atomic
  async useCredits(
    userId: string,
    amount: number,
    storyId?: string
  ): Promise<{ success: boolean; remainingBalance: number; error?: string }> {
    try {
      return await runTransaction(db, async (transaction) => {
        const creditsRef = doc(db, "userCredits", userId);
        const creditsDoc = await transaction.get(creditsRef);

        if (!creditsDoc.exists) {
          throw new Error("User credits not found");
        }

        const creditsData = creditsDoc.data();
        if (!creditsData) {
          throw new Error("Invalid credits data");
        }

        const currentBalance = creditsData.balance || 0;

        if (currentBalance < amount) {
          throw new Error(
            `Insufficient credits. Need ${amount}, have ${currentBalance}`
          );
        }

        // Update credits atomically
        transaction.update(creditsRef, {
          balance: increment(-amount),
          lifetimeUsed: increment(amount),
          lastUpdated: serverTimestamp(),
        });

        // Record transaction
        const transactionRef = doc(collection(db, "creditTransactions"));
        transaction.set(transactionRef, {
          userId,
          amount: -amount,
          type: "usage",
          description: `Used ${amount} credit${amount > 1 ? "s" : ""} for story generation`,
          createdAt: serverTimestamp(),
          storyId,
          metadata: {
            previousBalance: currentBalance,
            newBalance: currentBalance - amount,
          },
        });

        return {
          success: true,
          remainingBalance: currentBalance - amount,
        };
      });
    } catch (error) {
      logger.error("Error using credits", error);
      return {
        success: false,
        remainingBalance: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  // Atomic credit addition - keeps transaction fix
  async addCredits(
    userId: string,
    amount: number,
    type: "purchase" | "subscription" | "bonus" | "refund",
    description: string,
    purchaseDate?: string
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    try {
      return await runTransaction(db, async (transaction) => {
        const creditsRef = doc(db, "userCredits", userId);
        const creditsDoc = await transaction.get(creditsRef);

        let currentBalance = 0;

        if (!creditsDoc.exists) {
          // Initialize user credits if they don't exist
          const initialCredits = {
            userId,
            balance: 0,
            lifetimeUsed: 0,
            subscriptionActive: false,
            freeCreditsGranted: false,
            lastUpdated: serverTimestamp(),
          };
          transaction.set(creditsRef, initialCredits);
        } else {
          const creditsData = creditsDoc.data();
          currentBalance = creditsData?.balance || 0;
        }

        // Add credits atomically
        transaction.update(creditsRef, {
          balance: increment(amount),
          lastUpdated: serverTimestamp(),
        });

        // Record transaction
        const transactionRef = doc(collection(db, "creditTransactions"));

        // Build metadata object, excluding undefined values
        const metadata: any = {
          previousBalance: currentBalance,
          newBalance: currentBalance + amount,
        };

        // Only include purchaseDate if it's defined
        if (purchaseDate !== undefined) {
          metadata.purchaseDate = purchaseDate;
        }

        logger.debug("About to save credits transaction", {
          userId,
          amount,
          type,
          description,
          metadata,
        });

        transaction.set(transactionRef, {
          userId,
          amount,
          type,
          description,
          createdAt: serverTimestamp(),
          metadata,
        });

        return {
          success: true,
          newBalance: currentBalance + amount,
        };
      });
    } catch (error) {
      logger.error("Error adding credits", error);
      return {
        success: false,
        newBalance: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  async checkCreditsAvailable(
    userId: string,
    requiredCredits: number
  ): Promise<{ available: boolean; balance: number }> {
    try {
      const creditsDoc = await getDoc(doc(db, "userCredits", userId));

      if (!creditsDoc.exists()) {
        return { available: false, balance: 0 };
      }

      const data = creditsDoc.data();
      const balance = data?.balance || 0;

      return {
        available: balance >= requiredCredits,
        balance,
      };
    } catch (error) {
      logger.error("Error checking credits availability", error);
      return { available: false, balance: 0 };
    }
  },

  async recordTransaction(
    transaction: Omit<CreditTransaction, "createdAt">
  ): Promise<void> {
    try {
      // Filter out undefined values to prevent Firestore errors
      const cleanTransaction = Object.fromEntries(
        Object.entries(transaction).filter(([_, value]) => value !== undefined)
      );

      logger.debug("Recording transaction", cleanTransaction);

      await addDoc(collection(db, "creditTransactions"), {
        ...cleanTransaction,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      logger.error("Error recording credit transaction", error);
      throw error;
    }
  },

  async recordPurchase(
    purchase: Omit<PurchaseHistory, "purchaseDate"> & { purchaseDate?: Date }
  ): Promise<void> {
    try {
      // Filter out undefined values to prevent Firestore errors
      const cleanPurchase = Object.fromEntries(
        Object.entries(purchase).filter(([_, value]) => value !== undefined)
      );

      logger.debug("Recording purchase", cleanPurchase);

      await addDoc(collection(db, "purchaseHistory"), {
        ...cleanPurchase,
        purchaseDate: purchase.purchaseDate || serverTimestamp(),
      });
    } catch (error) {
      logger.error("Error recording purchase", error);
      throw error;
    }
  },

  async updateSubscription(
    userId: string,
    subscriptionId: string,
    monthlyCredits: number,
    expiresAt: Date,
    addCredits: boolean = false
  ): Promise<void> {
    try {
      const updateData = {
        subscriptionActive: true,
        subscriptionId,
        subscriptionRenewsAt: expiresAt,
        lastUpdated: serverTimestamp(),
      };

      logger.debug("updateSubscription - About to update userCredits", {
        updateData,
        addCredits,
      });

      await updateDoc(doc(db, "userCredits", userId), updateData);

      // Only add credits when explicitly requested (e.g., during purchase, not sync)
      if (addCredits) {
        logger.debug(
          "updateSubscription - Adding credits due to addCredits flag"
        );
        await this.addCredits(
          userId,
          monthlyCredits,
          "subscription",
          `Subscription credits: ${monthlyCredits}/month`
        );
      } else {
        logger.debug("Skipping credit addition (sync operation)");
      }
    } catch (error) {
      logger.error("Error updating subscription", error);
      throw error;
    }
  },

  async cancelSubscription(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, "userCredits", userId), {
        subscriptionActive: false,
        subscriptionId: deleteField(),
        subscriptionRenewsAt: deleteField(),
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      logger.error("Error canceling subscription", error);
      throw error;
    }
  },

  async getCreditTransactions(
    userId: string,
    limitCount: number = 10
  ): Promise<CreditTransaction[]> {
    try {
      const q = query(
        collection(db, "creditTransactions"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as CreditTransaction[];
    } catch (error) {
      logger.error("Error fetching credit transactions", error);
      throw error;
    }
  },

  onCreditsChange(
    userId: string,
    callback: (credits: UserCredits | null) => void
  ): () => void {
    const unsubscribe = onSnapshot(
      doc(db, "userCredits", userId),
      (doc) => {
        if (doc.exists()) {
          try {
            const data = doc.data();
            if (data) {
              const validatedCredits = creditsService.validateUserCredits(data);
              callback(validatedCredits);
            } else {
              callback(null);
            }
          } catch (error) {
            logger.error("Error validating credits data", error);
            callback(null);
          }
        } else {
          callback(null);
        }
      },
      (error) => {
        logger.error("Error listening to credits changes", error);
        callback(null);
      }
    );

    return unsubscribe;
  },
};
