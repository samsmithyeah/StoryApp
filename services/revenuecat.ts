import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";
import { Platform } from "react-native";
import { creditsService } from "./firebase/credits";
import { httpsCallable } from "@react-native-firebase/functions";
import { functionsService } from "./firebase/config";

// Replace with your actual RevenueCat API keys
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "";
const REVENUECAT_API_KEY_ANDROID =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "";

// Product identifiers - these should match your App Store/Play Store products
export const PRODUCT_IDS = {
  // Credit packs (consumable)
  CREDITS_10: "10_credit_pack",
  CREDITS_25: "25_credit_pack",
  CREDITS_50: "50_credit_pack",
  CREDITS_100: "100_credit_pack",

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

      if (__DEV__) {
        // In development, log warning but don't crash
        console.warn(
          "RevenueCat configuration failed - purchases will not work in development"
        );
      } else {
        // In production, this is a critical error that should be handled properly
        throw new Error(
          `RevenueCat configuration failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
  }

  private handleCustomerInfoUpdate = async (customerInfo: CustomerInfo) => {
    try {
      if (!this.userId) return;

      console.log("🔄 Customer info update:", {
        activeSubscriptions: customerInfo.activeSubscriptions,
        allExpirationDates: customerInfo.allExpirationDates,
      });

      // Check for active subscriptions
      const activeSubscriptions = customerInfo.activeSubscriptions;

      if (activeSubscriptions.length > 0) {
        // Get the latest subscription (most recent)
        // Priority: annual > monthly (since annual is usually preferred)
        const sortedSubscriptions = activeSubscriptions.sort((a, b) => {
          if (a.includes("annual") && !b.includes("annual")) return -1;
          if (!a.includes("annual") && b.includes("annual")) return 1;
          return 0;
        });

        const primarySubscription = sortedSubscriptions[0];
        const credits = CREDIT_AMOUNTS[primarySubscription] || 0;

        console.log("🔄 Primary subscription:", {
          primarySubscription,
          credits,
          totalActive: activeSubscriptions.length,
        });

        if (credits > 0) {
          const expirationDate =
            customerInfo.allExpirationDates?.[primarySubscription] || null;

          // Check if expiration date is in the past (expired/cancelled)
          const now = new Date();
          const expDate = expirationDate ? new Date(expirationDate) : null;
          const isExpired = expDate ? expDate <= now : false;

          if (!isExpired) {
            await creditsService.updateSubscription(
              this.userId,
              primarySubscription,
              credits,
              expDate || new Date(),
              false // Don't add credits during sync operations
            );
          } else {
            console.log("🔄 Subscription expired, cancelling");
            await creditsService.cancelSubscription(this.userId);
          }
        }
      } else {
        // No active subscription
        console.log("🔄 No active subscriptions, cancelling");
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

      console.log(
        "🏪 OFFERINGS DEBUG - Current offering:",
        offerings.current?.identifier
      );
      console.log(
        "🏪 PACKAGES COUNT:",
        offerings.current?.availablePackages?.length || 0
      );

      offerings.current?.availablePackages?.forEach((pkg, index) => {
        const isKnownProduct =
          CREDIT_AMOUNTS[pkg.product.identifier] !== undefined;
        console.log(`🏪 PACKAGE ${index}:`, {
          identifier: pkg.identifier,
          packageType: pkg.packageType,
          product: {
            identifier: pkg.product.identifier,
            title: pkg.product.title,
            description: pkg.product.description,
            price: pkg.product.price,
            priceString: pkg.product.priceString,
          },
          isKnownProduct,
          expectedCredits: CREDIT_AMOUNTS[pkg.product.identifier] || "UNKNOWN",
        });
      });

      console.log("🏪 EXPECTED PRODUCT IDS:", Object.keys(CREDIT_AMOUNTS));

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

    if (!this.userId) {
      throw new Error("User not configured");
    }

    let purchaseInfo: { customerInfo: CustomerInfo } | null = null;

    try {
      // Get the product ID from the purchase
      const productId = packageToPurchase.product.identifier;
      const credits = CREDIT_AMOUNTS[productId];

      console.log("🛒 CREDIT PACK PURCHASE DEBUG:", {
        productId,
        credits,
        packageDetails: {
          identifier: packageToPurchase.identifier,
          offeringIdentifier: packageToPurchase.offeringIdentifier,
          product: {
            identifier: packageToPurchase.product.identifier,
            title: packageToPurchase.product.title,
            price: packageToPurchase.product.price,
            priceString: packageToPurchase.product.priceString,
          },
        },
      });

      if (!credits) {
        throw new Error(`Unknown product: ${productId}`);
      }

      // Make the purchase
      console.log("🛒 STARTING CREDIT PACK PURCHASE...");
      purchaseInfo = await Purchases.purchasePackage(packageToPurchase);
      console.log("🛒 CREDIT PACK PURCHASE COMPLETED!", {
        customerInfo: {
          activeSubscriptions: purchaseInfo.customerInfo.activeSubscriptions,
          nonSubscriptionTransactions:
            purchaseInfo.customerInfo.nonSubscriptionTransactions?.length || 0,
          latestExpirationDate: purchaseInfo.customerInfo.latestExpirationDate,
        },
      });

      // Critical: Validate purchase server-side for security
      try {
        console.log("Calling validatePurchase function...");
        const validatePurchase = httpsCallable(
          functionsService,
          "validatePurchase"
        );

        const requestData = {
          transactionId: this.getValidTransactionId(purchaseInfo.customerInfo),
          productId,
          platform: Platform.OS,
          // Note: Receipt validation is handled server-side via RevenueCat webhook
          // For additional security, you could implement direct StoreKit/Google Play integration
        };

        console.log("validatePurchase request data:", requestData);
        const result = await validatePurchase(requestData);
        console.log("validatePurchase response:", result);

        const responseData = result.data as {
          success?: boolean;
          creditsAwarded?: number;
          error?: string;
        };
        if (responseData.success) {
          console.log(
            `Successfully awarded ${responseData.creditsAwarded} credits`
          );
          return true;
        } else {
          throw new Error(
            responseData.error || "Server-side validation failed"
          );
        }
      } catch (validationError) {
        // Critical: If server validation fails, still try client-side fallback
        // but log it as needing manual review
        console.error(
          "CRITICAL: Server-side validation failed, attempting client fallback:",
          validationError
        );

        // CRITICAL: Do not use client fallback - this can lead to credit fraud
        // Instead, record the failure and require manual resolution
        console.error("CRITICAL: Purchase completed but validation failed");

        try {
          await creditsService.recordPurchase({
            id: `${this.userId}_${Date.now()}_failed`,
            userId: this.userId,
            productId,
            purchaseDate: new Date(),
            amount: packageToPurchase.product.price,
            credits,
            platform: Platform.OS as "ios" | "android",
            transactionId: this.getValidTransactionId(
              purchaseInfo.customerInfo
            ),
            status: "validation_failed", // Requires manual review
          });
        } catch (recordError) {
          console.error("Could not record failed purchase:", recordError);
        }

        throw new Error(
          "Your purchase was processed but we couldn't verify it automatically. Please contact support and we'll add your credits manually."
        );
      }
    } catch (error: any) {
      if (error.userCancelled) {
        return false;
      }

      console.error("Error purchasing credit pack:", error);
      throw error;
    }
  }

  private getValidTransactionId(customerInfo: CustomerInfo): string {
    // Use a unique identifier combining timestamp and user
    // Since sandbox transactions often have the same originalPurchaseDate
    const timestamp = Date.now();
    const userPrefix = this.userId ? this.userId.substring(0, 8) : "unknown";
    const uniqueId = `${userPrefix}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    console.log("Generated unique transaction ID:", uniqueId);
    console.log("CustomerInfo debug:", {
      originalPurchaseDate: customerInfo.originalPurchaseDate,
      latestExpirationDate: customerInfo.latestExpirationDate,
      activeSubscriptions: customerInfo.activeSubscriptions,
    });

    return uniqueId;
  }

  async purchaseSubscription(
    packageToPurchase: PurchasesPackage
  ): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error("RevenueCat not configured");
    }

    if (!this.userId) {
      throw new Error("User not configured");
    }

    let purchaseInfo: { customerInfo: CustomerInfo } | null = null;

    try {
      // Get the product ID from the purchase
      const productId = packageToPurchase.product.identifier;
      const monthlyCredits = CREDIT_AMOUNTS[productId];

      if (!monthlyCredits) {
        throw new Error(`Unknown subscription: ${productId}`);
      }

      // Make the purchase
      console.log("🔔 SUBSCRIPTION PURCHASE STARTING...");
      purchaseInfo = await Purchases.purchasePackage(packageToPurchase);
      console.log("🔔 SUBSCRIPTION PURCHASE COMPLETED!");

      // Critical: Update subscription and add credits atomically
      try {
        const expirationDate =
          purchaseInfo.customerInfo.allExpirationDates?.[productId] || null;

        console.log("Subscription debug:", {
          productId,
          allExpirationDates: purchaseInfo.customerInfo.allExpirationDates,
          extractedExpiration: expirationDate,
          processedDate: expirationDate ? new Date(expirationDate) : new Date(),
        });

        // Enhanced debugging for renewal date issues
        console.log("=== RENEWAL DATE DEBUG ===");
        console.log("Raw RevenueCat data:", {
          productId,
          allExpirationDates: purchaseInfo.customerInfo.allExpirationDates,
          latestExpirationDate: purchaseInfo.customerInfo.latestExpirationDate,
          activeSubscriptions: purchaseInfo.customerInfo.activeSubscriptions,
          entitlements: purchaseInfo.customerInfo.entitlements,
          firstSeen: purchaseInfo.customerInfo.firstSeen,
          originalPurchaseDate: purchaseInfo.customerInfo.originalPurchaseDate,
        });

        const processedExpirationDate = expirationDate
          ? new Date(expirationDate)
          : new Date();
        const now = new Date();
        const daysDiff = expirationDate
          ? Math.floor(
              (processedExpirationDate.getTime() - now.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;

        console.log("Processed expiration date details:", {
          originalExpirationString: expirationDate,
          parsedExpirationDate: processedExpirationDate,
          expirationDateISO: processedExpirationDate.toISOString(),
          currentDate: now.toISOString(),
          daysDifference: daysDiff,
        });
        console.log("==========================");

        console.log("About to call updateSubscription with:", {
          userId: this.userId,
          productId,
          monthlyCredits,
          processedExpirationDate,
        });

        await creditsService.updateSubscription(
          this.userId,
          productId,
          monthlyCredits,
          processedExpirationDate,
          true // Add credits since this is a new purchase
        );

        // Credits are now added by updateSubscription when addCredits=true

        return true;
      } catch (subscriptionError) {
        // Critical: If subscription setup fails after successful purchase
        console.error(
          "CRITICAL: Subscription purchase succeeded but setup failed:",
          subscriptionError
        );

        throw new Error(
          "Subscription purchase completed but setup failed. Please contact support with this error message."
        );
      }
    } catch (error: any) {
      if (error.userCancelled) {
        return false;
      }

      console.error("Error purchasing subscription:", error);
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

  async syncSubscriptionStatus(): Promise<void> {
    if (!this.isConfigured || !this.userId) {
      console.warn(
        "RevenueCat not configured, cannot sync subscription status"
      );
      return;
    }

    try {
      console.log("Syncing subscription status with RevenueCat...");
      const customerInfo = await this.getCustomerInfo();

      console.log("RevenueCat customer info:", {
        activeSubscriptions: customerInfo.activeSubscriptions,
        allExpirationDates: customerInfo.allExpirationDates,
      });

      if (customerInfo.activeSubscriptions.length > 0) {
        // User has active subscriptions
        const subscriptionId = customerInfo.activeSubscriptions[0];
        const credits = CREDIT_AMOUNTS[subscriptionId] || 0;
        const expirationDate =
          customerInfo.allExpirationDates?.[subscriptionId];

        await creditsService.updateSubscription(
          this.userId,
          subscriptionId,
          credits,
          expirationDate ? new Date(expirationDate) : new Date(),
          false // Don't add credits during sync operations
        );

        console.log("Subscription status updated: active");
      } else {
        // No active subscriptions
        await creditsService.cancelSubscription(this.userId);
        console.log("Subscription status updated: cancelled");
      }
    } catch (error) {
      console.error("Error syncing subscription status:", error);
    }
  }

  cleanup() {
    Purchases.removeCustomerInfoUpdateListener(this.handleCustomerInfoUpdate);
    this.isConfigured = false;
    this.userId = null;
  }
}

export const revenueCatService = new RevenueCatService();
