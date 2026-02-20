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

function validateIdentifier(value: string, isSignUp: boolean): string {
  if (!value.trim()) {
    return "Email or phone is required";
  }

  if (!isSignUp) {
    return "";
  }

  const parsedIdentifier = parseAuthIdentifier(value);
  if (!parsedIdentifier.email && !parsedIdentifier.phone) {
    return "Enter a valid email or Jordanian phone number";
  }

  return "";
}

function validatePassword(value: string, isSignUp: boolean): string {
  if (!value) {
    return "Password is required";
  }

  if (value.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (!isSignUp) {
    return "";
  }

  const { requirements } = calculatePasswordStrength(value);

  if (!requirements.hasUpperCase) {
    return "Password must contain at least one uppercase letter";
  }

  if (!requirements.hasLowerCase) {
    return "Password must contain at least one lowercase letter";
  }

  if (!requirements.hasNumber) {
    return "Password must contain at least one number";
  }

  if (!requirements.hasSpecialChar) {
    return "Password must contain at least one special character (!@#$%^&*...)";
  }

  return "";
}

function validateConfirmPassword(
  value: string,
  values: LoginFormValues,
): string {
  if (!value) {
    return "Please confirm your password";
  }

  if (value !== values.password) {
    return "Passwords do not match";
  }

  return "";
}

function validateFirstName(value: string): string {
  return value.trim() ? "" : "First name is required";
}

function validateLastName(value: string): string {
  return value.trim() ? "" : "Last name is required";
}

function validatePhone(value: string): string {
  if (!value.trim()) {
    return "Phone number is required";
  }

  if (!normalizeJordanPhone(value)) {
    return "Enter a valid Jordanian phone number";
  }

  return "";
}

function validateCity(value: string): string {
  return value.trim() ? "" : "City is required";
}

function validateArea(value: string): string {
  return value.trim() ? "" : "Area is required";
}

export function validateLoginField(
  field: LoginField,
  values: LoginFormValues,
  isSignUp: boolean,
): string {
  switch (field) {
    case "identifier":
      return validateIdentifier(values.identifier, isSignUp);
    case "password":
      return validatePassword(values.password, isSignUp);
    case "confirmPassword":
      return validateConfirmPassword(values.confirmPassword, values);
    case "firstName":
      return validateFirstName(values.firstName);
    case "lastName":
      return validateLastName(values.lastName);
    case "phone":
      return validatePhone(values.phone);
    case "city":
      return validateCity(values.city);
    case "area":
      return validateArea(values.area);
    default:
      return "";
  }
}

export function validateLoginForm(
  values: LoginFormValues,
  isSignUp: boolean,
): LoginFormErrors {
  const nextErrors = createEmptyLoginErrors();

  nextErrors.identifier = validateIdentifier(values.identifier, isSignUp);
  nextErrors.password = validatePassword(values.password, isSignUp);

  if (isSignUp) {
    nextErrors.confirmPassword = validateConfirmPassword(
      values.confirmPassword,
      values,
    );
    nextErrors.firstName = validateFirstName(values.firstName);
    nextErrors.lastName = validateLastName(values.lastName);
    nextErrors.phone = validatePhone(values.phone);
    nextErrors.city = validateCity(values.city);
    nextErrors.area = validateArea(values.area);
  }

  return nextErrors;
}
