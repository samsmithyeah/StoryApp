import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../ui/Button";
import { Colors, Spacing, Typography } from "../../constants/Theme";
import type { AccountSectionProps } from "./types";

export function AccountSection({
  user,
  isAdmin,
  isDeleting,
  onShowWelcomeWizard,
  onSignOut,
  onDeleteAccount,
}: AccountSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account</Text>
      <Text style={styles.sectionDescription}>
        Manage your account and sign out options
      </Text>

      <View style={styles.accountInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {user?.displayName?.charAt(0).toUpperCase() ||
              user?.email?.charAt(0).toUpperCase() ||
              "?"}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.displayName || "User"}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      {isAdmin && (
        <Button
          title="Show welcome wizard"
          onPress={onShowWelcomeWizard}
          variant="outline"
          style={styles.debugButton}
        />
      )}

      <Button
        title="Sign out"
        onPress={onSignOut}
        variant="danger"
        style={styles.signOutButton}
      />

      <Button
        title={isDeleting ? "Deleting account..." : "Delete my account"}
        onPress={onDeleteAccount}
        variant="danger"
        style={StyleSheet.flatten([
          styles.deleteAccountButton,
          isDeleting && styles.disabledButton,
        ])}
        textStyle={styles.deleteAccountButtonText}
        loading={isDeleting}
        disabled={isDeleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xxxl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.primary,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  userAvatarText: {
    fontSize: Typography.fontSize.large,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textDark,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
  },
  debugButton: {
    marginBottom: Spacing.lg,
    borderColor: Colors.primary,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
  },
  signOutButton: {
    borderColor: Colors.error,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    marginBottom: Spacing.lg,
  },
  deleteAccountButton: {
    borderColor: "#DC2626",
    backgroundColor: "#DC2626",
    borderWidth: 0,
  },
  deleteAccountButtonText: {
    color: Colors.text,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
