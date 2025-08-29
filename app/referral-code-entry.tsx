import React, { useState, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackgroundContainer } from "@/components/shared/BackgroundContainer";
import { ReferralCodeInput, ReferralCodeInputRef } from "@/components/referrals/ReferralCodeInput";
import { Button } from "@/components/ui/Button";
import { Colors, Spacing, Typography } from "@/constants/Theme";
import { router } from "expo-router";
import { referralService } from "@/services/firebase/referrals";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/utils/logger";
import Toast from "react-native-toast-message";

export default function ReferralCodeEntryScreen() {
  const [referralCode, setReferralCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const referralInputRef = useRef<ReferralCodeInputRef>(null);
  const { user, setHasSeenReferralEntry } = useAuth();

  const handleSkip = () => {
    // Mark that user has seen this screen
    setHasSeenReferralEntry(true);
    router.replace("/");
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
        
        // Proceed with recording the referral
        await referralService.recordReferral(user.uid, referralCode.trim().toUpperCase());
        
        // For verified users (email verified or test accounts), immediately complete the referral
        const isTestAccount = __DEV__ && user.email?.includes("@test.dreamweaver");
        const shouldCompleteReferral = user.emailVerified || isTestAccount;
        
        if (shouldCompleteReferral) {
          try {
            logger.info("User is verified, completing referral immediately", { 
              userId: user.uid, 
              emailVerified: user.emailVerified,
              isTestAccount 
            });
            const result = await referralService.completeReferral(user.uid);
            logger.info("Referral completed successfully", { userId: user.uid, result });
          } catch (completeError) {
            logger.debug("Error completing referral", { userId: user.uid, error: completeError });
          }
        }
        
        Toast.show({
          type: "success",
          text1: "Referral code applied!",
          text2: shouldCompleteReferral ? "You got 5 bonus credits!" : "You'll get 5 bonus credits after email verification.",
        });
        
        // Mark that user has seen this screen
        setHasSeenReferralEntry(true);
        
        // Small delay to ensure auth status updates before navigation
        setTimeout(() => {
          router.replace("/");
        }, 100);
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
            />
          </View>

          <View style={styles.buttons}>
            <Button
              title="Apply referral code"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={!referralCode.trim()}
              style={styles.submitButton}
            />
            
            <Button
              title="Skip"
              onPress={handleSkip}
              variant="outline"
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