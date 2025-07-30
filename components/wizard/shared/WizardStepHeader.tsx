import { Colors, Typography } from "@/constants/Theme";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        {onCancel ? (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>✕</Text>
          </TouchableOpacity>
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
    paddingTop: isTablet ? 60 : 10,
  },
  backButton: {
    padding: 8,
    minWidth: 40,
  },
  backText: {
    color: Colors.primary,
    fontSize: isTablet ? 32 : 24,
    fontWeight: "400",
  },
  cancelButton: {
    padding: 8,
    minWidth: 40,
  },
  cancelText: {
    color: Colors.primary,
    fontSize: isTablet ? 32 : 24,
    fontWeight: "400",
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
