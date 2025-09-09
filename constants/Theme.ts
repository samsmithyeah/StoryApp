// Theme constants for DreamWeaver app
import { Dimensions, Platform } from "react-native";

export const Colors = {
  // Primary colors
  primary: "#D4AF37", // Golden yellow (DreamWeaver brand)
  primaryLight: "#FCD34D", // Lighter gold for highlights

  // Background colors
  background: "#0f1129", // Deep navy background
  backgroundLight: "#1a1b3a", // Slightly lighter navy
  backgroundOverlay: "rgba(15,17,41,0.96)", // Dark overlay
  backgroundGradientStart: "rgba(15,17,41,0.72)", // Gradient start
  backgroundGradientEnd: "rgba(15,17,41,0.96)", // Gradient end

  // Text colors
  text: "#FFFFFF", // Primary text
  textSecondary: "#B8B8B8", // Secondary text
  textMuted: "#999", // Muted text
  textDark: "#1a1b3a", // Dark text (on light backgrounds)

  // Border & divider colors
  border: "#3a3b5a", // Tab bar border
  borderLight: "#2a2b4a", // Lighter border

  // Card colors
  cardBackground: Platform.select({
    ios: "rgba(255, 255, 255, 0.02)",
    android: "rgba(255, 255, 255, 0.06)",
  }),
  cardBorder: "#D4AF37", // Golden card border
  placeholderBackground: "rgba(26,27,58,0.5)", // Placeholder background

  // Translucent card section colors
  cardSectionBackground: "rgba(255, 255, 255, 0.05)", // For internal card sections
  cardSectionBorder: "rgba(212, 175, 55, 0.2)", // Subtle golden border
  cardActionBackground: "rgba(255, 255, 255, 0.1)", // For action buttons
  cardActionBorder: "rgba(212, 175, 55, 0.3)", // For action button borders
  cardActionBackgroundError: "rgba(239, 68, 68, 0.1)", // For error/delete actions
  cardActionBorderError: "rgba(239, 68, 68, 0.3)", // For error/delete action borders

  // Status colors
  error: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
};

export const Typography = {
  // Font families
  fontFamily: {
    primary: "PlayfairDisplay-Regular",
    secondary: "SpaceMono-Regular",
  },

  // Font sizes
  fontSize: {
    // Headings
    h1: 55,
    h1Tablet: 64,
    h1Phone: 48,

    h2: 28, // Section headers
    h3: 24, // Card titles
    h4: 20, // Subsection headers

    // Body text
    large: 18,
    medium: 16,
    small: 14,
    tiny: 12,

    // Specific uses
    button: 16,
    buttonSmall: 14,
    label: 12,
  },

  // Font weights
  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },

  // Letter spacing
  letterSpacing: {
    normal: 0.5,
    wide: 1.5,
  },
};

export const Spacing = {
  // Base spacing units
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,

  // Specific spacing
  screenPadding: 24,
  cardPadding: 18,
  navigationBarHeight: 44, // Standard iOS navigation bar height
  buttonPadding: {
    horizontal: 24,
    vertical: 12,
  },
  buttonPaddingSmall: {
    horizontal: 20,
    vertical: 8,
  },
};

export const BorderRadius = {
  small: 10,
  medium: 12,
  large: 16,
  xl: 18,
  xxl: 20,
  round: 25,
};

export const Shadows = {
  // Golden glow effect (inner glow for cards)
  glow: Platform.select({
    ios: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7,
      shadowRadius: 12,
    },
    android: {
      boxShadow: "0 0 12px 0 rgba(212, 175, 55, 0.7)",
    },
  }),

  glowIos: Platform.select({
    ios: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7,
      shadowRadius: 12,
    },
    android: {},
  }),

  // Stronger glow (outer glow for buttons)
  glowStrong: Platform.select({
    ios: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.7,
      shadowRadius: 15,
    },
    android: {
      boxShadow: "0 0 15px 2px rgba(212, 175, 55, 0.7)",
    },
  }),

  // Error glow
  error: Platform.select({
    ios: {
      shadowColor: Colors.error,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
    },
    android: {
      boxShadow: "inset 0 0 10px 0 rgba(239, 68, 68, 0.3)",
    },
  }),
};

// Shadow utility functions for dynamic values
export const createShadow = {
  custom: (
    color: string,
    _elevation: number,
    shadowRadius: number,
    opacity?: number | any
  ) => {
    const opacityValue = opacity ?? 0.3;
    // Convert hex color to rgba for boxShadow
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    return Platform.select({
      ios: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: opacityValue,
        shadowRadius,
      },
      android: {
        boxShadow: `inset 0 0 ${shadowRadius}px 0 ${hexToRgba(color, opacityValue)}`,
      },
    });
  },
};

// Common component styles
export const CommonStyles = {
  // Text styles
  brandTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h1,
    color: Colors.primary,
  },

  // Common label style for form sections
  primarySectionLabel: {
    fontSize: Typography.fontSize.tiny,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
    textTransform: "uppercase" as const,
    letterSpacing: Typography.letterSpacing.wide,
    marginBottom: Spacing.xs,
  },
};

// Responsive helpers that auto-calculate dimensions
const getDimensions = () => Dimensions.get("window");

export const isTablet = () => getDimensions().width >= 768;
export const isPhoneSmall = () => getDimensions().width < 380;
export const isPhoneMiddle = () => getDimensions().width < 430;

// Height-based responsive helpers
export const isSmallScreen = () => getDimensions().height < 700;
export const isVerySmallScreen = () => getDimensions().height < 650;

// Legacy functions that accept parameters (for backward compatibility)
export const isTabletWidth = (width: number) => width >= 768;
export const isPhoneSmallWidth = (width: number) => width < 380;
export const isPhoneMiddleWidth = (width: number) => width < 430;
export const isSmallScreenHeight = (height: number) => height < 700;
export const isVerySmallScreenHeight = (height: number) => height < 650;

// Convenience function to get all responsive states
export const getResponsiveState = () => {
  const { width, height } = getDimensions();
  return {
    width,
    height,
    isTablet: isTablet(),
    isPhoneSmall: isPhoneSmall(),
    isPhoneMiddle: isPhoneMiddle(),
    isSmallScreen: isSmallScreen(),
    isVerySmallScreen: isVerySmallScreen(),
  };
};
