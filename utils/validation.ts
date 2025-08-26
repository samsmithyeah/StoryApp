export const validateEmail = (
  email: string
): { isValid: boolean; error?: string } => {
  if (!email.trim()) {
    return { isValid: false, error: "Please enter your email address" };
  }

  if (email.length > 254) {
    return { isValid: false, error: "Email address is too long" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  return { isValid: true };
};
