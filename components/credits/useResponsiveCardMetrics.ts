import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing } from "@/constants/Theme";

const BREAKPOINTS = {
  NARROW_PHONE_WIDTH: 380,
  COMPACT_HEIGHT: 720,
  VERY_SMALL_HEIGHT: 650,
  TABLET_WIDTH: 768,
} as const;

const CARD_MIN_HEIGHT = {
  COMPACT: 132,
  REGULAR: 160,
  LANDSCAPE: 140,
} as const;

const GRID_COLUMNS = 2;

export const useResponsiveCardMetrics = () => {
  const { width, height } = useWindowDimensions();
  const { left: insetLeft, right: insetRight } = useSafeAreaInsets();

  return useMemo(() => {
    const isNarrowPhone = width < BREAKPOINTS.NARROW_PHONE_WIDTH;
    const isCompactHeight = height < BREAKPOINTS.COMPACT_HEIGHT;
    const isVerySmallHeight = height < BREAKPOINTS.VERY_SMALL_HEIGHT;
    const isTablet = width >= BREAKPOINTS.TABLET_WIDTH;
    const isLandscape = width > height;
    const useTightSpacing = isVerySmallHeight || isCompactHeight;

    const horizontalPadding = isTablet
      ? Spacing.screenPadding
      : isLandscape
        ? Spacing.sm // Reduced from lg to sm for phone landscape
        : isNarrowPhone
          ? Spacing.lg
          : Spacing.screenPadding;

    const interCardGap = Spacing.md;
    const columns = GRID_COLUMNS;

    const safeAreaHorizontal = insetLeft + insetRight;

    const availableWidth = Math.max(
      0,
      width -
        safeAreaHorizontal -
        horizontalPadding * 2 -
        interCardGap * (columns - 1)
    );

    const cardWidth = availableWidth / columns;

    const cardPadding = isLandscape
      ? Spacing.md
      : useTightSpacing
        ? Spacing.md
        : Spacing.lg;
    const cardMarginBottom = isLandscape
      ? Spacing.md
      : useTightSpacing
        ? Spacing.md
        : Spacing.lg;
    const cardMinHeight = isLandscape
      ? CARD_MIN_HEIGHT.LANDSCAPE
      : useTightSpacing
        ? CARD_MIN_HEIGHT.COMPACT
        : CARD_MIN_HEIGHT.REGULAR;
    const cardHorizontalMargin = 0; // Always 0 to maintain 2x2 grid
    const landscapeClearance =
      cardMinHeight + cardMarginBottom + Spacing.massive;

    return {
      cardWidth,
      cardPadding,
      cardMarginBottom,
      cardMinHeight,
      cardHorizontalMargin,
      isCompactHeight,
      isVerySmallHeight,
      isLandscape,
      horizontalPadding,
      landscapeClearance,
    } as const;
  }, [width, height, insetLeft, insetRight]);
};
