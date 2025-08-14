import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";
import { Platform } from "react-native";
import { creditsService } from "./firebase/credits";

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
        // Warn if multiple subscriptions detected (shouldn't happen with upgrade path)
        if (activeSubscriptions.length > 1) {
          console.warn(
            "⚠️ MULTIPLE ACTIVE SUBSCRIPTIONS DETECTED:",
            activeSubscriptions
          );
          console.warn(
            "This may indicate an upgrade/downgrade in progress or a configuration issue"
          );
        }

        // Get the primary subscription (most recent/preferred)
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
          allActiveSubscriptions: activeSubscriptions,
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

      // Credits will be awarded by RevenueCat webhook automatically
      console.log("🛒 CREDIT PACK PURCHASE COMPLETED!");
      console.log("💡 Credits will be added by webhook within a few seconds");

      return true;
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

      // Check for existing active subscription to handle upgrades/downgrades
      const currentSubscription = await this.getCurrentActiveSubscription();
      let purchaseOptions: any = {};

      if (currentSubscription && currentSubscription.productId !== productId) {
        console.log("🔄 EXISTING SUBSCRIPTION DETECTED:", {
          current: currentSubscription.productId,
          new: productId,
        });

        // Use RevenueCat's upgrade/downgrade functionality
        purchaseOptions.oldProductIdentifier = currentSubscription.productId;
        console.log(
          "🔄 WILL REPLACE SUBSCRIPTION:",
          currentSubscription.productId,
          "->",
          productId
        );
      }

      // Make the purchase (with upgrade/replace if applicable)
      console.log("🔔 SUBSCRIPTION PURCHASE STARTING...");
      purchaseInfo = await Purchases.purchasePackage(
        packageToPurchase,
        purchaseOptions
      );
      console.log("🔔 SUBSCRIPTION PURCHASE COMPLETED!");

      // Critical: Update subscription and add credits atomically
      try {
        // For upgrades/downgrades, we need to be more careful about which subscription to track
        const customerInfo = purchaseInfo.customerInfo;
        const activeSubscriptions = customerInfo.activeSubscriptions;

        console.log("🔄 POST-PURCHASE SUBSCRIPTION DEBUG:", {
          requestedProductId: productId,
          activeSubscriptions,
          allExpirationDates: customerInfo.allExpirationDates,
          wasUpgrade: !!currentSubscription,
        });

        // Find the correct subscription to use - prioritize the one we just purchased
        let finalProductId = productId;
        let finalExpirationDate = customerInfo.allExpirationDates?.[productId];

        // If we don't find the expected product, use the first active subscription
        // This handles cases where RevenueCat processes the change differently
        if (!finalExpirationDate && activeSubscriptions.length > 0) {
          console.log(
            "⚠️ Expected product not found in expiration dates, using first active subscription"
          );
          const sortedSubscriptions = activeSubscriptions.sort((a, b) => {
            if (a.includes("annual") && !b.includes("annual")) return -1;
            if (!a.includes("annual") && b.includes("annual")) return 1;
            return 0;
          });
          finalProductId = sortedSubscriptions[0];
          finalExpirationDate =
            customerInfo.allExpirationDates?.[finalProductId];
        }

        const finalCredits = CREDIT_AMOUNTS[finalProductId] || monthlyCredits;
        const processedExpirationDate = finalExpirationDate
          ? new Date(finalExpirationDate)
          : new Date();

        console.log("🔄 FINAL SUBSCRIPTION UPDATE:", {
          originalProductId: productId,
          finalProductId,
          finalCredits,
          processedExpirationDate: processedExpirationDate.toISOString(),
          wasProductChanged: finalProductId !== productId,
        });

        await creditsService.updateSubscription(
          this.userId,
          finalProductId, // Use the actual active product ID
          finalCredits,
          processedExpirationDate,
          true // Add credits since this is a new purchase
        );

        // Force a sync after purchase to ensure consistency
        setTimeout(() => {
          this.syncSubscriptionStatus();
        }, 2000);

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

  async getCurrentActiveSubscription(): Promise<{
    productId: string;
    credits: number;
    expirationDate: Date;
  } | null> {
    try {
      const customerInfo = await this.getCustomerInfo();

      if (customerInfo.activeSubscriptions.length === 0) {
        return null;
      }

      // Use the same priority logic as the customer info handler
      const sortedSubscriptions = customerInfo.activeSubscriptions.sort(
        (a, b) => {
          if (a.includes("annual") && !b.includes("annual")) return -1;
          if (!a.includes("annual") && b.includes("annual")) return 1;
          return 0;
        }
      );

      const primarySubscription = sortedSubscriptions[0];
      const credits = CREDIT_AMOUNTS[primarySubscription] || 0;
      const expirationDate =
        customerInfo.allExpirationDates?.[primarySubscription];

      if (!expirationDate) {
        console.warn("No expiration date found for active subscription");
        return null;
      }

      return {
        productId: primarySubscription,
        credits,
        expirationDate: new Date(expirationDate),
      };
    } catch (error) {
      console.error("Error getting current active subscription:", error);
      return null;
    }
  }

  /**
   * Checks if a user can upgrade to a higher tier subscription
   * @param targetProductId The product ID they want to upgrade to
   * @returns Object indicating if upgrade is available and what type
   */
  async canUpgradeToSubscription(targetProductId: string): Promise<{
    canUpgrade: boolean;
    isUpgrade: boolean;
    isDowngrade: boolean;
    currentSubscription?: string;
  }> {
    try {
      const current = await this.getCurrentActiveSubscription();

      if (!current) {
        return {
          canUpgrade: true,
          isUpgrade: false,
          isDowngrade: false,
        };
      }

      if (current.productId === targetProductId) {
        return {
          canUpgrade: false,
          isUpgrade: false,
          isDowngrade: false,
          currentSubscription: current.productId,
        };
      }

      const currentCredits = CREDIT_AMOUNTS[current.productId] || 0;
      const targetCredits = CREDIT_AMOUNTS[targetProductId] || 0;

      return {
        canUpgrade: true,
        isUpgrade: targetCredits > currentCredits,
        isDowngrade: targetCredits < currentCredits,
        currentSubscription: current.productId,
      };
    } catch (error) {
      console.error("Error checking upgrade availability:", error);
      return {
        canUpgrade: false,
        isUpgrade: false,
        isDowngrade: false,
      };
    }
  }

  private getSubscriptionDisplayName(productId: string): string {
    const displayNames: Record<string, string> = {
      [PRODUCT_IDS.MONTHLY_BASIC]: "Monthly Storyteller",
      [PRODUCT_IDS.MONTHLY_PRO]: "Monthly Story Master",
      [PRODUCT_IDS.ANNUAL_BASIC]: "Annual Storyteller",
      [PRODUCT_IDS.ANNUAL_PRO]: "Annual Story Master",
    };
    return displayNames[productId] || productId;
  }

  /**
   * Check if purchasing a subscription would replace an existing one
   * Returns null if no current subscription, or change info if there would be a change
   */
  async getSubscriptionChangeInfo(newProductId: string): Promise<{
    currentName: string;
    newName: string;
    isUpgrade: boolean;
    message: string;
  } | null> {
    const currentSubscription = await this.getCurrentActiveSubscription();

    if (
      !currentSubscription ||
      currentSubscription.productId === newProductId
    ) {
      return null;
    }

    const currentName = this.getSubscriptionDisplayName(
      currentSubscription.productId
    );
    const newName = this.getSubscriptionDisplayName(newProductId);
    const currentCredits = CREDIT_AMOUNTS[currentSubscription.productId] || 0;
    const newCredits = CREDIT_AMOUNTS[newProductId] || 0;
    const isUpgrade = newCredits > currentCredits;

    const message = `You currently have ${currentName} active. This will be replaced with ${newName}.\n\n${isUpgrade ? "You'll get more credits" : "You'll get fewer credits"} and your billing will be adjusted automatically.`;

    return {
      currentName,
      newName,
      isUpgrade,
      message,
    };
  }

  /**
   * Debug method to see exactly what RevenueCat is reporting
   */
  async debugCustomerInfo(): Promise<void> {
    if (!this.isConfigured || !this.userId) {
      console.warn("RevenueCat not configured");
      return;
    }

    try {
      console.log("🐛 DEBUG: Fetching customer info from RevenueCat...");
      const customerInfo = await this.getCustomerInfo();

      console.log("🐛 DEBUG: Raw CustomerInfo:", {
        activeSubscriptions: customerInfo.activeSubscriptions,
        allPurchasedProductIdentifiers:
          customerInfo.allPurchasedProductIdentifiers,
        allExpirationDates: customerInfo.allExpirationDates,
        entitlements: customerInfo.entitlements,
        latestExpirationDate: customerInfo.latestExpirationDate,
        originalPurchaseDate: customerInfo.originalPurchaseDate,
        firstSeen: customerInfo.firstSeen,
      });

      // Analyze all subscription expirations to understand the timeline
      console.log("🐛 SUBSCRIPTION TIMELINE ANALYSIS:");
      const now = new Date();
      const subscriptionTimeline = Object.entries(
        customerInfo.allExpirationDates || {}
      )
        .filter(([productId]) => productId.includes("subscription"))
        .map(([productId, expiration]) => {
          if (!expiration) return null;
          const expDate = new Date(expiration);
          const isActive = expDate > now;
          const minutesFromNow = Math.floor(
            (expDate.getTime() - now.getTime()) / (1000 * 60)
          );

          return {
            productId,
            expiration: expDate.toISOString(),
            isActive,
            minutesFromNow,
            credits: CREDIT_AMOUNTS[productId] || 0,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b!.minutesFromNow - a!.minutesFromNow);

      subscriptionTimeline.forEach((sub, index) => {
        const status = sub!.isActive ? "✅ ACTIVE" : "❌ EXPIRED";
        const timeDesc = sub!.isActive
          ? `expires in ${sub!.minutesFromNow} min`
          : `expired ${Math.abs(sub!.minutesFromNow)} min ago`;
        console.log(
          `${index + 1}. ${sub!.productId} (${sub!.credits} credits) - ${status} - ${timeDesc}`
        );
      });

      // Check what our current active subscription should be
      const currentSub = await this.getCurrentActiveSubscription();
      console.log("🐛 DEBUG: getCurrentActiveSubscription result:", currentSub);
    } catch (error) {
      console.error("🐛 DEBUG: Error fetching customer info:", error);
    }
  }

  /**
   * Force sync subscription status (public method for debugging)
   */
  async forceSyncSubscription(): Promise<void> {
    console.log("🔧 FORCE SYNC: Starting manual subscription sync...");
    await this.syncSubscriptionStatus();
    console.log("🔧 FORCE SYNC: Manual subscription sync completed");
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

      console.log("🔄 SYNC: RevenueCat customer info:", {
        activeSubscriptions: customerInfo.activeSubscriptions,
        allExpirationDates: customerInfo.allExpirationDates,
      });

      if (customerInfo.activeSubscriptions.length > 0) {
        // Use the same prioritization logic as other methods
        const sortedSubscriptions = customerInfo.activeSubscriptions.sort(
          (a, b) => {
            if (a.includes("annual") && !b.includes("annual")) return -1;
            if (!a.includes("annual") && b.includes("annual")) return 1;
            return 0;
          }
        );

        const primarySubscription = sortedSubscriptions[0];
        const credits = CREDIT_AMOUNTS[primarySubscription] || 0;
        const expirationDate =
          customerInfo.allExpirationDates?.[primarySubscription];

        console.log("🔄 SYNC: Primary subscription details:", {
          primarySubscription,
          credits,
          expirationDate,
          totalActiveSubscriptions: customerInfo.activeSubscriptions.length,
        });

        if (expirationDate) {
          const expDate = new Date(expirationDate);
          const now = new Date();
          const isExpired = expDate <= now;

          console.log("🔄 SYNC: Expiration check:", {
            expirationDate: expDate.toISOString(),
            currentDate: now.toISOString(),
            isExpired,
          });

          if (!isExpired) {
            await creditsService.updateSubscription(
              this.userId,
              primarySubscription,
              credits,
              expDate,
              false // Don't add credits during sync operations
            );
            console.log("🔄 SYNC: Subscription status updated: active");
          } else {
            console.log("🔄 SYNC: Subscription expired, cancelling");
            await creditsService.cancelSubscription(this.userId);
          }
        } else {
          console.warn(
            "🔄 SYNC: No expiration date found for active subscription"
          );
          // Still update the subscription but with a fallback date
          await creditsService.updateSubscription(
            this.userId,
            primarySubscription,
            credits,
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now as fallback
            false
          );
        }
      } else {
        // No active subscriptions
        console.log("🔄 SYNC: No active subscriptions, cancelling");
        await creditsService.cancelSubscription(this.userId);
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
