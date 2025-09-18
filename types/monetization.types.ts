export interface UserCredits {
  userId: string;
  balance: number;
  lifetimeUsed: number;
  subscriptionActive: boolean;
  subscriptionId?: string;
  subscriptionCreditsRemaining?: number;
  subscriptionRenewsAt?: Date;
  freeCreditsGranted: boolean;
  lastUpdated: Date;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "purchase" | "subscription" | "usage" | "bonus" | "initial" | "refund";
  description: string;
  createdAt: Date;
  storyId?: string;
  purchaseId?: string;
  metadata?: Record<string, any>;
}

export interface PurchaseHistory {
  id: string;
  userId: string;
  productId: string;
  purchaseDate: Date;
  amount: number;
  credits: number;
  platform: "ios" | "android";
  transactionId: string;
  status:
    | "pending"
    | "completed"
    | "failed"
    | "refunded"
    | "pending_credits"
    | "validation_failed";
}
