import React from "react";
import { StyleSheet, View } from "react-native";
import { Spacing } from "../../../constants/Theme";
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
  return (
    <View style={[styles.footer]}>
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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
});
