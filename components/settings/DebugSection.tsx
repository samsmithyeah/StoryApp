import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import { Button } from "../ui/Button";
import { FCMService } from "../../services/fcm";

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
