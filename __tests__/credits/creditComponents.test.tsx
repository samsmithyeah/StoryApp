import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { InsufficientCreditsModal } from "../../components/ui/InsufficientCreditsModal";

// Mock expo-router
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  router: {
    push: mockPush,
  },
  useRouter: jest.fn(() => ({
    push: mockPush,
    back: jest.fn(),
    replace: jest.fn(),
  })),
}));

// Mock the theme
jest.mock("../../constants/Theme", () => ({
  Colors: {
    primary: "#007AFF",
    background: "#FFFFFF",
    surface: "#F8F9FA",
    text: "#1C1C1E",
    textSecondary: "#8E8E93",
    border: "#E5E5E7",
    error: "#FF3B30",
    success: "#34C759",
    warning: "#FF9500",
    backgroundLight: "#FFFFFF",
  },
  Typography: {
    title: { fontSize: 24, fontWeight: "600" },
    headline: { fontSize: 18, fontWeight: "600" },
    body: { fontSize: 16, fontWeight: "400" },
    caption: { fontSize: 14, fontWeight: "400" },
    fontSize: {
      h1: 56,
      h2: 28,
      h3: 24,
      h4: 20,
      large: 18,
      medium: 16,
      small: 14,
      tiny: 12,
      button: 16,
      buttonSmall: 14,
      label: 12,
    },
    fontWeight: {
      regular: "400" as const,
      medium: "500" as const,
      semibold: "600" as const,
      bold: "700" as const,
    },
    letterSpacing: {
      normal: 0.5,
      wide: 1.5,
    },
    fontFamily: {
      primary: "System",
      secondary: "System",
    },
  },
  Spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
    massive: 64,
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
  },
  BorderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  Shadows: {
    glow: {
      shadowColor: "#007AFF",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    card: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  },
}));

describe("InsufficientCreditsModal", () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    currentBalance: 5,
    creditsNeeded: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  it("should render modal when visible", () => {
    const { getByText } = render(
      <InsufficientCreditsModal {...defaultProps} />
    );

    expect(getByText("More credits needed")).toBeTruthy();
    expect(
      getByText("You need 10 more credits to create this story.")
    ).toBeTruthy();
    expect(getByText("Get credits")).toBeTruthy();
  });

  it("should not render modal when not visible", () => {
    const { queryByText } = render(
      <InsufficientCreditsModal {...defaultProps} visible={false} />
    );

    expect(queryByText("More credits needed")).toBeNull();
  });

  it("should display custom title when provided", () => {
    const customTitle = "Custom Title";
    const { getByText } = render(
      <InsufficientCreditsModal {...defaultProps} title={customTitle} />
    );

    expect(getByText(customTitle)).toBeTruthy();
  });

  it("should display custom message when provided", () => {
    const customMessage = "Custom message for testing";
    const { getByText } = render(
      <InsufficientCreditsModal {...defaultProps} message={customMessage} />
    );

    expect(getByText(customMessage)).toBeTruthy();
  });

  it("should show alternative action when provided", () => {
    const mockAlternativeAction = jest.fn();
    const { getByText } = render(
      <InsufficientCreditsModal
        {...defaultProps}
        showAlternativeAction={true}
        alternativeActionText="Try different approach"
        onAlternativeAction={mockAlternativeAction}
      />
    );

    expect(getByText("Try different approach")).toBeTruthy();

    fireEvent.press(getByText("Try different approach"));
    expect(mockAlternativeAction).toHaveBeenCalled();
  });

  it("should navigate to credits modal when get credits is pressed", async () => {
    const { getByText } = render(
      <InsufficientCreditsModal {...defaultProps} />
    );

    fireEvent.press(getByText("Get credits"));

    await waitFor(() => {
      // Note: This tests the router from the mocked useRouter hook
      expect(mockPush).toHaveBeenCalledWith("/credits-modal");
    });
  });

  it("should display correct credit counts in message", () => {
    const { getByText } = render(
      <InsufficientCreditsModal
        {...defaultProps}
        currentBalance={15}
        creditsNeeded={25}
      />
    );

    expect(
      getByText("You need 25 more credits to create this story.")
    ).toBeTruthy();
    expect(
      getByText(
        "You currently have 15 credits. Each credit creates one page of your story."
      )
    ).toBeTruthy();
  });

  it("should handle zero current balance", () => {
    const { getByText } = render(
      <InsufficientCreditsModal
        {...defaultProps}
        currentBalance={0}
        creditsNeeded={10}
      />
    );

    expect(
      getByText("You need 10 more credits to create this story.")
    ).toBeTruthy();
    expect(
      getByText(
        "You currently have 0 credits. Each credit creates one page of your story."
      )
    ).toBeTruthy();
  });

  it("should render get credits button", () => {
    const { getByText } = render(
      <InsufficientCreditsModal {...defaultProps} />
    );

    expect(getByText("Get credits")).toBeTruthy();
  });
});

describe("Credit Component Integration", () => {
  it("should handle edge case where credits needed is 1", () => {
    const { getByText } = render(
      <InsufficientCreditsModal
        visible={true}
        onClose={jest.fn()}
        currentBalance={0}
        creditsNeeded={1}
      />
    );

    expect(
      getByText("You need 1 more credit to create this story.")
    ).toBeTruthy();
  });

  it("should handle very large credit numbers", () => {
    const { getByText } = render(
      <InsufficientCreditsModal
        visible={true}
        onClose={jest.fn()}
        currentBalance={999}
        creditsNeeded={1000}
      />
    );

    expect(
      getByText("You need 1000 more credits to create this story.")
    ).toBeTruthy();
  });
});
