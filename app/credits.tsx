import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Theme";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAuth } from "@/hooks/useAuth";
import { creditsService } from "@/services/firebase/credits";
import { revenueCatService, PRODUCT_IDS } from "@/services/revenuecat";
import type { UserCredits } from "@/types/monetization.types";

export default function CreditsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [selectedTab, setSelectedTab] = useState<"packs" | "subscriptions">(
    "packs"
  );

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

  const getCreditPackInfo = (productId: string) => {
    const packs = {
      [PRODUCT_IDS.CREDITS_10]: {
        credits: 10,
        icon: "sparkles",
        popular: false,
      },
      [PRODUCT_IDS.CREDITS_25]: {
        credits: 25,
        icon: "star.fill",
        popular: true,
      },
      [PRODUCT_IDS.CREDITS_50]: {
        credits: 50,
        icon: "wand.and.stars",
        popular: false,
      },
      [PRODUCT_IDS.CREDITS_100]: {
        credits: 100,
        icon: "crown.fill",
        popular: false,
      },
    };
    return packs[productId] || { credits: 0, icon: "sparkles", popular: false };
  };

  const getSubscriptionInfo = (productId: string) => {
    const subs = {
      [PRODUCT_IDS.MONTHLY_BASIC]: {
        credits: 30,
        period: "month",
        icon: "calendar",
      },
      [PRODUCT_IDS.MONTHLY_PRO]: {
        credits: 100,
        period: "month",
        icon: "calendar.badge.plus",
      },
      [PRODUCT_IDS.ANNUAL_BASIC]: {
        credits: 360,
        period: "year",
        icon: "calendar.circle",
      },
      [PRODUCT_IDS.ANNUAL_PRO]: {
        credits: 1200,
        period: "year",
        icon: "calendar.circle.fill",
      },
    };
    return subs[productId] || { credits: 0, period: "month", icon: "calendar" };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const creditPacks =
    offerings?.availablePackages.filter(
      (pkg) => !pkg.product.identifier.includes("subscription")
    ) || [];

  const subscriptions =
    offerings?.availablePackages.filter((pkg) =>
      pkg.product.identifier.includes("subscription")
    ) || [];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["rgba(15,17,41,0.96)", "rgba(15,17,41,0.72)"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <IconSymbol name="chevron.left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credits</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Balance */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={["rgba(212, 175, 55, 0.1)", "rgba(212, 175, 55, 0.05)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.balanceContent}>
            <Text style={styles.balanceLabel}>Current balance</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>
                {userCredits?.balance || 0}
              </Text>
              <Text style={styles.balanceUnit}>credits</Text>
            </View>
            {userCredits?.subscriptionActive && (
              <Text style={styles.subscriptionStatus}>
                <IconSymbol
                  name="checkmark.circle.fill"
                  size={14}
                  color={Colors.success}
                />{" "}
                Active subscription
              </Text>
            )}
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "packs" && styles.tabActive]}
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
        </View>

        {/* Credit Packs */}
        {selectedTab === "packs" && (
          <View style={styles.packsList}>
            <Text style={styles.sectionDescription}>
              One-time purchase of credits to use whenever you need them
            </Text>
            {creditPacks.length === 0 ? (
              <View style={styles.noOfferings}>
                <IconSymbol
                  name="exclamationmark.triangle"
                  size={32}
                  color={Colors.textSecondary}
                />
                <Text style={styles.noOfferingsTitle}>
                  No credit packs available
                </Text>
                <Text style={styles.noOfferingsText}>
                  Credit packs haven't been configured yet. Set up products in
                  RevenueCat and App Store Connect to enable purchases.
                </Text>
              </View>
            ) : (
              creditPacks.map((pkg) => {
                const info = getCreditPackInfo(pkg.product.identifier);
                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={[
                      styles.packCard,
                      info.popular && styles.packCardPopular,
                    ]}
                    onPress={() => handlePurchase(pkg)}
                    disabled={purchasing}
                  >
                    {info.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>Most popular</Text>
                      </View>
                    )}
                    <View style={styles.packContent}>
                      <View style={styles.packLeft}>
                        <IconSymbol
                          name={info.icon}
                          size={24}
                          color={Colors.primary}
                        />
                        <View style={styles.packDetails}>
                          <Text style={styles.packCredits}>
                            {info.credits} credits
                          </Text>
                          <Text style={styles.packPrice}>
                            {pkg.product.priceString}
                          </Text>
                        </View>
                      </View>
                      <IconSymbol
                        name="chevron.right"
                        size={20}
                        color={Colors.textSecondary}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Subscriptions */}
        {selectedTab === "subscriptions" && (
          <View style={styles.packsList}>
            <Text style={styles.sectionDescription}>
              Get credits every month at a discounted rate
            </Text>
            {subscriptions.length === 0 ? (
              <View style={styles.noOfferings}>
                <IconSymbol
                  name="exclamationmark.triangle"
                  size={32}
                  color={Colors.textSecondary}
                />
                <Text style={styles.noOfferingsTitle}>
                  No subscriptions available
                </Text>
                <Text style={styles.noOfferingsText}>
                  Subscriptions haven't been configured yet. Set up products in
                  RevenueCat and App Store Connect to enable purchases.
                </Text>
              </View>
            ) : (
              subscriptions.map((pkg) => {
                const info = getSubscriptionInfo(pkg.product.identifier);
                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={styles.packCard}
                    onPress={() => handlePurchase(pkg)}
                    disabled={purchasing}
                  >
                    <View style={styles.packContent}>
                      <View style={styles.packLeft}>
                        <IconSymbol
                          name={info.icon}
                          size={24}
                          color={Colors.primary}
                        />
                        <View style={styles.packDetails}>
                          <Text style={styles.packCredits}>
                            {info.credits} credits/{info.period}
                          </Text>
                          <Text style={styles.packPrice}>
                            {pkg.product.priceString}
                          </Text>
                        </View>
                      </View>
                      <IconSymbol
                        name="chevron.right"
                        size={20}
                        color={Colors.textSecondary}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
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

        <View style={{ height: 40 }} />
      </ScrollView>

      {purchasing && (
        <View style={styles.purchasingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
  },
  balanceCard: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    overflow: "hidden",
  },
  balanceContent: {
    position: "relative",
  },
  balanceLabel: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  balanceUnit: {
    fontSize: Typography.fontSize.large,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  subscriptionStatus: {
    fontSize: Typography.fontSize.small,
    color: Colors.success,
    marginTop: Spacing.md,
  },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.medium,
    padding: 4,
    marginBottom: Spacing.xl,
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
  sectionDescription: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  packsList: {
    marginBottom: Spacing.xl,
  },
  packCard: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.1)",
  },
  packCardPopular: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  popularBadge: {
    position: "absolute",
    top: -10,
    right: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  popularText: {
    fontSize: Typography.fontSize.tiny,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textDark,
  },
  packContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  packLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  packDetails: {
    marginLeft: Spacing.lg,
  },
  packCredits: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 4,
  },
  packPrice: {
    fontSize: Typography.fontSize.small,
    color: Colors.primary,
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
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
