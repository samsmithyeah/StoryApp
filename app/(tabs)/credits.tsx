import { CreditPackCard } from "@/components/credits/CreditPackCard";
import { CreditsHeader } from "@/components/credits/CreditsHeader";
import { InfoSection } from "@/components/credits/InfoSection";
import { PurchaseButton } from "@/components/credits/PurchaseButton";
import { StarsDecorations } from "@/components/credits/StarsDecorations";
import { SubscriptionCard } from "@/components/credits/SubscriptionCard";
import { TabSelector } from "@/components/credits/TabSelector";
import type { ProductInfo } from "@/components/credits/types";
import { BackgroundContainer } from "@/components/shared/BackgroundContainer";
import {
  BorderRadius,
  Colors,
  isVerySmallScreen,
  Spacing,
  Typography,
} from "@/constants/Theme";
import { useAuth } from "@/hooks/useAuth";
import { creditsService } from "@/services/firebase/credits";
import { PRODUCT_IDS, revenueCatService } from "@/services/revenuecat";
import type { UserCredits } from "@/types/monetization.types";
import { logger } from "@/utils/logger";
import { Analytics } from "@/utils/analytics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

interface CreditsScreenProps {
  isModal?: boolean;
  onPurchaseSuccess?: () => void;
}

// Helper function to get product information
const getProductInfo = (
  productId: string,
  pkg?: PurchasesPackage
): ProductInfo => {
  // Always prefer the title from RevenueCat if available
  let productName = pkg?.product?.title;
  if (productName) {
    // Clean up app name suffixes like "(DreamWeaver)" or "(AppName)"
    productName = productName.replace(/\s*\([^)]+\)$/, "").trim();
  }

  // Fallback to hardcoded names only if no RevenueCat title
  const hardcodedProducts: Record<
    string,
    {
      name: string;
      credits: number;
      type: "subscription" | "pack";
      period: "month" | "year" | null;
      popular?: boolean;
      bestValue?: boolean;
    }
  > = {
    // Subscriptions
    [PRODUCT_IDS.MONTHLY_BASIC]: {
      name: "Monthly Storyteller",
      credits: 30,
      type: "subscription",
      period: "month",
    },
    [PRODUCT_IDS.MONTHLY_PRO]: {
      name: "Monthly Story Master",
      credits: 100,
      type: "subscription",
      period: "month",
      popular: true,
    },
    [PRODUCT_IDS.ANNUAL_BASIC]: {
      name: "Annual Storyteller",
      credits: 360,
      type: "subscription",
      period: "year",
    },
    [PRODUCT_IDS.ANNUAL_PRO]: {
      name: "Annual Story Master",
      credits: 1200,
      type: "subscription",
      period: "year",
      bestValue: true,
    },
    // Credit packs
    [PRODUCT_IDS.CREDITS_10]: {
      name: "Starter Pack",
      credits: 10,
      type: "pack",
      period: null,
    },
    [PRODUCT_IDS.CREDITS_25]: {
      name: "Story Bundle",
      credits: 25,
      type: "pack",
      period: null,
    },
    [PRODUCT_IDS.CREDITS_50]: {
      name: "Family Pack",
      credits: 50,
      type: "pack",
      period: null,
      popular: true,
    },
    [PRODUCT_IDS.CREDITS_100]: {
      name: "Story Master",
      credits: 100,
      type: "pack",
      period: null,
    },
  };

  const hardcodedProduct = hardcodedProducts[productId];

  // Use RevenueCat title if available, otherwise fallback to hardcoded name
  const finalName = productName || hardcodedProduct?.name || "Unknown Product";
  const finalDisplayName = finalName.replace(/\s+/g, "\n");

  // Determine product characteristics
  const isSubscription =
    productId.includes("subscription") ||
    hardcodedProduct?.type === "subscription";
  const isAnnual =
    productId.includes("annual") || hardcodedProduct?.period === "year";
  const isMonthly =
    productId.includes("monthly") || hardcodedProduct?.period === "month";

  // Determine credits - use hardcoded if available, otherwise try to infer
  let credits = hardcodedProduct?.credits || 0;
  if (!credits) {
    if (isSubscription) {
      if (productId.includes("basic")) {
        credits = isAnnual ? 360 : 30;
      } else if (productId.includes("pro")) {
        credits = isAnnual ? 1200 : 100;
      }
    } else {
      // Credit pack - try to extract number from product ID
      const creditMatch = productId.match(/(\d+)/);
      if (creditMatch) {
        credits = parseInt(creditMatch[1], 10);
      }
    }
  }

  // Determine badges - use hardcoded if available, otherwise infer from product characteristics
  let popular = hardcodedProduct?.popular;
  let bestValue = hardcodedProduct?.bestValue;

  // If no hardcoded badges, infer them based on product patterns
  if (popular === undefined && bestValue === undefined) {
    if (isSubscription) {
      // Monthly Pro is typically popular, Annual Pro is best value
      if (productId.includes("pro")) {
        if (isAnnual) {
          bestValue = true;
        } else if (isMonthly) {
          popular = true;
        }
      }
    } else {
      // For credit packs, 50-credit pack is typically popular
      if (credits === 50 || productId.includes("50")) {
        popular = true;
      }
    }
  }

  return {
    credits,
    type: isSubscription ? ("subscription" as const) : ("pack" as const),
    name: finalName,
    period: isSubscription
      ? isAnnual
        ? "year"
        : isMonthly
          ? "month"
          : null
      : null,
    displayName: finalDisplayName,
    popular,
    bestValue,
  };
};

