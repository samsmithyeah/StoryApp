// Layout constants to avoid magic numbers
export const LAYOUT = (() => {
  const values = {
    // Card dimensions
    CARD_WIDTH_PERCENTAGE: "49%" as const,

    // Spacing
    CONTAINER_HORIZONTAL_PADDING: 48,

    // Tablet-specific calculations
    TABLET_WIDTH_MULTIPLIER: 0.98,
    TABLET_WIDTH_OFFSET: 12,
  };

  return {
    ...values,
    // Dynamic tablet width calculation function
    getTabletCustomItemWidth: (screenWidth: number) =>
      (screenWidth - values.CONTAINER_HORIZONTAL_PADDING) *
        values.TABLET_WIDTH_MULTIPLIER +
      values.TABLET_WIDTH_OFFSET,
  } as const;
})();
