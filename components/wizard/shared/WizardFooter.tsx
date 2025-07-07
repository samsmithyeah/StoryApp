import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface WizardFooterProps {
  onNext: () => void;
  nextDisabled?: boolean;
  nextText?: string;
}

export const WizardFooter: React.FC<WizardFooterProps> = ({
  onNext,
  nextDisabled = false,
  nextText = "Next",
}) => {
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <View style={[styles.footer, { paddingBottom: tabBarHeight }]}>
      <TouchableOpacity
        style={[styles.nextButton, nextDisabled && styles.nextButtonDisabled]}
        onPress={onNext}
        disabled={nextDisabled}
      >
        <Text
          style={[
            styles.nextButtonText,
            nextDisabled && styles.nextButtonTextDisabled,
          ]}
        >
          {nextText}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  nextButton: {
    backgroundColor: "#D4AF37",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  nextButtonDisabled: {
    backgroundColor: "#374151",
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1b3a",
  },
  nextButtonTextDisabled: {
    color: "#6B7280",
  },
});
