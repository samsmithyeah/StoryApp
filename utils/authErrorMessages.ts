// Map Firebase error codes to user-friendly messages
export const getAuthErrorMessage = (error: any): string => {
  const errorCode = error?.code || error?.message || "";

  switch (errorCode) {
    // Email/Password errors
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/user-not-found":
      return "No account found with this email. Please check your email or sign up.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-credential":
      return "The email and password combination is incorrect.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";

    // Registration errors
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please sign in instead.";
    case "auth/weak-password":
      return "Password is too weak. Please choose a stronger password.";

    // Network errors
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";

    // Permission errors
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled. Please contact support.";
    case "auth/requires-recent-login":
      return "For security, please sign out and sign in again to continue.";

    // Google Sign-In specific errors
    case "SIGN_IN_CANCELLED":
      return "Sign-in was cancelled.";
    case "IN_PROGRESS":
      return "Another sign-in is already in progress.";
    case "PLAY_SERVICES_NOT_AVAILABLE":
      return "Google Play Services is not available.";

    // Apple Sign-In errors
    case "ERR_REQUEST_CANCELED":
      return "Apple Sign-In was cancelled.";
    case "ERR_REQUEST_FAILED":
      return "Apple Sign-In failed. Please try again.";

    // Generic fallbacks
    default:
      // Check if the error message is already user-friendly
      const message = error?.message || "";
      if (
        message.length > 0 &&
        !message.includes("Firebase") &&
        !message.includes("auth/") &&
        !message.includes("Error:")
      ) {
        return message;
      }

      return "An authentication error occurred. Please try again.";
  }
};
