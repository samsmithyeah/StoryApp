import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface WizardHeaderProps {
  step: number;
  totalSteps: number;
  onCancel?: () => void;
  onBack?: () => void;
  showCancel?: boolean;
  showBack?: boolean;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({
  step,
  totalSteps,
  onCancel,
  onBack,
  showCancel = false,
  showBack = false,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.brand}>DreamWeaver</Text>
        <Text style={styles.stepIndicator}>
          Step {step} of {totalSteps}
        </Text>
      </View>

      {showCancel && onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>✕</Text>
        </TouchableOpacity>
      )}

      {showBack && onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: "relative",
    paddingHorizontal: 24,
    paddingTop: isTablet ? 60 : 10,
    paddingBottom: 8,
  },
  headerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: isTablet ? 48 : 32,
    fontWeight: "600",
    color: "#D4AF37",
    fontFamily: "PlayfairDisplay-Regular",
  },
  stepIndicator: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 2,
  },
  cancelButton: {
    position: "absolute",
    top: isTablet ? 10 : -10,
    right: 24,
    padding: 8,
  },
  cancelText: {
    color: "#D4AF37",
    fontSize: isTablet ? 32 : 24,
    fontWeight: "400",
  },
  backButton: {
    position: "absolute",
    top: isTablet ? 10 : -10,
    left: 24,
    padding: 8,
  },
  backText: {
    color: "#D4AF37",
    fontSize: isTablet ? 32 : 24,
    fontWeight: "400",
  },
});
