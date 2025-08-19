export interface CreditPack {
  id: string;
  credits: number;
  price: number;
  productId: string;
  name: string;
  description?: string;
  mostPopular?: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  monthlyCredits: number;
  price: number;
  interval: "monthly" | "annual";
  productId: string;
  description?: string;
  savings?: string;
}

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

export interface RevenueCatCustomerInfo {
  activeSubscriptions: string[];
  allPurchasedProductIdentifiers: string[];
  entitlements: {
    active: Record<string, any>;
    all: Record<string, any>;
  };
  firstSeen: string;
  lastSeen: string;
  managementURL: string | null;
  originalAppUserId: string;
  originalApplicationVersion: string | null;
  originalPurchaseDate: string | null;
}
