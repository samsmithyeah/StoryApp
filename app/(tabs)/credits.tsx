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
  isModal = false,
}: CreditsScreenProps = {}) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [selectedPackage, setSelectedPackage] =
    useState<PurchasesPackage | null>(null);
  const [selectedPackageByTab, setSelectedPackageByTab] = useState<{
    packs: PurchasesPackage | null;
    subscriptions: PurchasesPackage | null;
  }>({ packs: null, subscriptions: null });
  const [selectedTab, setSelectedTab] = useState<"packs" | "subscriptions">(
    "subscriptions"
  );
  const [activeSubscriptions, setActiveSubscriptions] = useState<string[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);

  const loadCreditsAndOfferings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load user credits
      const credits = await creditsService.getUserCredits(user.uid);
      setUserCredits(credits);

      // Load offerings (RevenueCat should already be configured)
      const offerings = await revenueCatService.getOfferings();
      if (offerings.current) {
        setOfferings(offerings.current);

        // Set default selections
        const packages = offerings.current.availablePackages;

        // Default for credit packs: "Family Pack" (credits_50)
        const familyPack = packages.find(
          (pkg) => pkg.product.identifier === PRODUCT_IDS.CREDITS_50
        );

        // Default for subscriptions: "Monthly Story Master" (subscription_monthly_pro)
        const monthlyStoryMaster = packages.find(
          (pkg) => pkg.product.identifier === PRODUCT_IDS.MONTHLY_PRO
        );

        const defaults = {
          packs: familyPack || null,
          subscriptions: monthlyStoryMaster || null,
        };

        setSelectedPackageByTab(defaults);
        // Set the initial selected package based on current tab
        setSelectedPackage(defaults.subscriptions); // Since subscriptions is default tab
      }

      // Load customer info to get active subscriptions
      try {
        const customerInfo = await revenueCatService.getCustomerInfo();
        setActiveSubscriptions(customerInfo.activeSubscriptions);
        setSubscriptionInfo(customerInfo);
      } catch (error) {
        console.log("Could not load customer info:", error);
        // This is OK during development when RevenueCat isn't fully configured
      }
    } catch (error: any) {
      console.error("Error loading credits/offerings:", error);

      // Don't show error alert for missing RevenueCat products during development
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

  const handleTabChange = (newTab: "packs" | "subscriptions") => {
    setSelectedTab(newTab);

    // Update selected package to the tab's selection
    const tabSelection = selectedPackageByTab[newTab];
    setSelectedPackage(tabSelection);
  };

  const handlePackageSelect = (pkg: PurchasesPackage) => {
    setSelectedPackage(pkg);

    // Store the selection for the current tab
    setSelectedPackageByTab((prev) => ({
      ...prev,
      [selectedTab]: pkg,
    }));
  };

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    try {
      setPurchasing(true);

      const isSubscription =
        packageToPurchase.product.identifier.includes("subscription");
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
      // Credit packs
      [PRODUCT_IDS.CREDITS_10]: {
        credits: 10,
        type: "pack",
        icon: "sparkles",
        name: "Starter Pack",
        period: null,
      },
      [PRODUCT_IDS.CREDITS_25]: {
        credits: 25,
        type: "pack",
        icon: "star.fill",
        name: "Story Bundle",
        period: null,
      },
      [PRODUCT_IDS.CREDITS_50]: {
        credits: 50,
        type: "pack",
        icon: "wand.and.stars",
        name: "Family Pack",
        period: null,
        popular: true,
      },
      [PRODUCT_IDS.CREDITS_100]: {
        credits: 100,
        type: "pack",
        icon: "crown.fill",
        name: "Story Master",
        period: null,
      },
      // Subscriptions
      [PRODUCT_IDS.MONTHLY_BASIC]: {
        credits: 30,
        type: "subscription",
        icon: "sparkles",
        name: "Monthly Storyteller",
        period: "month",
      },
      [PRODUCT_IDS.MONTHLY_PRO]: {
        credits: 100,
        type: "subscription",
        icon: "star.fill",
        name: "Monthly Story Master",
        period: "month",
      },
      [PRODUCT_IDS.ANNUAL_BASIC]: {
        credits: 360,
        type: "subscription",
        icon: "wand.and.stars",
        name: "Annual Storyteller",
        period: "year",
      },
      [PRODUCT_IDS.ANNUAL_PRO]: {
        credits: 1200,
        type: "subscription",
        icon: "crown.fill",
        name: "Annual Story Master",
        period: "year",
        popular: true,
      },
    };
    return (
      products[productId] || {
        credits: 0,
        type: "pack",
        icon: "sparkles",
        name: "Unknown",
        period: null,
      }
    );
  };

  const isSubscriptionActive = (productId: string) => {
    return activeSubscriptions.includes(productId);
  };

  const getSubscriptionExpirationDate = (productId: string) => {
    if (!subscriptionInfo?.allExpirationDates) return null;
    const expirationDate = subscriptionInfo.allExpirationDates[productId];
    return expirationDate ? new Date(expirationDate) : null;
  };

  const formatExpirationDate = (date: Date) => {
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const calculateCostPerCredit = (pkg: PurchasesPackage) => {
    const info = getProductInfo(pkg.product.identifier);
    const price = pkg.product.price;
    const costPerCredit = price / info.credits;

    // Debug currency info
    console.log("Currency debug:", {
      productId: pkg.product.identifier,
      price: pkg.product.price,
      priceString: pkg.product.priceString,
      currencyCode: pkg.product.currencyCode,
      costPerCredit,
    });

    // Format as currency with proper locale - force GBP if not detected
    const currency = pkg.product.currencyCode || "GBP";
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(costPerCredit);
  };

  // Group packages by type for matrix display and sort by price (lowest to highest)
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

  const allPackages = [...creditPacks, ...subscriptions];

  return (
    <ImageBackground
      source={require("../../assets/images/background-landscape.png")}
      resizeMode="cover"
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
            <View style={styles.header}>
              <Text style={styles.title}>Credits</Text>
              <View style={styles.headerBalance}>
                <Text style={styles.headerBalanceAmount}>
                  {userCredits?.balance || 0}
                </Text>
                <IconSymbol name="sparkles" size={16} color={Colors.primary} />
              </View>
              {/* <Text style={styles.subtitle}>
                Purchase credit packs or subscribe for discounted deals
              </Text> */}
            </View>

            {allPackages.length === 0 ? (
              <View style={styles.noOfferings}>
                <IconSymbol
                  name="exclamationmark.triangle"
                  size={32}
                  color={Colors.textSecondary}
                />
                <Text style={styles.noOfferingsTitle}>
                  No products available
                </Text>
                <Text style={styles.noOfferingsText}>
                  Products haven't been configured yet. Set up products in
                  RevenueCat and App Store Connect to enable purchases.
                </Text>
              </View>
            ) : (
              <>
                {/* Subscription status */}
                {userCredits?.subscriptionActive && (
                  <View style={styles.subscriptionStatusContainer}>
                    <Text style={styles.subscriptionStatus}>
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={14}
                        color={Colors.success}
                      />{" "}
                      Active subscription
                    </Text>
                  </View>
                )}

                {/* Tab Selector */}
                <View style={styles.section}>
                  <View style={styles.tabSelector}>
                    <TouchableOpacity
                      style={[
                        styles.tab,
                        selectedTab === "subscriptions" && styles.tabActive,
                      ]}
                      onPress={() => handleTabChange("subscriptions")}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          selectedTab === "subscriptions" &&
                            styles.tabTextActive,
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
                      onPress={() => handleTabChange("packs")}
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

                  {/* Pricing Matrix */}
                  <View style={styles.matrixContainer}>
                    {/* <Text style={styles.matrixTitle}>
            {selectedTab === "packs" ? "Credit Packs" : "Subscriptions"}
          </Text> */}
                    <Text style={styles.matrixSubtitle}>
                      {selectedTab === "packs"
                        ? "One-time purchase of credits to use whenever you need them. Each credit enables you to generate 1 page of a story."
                        : "Get credits every month at a discounted rate. Each credit enables you to generate 1 page of a story."}
                    </Text>

                    {/* Matrix Header */}
                    <View style={styles.matrixHeader}>
                      <View style={styles.matrixHeaderCell}>
                        <Text style={styles.matrixHeaderText}>Plan</Text>
                      </View>
                      <View style={styles.matrixHeaderCell}>
                        <Text style={styles.matrixHeaderText}>Credits</Text>
                      </View>
                      <View style={styles.matrixHeaderCell}>
                        <Text style={styles.matrixHeaderText}>Price</Text>
                      </View>
                      <View style={styles.matrixHeaderCell}>
                        <Text style={styles.matrixHeaderText}>Per Credit</Text>
                      </View>
                    </View>

                    {/* Credit Packs */}
                    {selectedTab === "packs" && creditPacks.length > 0 && (
                      <>
                        <View style={styles.subscriptionSectionHeader}>
                          <Text style={styles.subscriptionSectionText}>
                            Credit Packs
                          </Text>
                          <Text style={styles.subscriptionSectionSubtext}>
                            One-time purchase, use anytime
                          </Text>
                        </View>
                        {creditPacks.map((pkg) => {
                          const info = getProductInfo(pkg.product.identifier);
                          const costPerCredit = calculateCostPerCredit(pkg);
                          return (
                            <TouchableOpacity
                              key={pkg.identifier}
                              style={[
                                styles.matrixRow,
                                info.popular && styles.matrixRowPopular,
                                selectedPackage?.identifier ===
                                  pkg.identifier && styles.matrixRowSelected,
                              ]}
                              onPress={() => handlePackageSelect(pkg)}
                              disabled={purchasing}
                            >
                              {info.popular && (
                                <View style={styles.matrixPopularBadge}>
                                  <Text style={styles.matrixPopularText}>
                                    POPULAR
                                  </Text>
                                </View>
                              )}
                              <View style={styles.matrixCell}>
                                <View style={styles.matrixPlanCell}>
                                  <IconSymbol
                                    name={info.icon}
                                    size={16}
                                    color={Colors.primary}
                                  />
                                  <Text style={styles.matrixPlanText}>
                                    {info.name}
                                  </Text>
                                </View>
                              </View>
                              <View style={styles.matrixCell}>
                                <Text style={styles.matrixCreditsText}>
                                  {info.credits}
                                </Text>
                              </View>
                              <View style={styles.matrixCell}>
                                <Text style={styles.matrixPriceText}>
                                  {pkg.product.priceString}
                                </Text>
                              </View>
                              <View style={styles.matrixCell}>
                                <Text style={styles.matrixCostText}>
                                  {costPerCredit}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </>
                    )}

                    {/* Subscriptions */}
                    {selectedTab === "subscriptions" &&
                      subscriptions.length > 0 && (
                        <>
                          {/* Monthly Subscriptions */}
                          {subscriptions.filter(
                            (pkg) =>
                              getProductInfo(pkg.product.identifier).period ===
                              "month"
                          ).length > 0 && (
                            <>
                              <View style={styles.subscriptionSectionHeader}>
                                <Text style={styles.subscriptionSectionText}>
                                  Monthly Plans
                                </Text>
                              </View>
                              {subscriptions
                                .filter(
                                  (pkg) =>
                                    getProductInfo(pkg.product.identifier)
                                      .period === "month"
                                )
                                .map((pkg) => {
                                  const info = getProductInfo(
                                    pkg.product.identifier
                                  );
                                  const costPerCredit =
                                    calculateCostPerCredit(pkg);
                                  const isActive = isSubscriptionActive(
                                    pkg.product.identifier
                                  );
                                  const expirationDate =
                                    getSubscriptionExpirationDate(
                                      pkg.product.identifier
                                    );
                                  return (
                                    <TouchableOpacity
                                      key={pkg.identifier}
                                      style={[
                                        styles.matrixRow,
                                        info.popular && styles.matrixRowPopular,
                                        isActive && styles.matrixRowActive,
                                        selectedPackage?.identifier ===
                                          pkg.identifier &&
                                          styles.matrixRowSelected,
                                      ]}
                                      onPress={() =>
                                        isActive
                                          ? null
                                          : handlePackageSelect(pkg)
                                      }
                                      disabled={purchasing || isActive}
                                    >
                                      {isActive && (
                                        <View style={styles.matrixActiveBadge}>
                                          <Text style={styles.matrixActiveText}>
                                            CURRENT
                                          </Text>
                                        </View>
                                      )}
                                      {info.popular && !isActive && (
                                        <View style={styles.matrixPopularBadge}>
                                          <Text
                                            style={styles.matrixPopularText}
                                          >
                                            {getProductInfo(
                                              pkg.product.identifier
                                            ).period === "year"
                                              ? "BEST VALUE"
                                              : "POPULAR"}
                                          </Text>
                                        </View>
                                      )}
                                      <View style={styles.matrixCell}>
                                        <View style={styles.matrixPlanCell}>
                                          <IconSymbol
                                            name={info.icon}
                                            size={16}
                                            color={Colors.primary}
                                          />
                                          <Text style={styles.matrixPlanText}>
                                            {info.name}
                                          </Text>
                                        </View>
                                      </View>
                                      <View style={styles.matrixCell}>
                                        <Text style={styles.matrixCreditsText}>
                                          {info.credits}/mo
                                        </Text>
                                        {isActive && expirationDate && (
                                          <Text
                                            style={styles.matrixRenewalText}
                                          >
                                            Renews{" "}
                                            {formatExpirationDate(
                                              expirationDate
                                            )}
                                          </Text>
                                        )}
                                      </View>
                                      <View style={styles.matrixCell}>
                                        <Text style={styles.matrixPriceText}>
                                          {pkg.product.priceString}/mo
                                        </Text>
                                      </View>
                                      <View style={styles.matrixCell}>
                                        <Text style={styles.matrixCostText}>
                                          {costPerCredit}
                                        </Text>
                                      </View>
                                    </TouchableOpacity>
                                  );
                                })}
                            </>
                          )}

                          {/* Annual Subscriptions */}
                          {subscriptions.filter(
                            (pkg) =>
                              getProductInfo(pkg.product.identifier).period ===
                              "year"
                          ).length > 0 && (
                            <>
                              <View style={styles.subscriptionSectionHeader}>
                                <Text style={styles.subscriptionSectionText}>
                                  Annual Plans
                                </Text>
                                <Text style={styles.subscriptionSectionSubtext}>
                                  Save up to 70% vs monthly
                                </Text>
                              </View>
                              {subscriptions
                                .filter(
                                  (pkg) =>
                                    getProductInfo(pkg.product.identifier)
                                      .period === "year"
                                )
                                .map((pkg) => {
                                  const info = getProductInfo(
                                    pkg.product.identifier
                                  );
                                  const costPerCredit =
                                    calculateCostPerCredit(pkg);
                                  const isActive = isSubscriptionActive(
                                    pkg.product.identifier
                                  );
                                  const expirationDate =
                                    getSubscriptionExpirationDate(
                                      pkg.product.identifier
                                    );
                                  return (
                                    <TouchableOpacity
                                      key={pkg.identifier}
                                      style={[
                                        styles.matrixRow,
                                        info.popular && styles.matrixRowPopular,
                                        isActive && styles.matrixRowActive,
                                        selectedPackage?.identifier ===
                                          pkg.identifier &&
                                          styles.matrixRowSelected,
                                      ]}
                                      onPress={() =>
                                        isActive
                                          ? null
                                          : handlePackageSelect(pkg)
                                      }
                                      disabled={purchasing || isActive}
                                    >
                                      {isActive && (
                                        <View style={styles.matrixActiveBadge}>
                                          <Text style={styles.matrixActiveText}>
                                            CURRENT
                                          </Text>
                                        </View>
                                      )}
                                      {info.popular && !isActive && (
                                        <View style={styles.matrixPopularBadge}>
                                          <Text
                                            style={styles.matrixPopularText}
                                          >
                                            {getProductInfo(
                                              pkg.product.identifier
                                            ).period === "year"
                                              ? "BEST VALUE"
                                              : "POPULAR"}
                                          </Text>
                                        </View>
                                      )}
                                      <View style={styles.matrixCell}>
                                        <View style={styles.matrixPlanCell}>
                                          <IconSymbol
                                            name={info.icon}
                                            size={16}
                                            color={Colors.primary}
                                          />
                                          <Text style={styles.matrixPlanText}>
                                            {info.name}
                                          </Text>
                                        </View>
                                      </View>
                                      <View style={styles.matrixCell}>
                                        <Text style={styles.matrixCreditsText}>
                                          {info.credits}/yr
                                        </Text>
                                        {isActive && expirationDate && (
                                          <Text
                                            style={styles.matrixRenewalText}
                                          >
                                            Renews{" "}
                                            {formatExpirationDate(
                                              expirationDate
                                            )}
                                          </Text>
                                        )}
                                      </View>
                                      <View style={styles.matrixCell}>
                                        <Text style={styles.matrixPriceText}>
                                          {pkg.product.priceString}/yr
                                        </Text>
                                      </View>
                                      <View style={styles.matrixCell}>
                                        <Text style={styles.matrixCostText}>
                                          {costPerCredit}
                                        </Text>
                                      </View>
                                    </TouchableOpacity>
                                  );
                                })}
                            </>
                          )}
                        </>
                      )}

                    {/* Empty State */}
                    {((selectedTab === "packs" && creditPacks.length === 0) ||
                      (selectedTab === "subscriptions" &&
                        subscriptions.length === 0)) && (
                      <View style={styles.matrixEmptyState}>
                        <IconSymbol
                          name="exclamationmark.triangle"
                          size={32}
                          color={Colors.textSecondary}
                        />
                        <Text style={styles.noOfferingsTitle}>
                          No{" "}
                          {selectedTab === "packs"
                            ? "credit packs"
                            : "subscriptions"}{" "}
                          available
                        </Text>
                        <Text style={styles.noOfferingsText}>
                          {selectedTab === "packs"
                            ? "Credit packs haven't"
                            : "Subscriptions haven't"}{" "}
                          been configured yet.
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Restore Purchases */}
                  <TouchableOpacity
                    style={styles.restoreButton}
                    onPress={handleRestorePurchases}
                    disabled={purchasing}
                  >
                    <Text style={styles.restoreText}>Restore purchases</Text>
                  </TouchableOpacity>

                  <View style={{ height: 100 }} />
                </View>
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Fixed Bottom Section */}
      <View
        style={[
          styles.bottomSection,
          {
            paddingBottom: isModal ? insets.bottom : insets.bottom + 37, // Account for tab bar
          },
        ]}
      >
        {/* Purchase Button */}
        {selectedPackage && (
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              (purchasing ||
                isSubscriptionActive(selectedPackage.product.identifier)) &&
                styles.purchaseButtonDisabled,
            ]}
            onPress={() => {
              if (!isSubscriptionActive(selectedPackage.product.identifier)) {
                handlePurchase(selectedPackage);
              }
            }}
            disabled={
              purchasing ||
              isSubscriptionActive(selectedPackage.product.identifier)
            }
          >
            {purchasing ? (
              <ActivityIndicator size="small" color={Colors.textDark} />
            ) : isSubscriptionActive(selectedPackage.product.identifier) ? (
              <>
                <Text style={styles.purchaseButtonText}>
                  Current Subscription
                </Text>
                <Text style={styles.purchaseButtonPrice}>
                  {(() => {
                    const expirationDate = getSubscriptionExpirationDate(
                      selectedPackage.product.identifier
                    );
                    return expirationDate
                      ? `Renews ${formatExpirationDate(expirationDate)}`
                      : "Active";
                  })()}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.purchaseButtonText}>
                  Purchase{" "}
                  {getProductInfo(selectedPackage.product.identifier).name}
                </Text>
                <Text style={styles.purchaseButtonPrice}>
                  {selectedPackage.product.priceString}
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
  header: {
    marginBottom: Spacing.lg,
    alignItems: "center",
    position: "relative",
  },
  title: {
    ...CommonStyles.brandTitle,
    fontSize: isTablet
      ? Typography.fontSize.h1Tablet
      : Typography.fontSize.h1Phone,
    textAlign: "center",
    // marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
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
  headerBalanceAmount: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xxxl,
  },
  star: {
    position: "absolute",
    width: 10,
    height: 10,
    opacity: 0.6,
  },
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
  subscriptionStatusContainer: {
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  subscriptionStatus: {
    fontSize: Typography.fontSize.small,
    color: Colors.success,
  },

  // Tab styles
  tabSelector: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.medium,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.small,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textDark,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Matrix styles
  matrixContainer: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.large,
    overflow: "visible",
    marginBottom: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  matrixTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    textAlign: "center",
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  matrixSubtitle: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  matrixHeader: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
  },
  matrixHeaderCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  matrixHeaderText: {
    fontSize: Typography.fontSize.tiny,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textDark,
    textTransform: "uppercase",
  },
  sectionHeaderRow: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  sectionHeaderText: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  matrixRow: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.1)",
    paddingVertical: Spacing.md,
    position: "relative",
    minHeight: 60,
    borderWidth: 1,
    borderColor: "transparent",
    marginHorizontal: 4,
    marginVertical: 3,
    borderRadius: BorderRadius.small,
  },
  matrixRowPopular: {
    backgroundColor: Colors.backgroundLight,
    borderBottomColor: "rgba(212, 175, 55, 0.1)",
  },
  matrixRowSelected: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    borderColor: Colors.primary,
    borderWidth: 2,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  matrixRowActive: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderColor: Colors.success,
    borderWidth: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.success,
    opacity: 0.8,
  },
  matrixPopularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderBottomLeftRadius: BorderRadius.small,
    zIndex: 1,
  },
  matrixPopularText: {
    fontSize: Typography.fontSize.tiny,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textDark,
  },
  matrixActiveBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderBottomLeftRadius: BorderRadius.small,
    zIndex: 1,
  },
  matrixActiveText: {
    fontSize: Typography.fontSize.tiny,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textDark,
  },
  matrixCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xs,
  },
  matrixPlanCell: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  matrixPlanText: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.text,
    textAlign: "center",
    marginTop: Spacing.xs,
    lineHeight: 12,
  },
  matrixCreditsText: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    textAlign: "center",
  },
  matrixPriceText: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    textAlign: "center",
  },
  matrixCostText: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  matrixRenewalText: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.success,
    textAlign: "center",
    marginTop: 2,
    fontStyle: "italic",
  },
  matrixEmptyState: {
    padding: Spacing.xl,
    alignItems: "center",
    backgroundColor: Colors.backgroundLight,
  },

  // Subscription section styles
  subscriptionSectionHeader: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 175, 55, 0.2)",
  },
  subscriptionSectionText: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subscriptionSectionSubtext: {
    fontSize: Typography.fontSize.tiny,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: Typography.fontWeight.medium,
  },

  // Purchase button styles
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
  purchaseButtonPrice: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textDark,
    marginTop: 2,
    textAlign: "center",
  },

  restoreButton: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  restoreText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    textDecorationLine: "underline",
  },
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
  noOfferings: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.medium,
    padding: Spacing.xl,
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  noOfferingsTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  noOfferingsText: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
