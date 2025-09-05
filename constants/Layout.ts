import { Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

// Layout constants to avoid magic numbers
export const LAYOUT = {
  // Card dimensions
  CARD_WIDTH_PERCENTAGE: "49%" as const,

  // Spacing
  CARD_MARGIN_HORIZONTAL: 6,
  CONTAINER_HORIZONTAL_PADDING: 48,

  // Tablet-specific calculations
  TABLET_WIDTH_MULTIPLIER: 0.98,
  TABLET_WIDTH_OFFSET: 12,

  // Calculated tablet widths
  getTabletCustomItemWidth: () =>
    (screenWidth - LAYOUT.CONTAINER_HORIZONTAL_PADDING) *
      LAYOUT.TABLET_WIDTH_MULTIPLIER +
    LAYOUT.TABLET_WIDTH_OFFSET,
} as const;

// Export individual constants for backward compatibility
export const CARD_WIDTH_PERCENTAGE = LAYOUT.CARD_WIDTH_PERCENTAGE;
export const TABLET_CUSTOM_ITEM_WIDTH = LAYOUT.getTabletCustomItemWidth();
