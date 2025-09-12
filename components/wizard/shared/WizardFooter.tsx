import { Spacing } from "@/constants/Theme";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Keyboard, Platform, StyleSheet, View } from "react-native";
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const baseWindowHeightRef = useRef(Dimensions.get("window").height);
  const keyboardVisibleRef = useRef(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      keyboardVisibleRef.current = true;
      setIsKeyboardVisible(true);
      if (Platform.OS === "android") {
        const currentHeight = Dimensions.get("window").height;
        const expectedKb = e.endCoordinates?.height || 0;
        const shrunkBy = baseWindowHeightRef.current - currentHeight;
        // If window already resized to accommodate keyboard, don't add extra padding
        const windowResized = expectedKb > 0 && shrunkBy > expectedKb * 0.6;
        setKeyboardHeight(windowResized ? 0 : expectedKb);
      }
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      keyboardVisibleRef.current = false;
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      // Update base height after keyboard hides
      if (Platform.OS === "android") {
        baseWindowHeightRef.current = Dimensions.get("window").height;
      }
    });
    const dimSub = Dimensions.addEventListener("change", ({ window }) => {
      if (Platform.OS === "android" && !keyboardVisibleRef.current) {
        baseWindowHeightRef.current = window.height;
      }
    });
    return () => {
      showSub.remove();
      hideSub.remove();
      dimSub.remove();
    };
  }, []);

  const bottomPadding = Platform.select({
    ios: isKeyboardVisible ? Spacing.md : 0,
    android: insets.bottom + Spacing.sm + keyboardHeight,
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
