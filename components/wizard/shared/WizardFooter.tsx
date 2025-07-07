import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Button } from '../../ui/Button';
import { Spacing } from '../../../constants/Theme';

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
  },
});
