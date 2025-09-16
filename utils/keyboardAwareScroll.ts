import { Dimensions, Keyboard } from "react-native";
import { Spacing, isTablet } from "@/constants/Theme";

// Constants for button dimensions and spacing
export const WIZARD_BUTTON_HEIGHT = 52; // Large button minHeight from Button.tsx
export const WIZARD_FOOTER_PADDING = Spacing.screenPadding; // Horizontal padding
export const WIZARD_FOOTER_MARGIN_TOP = Spacing.lg; // marginTop from WizardFooter styles

// Calculate the total height occupied by the WizardFooter
export const getWizardFooterHeight = (safeAreaBottom: number = 0): number => {
  return WIZARD_BUTTON_HEIGHT + WIZARD_FOOTER_MARGIN_TOP + safeAreaBottom;
};

interface ScrollToInputParams {
  scrollRef: React.RefObject<any>;
  inputOffsetY: number;
  headerHeight: number;
  keyboardHeight?: number;
  safeAreaBottom?: number;
  extraPadding?: number;
}

/**
 * Scrolls a text input to the optimal position when the keyboard appears.
 * Takes into account keyboard height on small screens to ensure input stays visible.
 */
export const scrollToInputPosition = ({
  scrollRef,
  inputOffsetY,
  headerHeight,
  keyboardHeight = 0,
  safeAreaBottom = 0,
  extraPadding = 20,
}: ScrollToInputParams): void => {
  requestAnimationFrame(() => {
    const screenHeight = Dimensions.get("window").height;
    const isVerySmallScreen = screenHeight <= 667; // iPhone SE (3rd gen) and smaller

    // Skip aggressive scrolling on tablets - they have plenty of space
    if (isTablet()) {
      const basicTargetPosition = headerHeight + extraPadding;
      const basicScrollOffset = Math.max(0, inputOffsetY - basicTargetPosition);

      scrollRef.current?.scrollTo({
        y: basicScrollOffset,
        animated: true,
      });
      return;
    }

    if (keyboardHeight === 0) {
      // No keyboard yet - basic positioning
      if (isVerySmallScreen) {
        // iPhone SE needs aggressive scroll even without keyboard
        const targetPosition = headerHeight + 1;
        const scrollOffset = Math.max(0, inputOffsetY - targetPosition);
        const extraScroll = 40; // Additional scroll for iPhone SE
        const finalScrollOffset = scrollOffset + extraScroll;

        scrollRef.current?.scrollTo({
          y: finalScrollOffset,
          animated: true,
        });
      } else {
        const targetPosition = headerHeight + extraPadding;
        const scrollOffset = Math.max(0, inputOffsetY - targetPosition);

        scrollRef.current?.scrollTo({
          y: scrollOffset,
          animated: true,
        });
      }
      return;
    }

    // Keyboard is visible - be very aggressive on small screens
    let targetPosition;

    if (isVerySmallScreen) {
      // iPhone SE requires VERY aggressive scrolling
      // Position the input to be immediately below header with virtually no padding
      targetPosition = headerHeight + 1;

      // The scroll offset calculation needs to be much more aggressive
      // We need to scroll the content up significantly more
      const scrollOffset = Math.max(0, inputOffsetY - targetPosition);

      // On iPhone SE, add extra scroll to make more room
      const extraScroll = 60; // Additional scroll to push content higher
      const finalScrollOffset = scrollOffset + extraScroll;

      scrollRef.current?.scrollTo({
        y: finalScrollOffset,
        animated: true,
      });
      return; // Exit early with custom logic for iPhone SE
    } else {
      // Larger screens - use more comfortable positioning
      const availableSpace =
        screenHeight - keyboardHeight - getWizardFooterHeight(safeAreaBottom);
      const contentSpace = availableSpace - headerHeight;
      targetPosition =
        headerHeight + Math.min(extraPadding, Math.max(8, contentSpace / 4));
    }

    const scrollOffset = Math.max(0, inputOffsetY - targetPosition);

    scrollRef.current?.scrollTo({
      y: scrollOffset,
      animated: true,
    });
  });
};

interface KeyboardAwareScrollHook {
  onInputFocus: (inputOffsetY: number, headerHeight: number) => void;
  getContentPadding: () => number;
}

/**
 * Hook that provides keyboard-aware scrolling functionality
 */
export const useKeyboardAwareScroll = (
  scrollRef: React.RefObject<any>,
  safeAreaBottom: number = 0
): KeyboardAwareScrollHook => {
  const onInputFocus = (inputOffsetY: number, headerHeight: number) => {
    const screenHeight = Dimensions.get("window").height;
    const isVerySmallScreen = screenHeight <= 667;

    // Skip aggressive scrolling on tablets - they have plenty of space
    if (isTablet()) {
      scrollToInputPosition({
        scrollRef,
        inputOffsetY,
        headerHeight,
        keyboardHeight: 0,
        safeAreaBottom,
      });
      return;
    }

    // For very small screens, be more aggressive with initial scroll
    if (isVerySmallScreen) {
      // Immediate aggressive scroll for small screens
      setTimeout(() => {
        const aggressiveTargetPosition = headerHeight + 1;
        const aggressiveScrollOffset = Math.max(
          0,
          inputOffsetY - aggressiveTargetPosition
        );
        // Add significant extra scroll for iPhone SE
        const extraScroll = 80;
        const finalAggressiveScroll = aggressiveScrollOffset + extraScroll;

        scrollRef.current?.scrollTo({
          y: finalAggressiveScroll,
          animated: true,
        });
      }, 50);
    }

    // Listen for keyboard events to get accurate height
    const keyboardListener = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        const keyboardHeight = event.endCoordinates?.height || 0;

        // Add delay to ensure layout is settled
        setTimeout(() => {
          scrollToInputPosition({
            scrollRef,
            inputOffsetY,
            headerHeight,
            keyboardHeight: isTablet() ? 0 : keyboardHeight, // Ignore keyboard height on tablets
            safeAreaBottom,
          });
        }, 100);

        keyboardListener.remove();
      }
    );

    // Immediate scroll for better UX, will be refined when keyboard appears
    scrollToInputPosition({
      scrollRef,
      inputOffsetY,
      headerHeight,
      keyboardHeight: 0, // No keyboard yet
      safeAreaBottom,
    });
  };

  const getContentPadding = (): number => {
    // Calculate dynamic padding to ensure content clears the footer
    const wizardFooterHeight = getWizardFooterHeight(safeAreaBottom);
    const screenHeight = Dimensions.get("window").height;

    const isVerySmallScreen = screenHeight <= 667; // iPhone SE (3rd gen) and smaller
    const isSmallScreen = screenHeight < 700;

    // Adjust padding based on screen size to accommodate keyboard scenarios
    if (isVerySmallScreen) {
      // Very small screens need significant extra padding for keyboard scenarios
      return wizardFooterHeight + Spacing.massive + Spacing.xl;
    } else if (isSmallScreen) {
      // Small screens get extra padding
      return wizardFooterHeight + Spacing.huge + Spacing.lg;
    } else {
      // Large screens use comfortable padding
      return wizardFooterHeight + Spacing.xl;
    }
  };

  return {
    onInputFocus,
    getContentPadding,
  };
};
