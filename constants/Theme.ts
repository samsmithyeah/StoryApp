// Theme constants for DreamWeaver app
import { Platform } from "react-native";

export const Colors = {
  // Primary colors
  primary: "#D4AF37", // Golden yellow (DreamWeaver brand)
  primaryDark: "#B8941F", // Darker gold for pressed states
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
  cardBackground: "rgba(255,255,255,0.02)", // Subtle card background
  cardBorder: "#D4AF37", // Golden card border
  placeholderBackground: "rgba(26,27,58,0.5)", // Placeholder background

  // Status colors
  error: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
  info: "#6366F1",
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
    h1: 56, // Brand title
    h1Tablet: 64,
    h1Phone: 48,
    h1Small: 34,

    h2: 28, // Section headers
    h3: 24, // Card titles
    h4: 20, // Subsection headers

    // Body text
    large: 18,
    medium: 16,
    small: 14,
    tiny: 12,
    micro: 10,

    // Specific uses
    button: 16,
    buttonSmall: 14,
    label: 12,
    tag: 12,
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
    tight: 0,
    normal: 0.5,
    wide: 1.5,
    wider: 2,
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
  pill: 999,
};

export const Shadows = {
  // Golden glow effect
  glow: Platform.select({
    ios: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55,
      shadowRadius: 10,
    },
    android: {
      elevation: 8,
      shadowColor: Colors.primary,
    },
  }),

  // Stronger glow
  glowStrong: Platform.select({
    ios: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55,
      shadowRadius: 12,
    },
    android: {
      elevation: 10,
      shadowColor: Colors.primary,
    },
  }),

  // Light glow (for empty state)
  glowLight: Platform.select({
    ios: {
      shadowColor: Colors.primaryLight,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
    },
    android: {
      elevation: 10,
      shadowColor: Colors.primaryLight,
    },
  }),

  // Standard shadow
  standard: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
      shadowColor: "#000",
    },
  }),
};

// Common component styles
export const CommonStyles = {
  // Buttons
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.buttonPadding.horizontal,
    paddingVertical: Spacing.buttonPadding.vertical,
    borderRadius: BorderRadius.round,
    ...Shadows.glow,
  },

  primaryButtonSmall: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.buttonPaddingSmall.horizontal,
    paddingVertical: Spacing.buttonPaddingSmall.vertical,
    borderRadius: BorderRadius.large,
  },

  buttonText: {
    color: Colors.textDark,
    fontSize: Typography.fontSize.button,
    fontWeight: Typography.fontWeight.semibold,
  },

  buttonTextSmall: {
    color: Colors.textDark,
    fontSize: Typography.fontSize.buttonSmall,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Cards
  card: {
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" as const,
    backgroundColor: Colors.cardBackground,
    ...Shadows.glowStrong,
  },

  // Screens
  darkScreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Text styles
  brandTitle: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: Typography.fontSize.h1,
    color: Colors.primary,
  },

  sectionLabel: {
    fontSize: Typography.fontSize.label,
    color: Colors.textMuted,
    letterSpacing: Typography.letterSpacing.wide,
    fontWeight: Typography.fontWeight.semibold,
  },
};

// Responsive helpers
export const isTablet = (width: number) => width >= 768;
export const isPhoneSmall = (width: number) => width < 380;
export const isPhoneMiddle = (width: number) => width < 430;
