import { CreditPackCard } from "@/components/credits/CreditPackCard";
import { CreditsHeader } from "@/components/credits/CreditsHeader";
import { InfoSection } from "@/components/credits/InfoSection";
import { logger } from "@/utils/logger";
import { PurchaseButton } from "@/components/credits/PurchaseButton";
import { StarsDecorations } from "@/components/credits/StarsDecorations";
import { SubscriptionCard } from "@/components/credits/SubscriptionCard";
import { TabSelector } from "@/components/credits/TabSelector";
import type { ProductInfo } from "@/components/credits/types";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import { useAuth } from "@/hooks/useAuth";
import { creditsService } from "@/services/firebase/credits";
import { PRODUCT_IDS, revenueCatService } from "@/services/revenuecat";
import type { UserCredits } from "@/types/monetization.types";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface CreditsScreenProps {
  isModal?: boolean;
  onPurchaseSuccess?: () => void;
}

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
                  title: "Monthly Storyteller",
                  description: "30 stories per month",
                },
              },
              {
                identifier: "fake_monthly_pro",
                product: {
                  identifier: "com.dreamweaver.subscription.monthly.pro",
                  price: 12.99,
                  priceString: "$12.99",
                  title: "Monthly Story Master",
                  description: "100 stories per month",
                },
              },
              {
                identifier: "fake_annual_basic",
                product: {
                  identifier: "com.dreamweaver.subscription.annual.basic",
                  price: 49.99,
                  priceString: "$49.99",
                  title: "Annual Storyteller",
                  description: "360 stories per year",
                },
              },
              {
                identifier: "fake_annual_pro",
                product: {
                  identifier: "com.dreamweaver.subscription.annual.pro",
                  price: 119.99,
                  priceString: "$119.99",
                  title: "Annual Story Master",
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
                  title: "Starter Pack",
                  description: "10 credits",
                },
              },
              {
                identifier: "fake_credits_25",
                product: {
                  identifier: "com.dreamweaver.credits.25",
                  price: 6.99,
                  priceString: "$6.99",
                  title: "Story Bundle",
                  description: "25 credits",
                },
              },
              {
                identifier: "fake_credits_50",
                product: {
                  identifier: "com.dreamweaver.credits.50",
                  price: 12.99,
                  priceString: "$12.99",
                  title: "Family Pack",
                  description: "50 credits",
                },
              },
              {
                identifier: "fake_credits_100",
                product: {
                  identifier: "com.dreamweaver.credits.100",
                  price: 24.99,
                  priceString: "$24.99",
                  title: "Story Master",
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
      if (!error.userCancelled) {
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

  const getProductInfo = (productId: string): ProductInfo => {
    const products: Record<string, ProductInfo> = {
      // Subscriptions
      [PRODUCT_IDS.MONTHLY_BASIC]: {
        credits: 30,
        type: "subscription" as const,
        name: "Monthly Storyteller",
        period: "month",
        displayName: "Monthly\nStoryteller",
      },
      [PRODUCT_IDS.MONTHLY_PRO]: {
        credits: 100,
        type: "subscription" as const,
        name: "Monthly Story Master",
        period: "month",
        displayName: "Monthly\nStory Master",
        popular: true,
      },
      [PRODUCT_IDS.ANNUAL_BASIC]: {
        credits: 360,
        type: "subscription" as const,
        name: "Annual Storyteller",
        period: "year",
        displayName: "Annual\nStoryteller",
      },
      [PRODUCT_IDS.ANNUAL_PRO]: {
        credits: 1200,
        type: "subscription" as const,
        name: "Annual Story Master",
        period: "year",
        displayName: "Annual\nStory Master",
        bestValue: true,
      },
      // Credit packs
      [PRODUCT_IDS.CREDITS_10]: {
        credits: 10,
        type: "pack" as const,
        name: "Starter Pack",
        period: null,
        displayName: "Starter\nPack",
      },
      [PRODUCT_IDS.CREDITS_25]: {
        credits: 25,
        type: "pack" as const,
        name: "Story Bundle",
        period: null,
        displayName: "Story\nBundle",
      },
      [PRODUCT_IDS.CREDITS_50]: {
        credits: 50,
        type: "pack" as const,
        name: "Family Pack",
        period: null,
        displayName: "Family\nPack",
        popular: true,
      },
      [PRODUCT_IDS.CREDITS_100]: {
        credits: 100,
        type: "pack" as const,
        name: "Story Master",
        period: null,
        displayName: "Story\nMaster",
      },
    };
    return (
      products[productId] || {
        credits: 0,
        type: "pack" as const,
        name: "Unknown",
        period: null,
        displayName: "Unknown",
      }
    );
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
            getProductInfo(pkg.product.identifier).popular ||
            getProductInfo(pkg.product.identifier).bestValue
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
          (pkg) => getProductInfo(pkg.product.identifier).popular
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
    <ImageBackground
      source={require("../../assets/images/background-landscape.png")}
      resizeMode={isTablet ? "cover" : "contain"}
      style={styles.container}
    >
      <LinearGradient
        colors={[Colors.backgroundGradientStart, Colors.backgroundGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

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
                paddingTop: insets.top + Spacing.screenPadding,
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
                        getProductInfo={getProductInfo}
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
                      getProductInfo={getProductInfo}
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

            <View style={{ height: 100 }} />
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
          getProductInfo={getProductInfo}
          insets={insets}
        />
      )}

      {purchasing && (
        <View style={styles.purchasingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.purchasingText}>Processing purchase...</Text>
        </View>
      )}
    </ImageBackground>
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
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.screenPadding,
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
    paddingVertical: Spacing.lg,
    marginTop: -15,
    marginBottom: Spacing.lg,
  },
  restoreText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    textDecorationLine: "underline",
  },

  // Debug button - Development only
  debugButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 0, 0.3)",
  },
  debugText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },

  // Force refresh button - Development only
  forceRefreshButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xxl,
    backgroundColor: "rgba(0, 150, 255, 0.1)",
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: "rgba(0, 150, 255, 0.3)",
  },
  forceRefreshText: {
    fontSize: Typography.fontSize.small,
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
    fontSize: Typography.fontSize.medium,
    color: Colors.text,
    marginTop: Spacing.lg,
    textAlign: "center",
  },
});
