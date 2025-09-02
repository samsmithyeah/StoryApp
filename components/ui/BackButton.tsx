import { Colors, Spacing } from "@/constants/Theme";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { IconSymbol } from "./IconSymbol";

interface BackButtonProps {
  onPress?: () => void;
  style?: object;
}

export const BackButton: React.FC<BackButtonProps> = ({ onPress, style }) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity style={[styles.backButton, style]} onPress={handlePress}>
      <IconSymbol
        name="chevron.left"
        size={Platform.select({
          ios: 20,
          android: 24,
        })}
        color={Colors.primary}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    padding: Spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 32,
    minHeight: 32,
    alignSelf: "flex-start",
    marginBottom: Spacing.lg,
  },
});
