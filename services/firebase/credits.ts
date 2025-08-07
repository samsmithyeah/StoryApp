import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  increment,
  runTransaction,
  getFirestore,
} from "@react-native-firebase/firestore";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import type {
  UserCredits,
  CreditTransaction,
  PurchaseHistory,
} from "../../types/monetization.types";

const INITIAL_FREE_CREDITS = 10;
const db = getFirestore();

export const creditsService = {
  async getUserCredits(userId: string): Promise<UserCredits | null> {
    try {
      const creditsRef = doc(db, "userCredits", userId);
      const creditsDoc = await getDoc(creditsRef);

      if (!creditsDoc.exists()) {
        return null;
      }

      const data = creditsDoc.data();
      if (!data) return null;

      return {
        ...data,
        subscriptionRenewsAt: data.subscriptionRenewsAt?.toDate(),
        lastUpdated: data.lastUpdated?.toDate(),
      } as UserCredits;
    } catch (error) {
      console.error("Error fetching user credits:", error);
      throw error;
    }
  },

  async initializeUserCredits(userId: string): Promise<void> {
    try {
      const creditsRef = doc(db, "userCredits", userId);
      const creditsDoc = await getDoc(creditsRef);

      if (!creditsDoc.exists()) {
        const initialCredits: Omit<
          UserCredits,
          "subscriptionRenewsAt" | "lastUpdated"
        > & {
          subscriptionRenewsAt?: any;
          lastUpdated: any;
        } = {
          userId,
          balance: INITIAL_FREE_CREDITS,
          lifetimeUsed: 0,
          subscriptionActive: false,
          freeCreditsGranted: true,
          lastUpdated: serverTimestamp(),
        };

        await setDoc(creditsRef, initialCredits);

        await this.recordTransaction({
          userId,
          amount: INITIAL_FREE_CREDITS,
          type: "initial",
          description: "Welcome bonus credits",
        });
      }
    } catch (error) {
      console.error("Error initializing user credits:", error);
      throw error;
    }
  },

  async useCredits(
    userId: string,
    amount: number,
    storyId?: string
  ): Promise<boolean> {
    try {
      return await runTransaction(
        db,
        async (transaction: FirebaseFirestoreTypes.Transaction) => {
          const creditsRef = doc(db, "userCredits", userId);
          const creditsDoc = await transaction.get(creditsRef);

          if (!creditsDoc.exists()) {
            throw new Error("User credits not found");
          }

          const credits = creditsDoc.data() as UserCredits;

          if (credits.balance < amount) {
            return false;
          }

          transaction.update(creditsRef, {
            balance: increment(-amount),
            lifetimeUsed: increment(amount),
            lastUpdated: serverTimestamp(),
          });

          const transactionRef = doc(collection(db, "creditTransactions"));
          transaction.set(transactionRef, {
            userId,
            amount: -amount,
            type: "usage",
            description: `Used ${amount} credit${amount > 1 ? "s" : ""} for story generation`,
            createdAt: serverTimestamp(),
            storyId,
          });

          return true;
        }
      );
    } catch (error) {
      console.error("Error using credits:", error);
      throw error;
    }
  },

  async addCredits(
    userId: string,
    amount: number,
    type: CreditTransaction["type"],
    description: string,
    purchaseId?: string
  ): Promise<void> {
    try {
      await runTransaction(
        db,
        async (transaction: FirebaseFirestoreTypes.Transaction) => {
          const creditsRef = doc(db, "userCredits", userId);
          const creditsDoc = await transaction.get(creditsRef);

          if (!creditsDoc.exists()) {
            await this.initializeUserCredits(userId);
            const updatedDoc = await transaction.get(creditsRef);
            if (!updatedDoc.exists()) {
              throw new Error("Failed to initialize user credits");
            }
          }

          transaction.update(creditsRef, {
            balance: increment(amount),
            lastUpdated: serverTimestamp(),
          });

          const transactionRef = doc(collection(db, "creditTransactions"));
          transaction.set(transactionRef, {
            userId,
            amount,
            type,
            description,
            createdAt: serverTimestamp(),
            purchaseId,
          });
        }
      );
    } catch (error) {
      console.error("Error adding credits:", error);
      throw error;
    }
  },

  async recordTransaction(
    transaction: Omit<CreditTransaction, "id" | "createdAt">
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "creditTransactions"), {
        ...transaction,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error recording transaction:", error);
      throw error;
    }
  },

  async getTransactionHistory(
    userId: string,
    limitCount: number = 20
  ): Promise<CreditTransaction[]> {
    try {
      const q = query(
        collection(db, "creditTransactions"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(
        (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        })
      ) as CreditTransaction[];
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      throw error;
    }
  },

  async recordPurchase(purchase: Omit<PurchaseHistory, "id">): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "purchaseHistory"), {
        ...purchase,
        purchaseDate: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error recording purchase:", error);
      throw error;
    }
  },

  async updateSubscription(
    userId: string,
    subscriptionId: string,
    monthlyCredits: number,
    renewsAt: Date
  ): Promise<void> {
    try {
      const creditsRef = doc(db, "userCredits", userId);
      await updateDoc(creditsRef, {
        subscriptionActive: true,
        subscriptionId,
        subscriptionCreditsRemaining: monthlyCredits,
        subscriptionRenewsAt: renewsAt,
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
  },

  async cancelSubscription(userId: string): Promise<void> {
    try {
      const creditsRef = doc(db, "userCredits", userId);
      await updateDoc(creditsRef, {
        subscriptionActive: false,
        subscriptionId: null,
        subscriptionCreditsRemaining: null,
        subscriptionRenewsAt: null,
        lastUpdated: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw error;
    }
  },
};
