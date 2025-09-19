import * as Sentry from "@sentry/react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import { FCMService } from "../../services/fcm";
import { logger } from "../../utils/logger";
import { Button } from "../ui/Button";

interface DebugSectionProps {
  isAdmin: boolean;
  onShowWelcomeWizard: () => void;
  onNavigate?: (route: string) => void;
}

export function DebugSection({
  isAdmin,
  onShowWelcomeWizard,
  onNavigate,
}: DebugSectionProps) {
  // Only show this section for admin users
  if (!isAdmin) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionDescription}>
        Development and testing tools
      </Text>

      {onNavigate && (
        <Button
          title="Debug generation UI"
          onPress={() => onNavigate("/debug-generation")}
          variant="outline"
          style={styles.debugButton}
        />
      )}

      <Button
        title="Show welcome wizard"
        onPress={onShowWelcomeWizard}
        variant="outline"
        style={styles.debugButton}
      />

      <Button
        title="Test push notification"
        onPress={async () => {
          await FCMService.scheduleTestStoryNotification();
        }}
        variant="outline"
        style={styles.debugButton}
      />

      <Button
        title="Test Sentry error"
        onPress={async () => {
          logger.debug("Testing Sentry...");
          logger.debug("Sentry DSN:", process.env.EXPO_PUBLIC_SENTRY_DSN);

          try {
            // Test direct Sentry call with promise
            await Sentry.captureException(new Error("Direct Sentry test"));
            logger.debug("✅ Direct Sentry call completed");

            // Test via logger
            logger.error(
              "Debug test error",
              new Error("Sentry test from debug screen")
            );
            logger.debug("✅ Logger call completed");

            // Add a message with different level
            Sentry.captureMessage("Test message from debug", "info");
            logger.debug("✅ Message call completed");
          } catch (error) {
            logger.error("❌ Sentry test button failed", error);
          }
        }}
        variant="outline"
        style={styles.debugButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xxxl,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.medium,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  debugButton: {
    marginBottom: Spacing.md,
  },
});
