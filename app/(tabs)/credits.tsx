import { CreditsHeader } from "@/components/credits/CreditsHeader";
import { InfoSection } from "@/components/credits/InfoSection";
import { TabSelector } from "@/components/credits/TabSelector";
import { SubscriptionCard } from "@/components/credits/SubscriptionCard";
import { CreditPackCard } from "@/components/credits/CreditPackCard";
import { PurchaseButton } from "@/components/credits/PurchaseButton";
import { StarsDecorations } from "@/components/credits/StarsDecorations";
import type { ProductInfo } from "@/components/credits/types";
import { BorderRadius, Colors, Spacing, Typography } from "@/constants/Theme";
import { useAuth } from "@/hooks/useAuth";
import { creditsService } from "@/services/firebase/credits";
import { PRODUCT_IDS, revenueCatService } from "@/services/revenuecat";
import type { UserCredits } from "@/types/monetization.types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  ImageBackground,
  Platform,
  ScrollView,
  StatusBar,
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
import { LinearGradient } from "expo-linear-gradient";

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
        console.log("Could not load customer info:", error);
      }
    } catch (error: any) {
      console.error("Error loading offerings:", error);
      if (!error.message?.includes("None of the products registered")) {
        Alert.alert("Error", "Failed to load store information");
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
        console.log(
          `🎯 Initial balance set to ${userCredits.balance} (modal: ${_isModal})`
        );
      }
    }
  }, [userCredits, _isModal]);

  // Real-time subscription to credit updates
  useEffect(() => {
    if (!user?.uid) return;

    console.log("🔔 Setting up real-time credit subscription");

    const unsubscribe = creditsService.onCreditsChange(
      user.uid,
      (updatedCredits) => {
        if (updatedCredits) {
          console.log(
            "💰 Credits updated in real-time:",
            updatedCredits.balance
          );

          // Check if credits increased to trigger animation
          const newBalance = updatedCredits.balance;
          const oldBalance = previousBalance.current;

          console.log(`🔍 Animation check:`, {
            isModal: _isModal,
            newBalance,
            oldBalance,
            difference: newBalance - oldBalance,
            shouldCheckAnimation: true,
          });

          // In modal mode, be more liberal with animations to ensure they work
          const shouldAnimate = _isModal
            ? newBalance > oldBalance && oldBalance >= 0
            : oldBalance > 0 && newBalance > oldBalance;

          if (shouldAnimate) {
            console.log(
              `✨ Credits increased from ${oldBalance} to ${newBalance} - animating! (modal: ${_isModal})`
            );
            animateCreditsIncrease();
          } else {
            console.log(
              `❌ No animation: newBalance=${newBalance}, oldBalance=${oldBalance}, modal=${_isModal}`
            );
          }

          // Update previous balance for next comparison
          previousBalance.current = newBalance;
          setUserCredits(updatedCredits);
        }
      }
    );

    return () => {
      console.log("🔔 Cleaning up credit subscription");
      unsubscribe();
    };
  }, [user?.uid, animateCreditsIncrease, _isModal]);

  // Clear selected package when switching tabs
  useEffect(() => {
    setSelectedPackage(null);
  }, [selectedTab]);

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
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
                    console.error("Purchase error:", purchaseError);
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
          Alert.alert("Success", "Subscription updated successfully", [
            {
              text: "OK",
              onPress: () => {
                if (_isModal && onPurchaseSuccess) {
                  onPurchaseSuccess();
                }
              },
            },
          ]);
          await loadCreditsAndOfferings();
        } else {
          Alert.alert(
            "Purchase successful",
            "Your credits have been added to your account",
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
        }
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
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
      Alert.alert("Success", "Purchases restored successfully!");
      await loadCreditsAndOfferings();
    } catch (error) {
      console.error("Restore error:", error);
      Alert.alert("Error", "Failed to restore purchases");
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
                paddingTop:
                  insets.top +
                  Spacing.screenPadding +
                  (Platform.select({
                    android: StatusBar.currentHeight || 0,
                    ios: 0,
                  }) || 0),
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
                        isSelected={selectedPackage?.identifier === pkg.identifier}
                        isActive={isSubscriptionActive(pkg.product.identifier)}
                        hasAnyActiveSubscription={activeSubscriptions.length > 0}
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
                      isSelected={selectedPackage?.identifier === pkg.identifier}
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
                    console.log("=== DEBUGGING SUBSCRIPTION ===");
                    try {
                      // Check what RevenueCat is reporting
                      await revenueCatService.configure(user?.uid || "");

                      console.log("🐛 DEBUG: Raw RevenueCat customer info:");
                      const customerInfo =
                        await revenueCatService.getCustomerInfo();
                      console.log(
                        "🐛 Active subscriptions:",
                        customerInfo.activeSubscriptions
                      );
                      console.log(
                        "🐛 All expiration dates:",
                        customerInfo.allExpirationDates
                      );
                      console.log(
                        "🐛 All purchased products:",
                        customerInfo.allPurchasedProductIdentifiers
                      );

                      // Get current active subscription
                      const currentSub =
                        await revenueCatService.getCurrentActiveSubscription();
                      console.log(
                        "🐛 getCurrentActiveSubscription result:",
                        currentSub
                      );

                      // Force sync
                      await revenueCatService.syncSubscriptionStatus();

                      // Reload this screen
                      await loadCreditsAndOfferings();

                      Alert.alert(
                        "Debug Complete",
                        `Current subscription: ${currentSub?.productId || "None"}\nCheck console for details`
                      );
                    } catch (error) {
                      console.error("🐛 DEBUG ERROR:", error);
                      Alert.alert("Debug Error", String(error));
                    }
                    console.log("=== DEBUG COMPLETE ===");
                  }}
                >
                  <Text style={styles.debugText}>🐛 Debug Subscription</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.forceRefreshButton}
                  onPress={async () => {
                    console.log("=== FORCE REFRESH REVENUECAT ===");
                    try {
                      await revenueCatService.configure(user?.uid || "");

                      // Force RevenueCat to refresh from server (not cache)
                      console.log(
                        "🔄 Calling restorePurchases to force refresh..."
                      );
                      const freshCustomerInfo =
                        await revenueCatService.restorePurchases();
                      console.log("🔄 Fresh customer info after restore:", {
                        activeSubscriptions:
                          freshCustomerInfo.activeSubscriptions,
                        allExpirationDates:
                          freshCustomerInfo.allExpirationDates,
                      });

                      // Now sync with fresh data
                      await revenueCatService.syncSubscriptionStatus();

                      // Reload screen
                      await loadCreditsAndOfferings();

                      Alert.alert(
                        "Refresh Complete",
                        `Active subs: ${freshCustomerInfo.activeSubscriptions.join(", ")}\nCheck console for details`
                      );
                    } catch (error) {
                      console.error("🔄 REFRESH ERROR:", error);
                      Alert.alert("Refresh Error", String(error));
                    }
                    console.log("=== FORCE REFRESH COMPLETE ===");
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

  // Debug button - Temporary
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

  // Force refresh button - Temporary
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
