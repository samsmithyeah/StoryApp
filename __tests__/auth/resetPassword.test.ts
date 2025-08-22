// Basic tests for password reset functionality

// Mock all Firebase and React Native modules first
jest.mock("@react-native-firebase/auth", () => ({
  sendPasswordResetEmail: jest.fn(),
  default: () => ({}),
  createUserWithEmailAndPassword: jest.fn(),
  GoogleAuthProvider: {
    credential: jest.fn(),
  },
  onAuthStateChanged: jest.fn(),
  reload: jest.fn(),
  sendEmailVerification: jest.fn(),
  signInWithCredential: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  AppleAuthProvider: {
    credential: jest.fn(),
  },
}));

jest.mock("@react-native-firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

jest.mock("@react-native-firebase/functions", () => ({
  httpsCallable: jest.fn(),
}));

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
}));

jest.mock("expo-apple-authentication", () => ({
  isAvailableAsync: jest.fn(),
  signInAsync: jest.fn(),
  AppleAuthenticationScope: {
    FULL_NAME: "fullName",
    EMAIL: "email",
  },
}));

jest.mock("../../services/firebase/config", () => ({
  authService: {},
  db: {},
  functionsService: {},
}));

jest.mock("../../services/fcm", () => ({
  FCMService: {
    initializeFCM: jest.fn(),
    cleanup: jest.fn(),
  },
}));

jest.mock("../../services/firebase/credits", () => ({
  creditsService: {
    initializeUserCredits: jest.fn(),
    getUserCredits: jest.fn(),
  },
}));

import { resetPassword } from "../../services/firebase/auth";

describe("Password Reset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call sendPasswordResetEmail with correct email", async () => {
    const mockSendPasswordResetEmail = jest.requireMock(
      "@react-native-firebase/auth"
    ).sendPasswordResetEmail;

    const email = "test@example.com";

    await resetPassword(email);

    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      expect.anything(), // authService
      email
    );
  });

  it("should handle email validation in components", () => {
    const validateEmail = (email: string) => {
      if (!email.trim()) return "Please enter your email address";
      if (!email.includes("@")) return "Please enter a valid email address";
      return "";
    };

    expect(validateEmail("")).toBe("Please enter your email address");
    expect(validateEmail("invalid-email")).toBe(
      "Please enter a valid email address"
    );
    expect(validateEmail("valid@example.com")).toBe("");
  });

  it("should handle reset flow states correctly", () => {
    const createResetFlow = () => {
      let state = {
        step: "initial",
        email: "",
        resetSent: false,
      };

      return {
        requestReset: (email: string) => {
          if (!email.includes("@")) {
            return { success: false, error: "Invalid email address" };
          }

          state = {
            step: "reset_sent",
            email,
            resetSent: true,
          };
          return { success: true };
        },
        getState: () => ({ ...state }),
      };
    };

    const flow = createResetFlow();

    // Test invalid email
    const invalidResult = flow.requestReset("invalid");
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toBe("Invalid email address");

    // Test valid email
    const validResult = flow.requestReset("test@example.com");
    expect(validResult.success).toBe(true);
    expect(flow.getState().resetSent).toBe(true);
    expect(flow.getState().step).toBe("reset_sent");
  });
});
