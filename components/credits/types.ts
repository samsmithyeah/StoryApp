import type { UserCredits } from "@/types/monetization.types";
import { PurchasesPackage } from "react-native-purchases";

export interface CreditsHeaderProps {
  userCredits: UserCredits | null;
  scaleAnim: any;
  fadeAnim: any;
}

export type InfoSectionProps = Record<string, never>;

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

export interface ProductInfo {
  credits: number;
  type: "subscription" | "pack";
  name: string;
  period: string | null;
  displayName: string;
  popular?: boolean;
  bestValue?: boolean;
}
