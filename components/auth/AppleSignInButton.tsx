import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Platform,
} from "react-native";
import { IconSymbol } from "../ui/IconSymbol";

interface AppleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const AppleSignInButton: React.FC<AppleSignInButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
}) => {
  // Only show on iOS
  if (Platform.OS !== "ios") {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.button, (disabled || loading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <IconSymbol
          name="apple.logo"
          size={20}
          color="#FFFFFF"
          style={styles.icon}
        />
        <Text style={styles.text}>
          {loading ? "Signing in..." : "Continue with Apple"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#000000",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    marginVertical: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
