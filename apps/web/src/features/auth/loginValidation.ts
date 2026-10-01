import { normalizeJordanPhone } from "../../utils/phone";
import { calculatePasswordStrength, parseAuthIdentifier } from "./loginUtils";

export type LoginField =
  | "identifier"
  | "password"
  | "confirmPassword"
  | "firstName"
  | "lastName"
  | "phone"
  | "city"
  | "area";

export interface LoginFormValues {
  identifier: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  area: string;
}

export interface LoginFormErrors {
  identifier: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  area: string;
}

export interface LoginValidationMessages {
  identifierRequired: string;
  identifierInvalid: string;
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordMinLength: string;
  passwordUppercase: string;
  passwordLowercase: string;
  passwordNumber: string;
  passwordSpecial: string;
  confirmPasswordRequired: string;
  confirmPasswordMismatch: string;
  firstNameRequired: string;
  lastNameRequired: string;
  phoneRequired: string;
  phoneInvalid: string;
  cityRequired: string;
  areaRequired: string;
}

export const createEmptyLoginErrors = (): LoginFormErrors => ({
  identifier: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  phone: "",
  city: "",
  area: "",
});

const DEFAULT_LOGIN_VALIDATION_MESSAGES: LoginValidationMessages = {
  identifierRequired: "Email or phone is required",
  identifierInvalid: "Enter a valid email or Jordanian phone number",
  emailRequired: "Email address is required",
  emailInvalid: "Enter a valid email address",
  passwordRequired: "Password is required",
  passwordMinLength: "Password must be at least 8 characters",
  passwordUppercase: "Password must contain at least one uppercase letter",
  passwordLowercase: "Password must contain at least one lowercase letter",
  passwordNumber: "Password must contain at least one number",
  passwordSpecial:
    "Password must contain at least one special character (!@#$%^&*...)",
  confirmPasswordRequired: "Please confirm your password",
  confirmPasswordMismatch: "Passwords do not match",
  firstNameRequired: "First name is required",
  lastNameRequired: "Last name is required",
  phoneRequired: "Phone number is required",
  phoneInvalid: "Enter a valid Jordanian phone number",
  cityRequired: "City is required",
  areaRequired: "Area is required",
};

function validateIdentifier(
  value: string,
  isSignUp: boolean,
  messages: LoginValidationMessages,
): string {
  if (!value.trim()) {
    return isSignUp ? messages.emailRequired : messages.identifierRequired;
  }

  if (!isSignUp) {
    return "";
  }

  const parsedIdentifier = parseAuthIdentifier(value);
  if (!parsedIdentifier.email) {
    return messages.emailInvalid;
  }

  return "";
}

function validatePassword(
  value: string,
  isSignUp: boolean,
  messages: LoginValidationMessages,
): string {
  if (!value) {
    return messages.passwordRequired;
  }

  if (value.length < 8) {
    return messages.passwordMinLength;
  }

  if (!isSignUp) {
    return "";
  }

  const { requirements } = calculatePasswordStrength(value);

  if (!requirements.hasUpperCase) {
    return messages.passwordUppercase;
  }

  if (!requirements.hasLowerCase) {
    return messages.passwordLowercase;
  }

  if (!requirements.hasNumber) {
    return messages.passwordNumber;
  }

  if (!requirements.hasSpecialChar) {
    return messages.passwordSpecial;
  }

  return "";
}

function validateConfirmPassword(
  value: string,
  values: LoginFormValues,
  messages: LoginValidationMessages,
): string {
  if (!value) {
    return messages.confirmPasswordRequired;
  }

  if (value !== values.password) {
    return messages.confirmPasswordMismatch;
  }

  return "";
}

function validateFirstName(
  value: string,
  messages: LoginValidationMessages,
): string {
  return value.trim() ? "" : messages.firstNameRequired;
}

function validateLastName(
  value: string,
  messages: LoginValidationMessages,
): string {
  return value.trim() ? "" : messages.lastNameRequired;
}

function validatePhone(value: string, messages: LoginValidationMessages): string {
  if (!value.trim()) {
    return messages.phoneRequired;
  }

  if (!normalizeJordanPhone(value)) {
    return messages.phoneInvalid;
  }

  return "";
}

function validateCity(value: string, messages: LoginValidationMessages): string {
  return value.trim() ? "" : messages.cityRequired;
}

function validateArea(value: string, messages: LoginValidationMessages): string {
  return value.trim() ? "" : messages.areaRequired;
}

export function validateLoginField(
  field: LoginField,
  values: LoginFormValues,
  isSignUp: boolean,
  messages: LoginValidationMessages = DEFAULT_LOGIN_VALIDATION_MESSAGES,
): string {
  switch (field) {
    case "identifier":
      return validateIdentifier(values.identifier, isSignUp, messages);
    case "password":
      return validatePassword(values.password, isSignUp, messages);
    case "confirmPassword":
      return validateConfirmPassword(values.confirmPassword, values, messages);
    case "firstName":
      return validateFirstName(values.firstName, messages);
    case "lastName":
      return validateLastName(values.lastName, messages);
    case "phone":
      return validatePhone(values.phone, messages);
    case "city":
      return validateCity(values.city, messages);
    case "area":
      return validateArea(values.area, messages);
    default:
      return "";
  }
}

export function validateLoginForm(
  values: LoginFormValues,
  isSignUp: boolean,
  messages: LoginValidationMessages = DEFAULT_LOGIN_VALIDATION_MESSAGES,
): LoginFormErrors {
  const nextErrors = createEmptyLoginErrors();

  nextErrors.identifier = validateIdentifier(values.identifier, isSignUp, messages);
  nextErrors.password = validatePassword(values.password, isSignUp, messages);

  if (isSignUp) {
    nextErrors.confirmPassword = validateConfirmPassword(
      values.confirmPassword,
      values,
      messages,
    );
    nextErrors.firstName = validateFirstName(values.firstName, messages);
    nextErrors.lastName = validateLastName(values.lastName, messages);
    nextErrors.phone = validatePhone(values.phone, messages);
    nextErrors.city = validateCity(values.city, messages);
    nextErrors.area = validateArea(values.area, messages);
  }

  return nextErrors;
}
