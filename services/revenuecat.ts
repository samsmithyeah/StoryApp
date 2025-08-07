import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";
import { Platform } from "react-native";
import { creditsService } from "./firebase/credits";
import type { CreditPack, Subscription } from "../types/monetization.types";

// Replace with your actual RevenueCat API keys
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "";
const REVENUECAT_API_KEY_ANDROID =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "";

// Product identifiers - these should match your App Store/Play Store products
export const PRODUCT_IDS = {
  // Credit packs
  CREDITS_10: "credits_10",
  CREDITS_25: "credits_25",
  CREDITS_50: "credits_50",
  CREDITS_100: "credits_100",

  // Subscriptions
  MONTHLY_BASIC: "subscription_monthly_basic",
  MONTHLY_PRO: "subscription_monthly_pro",
  ANNUAL_BASIC: "subscription_annual_basic",
  ANNUAL_PRO: "subscription_annual_pro",
};

// Credit amounts for each product
const CREDIT_AMOUNTS: Record<string, number> = {
  [PRODUCT_IDS.CREDITS_10]: 10,
  [PRODUCT_IDS.CREDITS_25]: 25,
  [PRODUCT_IDS.CREDITS_50]: 50,
  [PRODUCT_IDS.CREDITS_100]: 100,
  [PRODUCT_IDS.MONTHLY_BASIC]: 30,
  [PRODUCT_IDS.MONTHLY_PRO]: 100,
  [PRODUCT_IDS.ANNUAL_BASIC]: 360,
  [PRODUCT_IDS.ANNUAL_PRO]: 1200,
};

class RevenueCatService {
  private isConfigured = false;
  private userId: string | null = null;

  async configure(userId: string) {
    if (this.isConfigured && this.userId === userId) {
      return;
    }

    try {
      const apiKey =
        Platform.OS === "ios"
          ? REVENUECAT_API_KEY_IOS
          : REVENUECAT_API_KEY_ANDROID;

      if (!apiKey) {
        console.warn(
          "RevenueCat API key not configured - purchases will not work"
        );
        console.warn(
          "Add EXPO_PUBLIC_REVENUECAT_IOS_KEY and EXPO_PUBLIC_REVENUECAT_ANDROID_KEY to your .env file"
        );
        return;
      }

      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      await Purchases.configure({
        apiKey,
        appUserID: userId,
      });

      this.userId = userId;
      this.isConfigured = true;

      // Set up listener for customer info updates
      Purchases.addCustomerInfoUpdateListener(this.handleCustomerInfoUpdate);
      console.log("RevenueCat configured successfully");
    } catch (error) {
      console.error("Error configuring RevenueCat:", error);
      // Don't throw error to prevent app crashes during development
      console.warn("RevenueCat configuration failed - purchases will not work");
    }
  }

  private handleCustomerInfoUpdate = async (customerInfo: CustomerInfo) => {
    try {
      if (!this.userId) return;

      // Check for active subscriptions
      const activeSubscriptions = customerInfo.activeSubscriptions;

      if (activeSubscriptions.length > 0) {
        // Handle subscription updates
        const subscriptionId = activeSubscriptions[0];
        const credits = CREDIT_AMOUNTS[subscriptionId] || 0;

        if (credits > 0) {
          const expirationDate =
            customerInfo.allExpirationDates?.[subscriptionId] || null;
          await creditsService.updateSubscription(
            this.userId,
            subscriptionId,
            credits,
            expirationDate ? new Date(expirationDate) : new Date()
          );
        }
      } else {
        // No active subscription
        await creditsService.cancelSubscription(this.userId);
      }
    } catch (error) {
      console.error("Error handling customer info update:", error);
    }
  };

  async getOfferings() {
    if (!this.isConfigured) {
      console.warn("RevenueCat not configured - returning empty offerings");
      return { current: null, all: {} };
    }

    try {
      const offerings = await Purchases.getOfferings();
      return offerings;
    } catch (error: any) {
      console.error("Error getting offerings:", error);

      // Handle the case where no products are configured yet
      if (error.message?.includes("None of the products registered")) {
        console.warn(
          "No products configured in RevenueCat yet - this is normal during development"
        );
        return { current: null, all: {} };
      }

      throw error;
    }
  }

  async purchaseCreditPack(
    packageToPurchase: PurchasesPackage
  ): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error("RevenueCat not configured");
    }

    try {
      if (!this.userId) {
        throw new Error("User not configured");
      }

      const { customerInfo } =
        await Purchases.purchasePackage(packageToPurchase);

      // Get the product ID from the purchase
      const productId = packageToPurchase.product.identifier;
      const credits = CREDIT_AMOUNTS[productId];

      if (!credits) {
        throw new Error(`Unknown product: ${productId}`);
      }

      // Add credits to user account
      await creditsService.addCredits(
        this.userId,
        credits,
        "purchase",
        `Purchased ${credits} credits`,
        customerInfo.originalPurchaseDate || undefined
      );

      // Record the purchase
      await creditsService.recordPurchase({
        userId: this.userId,
        productId,
        purchaseDate: new Date(),
        amount: packageToPurchase.product.price,
        credits,
        platform: Platform.OS as "ios" | "android",
        transactionId: customerInfo.originalPurchaseDate || "unknown",
        status: "completed",
      });

      return true;
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error("Error purchasing credit pack:", error);
        throw error;
      }
      return false;
    }
  }

  async purchaseSubscription(
    packageToPurchase: PurchasesPackage
  ): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error("RevenueCat not configured");
    }

    try {
      if (!this.userId) {
        throw new Error("User not configured");
      }

      const { customerInfo } =
        await Purchases.purchasePackage(packageToPurchase);

      // Get the product ID from the purchase
      const productId = packageToPurchase.product.identifier;
      const monthlyCredits = CREDIT_AMOUNTS[productId];

      if (!monthlyCredits) {
        throw new Error(`Unknown subscription: ${productId}`);
      }

      // Update subscription status
      const expirationDate =
        customerInfo.allExpirationDates?.[productId] || null;
      await creditsService.updateSubscription(
        this.userId,
        productId,
        monthlyCredits,
        expirationDate ? new Date(expirationDate) : new Date()
      );

      // Add initial credits for subscription
      await creditsService.addCredits(
        this.userId,
        monthlyCredits,
        "subscription",
        `Subscription activated: ${monthlyCredits} credits/month`,
        customerInfo.originalPurchaseDate || undefined
      );

      return true;
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error("Error purchasing subscription:", error);
        throw error;
      }
      return false;
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

  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error("Error getting customer info:", error);
      throw error;
    }
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return customerInfo.activeSubscriptions.length > 0;
    } catch (error) {
      console.error("Error checking subscription status:", error);
      return false;
    }
  }

  cleanup() {
    Purchases.removeCustomerInfoUpdateListener(this.handleCustomerInfoUpdate);
    this.isConfigured = false;
    this.userId = null;
  }
}

export const revenueCatService = new RevenueCatService();