export default function CreditsScreen({
  isModal: _isModal = false,
  onPurchaseSuccess,
}: CreditsScreenProps = {}) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [selectedTab, setSelectedTab] = useState<"subscriptions" | "packs">(
    "subscriptions"
  );
  const [activeSubscriptions, setActiveSubscriptions] = useState<string[]>([]);
  const [_subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);

  // Animation refs for credit counter
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const previousBalance = useRef<number>(0);

  // Track if screen view has been logged
  const screenViewLogged = useRef(false);

  // Animate credit counter when balance increases
  const animateCreditsIncrease = useCallback(() => {
    // Pulse animation - scale up and down with glow effect
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const loadCreditsAndOfferings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load offerings
      const offerings = await revenueCatService.getOfferings();
      if (offerings.current) {
        setOfferings(offerings.current);
      }

      // Load customer info to get active subscriptions
      try {
        const customerInfo = await revenueCatService.getCustomerInfo();
        setActiveSubscriptions(customerInfo.activeSubscriptions);
        setSubscriptionInfo(customerInfo);
      } catch (error) {
        logger.debug("Could not load customer info", { error });
      }
    } catch (error: any) {
      logger.error("Error loading offerings", error);

      // Add fake offerings for testing when RevenueCat fails (dev only)
      if (__DEV__) {
        const fakeOfferings = {
          current: {
            identifier: "fake_offering",
            serverDescription: "Fake offerings for testing",
            availablePackages: [
              // Fake subscriptions
              {
                identifier: "fake_monthly_basic",
                product: {
                  identifier: "com.dreamweaver.subscription.monthly.basic",
                  price: 4.99,
                  priceString: "$4.99",
                  title: "Monthly Storyteller fake",
                  description: "30 stories per month",
                },
              },
              {
                identifier: "fake_monthly_pro",
                product: {
                  identifier: "com.dreamweaver.subscription.monthly.pro",
                  price: 12.99,
                  priceString: "$12.99",
                  title: "Monthly Story Master fake",
                  description: "100 stories per month",
                },
              },
              {
                identifier: "fake_annual_basic",
                product: {
                  identifier: "com.dreamweaver.subscription.annual.basic",
                  price: 49.99,
                  priceString: "$49.99",
                  title: "Annual Storyteller fake",
                  description: "360 stories per year",
                },
              },
              {
                identifier: "fake_annual_pro",
                product: {
                  identifier: "com.dreamweaver.subscription.annual.pro",
                  price: 119.99,
                  priceString: "$119.99",
                  title: "Annual Story Master fake",
                  description: "1200 stories per year",
                },
              },
              // Fake credit packs
              {
                identifier: "fake_credits_10",
                product: {
                  identifier: "com.dreamweaver.credits.10",
                  price: 2.99,
                  priceString: "$2.99",
                  title: "Starter Pack fake",
                  description: "10 credits",
                },
              },
              {
                identifier: "fake_credits_25",
                product: {
                  identifier: "com.dreamweaver.credits.25",
                  price: 6.99,
                  priceString: "$6.99",
                  title: "Story Bundle fake",
                  description: "25 credits",
                },
              },
              {
                identifier: "fake_credits_50",
                product: {
                  identifier: "com.dreamweaver.credits.50",
                  price: 12.99,
                  priceString: "$12.99",
                  title: "Family Pack fake",
                  description: "50 credits",
                },
              },
              {
                identifier: "fake_credits_100",
                product: {
                  identifier: "com.dreamweaver.credits.100",
                  price: 24.99,
                  priceString: "$24.99",
                  title: "Story Master fake",
                  description: "100 credits",
                },
              },
            ],
          },
        };

        setOfferings(fakeOfferings.current as any);

        if (!error.message?.includes("None of the products registered")) {
          Alert.alert(
            "Error",
            "Failed to load store information - using test data"
          );
        }
      } else {
        // In production, just show the error
        if (!error.message?.includes("None of the products registered")) {
          Alert.alert("Error", "Failed to load store information");
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCreditsAndOfferings();
  }, [loadCreditsAndOfferings]);

  useEffect(() => {
    if (userCredits && !screenViewLogged.current) {
      // Track credits screen view
      Analytics.logCreditsScreenViewed({
        current_balance: userCredits.balance,
        entry_point: _isModal ? "insufficient_credits_modal" : "credits_tab",
      });
      screenViewLogged.current = true;
    }
  }, [userCredits, _isModal]);

  // Initialize previous balance when userCredits first loads
  useEffect(() => {
    if (userCredits) {
      // For modal mode, set the previous balance immediately when modal opens
      if (previousBalance.current === 0) {
        previousBalance.current = userCredits.balance;
      }
    }
  }, [userCredits, _isModal]);

  // Real-time subscription to credit updates
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = creditsService.onCreditsChange(
      user.uid,
      (updatedCredits) => {
        if (updatedCredits) {
          logger.debug("Credits updated", { balance: updatedCredits.balance });

          // Check if credits increased to trigger animation
          const newBalance = updatedCredits.balance;
          const oldBalance = previousBalance.current;

          // In modal mode, be more liberal with animations to ensure they work
          const shouldAnimate = _isModal
            ? newBalance > oldBalance && oldBalance >= 0
            : oldBalance > 0 && newBalance > oldBalance;

          if (shouldAnimate) {
            animateCreditsIncrease();
          }

          // Update previous balance for next comparison
          previousBalance.current = newBalance;
          setUserCredits(updatedCredits);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid, animateCreditsIncrease, _isModal]);

  // Clear selected package when switching tabs
  useEffect(() => {
    setSelectedPackage(null);
  }, [selectedTab]);

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    const productInfo = getProductInfo(
      packageToPurchase.product.identifier,
      packageToPurchase
    );
    const isSubscription = productInfo.type === "subscription";

    // Track purchase initiated
    Analytics.logPurchaseInitiated({
      item_type: isSubscription ? "subscription" : "credits",
      package_id: packageToPurchase.identifier,
      price: packageToPurchase.product.price,
      currency: packageToPurchase.product.currencyCode || "USD",
    });

    // Check if this is a fake package for testing
    if (packageToPurchase.identifier.startsWith("fake_")) {
      Alert.alert(
        "Test Purchase",
        `This is a test purchase for: ${packageToPurchase.product.title}\nPrice: ${packageToPurchase.product.priceString}\n\nIn a real app, this would process the payment.`,
        [{ text: "OK" }]
      );
      return;
    }

    try {
      setPurchasing(true);

      const isSubscription =
        packageToPurchase.product.identifier.includes("subscription");

      // For subscriptions, check if this would replace an existing subscription
      if (isSubscription) {
        const changeInfo = await revenueCatService.getSubscriptionChangeInfo(
          packageToPurchase.product.identifier
        );

        if (changeInfo) {
          // Show confirmation alert for subscription changes
          Alert.alert(
            changeInfo.isUpgrade
              ? "Upgrade subscription?"
              : "Change subscription?",
            changeInfo.message,
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => setPurchasing(false),
              },
              {
                text: changeInfo.isUpgrade ? "Upgrade" : "Change",
                onPress: async () => {
                  try {
                    const success =
                      await revenueCatService.purchaseSubscription(
                        packageToPurchase
                      );
                    if (success) {
                      Alert.alert(
                        "Success",
                        "Subscription updated successfully!",
                        [
                          {
                            text: "OK",
                            onPress: () => {
                              if (_isModal && onPurchaseSuccess) {
                                onPurchaseSuccess();
                              }
                            },
                          },
                        ]
                      );
                      await loadCreditsAndOfferings();
                    }
                  } catch (purchaseError: any) {
                    logger.error("Purchase error", purchaseError);
                    if (!purchaseError.userCancelled) {
                      Alert.alert(
                        "Purchase failed",
                        purchaseError.message || "Something went wrong"
                      );
                    }
                  } finally {
                    setPurchasing(false);
                  }
                },
              },
            ]
          );
          return; // Exit early, alert will handle the rest
        }
      }

      // Proceed with normal purchase (no subscription change needed)
      const success = isSubscription
        ? await revenueCatService.purchaseSubscription(packageToPurchase)
        : await revenueCatService.purchaseCreditPack(packageToPurchase);

      if (success) {
        // Track purchase completed
        Analytics.logPurchaseCompleted({
          item_type: isSubscription ? "subscription" : "credits",
          package_id: packageToPurchase.identifier,
          price: packageToPurchase.product.price,
          currency: packageToPurchase.product.currencyCode || "USD",
          credits_granted: isSubscription ? undefined : productInfo.credits,
        });

        if (isSubscription) {
          Toast.show({
            type: "success",
            text1: "Success",
            text2: "Subscription updated successfully",
            visibilityTime: 3000,
          });
          if (_isModal && onPurchaseSuccess) {
            onPurchaseSuccess();
          }
          await loadCreditsAndOfferings();
        } else {
          Toast.show({
            type: "success",
            text1: "Purchase successful",
            text2: "Your credits have been added to your account",
            visibilityTime: 3000,
          });
          if (_isModal && onPurchaseSuccess) {
            onPurchaseSuccess();
          }
        }
      }
    } catch (error: any) {
      logger.error("Purchase error", error);

      // Track purchase error (but not if user cancelled)
      if (!error.userCancelled) {
        Analytics.logPurchaseError({
          item_type: isSubscription ? "subscription" : "credits",
          package_id: packageToPurchase.identifier,
          error_type: error.code || "unknown_error",
          error_message: error.message,
        });

        Alert.alert("Purchase failed", error.message || "Something went wrong");
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setPurchasing(true);
      await revenueCatService.restorePurchases();
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Purchases restored successfully!",
        visibilityTime: 3000,
      });
      await loadCreditsAndOfferings();
    } catch (error) {
      logger.error("Restore error", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to restore purchases",
        visibilityTime: 3000,
      });
    } finally {
      setPurchasing(false);
    }
  };

  const isSubscriptionActive = (productId: string) => {
    return activeSubscriptions.includes(productId);
  };

  // Group packages by type and sort by price
  const creditPacks = (
    offerings?.availablePackages.filter(
      (pkg) => !pkg.product.identifier.includes("subscription")
    ) || []
  ).sort((a, b) => a.product.price - b.product.price);

  const subscriptions = (
    offerings?.availablePackages.filter((pkg) =>
      pkg.product.identifier.includes("subscription")
    ) || []
  ).sort((a, b) => a.product.price - b.product.price);

  // Auto-select popular options by default
  useEffect(() => {
    if (!offerings?.availablePackages) return;

    if (selectedTab === "subscriptions") {
      // Always clear selection if user has an active subscription
      const hasActiveSubscription = activeSubscriptions.length > 0;
      if (hasActiveSubscription) {
        setSelectedPackage(null);
        return;
      }

      // Only auto-select if nothing is currently selected
      if (!selectedPackage) {
        // Find popular subscription
        const popularSubscription = subscriptions.find(
          (pkg) =>
            getProductInfo(pkg.product.identifier, pkg).popular ||
            getProductInfo(pkg.product.identifier, pkg).bestValue
        );
        if (popularSubscription) {
          setSelectedPackage(popularSubscription);
        }
      }
    } else {
      // Only auto-select credit pack if nothing is currently selected
      if (!selectedPackage) {
        // Find popular credit pack
        const popularCreditPack = creditPacks.find(
          (pkg) => getProductInfo(pkg.product.identifier, pkg).popular
        );
        if (popularCreditPack) {
          setSelectedPackage(popularCreditPack);
        }
      }
    }
  }, [
    offerings,
    selectedTab,
    activeSubscriptions,
    subscriptions,
    creditPacks,
    selectedPackage,
  ]);

  return (
    <BackgroundContainer showDecorations={false}>
      <StarsDecorations />

      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <ScrollView
            style={[styles.scrollView, { marginTop: -insets.top }]}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop:
                  insets.top +
                  (isVerySmallScreen() ? Spacing.md : Spacing.screenPadding),
              },
            ]}
            contentInsetAdjustmentBehavior="never"
            showsVerticalScrollIndicator={false}
          >
            {/* Header with Credits title and balance */}
            <CreditsHeader
              userCredits={userCredits}
              scaleAnim={scaleAnim}
              fadeAnim={fadeAnim}
            />

            {/* Info Message */}
            <InfoSection />

            {/* Tab Selector */}
            <TabSelector
              selectedTab={selectedTab}
              onTabChange={setSelectedTab}
            />

            {/* Content based on selected tab */}
            {selectedTab === "subscriptions" ? (
              <View>
                {subscriptions.length > 0 && (
                  <View style={styles.planGrid}>
                    {subscriptions.map((pkg) => (
                      <SubscriptionCard
                        key={pkg.identifier}
                        package={pkg}
                        isSelected={
                          selectedPackage?.identifier === pkg.identifier
                        }
                        isActive={isSubscriptionActive(pkg.product.identifier)}
                        hasAnyActiveSubscription={
                          activeSubscriptions.length > 0
                        }
                        onSelect={setSelectedPackage}
                        getProductInfo={(productId) =>
                          getProductInfo(productId, pkg)
                        }
                      />
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View>
                <View style={styles.planGrid}>
                  {creditPacks.map((pkg) => (
                    <CreditPackCard
                      key={pkg.identifier}
                      package={pkg}
                      isSelected={
                        selectedPackage?.identifier === pkg.identifier
                      }
                      onSelect={setSelectedPackage}
                      getProductInfo={(productId) =>
                        getProductInfo(productId, pkg)
                      }
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Restore Purchases */}
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestorePurchases}
              disabled={purchasing}
            >
              <Text style={styles.restoreText}>Restore purchases</Text>
            </TouchableOpacity>

            {/* Debug Buttons - Only visible in development */}
            {__DEV__ && (
              <>
                <TouchableOpacity
                  style={styles.debugButton}
                  onPress={async () => {
                    try {
                      await revenueCatService.configure(user?.uid || "");

                      const customerInfo =
                        await revenueCatService.getCustomerInfo();
                      logger.debug("Debug - Active subscriptions", {
                        activeSubscriptions: customerInfo.activeSubscriptions,
                      });
                      logger.debug("Debug - Expiration dates", {
                        expirationDates: customerInfo.allExpirationDates,
                      });

                      const currentSub =
                        await revenueCatService.getCurrentActiveSubscription();
                      logger.debug("Debug - Current subscription", {
                        currentSub,
                      });

                      await revenueCatService.syncSubscriptionStatus();
                      await loadCreditsAndOfferings();

                      Alert.alert(
                        "Debug Complete",
                        `Current subscription: ${currentSub?.productId || "None"}`
                      );
                    } catch (error) {
                      logger.error("Debug error", error);
                      Alert.alert("Debug Error", String(error));
                    }
                  }}
                >
                  <Text style={styles.debugText}>🐛 Debug Subscription</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.forceRefreshButton}
                  onPress={async () => {
                    try {
                      await revenueCatService.configure(user?.uid || "");

                      const freshCustomerInfo =
                        await revenueCatService.restorePurchases();
                      logger.debug("Refresh - Active subscriptions", {
                        activeSubscriptions:
                          freshCustomerInfo.activeSubscriptions,
                      });

                      await revenueCatService.syncSubscriptionStatus();
                      await loadCreditsAndOfferings();

                      Alert.alert(
                        "Refresh Complete",
                        `Active subs: ${freshCustomerInfo.activeSubscriptions.join(", ")}`
                      );
                    } catch (error) {
                      logger.error("Refresh error", error);
                      Alert.alert("Refresh Error", String(error));
                    }
                  }}
                >
                  <Text style={styles.forceRefreshText}>
                    🔄 Force Refresh RevenueCat
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <View style={{ height: isVerySmallScreen() ? 60 : 100 }} />
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Fixed Bottom Purchase Button Section */}
      {(offerings?.availablePackages?.length || 0) > 0 && (
        <PurchaseButton
          selectedPackage={selectedPackage}
          selectedTab={selectedTab}
          purchasing={purchasing}
          activeSubscriptions={activeSubscriptions}
          onPurchase={handlePurchase}
          getProductInfo={(productId) =>
            getProductInfo(productId, selectedPackage || undefined)
          }
          insets={insets}
        />
      )}

      {purchasing && (
        <View style={styles.purchasingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.purchasingText}>Processing purchase...</Text>
        </View>
      )}
    </BackgroundContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: isVerySmallScreen() ? Spacing.lg : Spacing.screenPadding,
    paddingVertical: isVerySmallScreen() ? Spacing.md : Spacing.screenPadding,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Plan grid
  planGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  // Restore button
  restoreButton: {
    alignItems: "center",
    paddingVertical: isVerySmallScreen() ? Spacing.md : Spacing.lg,
    marginTop: isVerySmallScreen() ? -10 : -15,
    marginBottom: isVerySmallScreen() ? Spacing.md : Spacing.lg,
  },
  restoreText: {
    fontSize: isVerySmallScreen()
      ? Typography.fontSize.tiny
      : Typography.fontSize.small,
    color: Colors.textSecondary,
    textDecorationLine: "underline",
  },

  // Debug button - Development only
  debugButton: {
    alignItems: "center",
    paddingVertical: isVerySmallScreen() ? Spacing.sm : Spacing.md,
    marginBottom: isVerySmallScreen() ? Spacing.sm : Spacing.md,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 0, 0.3)",
  },
  debugText: {
    fontSize: isVerySmallScreen()
      ? Typography.fontSize.tiny
      : Typography.fontSize.small,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },

  // Force refresh button - Development only
  forceRefreshButton: {
    alignItems: "center",
    paddingVertical: isVerySmallScreen() ? Spacing.sm : Spacing.md,
    marginBottom: isVerySmallScreen() ? Spacing.lg : Spacing.xxl,
    backgroundColor: "rgba(0, 150, 255, 0.1)",
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: "rgba(0, 150, 255, 0.3)",
  },
  forceRefreshText: {
    fontSize: isVerySmallScreen()
      ? Typography.fontSize.tiny
      : Typography.fontSize.small,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },

  // Purchasing overlay
  purchasingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  purchasingText: {
    fontSize: isVerySmallScreen()
      ? Typography.fontSize.small
      : Typography.fontSize.medium,
    color: Colors.text,
    marginTop: isVerySmallScreen() ? Spacing.md : Spacing.lg,
    textAlign: "center",
  },
});
