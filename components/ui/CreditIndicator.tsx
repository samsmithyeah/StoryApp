import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "@/constants/Theme";
import { IconSymbol } from "./IconSymbol";
import { useCredits } from "@/hooks/useCredits";

interface CreditIndicatorProps {
  compact?: boolean;
  onPress?: () => void;
}

export const CreditIndicator: React.FC<CreditIndicatorProps> = ({
  compact = false,
  onPress,
}) => {
  const router = useRouter();
  const { balance, loading } = useCredits();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/credits" as any);
    }
  };

  if (loading) {
    return null;
  }

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={handlePress}>
        <IconSymbol name="sparkles" size={16} color={Colors.primary} />
        <Text style={styles.compactText}>{balance}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.content}>
        <IconSymbol name="sparkles" size={18} color={Colors.primary} />
        <Text style={styles.balance}>{balance}</Text>
        <Text style={styles.label}>credits</Text>
      </View>
      <IconSymbol name="chevron.right" size={14} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.xs,
  },
  balance: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text,
    marginHorizontal: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  compactText: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    marginLeft: 4,
  },
});
