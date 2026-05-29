// Values appear in redirect URLs, server logs, and browser history — do not include messages that reveal account existence.

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  callback_failed:
    "Could not confirm your email. Try logging in, or sign up again and open the link in the same browser you used to register.",
  callback_invalid_type:
    "The confirmation link was invalid. Please try signing up again.",
  invalid_division: "Please select a valid division (B or C).",
  no_user_returned: "Account created but could not establish a session. Check your email or try again.",
  password_mismatch: "Passwords do not match. Please try again.",
};

export function mapAuthError(raw: string | null): string {
  if (!raw) {
    return "Something went wrong. Please try again.";
  }

  return AUTH_ERROR_MESSAGES[raw] ?? "Something went wrong. Please try again.";
}
