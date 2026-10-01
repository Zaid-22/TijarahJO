import { normalizeJordanPhone } from "../../utils/phone";
import type { Language } from "../../types";



interface ParsedAuthIdentifier {
  email: string | null;
  phone: string | null;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const parseAuthIdentifier = (value: string): ParsedAuthIdentifier => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { email: null, phone: null };
  }

  if (isValidEmail(trimmed)) {
    return { email: trimmed.toLowerCase(), phone: null };
  }

  return { email: null, phone: normalizeJordanPhone(trimmed) };
};

export const formatJoinedDateLabel = (
  value?: unknown,
  language: Language = "en",
): string => {
  const dateLocale = language === "ar" ? "ar-JO" : "en-US";

  if (typeof value === "string" && value.trim()) {
    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString(dateLocale, {
        month: "short",
        year: "numeric",
      });
    }

    return value.trim();
  }

  return new Date().toLocaleDateString(dateLocale, {
    month: "short",
    year: "numeric",
  });
};

export const calculatePasswordStrength = (
  password: string,
): PasswordStrength => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;

  if (metRequirements === 0 || password.length === 0) {
    return { score: 0, label: "", color: "rgb(229 231 235)", requirements };
  }

  if (metRequirements <= 2) {
    return { score: 25, label: "Weak", color: "rgb(239 68 68)", requirements };
  }

  if (metRequirements === 3) {
    return { score: 50, label: "Good", color: "rgb(249 115 22)", requirements };
  }

  if (metRequirements === 4) {
    return {
      score: 75,
      label: "Strong",
      color: "rgb(16 185 129)",
      requirements,
    };
  }

  return {
    score: 100,
    label: "Very Strong",
    color: "rgb(16 185 129)",
    requirements,
  };
};
