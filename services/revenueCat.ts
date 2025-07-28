import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOffering,
  PurchasesPackage,
} from "react-native-purchases";

// RevenueCat API Keys (replace with your actual keys)
const REVENUECAT_API_KEY_IOS = "appl_gZDanqikQMABemWlsnORAWqddaO";
const REVENUECAT_API_KEY_ANDROID = "your_android_api_key_here";

// Entitlement IDs
export const ENTITLEMENT_ID = "pro";

// Package identifiers
export const PACKAGE_TYPE = {
  MONTHLY: "monthly",
  ANNUAL: "annual",
};

class RevenueCatService {
  private initialized = false;

  async initialize(userId?: string) {
    if (this.initialized) return;

    try {
      Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

      const apiKey =
        Platform.OS === "ios"
          ? REVENUECAT_API_KEY_IOS
          : REVENUECAT_API_KEY_ANDROID;

      await Purchases.configure({
        apiKey,
        appUserID: userId,
      });

      this.initialized = true;
    } catch (error) {
      console.error("Error initializing RevenueCat:", error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error("Error getting customer info:", error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error("Error getting offerings:", error);
      throw error;
    }
  }

  async purchasePackage(purchasePackage: PurchasesPackage) {
    try {
      const { customerInfo } = await Purchases.purchasePackage(purchasePackage);
      return customerInfo;
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error("Error purchasing package:", error);
      }
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error("Error restoring purchases:", error);
      throw error;
    }
  }

  async checkSubscriptionStatus(): Promise<{
    isPro: boolean;
    expirationDate?: string;
  }> {
    try {
      const customerInfo = await this.getCustomerInfo();
      const isPro =
        typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
      const proEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

      return {
        isPro,
        expirationDate: proEntitlement?.expirationDate || undefined,
      };
    } catch (error) {
      console.error("Error checking subscription status:", error);
      return { isPro: false };
    }
  }

  async logout() {
    try {
      await Purchases.logOut();
    } catch (error) {
      console.error("Error logging out from RevenueCat:", error);
    }
  }
}

export const revenueCatService = new RevenueCatService();
