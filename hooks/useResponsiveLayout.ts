import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

// Responsive design constants
const TABLET_BREAKPOINT = 768;
const HORIZONTAL_PADDING = 24;
const CARD_ASPECT_RATIO = 1.46;

// Device type constants
const TABLET_GAP = 20;
const PHONE_GAP = 16;

// Column count constants
const TABLET_LANDSCAPE_COLUMNS = 4;
const TABLET_PORTRAIT_COLUMNS = 3;
const PHONE_LANDSCAPE_COLUMNS = 3;
const PHONE_PORTRAIT_COLUMNS = 2;

// Typography breakpoints and sizes
const TYPOGRAPHY_LARGE_BREAKPOINT = 768;
const TYPOGRAPHY_SMALL_BREAKPOINT = 360;
const TYPOGRAPHY_MEDIUM_BREAKPOINT = 390;
const BRAND_MEDIUM_BREAKPOINT = 430;

// Typography sizes
const TITLE_SIZES = {
  large: 36,
  small: 14,
  medium: 16,
  default: 18,
};

const SUBTITLE_SIZES = {
  large: 18,
  small: 10,
  medium: 11,
  default: 12,
};

const BRAND_SIZES = {
  large: 64,
  small: 34,
  medium: 40,
  default: 48,
};

const TAGLINE_SIZES = {
  large: 24,
  small: 14,
  default: 18,
};

export interface ResponsiveLayoutValues {
  isLandscape: boolean;
  isTabletDevice: boolean;
  columns: number;
  gap: number;
  cardWidth: number;
  cardHeight: number;
  titleSize: number;
  subtitleSize: number;
  brandFontSize: number;
  taglineFontSize: number;
}

/**
 * Custom hook for responsive layout calculations
 * Provides consistent responsive values across components
 * Memoized to prevent unnecessary recalculations
 */
export function useResponsiveLayout(): ResponsiveLayoutValues {
  const { width: winWidth, height: winHeight } = useWindowDimensions();

  return useMemo(() => {
    const isLandscape = winWidth > winHeight;
    const isTabletDevice = Math.min(winWidth, winHeight) >= TABLET_BREAKPOINT;

    // Column calculation based on device type and orientation
    const columns = isTabletDevice
      ? isLandscape
        ? TABLET_LANDSCAPE_COLUMNS
        : TABLET_PORTRAIT_COLUMNS
      : isLandscape
        ? PHONE_LANDSCAPE_COLUMNS
        : PHONE_PORTRAIT_COLUMNS;

    // Gap spacing
    const gap = isTabletDevice ? TABLET_GAP : PHONE_GAP;

    // Card dimensions
    const cardWidth =
      (winWidth - 2 * HORIZONTAL_PADDING - (columns - 1) * gap) / columns;
    const cardHeight = cardWidth * CARD_ASPECT_RATIO;

    // Typography sizes with responsive breakpoints
    const titleSize =
      winWidth >= TYPOGRAPHY_LARGE_BREAKPOINT
        ? TITLE_SIZES.large
        : winWidth < TYPOGRAPHY_SMALL_BREAKPOINT
          ? TITLE_SIZES.small
          : winWidth < TYPOGRAPHY_MEDIUM_BREAKPOINT
            ? TITLE_SIZES.medium
            : TITLE_SIZES.default;

    const subtitleSize =
      winWidth >= TYPOGRAPHY_LARGE_BREAKPOINT
        ? SUBTITLE_SIZES.large
        : winWidth < TYPOGRAPHY_SMALL_BREAKPOINT
          ? SUBTITLE_SIZES.small
          : winWidth < TYPOGRAPHY_MEDIUM_BREAKPOINT
            ? SUBTITLE_SIZES.medium
            : SUBTITLE_SIZES.default;

    const brandFontSize =
      winWidth >= TYPOGRAPHY_LARGE_BREAKPOINT
        ? BRAND_SIZES.large
        : winWidth < TYPOGRAPHY_SMALL_BREAKPOINT
          ? BRAND_SIZES.small
          : winWidth < BRAND_MEDIUM_BREAKPOINT
            ? BRAND_SIZES.medium
            : BRAND_SIZES.default;

    const taglineFontSize =
      winWidth >= TYPOGRAPHY_LARGE_BREAKPOINT
        ? TAGLINE_SIZES.large
        : winWidth < TYPOGRAPHY_SMALL_BREAKPOINT
          ? TAGLINE_SIZES.small
          : TAGLINE_SIZES.default;

    return {
      isLandscape,
      isTabletDevice,
      columns,
      gap,
      cardWidth,
      cardHeight,
      titleSize,
      subtitleSize,
      brandFontSize,
      taglineFontSize,
    };
  }, [winWidth, winHeight]);
}
