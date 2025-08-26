import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";
import { Platform } from "react-native";
import { creditsService } from "./firebase/credits";
import { logger } from "../utils/logger";

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
        logger.warn(
          "RevenueCat API key not configured - purchases will not work",
          {
            message:
              "Add EXPO_PUBLIC_REVENUECAT_IOS_KEY and EXPO_PUBLIC_REVENUECAT_ANDROID_KEY to your .env file",
          }
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
      logger.debug("RevenueCat configured successfully");
    } catch (error) {
      logger.error("Error configuring RevenueCat", error);

      if (__DEV__) {
        // In development, log warning but don't crash
        logger.warn(
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

      logger.debug("Customer info update", {
        activeSubscriptions: customerInfo.activeSubscriptions,
        allExpirationDates: customerInfo.allExpirationDates,
      });

      // Check for active subscriptions
      const activeSubscriptions = customerInfo.activeSubscriptions;

      if (activeSubscriptions.length > 0) {
        // Warn if multiple subscriptions detected (shouldn't happen with upgrade path)
        if (activeSubscriptions.length > 1) {
          logger.warn("Multiple active subscriptions detected", {
            activeSubscriptions,
            message:
              "This may indicate an upgrade/downgrade in progress or a configuration issue",
          });

          // Provide detailed analysis of each subscription
          activeSubscriptions.forEach((subscriptionId, index) => {
            const expirationDate =
              customerInfo.allExpirationDates?.[subscriptionId];
            const expDate = expirationDate ? new Date(expirationDate) : null;
            const now = new Date();
            const isStillActive = expDate ? expDate > now : false;
            const minutesFromNow = expDate
              ? Math.floor((expDate.getTime() - now.getTime()) / (1000 * 60))
              : null;

            logger.warn(`Subscription ${index + 1} details`, {
              productId: subscriptionId,
              expirationDate: expDate?.toISOString() || "unknown",
              isStillActive,
              minutesFromNow:
                minutesFromNow !== null
                  ? isStillActive
                    ? `expires in ${minutesFromNow} min`
                    : `expired ${Math.abs(minutesFromNow)} min ago`
                  : "unknown",
              credits: CREDIT_AMOUNTS[subscriptionId] || 0,
            });
          });
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

        logger.debug("Primary subscription identified", {
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
            logger.debug("Subscription expired, cancelling");
            await creditsService.cancelSubscription(this.userId);
          }
        }
      } else {
        // No active subscription
        logger.debug("No active subscriptions, cancelling");
        await creditsService.cancelSubscription(this.userId);
      }
    } catch (error) {
      logger.error("Error handling customer info update", error);
    }
  };

  async getOfferings() {
    if (!this.isConfigured) {
      logger.warn("RevenueCat not configured - returning empty offerings");
      return { current: null, all: {} };
    }

    try {
      const offerings = await Purchases.getOfferings();

      logger.debug("Offerings current offering", {
        currentOffering: offerings.current?.identifier,
      });
      logger.debug("Offerings packages count", {
        packagesCount: offerings.current?.availablePackages?.length || 0,
      });

      offerings.current?.availablePackages?.forEach((pkg, index) => {
        const isKnownProduct =
          CREDIT_AMOUNTS[pkg.product.identifier] !== undefined;
        logger.debug(`Package ${index} details`, {
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

      logger.debug("Expected product IDs", {
        expectedProductIds: Object.keys(CREDIT_AMOUNTS),
      });

      return offerings;
    } catch (error: any) {
      logger.error("Error getting offerings", error);

      // Handle the case where no products are configured yet
      if (error.message?.includes("None of the products registered")) {
        logger.warn(
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

      logger.debug("Credit pack purchase debug", {
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
      logger.debug("Starting credit pack purchase");
      purchaseInfo = await Purchases.purchasePackage(packageToPurchase);
      logger.debug("Credit pack purchase completed", {
        customerInfo: {
          activeSubscriptions: purchaseInfo.customerInfo.activeSubscriptions,
          nonSubscriptionTransactions:
            purchaseInfo.customerInfo.nonSubscriptionTransactions?.length || 0,
          latestExpirationDate: purchaseInfo.customerInfo.latestExpirationDate,
        },
      });

      // Credits will be awarded by RevenueCat webhook automatically
      logger.debug(
        "Credit pack purchase completed - credits will be added by webhook within a few seconds"
      );

      return true;
    } catch (error: any) {
      if (error.userCancelled) {
        return false;
      }

      logger.error("Error purchasing credit pack", error);
      throw error;
    }
  }

  private getValidTransactionId(customerInfo: CustomerInfo): string {
    // Use a unique identifier combining timestamp and user
    // Since sandbox transactions often have the same originalPurchaseDate
    const timestamp = Date.now();
    const userPrefix = this.userId ? this.userId.substring(0, 8) : "unknown";
    const uniqueId = `${userPrefix}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    logger.debug("Generated unique transaction ID", { uniqueId });
    logger.debug("CustomerInfo debug", {
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
        logger.debug("Existing subscription detected", {
          current: currentSubscription.productId,
          new: productId,
          platform: Platform.OS,
          expirationDate: currentSubscription.expirationDate.toISOString(),
        });

        // Use RevenueCat's upgrade/downgrade functionality
        purchaseOptions.oldProductIdentifier = currentSubscription.productId;

        // Add platform-specific options for immediate replacement
        if (Platform.OS === "ios") {
          // iOS: For RevenueCat v7+, use the GooglePlayProductChangeOptions or standard upgrade flow
          // The oldProductIdentifier should be sufficient for iOS upgrades
          logger.debug(
            "iOS: Using oldProductIdentifier for subscription replacement"
          );
          // Note: iOS handles subscription upgrades/downgrades automatically through oldProductIdentifier
          // ProrationMode is primarily for Android - removing it for iOS
        } else {
          // Android: Use replace SKUs for immediate replacement
          purchaseOptions.oldSkus = [currentSubscription.productId];
          purchaseOptions.prorationMode = 1; // IMMEDIATE_WITHOUT_PRORATION
          logger.debug(
            "Android: Configuring subscription replacement with oldSkus"
          );
        }

        logger.debug("Subscription replacement config", {
          oldProductIdentifier: currentSubscription.productId,
          newProductIdentifier: productId,
          platform: Platform.OS,
          purchaseOptions,
        });
      }

      // Make the purchase (with upgrade/replace if applicable)
      logger.debug("Subscription purchase starting");
      logger.debug("Final purchase options", { purchaseOptions });
      logger.debug("Package to purchase", {
        identifier: packageToPurchase.identifier,
        productId: packageToPurchase.product.identifier,
        priceString: packageToPurchase.product.priceString,
      });

      purchaseInfo = await Purchases.purchasePackage(
        packageToPurchase,
        purchaseOptions
      );
      logger.debug("Subscription purchase completed");

      // Critical: Update subscription and add credits atomically
      try {
        // For upgrades/downgrades, we need to be more careful about which subscription to track
        const customerInfo = purchaseInfo.customerInfo;
        const activeSubscriptions = customerInfo.activeSubscriptions;

        logger.debug("Post-purchase subscription debug", {
          requestedProductId: productId,
          oldSubscription: currentSubscription?.productId,
          activeSubscriptions,
          activeSubscriptionCount: activeSubscriptions.length,
          allExpirationDates: customerInfo.allExpirationDates,
          wasUpgrade: !!currentSubscription,
        });

        // Validate subscription replacement worked
        if (currentSubscription && activeSubscriptions.length > 1) {
          logger.warn("Multiple subscriptions detected after upgrade", {
            oldSubscription: currentSubscription.productId,
            newSubscription: productId,
            allActiveSubscriptions: activeSubscriptions,
            allExpirationDates: customerInfo.allExpirationDates,
            platform: Platform.OS,
            purchaseOptions,
            message:
              "Subscription replacement may not have worked properly - this indicates a platform-specific configuration issue",
          });

          // Check if the old subscription is still active with a future expiration
          const oldExpirationDate =
            customerInfo.allExpirationDates?.[currentSubscription.productId];
          if (oldExpirationDate) {
            const oldExpDate = new Date(oldExpirationDate);
            const now = new Date();
            const stillActive = oldExpDate > now;
            const minutesUntilExpiration = Math.floor(
              (oldExpDate.getTime() - now.getTime()) / (1000 * 60)
            );

            logger.warn("Old subscription status", {
              productId: currentSubscription.productId,
              expirationDate: oldExpDate.toISOString(),
              stillActive,
              minutesUntilExpiration: stillActive
                ? minutesUntilExpiration
                : `expired ${Math.abs(minutesUntilExpiration)} minutes ago`,
              message: stillActive
                ? "Old subscription is still active - replacement may not have worked immediately"
                : "Old subscription has expired - replacement worked correctly",
            });
          }
        } else if (currentSubscription && activeSubscriptions.length === 1) {
          logger.debug("Subscription replacement successful", {
            oldSubscription: currentSubscription.productId,
            newSubscription: productId,
            activeSubscription: activeSubscriptions[0],
            replacementWorked: activeSubscriptions[0] === productId,
            platform: Platform.OS,
          });
        }

        // Find the correct subscription to use - prioritize the one we just purchased
        let finalProductId = productId;
        let finalExpirationDate = customerInfo.allExpirationDates?.[productId];

        // If we don't find the expected product, use the first active subscription
        // This handles cases where RevenueCat processes the change differently
        if (!finalExpirationDate && activeSubscriptions.length > 0) {
          logger.warn(
            "Expected product not found in expiration dates, using first active subscription"
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

        logger.debug("Final subscription update", {
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
        logger.error(
          "CRITICAL: Subscription purchase succeeded but setup failed",
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

      logger.error("Error purchasing subscription", error);
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      logger.error("Error restoring purchases", error);
      throw error;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      logger.error("Error getting customer info", error);
      throw error;
    }
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return customerInfo.activeSubscriptions.length > 0;
    } catch (error) {
      logger.error("Error checking subscription status", error);
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
        logger.warn("No expiration date found for active subscription");
        return null;
      }

      return {
        productId: primarySubscription,
        credits,
        expirationDate: new Date(expirationDate),
      };
    } catch (error) {
      logger.error("Error getting current active subscription", error);
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
      logger.error("Error checking upgrade availability", error);
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
      logger.warn("RevenueCat not configured");
      return;
    }

    try {
      logger.debug("Fetching customer info from RevenueCat");
      const customerInfo = await this.getCustomerInfo();

      logger.debug("Raw CustomerInfo", {
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
      logger.debug("Subscription timeline analysis");
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
        logger.debug(`Subscription ${index + 1}`, {
          productId: sub!.productId,
          credits: sub!.credits,
          status,
          timeDescription: timeDesc,
        });
      });

      // Check what our current active subscription should be
      const currentSub = await this.getCurrentActiveSubscription();
      logger.debug("getCurrentActiveSubscription result", { currentSub });
    } catch (error) {
      logger.error("Error fetching customer info for debug", error);
    }
  }

  /**
   * Force sync subscription status (public method for debugging)
   */
  async forceSyncSubscription(): Promise<void> {
    logger.debug("Force sync: Starting manual subscription sync");
    await this.syncSubscriptionStatus();
    logger.debug("Force sync: Manual subscription sync completed");
  }

  async syncSubscriptionStatus(): Promise<void> {
    if (!this.isConfigured || !this.userId) {
      logger.warn("RevenueCat not configured, cannot sync subscription status");
      return;
    }

    try {
      logger.debug("Syncing subscription status with RevenueCat");
      const customerInfo = await this.getCustomerInfo();

      logger.debug("Sync: RevenueCat customer info", {
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

        logger.debug("Sync: Primary subscription details", {
          primarySubscription,
          credits,
          expirationDate,
          totalActiveSubscriptions: customerInfo.activeSubscriptions.length,
        });

        if (expirationDate) {
          const expDate = new Date(expirationDate);
          const now = new Date();
          const isExpired = expDate <= now;

          logger.debug("Sync: Expiration check", {
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
            logger.debug("Sync: Subscription status updated - active");
          } else {
            logger.debug("Sync: Subscription expired, cancelling");
            await creditsService.cancelSubscription(this.userId);
          }
        } else {
          logger.warn("Sync: No expiration date found for active subscription");
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
        logger.debug("Sync: No active subscriptions, cancelling");
        await creditsService.cancelSubscription(this.userId);
      }
    } catch (error) {
      logger.error("Error syncing subscription status", error);
    }
  }

  cleanup() {
    Purchases.removeCustomerInfoUpdateListener(this.handleCustomerInfoUpdate);
    this.isConfigured = false;
    this.userId = null;
  }
}

export const revenueCatService = new RevenueCatService();
