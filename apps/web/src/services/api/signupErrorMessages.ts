function isUniqueConstraintError(message: string): boolean {
  return (
    message.includes("UNIQUE KEY constraint") || message.includes("UQ_TbUsers")
  );
}

function containsDuplicateIdentityPhrase(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already exists") ||
    normalized.includes("duplicate") ||
    normalized.includes("already been taken") ||
    normalized.includes("already registered")
  );
}

export function normalizeSignupConstraintMessage(message: string): string {
  const normalized = message.toLowerCase();
  const looksLikeDuplicateIdentity =
    isUniqueConstraintError(message) || containsDuplicateIdentityPhrase(message);

  if (!looksLikeDuplicateIdentity) {
    return message;
  }

  if (
    normalized.includes("uq_tbusers_e") ||
    normalized.includes("uq_tbusers_email") ||
    normalized.includes("uq_users_email") ||
    normalized.includes("ix_users_login_email_active") ||
    normalized.includes("email")
  ) {
    return "An account with this email address already exists. Please use a different email or try logging in.";
  }

  if (
    normalized.includes("uq_users_phone_active") ||
    normalized.includes("phone")
  ) {
    return "An account with this phone number already exists. Please use a different phone number or try logging in.";
  }

  return "An account with this information already exists. Please check your details and try again.";
}
