import { useEffect, useRef } from "react";
import {
  Keyboard,
  EmitterSubscription,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import {
  Spacing,
  isTablet,
  isSmallScreen,
  isVerySmallScreen,
} from "@/constants/Theme";
import { WIZARD_FOOTER_BUTTON_HEIGHT } from "@/components/wizard/shared/WizardFooter";

// Scroll adjustment values for different scenarios
const SCROLL_ADJUSTMENTS = {
  // Basic positioning
  BASIC_EXTRA: 40,

  // iPhone SE aggressive scrolling
  IPHONE_SE_AGGRESSIVE: 60,
  IPHONE_SE_VERY_AGGRESSIVE: 80,

  // Component-specific adjustments (for future use)
  STORY_ABOUT_BOOST: 10,
  ILLUSTRATION_SELECTION_REDUCTION: 15,
} as const;

// Timing delays for smooth UX
const TIMING_DELAYS = {
  IMMEDIATE_SCROLL: 50, // Quick initial scroll
  KEYBOARD_SETTLE: 100, // Wait for keyboard layout to settle
} as const;

// Constants for wizard footer dimensions and spacing
export const WIZARD_FOOTER_MARGIN_TOP = Spacing.lg; // marginTop from WizardFooter styles

// Calculate the total height occupied by the WizardFooter
export const getWizardFooterHeight = (safeAreaBottom: number = 0): number => {
  return (
    WIZARD_FOOTER_BUTTON_HEIGHT + WIZARD_FOOTER_MARGIN_TOP + safeAreaBottom
  );
};

interface ScrollToInputParams {
  scrollRef: React.RefObject<ScrollView | null>;
  inputOffsetY: number;
  headerHeight: number;
  keyboardHeight?: number;
  safeAreaBottom?: number;
  extraPadding?: number;
  screenHeight?: number;
}

/**
 * Scrolls a text input to the optimal position when the keyboard appears.
 *
 * This function implements different scrolling strategies based on device type:
 * - Tablets: Basic comfortable scrolling (plenty of screen space)
 * - iPhone SE: Very aggressive scrolling to maximize visible space
 * - Other phones: Moderate scrolling based on available space
 *
 * @param params - Scroll configuration parameters
 */
export const scrollToInputPosition = ({
  scrollRef,
  inputOffsetY,
  headerHeight,
  keyboardHeight = 0,
  safeAreaBottom = 0,
  extraPadding = 20,
  screenHeight,
}: ScrollToInputParams): void => {
  requestAnimationFrame(() => {
    // Use Theme helpers for consistent screen detection
    const isCurrentlySmallScreen = isSmallScreen();

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
      if (isCurrentlySmallScreen) {
        // Small screens need aggressive scroll even without keyboard
        const targetPosition = headerHeight + 1;
        const scrollOffset = Math.max(0, inputOffsetY - targetPosition);
        const extraScroll = SCROLL_ADJUSTMENTS.BASIC_EXTRA;
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

    if (isCurrentlySmallScreen) {
      // Small screens require VERY aggressive scrolling
      // Position the input to be immediately below header with virtually no padding
      targetPosition = headerHeight + 1;

      // The scroll offset calculation needs to be much more aggressive
      // We need to scroll the content up significantly more
      const scrollOffset = Math.max(0, inputOffsetY - targetPosition);

      // On small screens, add extra scroll to make more room
      const extraScroll = SCROLL_ADJUSTMENTS.IPHONE_SE_AGGRESSIVE;
      const finalScrollOffset = scrollOffset + extraScroll;

      scrollRef.current?.scrollTo({
        y: finalScrollOffset,
        animated: true,
      });
      return; // Exit early with custom logic for small screens
    } else {
      // Larger screens - use more comfortable positioning
      // Use dynamic screen height for calculations
      const currentScreenHeight = screenHeight || 800; // fallback value
      const availableSpace =
        currentScreenHeight -
        keyboardHeight -
        getWizardFooterHeight(safeAreaBottom);
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
 * Hook that provides keyboard-aware scrolling functionality for wizard components.
 *
 * This hook manages keyboard listeners with proper cleanup and provides optimized
 * scrolling behavior for different device types. It prevents memory leaks by
 * properly managing listener lifecycle and avoids stale closures.
 *
 * @param scrollRef - Reference to the ScrollView component
 * @param safeAreaBottom - Bottom safe area inset value
 * @returns Object with onInputFocus function and getContentPadding function
 *
 * @example
 * ```tsx
 * const scrollRef = useRef<ScrollView | null>(null);
 * const insets = useSafeAreaInsets();
 * const { onInputFocus, getContentPadding } = useKeyboardAwareScroll(scrollRef, insets.bottom);
 *
 * // In TextInput onFocus:
 * onFocus={() => onInputFocus(inputOffsetY, headerHeight)}
 *
 * // In ScrollView contentContainerStyle:
 * contentContainerStyle={{ paddingBottom: getContentPadding() }}
 * ```
 */
export const useKeyboardAwareScroll = (
  scrollRef: React.RefObject<ScrollView | null>,
  safeAreaBottom: number = 0
): KeyboardAwareScrollHook => {
  const { height: screenHeight } = useWindowDimensions();
  const keyboardListenerRef = useRef<EmitterSubscription | null>(null);
  const currentFocusParamsRef = useRef<{
    inputOffsetY: number;
    headerHeight: number;
  } | null>(null);

  // Clean up keyboard listener on unmount
  useEffect(() => {
    return () => {
      keyboardListenerRef.current?.remove();
    };
  }, []);

  const onInputFocus = (inputOffsetY: number, headerHeight: number) => {
    const isCurrentlySmallScreen = isSmallScreen();

    // Store current focus parameters for the keyboard listener
    currentFocusParamsRef.current = { inputOffsetY, headerHeight };

    // Clean up any existing listener
    keyboardListenerRef.current?.remove();

    // Skip aggressive scrolling on tablets - they have plenty of space
    if (isTablet()) {
      scrollToInputPosition({
        scrollRef,
        inputOffsetY,
        headerHeight,
        keyboardHeight: 0,
        safeAreaBottom,
        screenHeight,
      });
      return;
    }

    // For small screens, be more aggressive with initial scroll
    if (isCurrentlySmallScreen) {
      // Immediate aggressive scroll for small screens
      setTimeout(() => {
        const aggressiveTargetPosition = headerHeight + 1;
        const aggressiveScrollOffset = Math.max(
          0,
          inputOffsetY - aggressiveTargetPosition
        );
        // Add significant extra scroll for small screens
        const extraScroll = SCROLL_ADJUSTMENTS.IPHONE_SE_VERY_AGGRESSIVE;
        const finalAggressiveScroll = aggressiveScrollOffset + extraScroll;

        scrollRef.current?.scrollTo({
          y: finalAggressiveScroll,
          animated: true,
        });
      }, TIMING_DELAYS.IMMEDIATE_SCROLL);
    }

    // Set up keyboard listener with proper cleanup
    keyboardListenerRef.current = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        const keyboardHeight = event.endCoordinates?.height || 0;
        const currentParams = currentFocusParamsRef.current;

        // Only proceed if we have valid current focus parameters
        if (!currentParams) return;

        // Add delay to ensure layout is settled
        setTimeout(() => {
          scrollToInputPosition({
            scrollRef,
            inputOffsetY: currentParams.inputOffsetY,
            headerHeight: currentParams.headerHeight,
            keyboardHeight: isTablet() ? 0 : keyboardHeight, // Ignore keyboard height on tablets
            safeAreaBottom,
            screenHeight,
          });
        }, TIMING_DELAYS.KEYBOARD_SETTLE);

        // Clean up this listener after use
        keyboardListenerRef.current?.remove();
        keyboardListenerRef.current = null;
      }
    );

    // Immediate scroll for better UX, will be refined when keyboard appears
    scrollToInputPosition({
      scrollRef,
      inputOffsetY,
      headerHeight,
      keyboardHeight: 0, // No keyboard yet
      safeAreaBottom,
      screenHeight,
    });
  };

  const getContentPadding = (): number => {
    // Calculate dynamic padding to ensure content clears the footer
    const wizardFooterHeight = getWizardFooterHeight(safeAreaBottom);

    const isCurrentlyVerySmallScreen = isVerySmallScreen();
    const isCurrentlySmallScreen = isSmallScreen();

    // Adjust padding based on screen size to accommodate keyboard scenarios
    if (isCurrentlyVerySmallScreen) {
      // Very small screens need significant extra padding for keyboard scenarios
      return wizardFooterHeight + Spacing.massive + Spacing.xl;
    } else if (isCurrentlySmallScreen) {
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
