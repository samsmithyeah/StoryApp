import type { UserCredits } from "@/types/monetization.types";
import { PurchasesPackage } from "react-native-purchases";

export interface CreditsScreenProps {
  isModal?: boolean;
  onPurchaseSuccess?: () => void;
}

export interface CreditsHeaderProps {
  userCredits: UserCredits | null;
  scaleAnim: any;
  fadeAnim: any;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InfoSectionProps {}

export interface TabSelectorProps {
  selectedTab: "subscriptions" | "packs";
  onTabChange: (tab: "subscriptions" | "packs") => void;
}

export interface SubscriptionCardProps {
  package: PurchasesPackage;
  isSelected: boolean;
  isActive: boolean;
  hasAnyActiveSubscription: boolean;
  onSelect: (pkg: PurchasesPackage) => void;
  getProductInfo: (productId: string) => ProductInfo;
}

export interface CreditPackCardProps {
  package: PurchasesPackage;
  isSelected: boolean;
  onSelect: (pkg: PurchasesPackage) => void;
  getProductInfo: (productId: string) => ProductInfo;
}

export interface PurchaseButtonProps {
  selectedPackage: PurchasesPackage | null;
  selectedTab: "subscriptions" | "packs";
  purchasing: boolean;
  activeSubscriptions: string[];
  onPurchase: (pkg: PurchasesPackage) => void;
  getProductInfo: (productId: string) => ProductInfo;
  insets: any;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DecorationsProps {}

export interface ProductInfo {
  credits: number;
  type: "subscription" | "pack";
  name: string;
  period: string | null;
  displayName: string;
  popular?: boolean;
  bestValue?: boolean;
}
