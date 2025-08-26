import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";
import { Platform } from "react-native";
import { creditsService } from "./firebase/credits";
import { logger } from "../utils/logger";
import { getAuth, onAuthStateChanged } from "@react-native-firebase/auth";
import {
  AuthenticationError,
  UserContextError,
  SubscriptionError,
  ConfigurationError,
} from "../types/revenuecat.errors";

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
  private authUnsubscribe: (() => void) | null = null;

  private validateCurrentUser(targetUserId: string): void {
    const authInstance = getAuth();
    const currentUser = authInstance.currentUser;
    if (!currentUser) {
      throw new AuthenticationError("No authenticated user found");
    }

    if (currentUser.uid !== targetUserId) {
      throw new UserContextError("User context mismatch detected");
    }
  }

  private async safelyCallCancelSubscription(userId: string): Promise<void> {
    try {
      await creditsService.cancelSubscription(userId);
    } catch (error: any) {
      if (error?.code === "firestore/permission-denied") {
        // Expected during user context switches - don't throw to avoid breaking the flow
        logger.info(
          "Subscription cancellation skipped due to user context switch"
        );
        return;
      }

      logger.error("Failed to cancel subscription", {
        userId,
        error: error.message,
      });
      throw new SubscriptionError("Failed to cancel subscription", error);
    }
  }

  async configure(userId: string) {
    if (this.isConfigured && this.userId === userId) {
      return;
    }

    // Always cleanup before configuring with a new user
    if (this.isConfigured && this.userId !== userId) {
      logger.debug("Cleaning up RevenueCat before reconfiguring for new user", {
        oldUserId: this.userId,
        newUserId: userId,
      });
      this.cleanup();
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

      // Set up auth state listener to handle user switches
      this.setupAuthListener();

      logger.info("RevenueCat configured successfully");
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

  private setupAuthListener(): void {
    // Clean up existing listener if any
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }

    // Set up new listener using modular API
    const authInstance = getAuth();
    this.authUnsubscribe = onAuthStateChanged(authInstance, (user) => {
      if (!user) {
        // User logged out - cleanup RevenueCat
        logger.info("User logged out, cleaning up RevenueCat");
        this.cleanup();
      } else if (this.userId && user.uid !== this.userId) {
        // User switched - cleanup and prepare for reconfiguration
        logger.info("User switched, cleaning up RevenueCat");
        this.cleanup();
      }
    });
  }

  private handleCustomerInfoUpdate = async (customerInfo: CustomerInfo) => {
    try {
      if (!this.userId) {
        logger.debug("Customer info update skipped: no user ID");
        return;
      }

      // Validate that current user matches the operation target
      try {
        this.validateCurrentUser(this.userId);
      } catch (error) {
        if (
          error instanceof UserContextError ||
          error instanceof AuthenticationError
        ) {
          logger.info("Customer info update skipped: user context issue");
          return;
        }
        throw error;
      }

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
            await this.safelyCallCancelSubscription(this.userId);
          }
        }
      } else {
        // No active subscription
        logger.debug("No active subscriptions, cancelling");
        await this.safelyCallCancelSubscription(this.userId);
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

  private validatePurchaseConfiguration(): void {
    if (!this.isConfigured) {
      throw new ConfigurationError("RevenueCat not configured");
    }

    if (!this.userId) {
      throw new ConfigurationError("User not configured");
    }
  }

  private validateProductCredits(productId: string): number {
    const monthlyCredits = CREDIT_AMOUNTS[productId];
    if (!monthlyCredits) {
      throw new SubscriptionError(`Unknown subscription: ${productId}`);
    }
    return monthlyCredits;
  }

  private configurePurchaseOptions(
    currentSubscription: any,
    productId: string
  ): any {
    const purchaseOptions: any = {};

    if (currentSubscription && currentSubscription.productId !== productId) {
      purchaseOptions.oldProductIdentifier = currentSubscription.productId;

      if (Platform.OS === "android") {
        purchaseOptions.oldSkus = [currentSubscription.productId];
        purchaseOptions.prorationMode = 1; // IMMEDIATE_WITHOUT_PRORATION
      }
    }

    return purchaseOptions;
  }

  private async processPostPurchaseSubscription(
    customerInfo: CustomerInfo,
    productId: string,
    monthlyCredits: number,
    _currentSubscription: any
  ): Promise<void> {
    const activeSubscriptions = customerInfo.activeSubscriptions;

    // Find the correct subscription to use - prioritize the one we just purchased
    let finalProductId = productId;
    let finalExpirationDate = customerInfo.allExpirationDates?.[productId];

    // If we don't find the expected product, use the first active subscription
    if (!finalExpirationDate && activeSubscriptions.length > 0) {
      const sortedSubscriptions = activeSubscriptions.sort((a, b) => {
        if (a.includes("annual") && !b.includes("annual")) return -1;
        if (!a.includes("annual") && b.includes("annual")) return 1;
        return 0;
      });
      finalProductId = sortedSubscriptions[0];
      finalExpirationDate = customerInfo.allExpirationDates?.[finalProductId];
    }

    const finalCredits = CREDIT_AMOUNTS[finalProductId] || monthlyCredits;
    const processedExpirationDate = finalExpirationDate
      ? new Date(finalExpirationDate)
      : new Date();

    await creditsService.updateSubscription(
      this.userId!,
      finalProductId,
      finalCredits,
      processedExpirationDate,
      true // Add credits since this is a new purchase
    );
  }

  async purchaseSubscription(
    packageToPurchase: PurchasesPackage
  ): Promise<boolean> {
    this.validatePurchaseConfiguration();

    let purchaseInfo: { customerInfo: CustomerInfo } | null = null;

    try {
      const productId = packageToPurchase.product.identifier;
      const monthlyCredits = this.validateProductCredits(productId);

      const currentSubscription = await this.getCurrentActiveSubscription();
      const purchaseOptions = this.configurePurchaseOptions(
        currentSubscription,
        productId
      );

      // Make the purchase (with upgrade/replace if applicable)
      purchaseInfo = await Purchases.purchasePackage(
        packageToPurchase,
        purchaseOptions
      );

      // Process the successful purchase
      try {
        await this.processPostPurchaseSubscription(
          purchaseInfo.customerInfo,
          productId,
          monthlyCredits,
          currentSubscription
        );
        return true;
      } catch (subscriptionError) {
        logger.error(
          "CRITICAL: Subscription purchase succeeded but setup failed",
          subscriptionError
        );
        throw new SubscriptionError(
          "Subscription purchase completed but setup failed. Please contact support.",
          subscriptionError as Error
        );
      }
    } catch (error: any) {
      if (error.userCancelled) {
        return false;
      }

      logger.error("Error purchasing subscription", error);
      throw new SubscriptionError("Failed to purchase subscription", error);
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
            await this.safelyCallCancelSubscription(this.userId);
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
        await this.safelyCallCancelSubscription(this.userId);
      }
    } catch (error) {
      logger.error("Error syncing subscription status", error);
    }
  }

  cleanup() {
    // Remove RevenueCat listeners
    Purchases.removeCustomerInfoUpdateListener(this.handleCustomerInfoUpdate);

    // Remove auth state listener
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
      this.authUnsubscribe = null;
    }

    // Reset state
    this.isConfigured = false;
    this.userId = null;

    logger.debug("RevenueCat cleanup completed");
  }
}

export const revenueCatService = new RevenueCatService();
