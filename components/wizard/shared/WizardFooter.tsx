import { Spacing } from "@/constants/Theme";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../ui/Button";

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
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.select({
    ios: 0,
    android: insets.bottom + Spacing.sm,
  });

  return (
    <View style={[styles.footer, { paddingBottom: bottomPadding }]}>
      <Button
        title={nextText}
        onPress={onNext}
        disabled={nextDisabled}
        variant="wizard"
        size="large"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: Spacing.screenPadding,
    marginTop: Spacing.lg,
  },
});
