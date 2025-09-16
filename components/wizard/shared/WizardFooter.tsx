import { Spacing } from "@/constants/Theme";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../ui/Button";

// Export the exact button height for use in keyboard calculations
export const WIZARD_FOOTER_BUTTON_HEIGHT = 52; // Matches Button large size minHeight

// Export footer margin for consistent height calculations
export const WIZARD_FOOTER_MARGIN_TOP = Spacing.lg; // marginTop from WizardFooter styles

// Calculate the total height occupied by the WizardFooter
export const getWizardFooterHeight = (safeAreaBottom: number = 0): number => {
  return (
    WIZARD_FOOTER_BUTTON_HEIGHT + WIZARD_FOOTER_MARGIN_TOP + safeAreaBottom
  );
};

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
  const ANDROID_KEYBOARD_RESIZE_THRESHOLD = 0.6; // Treat window as resized if it shrank by at least 60% of reported keyboard height
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const baseWindowHeightRef = useRef(Dimensions.get("window").height);
  const keyboardVisibleRef = useRef(false);
  const { height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      keyboardVisibleRef.current = true;
      setIsKeyboardVisible(true);
      if (Platform.OS === "android") {
        const currentHeight = Dimensions.get("window").height;
        const expectedKb = e.endCoordinates?.height || 0;
        const shrunkBy = baseWindowHeightRef.current - currentHeight;
        // If window already resized to accommodate keyboard, don't add extra padding
        const windowResized =
          expectedKb > 0 &&
          shrunkBy > expectedKb * ANDROID_KEYBOARD_RESIZE_THRESHOLD;
        setKeyboardHeight(windowResized ? 0 : expectedKb);
      }
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      keyboardVisibleRef.current = false;
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Keep base window height in sync (Android) without deprecated listeners
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (!keyboardVisibleRef.current) {
      baseWindowHeightRef.current = windowHeight;
    }
  }, [windowHeight]);

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
    marginTop: WIZARD_FOOTER_MARGIN_TOP,
  },
});
