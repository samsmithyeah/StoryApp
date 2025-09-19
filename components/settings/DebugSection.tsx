import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import { Button } from "../ui/Button";
import { FCMService } from "../../services/fcm";
import { logger } from "../../utils/logger";
import * as Sentry from "@sentry/react-native";

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
          console.log("Testing Sentry...");
          console.log("Sentry DSN:", process.env.EXPO_PUBLIC_SENTRY_DSN);

          try {
            // Test direct Sentry call with promise
            await Sentry.captureException(new Error("Direct Sentry test"));
            console.log("✅ Direct Sentry call completed");

            // Test via logger
            logger.error(
              "Debug test error",
              new Error("Sentry test from debug screen")
            );
            console.log("✅ Logger call completed");

            // Add a message with different level
            Sentry.captureMessage("Test message from debug", "info");
            console.log("✅ Message call completed");
          } catch (error) {
            console.error("❌ Sentry error:", error);
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
