import React from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Colors, Shadows, Spacing, Typography } from "../../constants/Theme";
import { IconSymbol } from "./IconSymbol";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "wizard" | "danger";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: string;
  rightIcon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[`${size}Size`],
    (disabled || loading) && styles.disabled,
    (disabled || loading) && variant === "outline" && styles.disabledOutline,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    (disabled || loading) && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getLoadingColor(variant)} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon && (
            <IconSymbol
              name={leftIcon}
              size={size === "small" ? 16 : size === "large" ? 20 : 18}
              color={getIconColor(variant)}
              style={styles.leftIcon}
            />
          )}
          <Text style={textStyles}>{title}</Text>
          {rightIcon && (
            <IconSymbol
              name={rightIcon}
              size={size === "small" ? 16 : size === "large" ? 20 : 18}
              color={getIconColor(variant)}
              style={styles.rightIcon}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const getLoadingColor = (variant: string) => {
  switch (variant) {
    case "primary":
    case "wizard":
      return Colors.textDark;
    case "secondary":
      return Colors.primary;
    case "outline":
    case "danger":
      return Colors.primary;
    default:
      return Colors.primary;
  }
};

const getIconColor = (variant: string) => {
  switch (variant) {
    case "primary":
    case "wizard":
      return Colors.textDark;
    case "secondary":
      return Colors.primary;
    case "outline":
      return Colors.primary;
    case "danger":
      return Colors.error;
    default:
      return Colors.primary;
  }
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
    ...Shadows.glow,
  },
  secondary: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  wizard: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    ...Shadows.glow,
    borderWidth: 0,
  },
  danger: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: Colors.error,
  },

  // Sizes
  smallSize: {
    paddingHorizontal: Spacing.buttonPaddingSmall.horizontal,
    paddingVertical: Spacing.buttonPaddingSmall.vertical,
    minHeight: 36,
  },
  mediumSize: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  largeSize: {
    paddingHorizontal: Spacing.buttonPadding.horizontal,
    paddingVertical: Spacing.buttonPadding.vertical,
    minHeight: 52,
  },

  // Text styles
  text: {
    fontWeight: Typography.fontWeight.semibold,
    textAlign: "center",
  },
  primaryText: {
    color: Colors.textDark,
  },
  secondaryText: {
    color: Colors.primary,
  },
  outlineText: {
    color: Colors.primary,
  },
  wizardText: {
    color: Colors.textDark,
  },
  dangerText: {
    color: Colors.error,
  },

  // Text sizes
  smallText: {
    fontSize: Typography.fontSize.buttonSmall,
  },
  mediumText: {
    fontSize: Typography.fontSize.button,
  },
  largeText: {
    fontSize: Typography.fontSize.large,
  },

  // Disabled states
  disabled: {
    backgroundColor: "#374151",
    borderColor: "#374151",
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
      },
      android: {
        boxShadow: "none",
      },
    }),
  },
  disabledOutline: {
    backgroundColor: "transparent",
    borderColor: Colors.textMuted,
    opacity: 0.6,
  },
  disabledText: {
    color: Colors.textMuted,
  },

  // Content and icon styles
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
});
