import {
  ReferralCodeInput,
  ReferralCodeInputRef,
} from "@/components/referrals/ReferralCodeInput";
import { BackgroundContainer } from "@/components/shared/BackgroundContainer";
import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { Colors, Spacing, Typography } from "@/constants/Theme";
import { useAuth } from "@/hooks/useAuth";
import { referralService } from "@/services/firebase/referrals";
import { AuthStatus } from "@/types/auth.types";
import { logger } from "@/utils/logger";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function ReferralCodeEntryScreen() {
  const [referralCode, setReferralCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const referralInputRef = useRef<ReferralCodeInputRef>(null);
  const { user, authStatus, setHasSeenReferralEntry, setJustAppliedReferral } =
    useAuth();

  // Watch for auth status changes and redirect when no longer on referral entry
  useEffect(() => {
    if (authStatus !== AuthStatus.REFERRAL_ENTRY) {
      router.replace("/");
    }
  }, [authStatus]);

  const handleSkip = () => {
    // Mark that user has seen this screen. The reactive system will handle navigation.
    setHasSeenReferralEntry(true);
  };

  const handleSubmit = async () => {
    if (!user?.uid) {
      logger.error("No user found when submitting referral code");
      return;
    }

    if (!referralCode.trim()) {
      handleSkip();
      return;
    }

    // Validate the code first
    if (referralInputRef.current) {
      try {
        setIsSubmitting(true);
        const result = await referralInputRef.current.validate();

        // Check if validation passed
        if (!result.isValid) {
          // Only show toast for backend validation errors, not client-side errors
          if (result.isBackendError) {
            Toast.show({
              type: "error",
              text1: "Invalid referral code",
              text2: "Please enter a valid referral code or skip this step.",
            });
          }
          setIsSubmitting(false);
          return;
        }

        // Apply the referral (combines record + complete in single atomic operation)
        await referralService.applyReferral(referralCode.trim().toUpperCase());

        logger.info("Referral applied successfully", {
          userId: user.uid,
          referralCode: referralCode.trim().toUpperCase(),
        });

        // Mark that referral was just applied and user has seen this screen
        // The reactive system will handle navigation.
        setJustAppliedReferral(true);
        setHasSeenReferralEntry(true);
      } catch (error) {
        logger.error("Error submitting referral code", error);
        Toast.show({
          type: "error",
          text1: "Error applying referral code",
          text2: "Please try again or skip this step.",
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isSubmitting) {
    return (
      <BackgroundContainer showDecorations={false}>
        <LoadingScreen message="Processing referral code..." transparent />
      </BackgroundContainer>
    );
  }

  return (
    <BackgroundContainer showDecorations={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Got a referral code?</Text>
            <Text style={styles.subtitle}>
              If a friend invited you to DreamWeaver, enter their referral code
              to get 5 bonus credits after you verify your email!
            </Text>
          </View>

          <View style={styles.form}>
            <ReferralCodeInput
              ref={referralInputRef}
              value={referralCode}
              onChangeText={setReferralCode}
              disabled={isSubmitting}
            />
          </View>

          <View style={styles.buttons}>
            <Button
              title="Apply referral code"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={!referralCode.trim() || isSubmitting}
              style={styles.submitButton}
            />

            <Button
              title="Skip"
              onPress={handleSkip}
              variant="outline"
              disabled={isSubmitting}
              style={styles.skipButton}
            />
          </View>
        </View>
      </SafeAreaView>
    </BackgroundContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.xxxl,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xxxl,
  },
  title: {
    fontSize: Typography.fontSize.h2,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    fontFamily: Typography.fontFamily.primary,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  form: {
    flex: 1,
    justifyContent: "center",
    marginTop: -Spacing.xxxl,
  },
  buttons: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  submitButton: {
    marginBottom: Spacing.sm,
  },
  skipButton: {},
});
