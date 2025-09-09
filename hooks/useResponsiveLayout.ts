import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

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
    const isTabletDevice = Math.min(winWidth, winHeight) >= 768;

    // Column calculation based on device type and orientation
    const columns = isTabletDevice
      ? isLandscape
        ? 4
        : 3
      : isLandscape
        ? 3
        : 2;

    // Gap spacing
    const gap = isTabletDevice ? 20 : 16;

    // Card dimensions (assuming 24px horizontal padding on each side)
    const cardWidth = (winWidth - 2 * 24 - (columns - 1) * gap) / columns;
    const cardHeight = cardWidth * 1.46; // 2:3 aspect ratio approximately

    // Typography sizes
    const titleSize =
      winWidth >= 768 ? 36 : winWidth < 360 ? 14 : winWidth < 390 ? 16 : 18;
    const subtitleSize =
      winWidth >= 768 ? 18 : winWidth < 360 ? 10 : winWidth < 390 ? 11 : 12;
    const brandFontSize =
      winWidth >= 768 ? 64 : winWidth < 360 ? 34 : winWidth < 430 ? 40 : 48;
    const taglineFontSize = winWidth >= 768 ? 24 : winWidth < 360 ? 14 : 18;

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
