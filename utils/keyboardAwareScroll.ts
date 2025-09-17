import { getWizardFooterHeight } from "@/components/wizard/shared/WizardFooter";
import {
  Spacing,
  isSmallScreen,
  isTablet,
  isVerySmallScreen,
} from "@/constants/Theme";
import { useCallback, useEffect, useRef } from "react";
import {
  EmitterSubscription,
  Keyboard,
  ScrollView,
  useWindowDimensions,
} from "react-native";

// Scroll adjustment values for different scenarios
const SCROLL_ADJUSTMENTS = {
  // iPhone SE aggressive scrolling
  IPHONE_SE_AGGRESSIVE: 60,
} as const;

// Timing delays for smooth UX
const TIMING_DELAYS = {
  KEYBOARD_SETTLE: 100, // Wait for keyboard layout to settle
} as const;

interface ScrollToInputParams {
  scrollRef: React.RefObject<ScrollView | null>;
  inputOffsetY: number;
  headerHeight: number;
  keyboardHeight?: number;
  safeAreaBottom?: number;
  extraPadding?: number;
  screenHeight: number;
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
const scrollToInputPosition = ({
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
      // On tablets, don't scroll at all - they have enough screen space
      return;
    }

    // Keyboard is visible - be very aggressive on small screens
    let targetPosition;

    if (isCurrentlySmallScreen) {
      // Small screens require VERY aggressive scrolling
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

  const onInputFocus = useCallback(
    (inputOffsetY: number, headerHeight: number) => {
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

      // Skip immediate scroll - wait for keyboard to appear for single, accurate scroll
    },
    [scrollRef, safeAreaBottom, screenHeight]
  );

  const getContentPadding = useCallback((): number => {
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
  }, [safeAreaBottom]);

  return {
    onInputFocus,
    getContentPadding,
  };
};
