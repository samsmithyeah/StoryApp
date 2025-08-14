import { IconSymbol } from "@/components/ui/IconSymbol";
import {
  BorderRadius,
  Colors,
  CommonStyles,
  Spacing,
  Typography,
} from "@/constants/Theme";
import { useAuth } from "@/hooks/useAuth";
import { creditsService } from "@/services/firebase/credits";
import { PRODUCT_IDS, revenueCatService } from "@/services/revenuecat";
import type { UserCredits } from "@/types/monetization.types";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface CreditsScreenProps {
  isModal?: boolean;
}

export default function CreditsScreen({
  isModal: _isModal = false,
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

  const loadCreditsAndOfferings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load user credits
      const credits = await creditsService.getUserCredits(user.uid);
      setUserCredits(credits);

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
      console.error("Error loading credits/offerings:", error);
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
                        "Subscription updated successfully!"
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
        Alert.alert("Success", "Purchase completed successfully!");
        await loadCreditsAndOfferings();
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

  const getProductInfo = (productId: string) => {
    const products = {
      // Subscriptions
      [PRODUCT_IDS.MONTHLY_BASIC]: {
        credits: 30,
        type: "subscription",
        name: "Monthly Storyteller",
        period: "month",
        displayName: "Monthly\nStoryteller",
      },
      [PRODUCT_IDS.MONTHLY_PRO]: {
        credits: 100,
        type: "subscription",
        name: "Monthly Story Master",
        period: "month",
        displayName: "Monthly\nStory Master",
        popular: true,
      },
      [PRODUCT_IDS.ANNUAL_BASIC]: {
        credits: 360,
        type: "subscription",
        name: "Annual Storyteller",
        period: "year",
        displayName: "Annual\nStoryteller",
      },
      [PRODUCT_IDS.ANNUAL_PRO]: {
        credits: 1200,
        type: "subscription",
        name: "Annual Story Master",
        period: "year",
        displayName: "Annual\nStory Master",
        bestValue: true,
      },
      // Credit packs
      [PRODUCT_IDS.CREDITS_10]: {
        credits: 10,
        type: "pack",
        name: "Starter Pack",
        period: null,
        displayName: "Starter\nPack",
      },
      [PRODUCT_IDS.CREDITS_25]: {
        credits: 25,
        type: "pack",
        name: "Story Bundle",
        period: null,
        displayName: "Story\nBundle",
      },
      [PRODUCT_IDS.CREDITS_50]: {
        credits: 50,
        type: "pack",
        name: "Family Pack",
        period: null,
        displayName: "Family\nPack",
        popular: true,
      },
      [PRODUCT_IDS.CREDITS_100]: {
        credits: 100,
        type: "pack",
        name: "Story Master",
        period: null,
        displayName: "Story\nMaster",
      },
    };
    return (
      products[productId] || {
        credits: 0,
        type: "pack",
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
    if (!offerings?.availablePackages || selectedPackage) return;

    if (selectedTab === "subscriptions") {
      // Don't auto-select if user has an active subscription
      const hasActiveSubscription = activeSubscriptions.length > 0;
      if (hasActiveSubscription) return;

      // Find popular subscription
      const popularSubscription = subscriptions.find(
        (pkg) =>
          getProductInfo(pkg.product.identifier).popular ||
          getProductInfo(pkg.product.identifier).bestValue
      );
      if (popularSubscription) {
        setSelectedPackage(popularSubscription);
      }
    } else {
      // Find popular credit pack
      const popularCreditPack = creditPacks.find(
        (pkg) => getProductInfo(pkg.product.identifier).popular
      );
      if (popularCreditPack) {
        setSelectedPackage(popularCreditPack);
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

  const renderSubscriptionCard = (pkg: PurchasesPackage) => {
    const info = getProductInfo(pkg.product.identifier);
    const isActive = isSubscriptionActive(pkg.product.identifier);
    const isSelected = selectedPackage?.identifier === pkg.identifier;
    const priceText =
      info.period === "month"
        ? `${pkg.product.priceString} / month`
        : `${pkg.product.priceString} / year`;

    return (
      <TouchableOpacity
        key={pkg.identifier}
        style={[
          styles.subscriptionCard,
          isActive && styles.subscriptionCardActive,
          isSelected && styles.subscriptionCardSelected,
        ]}
        onPress={() => setSelectedPackage(pkg)}
        disabled={isActive}
      >
        {info.popular && !isActive && (
          <View style={styles.popularBadge}>
            <Text style={styles.badgeText}>POPULAR</Text>
          </View>
        )}
        {info.bestValue && !isActive && (
          <View style={styles.bestValueBadge}>
            <Text style={styles.badgeText}>BEST VALUE</Text>
          </View>
        )}
        {isActive && (
          <View style={styles.currentBadge}>
            <Text style={styles.badgeText}>CURRENT</Text>
          </View>
        )}

        <Text style={styles.cardTitle}>{info.displayName}</Text>
        <Text style={styles.cardCredits}>
          {info.credits} credits
          {info.period === "month" ? "\n/ month" : "\n/ year"}
        </Text>
        <Text style={styles.cardPrice}>{priceText}</Text>
      </TouchableOpacity>
    );
  };

  const renderCreditPackCard = (pkg: PurchasesPackage) => {
    const info = getProductInfo(pkg.product.identifier);
    const isSelected = selectedPackage?.identifier === pkg.identifier;

    return (
      <TouchableOpacity
        key={pkg.identifier}
        style={[
          styles.creditPackCard,
          isSelected && styles.creditPackCardSelected,
        ]}
        onPress={() => setSelectedPackage(pkg)}
      >
        {info.popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.badgeText}>POPULAR</Text>
          </View>
        )}

        <Text style={styles.cardTitle}>{info.displayName}</Text>
        <Text style={styles.cardCredits}>{info.credits} credits</Text>
        <Text style={styles.cardPrice}>{pkg.product.priceString}</Text>
      </TouchableOpacity>
    );
  };

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

      <Decorations />

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
            <View style={styles.header}>
              <Text style={styles.title}>Credits</Text>
              <View style={styles.headerBalance}>
                <Text style={styles.headerBalanceAmount}>
                  {userCredits?.balance || 0}
                </Text>
                <IconSymbol name="sparkles" size={16} color={Colors.primary} />
              </View>
            </View>

            {/* Info Message */}
            <View style={styles.infoContainer}>
              <IconSymbol
                name="info.circle"
                size={16}
                color={Colors.textSecondary}
              />
              <Text style={styles.infoText}>
                Each credit enables you to generate 1 page of a story.
              </Text>
            </View>

            {/* Tab Selector */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  selectedTab === "subscriptions" && styles.tabActive,
                ]}
                onPress={() => setSelectedTab("subscriptions")}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === "subscriptions" && styles.tabTextActive,
                  ]}
                >
                  Subscriptions
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  selectedTab === "packs" && styles.tabActive,
                ]}
                onPress={() => setSelectedTab("packs")}
              >
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === "packs" && styles.tabTextActive,
                  ]}
                >
                  Credit packs
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content based on selected tab */}
            {selectedTab === "subscriptions" ? (
              <View>
                {subscriptions.length > 0 && (
                  <View style={styles.planGrid}>
                    {subscriptions.map(renderSubscriptionCard)}
                  </View>
                )}
              </View>
            ) : (
              <View>
                <View style={styles.planGrid}>
                  {creditPacks.map(renderCreditPackCard)}
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
      <View
        style={[
          styles.bottomSection,
          {
            paddingBottom: insets.bottom + 37, // Account for tab bar
          },
        ]}
      >
        {(offerings?.availablePackages?.length || 0) > 0 && (
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              (purchasing || !selectedPackage) && styles.purchaseButtonDisabled,
            ]}
            onPress={() => {
              if (selectedPackage) {
                handlePurchase(selectedPackage);
              }
            }}
            disabled={purchasing || !selectedPackage}
          >
            {purchasing ? (
              <ActivityIndicator size="small" color={Colors.textDark} />
            ) : selectedPackage ? (
              <>
                <Text style={styles.purchaseButtonText}>
                  Purchase{" "}
                  {getProductInfo(selectedPackage.product.identifier).name}
                </Text>
                <Text style={styles.purchaseButtonSubtext}>
                  {selectedPackage.product.priceString}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.purchaseButtonText}>
                  {selectedTab === "subscriptions"
                    ? "Start subscription"
                    : "Purchase credits"}
                </Text>
                <Text style={styles.purchaseButtonSubtext}>
                  {selectedTab === "subscriptions"
                    ? "Choose your preferred plan above"
                    : "Select your credit pack above"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {purchasing && (
        <View style={styles.purchasingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.purchasingText}>Processing purchase...</Text>
        </View>
      )}
    </ImageBackground>
  );
}

// Decorations component for background elements
function Decorations() {
  return (
    <>
      {/* Stars */}
      {STAR_POSITIONS.map((pos, i) => (
        <Image
          key={`star-${i}`}
          source={require("../../assets/images/star.png")}
          style={[styles.star, pos]}
        />
      ))}
    </>
  );
}

const STAR_POSITIONS = [
  { top: 80, left: 40 },
  { top: 120, right: 60 },
  { top: 200, left: 100 },
  { bottom: 150, left: 60 },
  { bottom: 100, right: 80 },
];

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

  // Header section
  header: {
    marginBottom: Spacing.lg,
    alignItems: "center",
    position: "relative",
  },
  title: {
    ...CommonStyles.brandTitle,
    fontSize:
      width >= 768 ? Typography.fontSize.h1Tablet : Typography.fontSize.h1Phone,
    textAlign: "center",
  },
  headerBalance: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    borderRadius: BorderRadius.small,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  star: {
    position: "absolute",
    width: 10,
    height: 10,
    opacity: 0.6,
  },
  headerBalanceAmount: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },

  // Info section
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.xl,
  },
  infoText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    lineHeight: 18,
  },

  // Tab section
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.round,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.round,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  tabTextActive: {
    color: Colors.textDark,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Section
  sectionTitle: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },

  // Plan grid
  planGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  // Subscription cards
  subscriptionCard: {
    width: (width - Spacing.screenPadding * 2 - Spacing.md) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: "center",
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
    minHeight: 160,
  },
  subscriptionCardActive: {
    borderColor: Colors.success,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  subscriptionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // Credit pack cards
  creditPackCard: {
    width: (width - Spacing.screenPadding * 2 - Spacing.md) / 2,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
    minHeight: 160,
  },
  creditPackCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // Card content
  cardTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  cardCredits: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  cardPrice: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    textAlign: "center",
  },

  // Badges
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderTopRightRadius: BorderRadius.medium,
    borderBottomLeftRadius: BorderRadius.medium,
  },
  bestValueBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderTopRightRadius: BorderRadius.medium,
    borderBottomLeftRadius: BorderRadius.medium,
  },
  currentBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderTopRightRadius: BorderRadius.medium,
    borderBottomLeftRadius: BorderRadius.medium,
  },
  badgeText: {
    fontSize: Typography.fontSize.tiny,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textDark,
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

  // Bottom section and purchase button
  bottomSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 175, 55, 0.2)",
  },
  purchaseButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textDark,
    textAlign: "center",
  },
  purchaseButtonSubtext: {
    fontSize: Typography.fontSize.small,
    color: Colors.textDark,
    textAlign: "center",
    marginTop: 2,
    opacity: 0.8,
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
