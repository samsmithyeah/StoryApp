import { ReferralCodeCard } from "@/components/referrals/ReferralCodeCard";
import { BackgroundContainer } from "@/components/shared/BackgroundContainer";
import { toastConfig } from "@/components/ui/CustomToast";
import { Colors, Spacing, Typography } from "@/constants/Theme";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function InviteFriendsScreen() {
  const handleClose = () => {
    router.back();
  };

  return (
    <BackgroundContainer showDecorations={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <View style={styles.headerSpacer} />
          <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Invite friends</Text>
          <Text style={styles.subtitle}>
            Share your referral code and earn free credits when your friends
            join DreamWeaver
          </Text>

          <View style={styles.cardContainer}>
            <ReferralCodeCard showStats={true} compact={false} />
          </View>

          <View style={styles.howItWorks}>
            <Text style={styles.howItWorksTitle}>How it works</Text>
            <View style={styles.steps}>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>
                  Share your referral code with friends
                </Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>
                  They sign up using your code
                </Text>
              </View>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>
                  When they verify their email, you both get bonus credits!
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <Toast config={toastConfig} />
    </BackgroundContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerSpacer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    fontFamily: Typography.fontFamily.primary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  doneButton: {
    minWidth: 60,
  },
  doneText: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary,
    textAlign: "center",
  },
  scrollContent: {
    paddingBottom: Spacing.screenPadding,
  },
  cardContainer: {
    paddingHorizontal: Spacing.screenPadding,
  },
  subtitle: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.xl,
  },
  howItWorks: {
    paddingHorizontal: Spacing.screenPadding,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  howItWorksTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.xl,
    fontFamily: Typography.fontFamily.primary,
  },
  steps: {
    gap: Spacing.lg,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardSectionBackground,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardSectionBorder,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    color: Colors.textDark,
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.bold,
    textAlign: "center",
    lineHeight: 32,
    marginRight: Spacing.lg,
  },
  stepText: {
    flex: 1,
    fontSize: Typography.fontSize.small,
    color: Colors.text,
    lineHeight: 20,
  },
});
