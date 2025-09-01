import { BorderRadius, Colors, Spacing } from "@/constants/Theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import {
  BaseToast,
  BaseToastProps,
  ErrorToast,
  InfoToast,
} from "react-native-toast-message";
import { IconSymbol } from "./IconSymbol";

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      style={[styles.baseToast, styles.successToast]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text2NumberOfLines={2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <IconSymbol
            name="checkmark.circle.fill"
            size={24}
            color={Colors.success}
          />
        </View>
      )}
    />
  ),

  error: (props: BaseToastProps) => (
    <ErrorToast
      {...props}
      style={[styles.baseToast, styles.errorToast]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text2NumberOfLines={2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <IconSymbol
            name="exclamationmark.circle.fill"
            size={24}
            color={Colors.error}
          />
        </View>
      )}
    />
  ),

  info: (props: BaseToastProps) => (
    <InfoToast
      {...props}
      style={[styles.baseToast, styles.infoToast]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      text2NumberOfLines={2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <IconSymbol
            name="info.circle.fill"
            size={24}
            color={Colors.primary}
          />
        </View>
      )}
    />
  ),
};

const styles = StyleSheet.create({
  baseToast: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.borderLight,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.medium,
    height: undefined,
    minHeight: 60,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    width: "90%",
    maxWidth: 400,
    zIndex: 9999999,
    elevation: 9999999,
  },

  successToast: {
    borderColor: Colors.success,
    borderLeftColor: Colors.success,
    backgroundColor: `${Colors.backgroundLight}ee`,
  },

  errorToast: {
    borderColor: Colors.error,
    borderLeftColor: Colors.error,
    backgroundColor: `${Colors.backgroundLight}ee`,
  },

  infoToast: {
    borderColor: Colors.primary,
    borderLeftColor: Colors.primary,
    backgroundColor: `${Colors.backgroundLight}ee`,
  },

  contentContainer: {
    paddingHorizontal: Spacing.md,
  },

  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },

  text1: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600",
  },

  text2: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
