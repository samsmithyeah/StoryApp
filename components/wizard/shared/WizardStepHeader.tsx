import { Colors, Typography } from "@/constants/Theme";
import React from "react";
import {
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CloseButton } from "../../ui/CloseButton";
import { IconSymbol } from "../../ui/IconSymbol";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface WizardStepHeaderProps {
  title: string;
  subtitle: string;
  stepNumber: number;
  totalSteps: number;
  onBack: () => void;
  onCancel?: () => void;
  showBackButton?: boolean;
}

export const WizardStepHeader: React.FC<WizardStepHeaderProps> = ({
  title,
  subtitle,
  stepNumber,
  totalSteps,
  onBack,
  onCancel,
  showBackButton = true,
}) => {
  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <IconSymbol
              name="chevron.left"
              size={Platform.select({
                ios: isTablet ? 24 : 20,
                android: isTablet ? 32 : 28,
              })}
              color={Colors.primary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        {onCancel ? (
          <CloseButton onPress={onCancel} style={{ padding: 8 }} />
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      {/* Step indicator */}
      <View style={styles.stepIndicatorSection}>
        <Text style={styles.stepIndicator}>
          Step {stepNumber} of {totalSteps}
        </Text>
      </View>

      {/* Subtitle */}
      <View style={styles.titleSection}>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: Platform.select({
      android: (StatusBar.currentHeight || 0) + 16,
      ios: isTablet ? 20 : 16,
    }),
  },
  backButton: {
    marginLeft: -8,
    padding: 8,
    minWidth: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    padding: 8,
    minWidth: 40,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: isTablet ? Typography.fontSize.h1 : Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    textAlign: "center",
    fontFamily: Typography.fontFamily.primary,
  },
  stepIndicatorSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 4,
  },
  stepIndicator: {
    fontSize: Typography.fontSize.small,
    color: Colors.textSecondary,
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: "center",
  },
  subtitle: {
    fontSize: isTablet ? Typography.fontSize.large : Typography.fontSize.small,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
