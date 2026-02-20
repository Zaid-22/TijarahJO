import { useState } from "react";
import { APP_CONFIG } from "../constants/appConfig";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { normalizeJordanPhone } from "../utils/phone";
import { LoginForm } from "../features/auth/LoginForm";
import {
  extractApiCode,
  extractApiMessage,
  formatJoinedDateLabel,
  parseAuthIdentifier,
} from "../features/auth/loginUtils";
import {
  createEmptyLoginErrors,
  LoginField,
  LoginFormErrors,
  LoginFormValues,
  validateLoginForm,
  validateLoginField,
} from "../features/auth/loginValidation";

const BACKEND_CONNECTION_MESSAGE = `Cannot connect to backend. Please make sure the backend is running on ${APP_CONFIG.backendHostUrl}`;

interface LoginPageProps {
  onLogin: (userData: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    joinedDate?: string;
  }) => void;
  onContinueAsGuest: () => void;
}

const extractErrorMessage = (payload: unknown, fallback: string): string => {
  if (extractApiCode(payload) === "CONNECTION_REFUSED") {
    return BACKEND_CONNECTION_MESSAGE;
  }

  return extractApiMessage(payload) || fallback;
};

const toExceptionMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return "An unexpected error occurred. Please try again.";
  }

  if (
    error.message.includes("Failed to fetch") ||
    error.message.includes("ERR_CONNECTION_REFUSED")
  ) {
    return BACKEND_CONNECTION_MESSAGE;
  }

  return error.message;
};

const appendDuplicateAccountHint = (message: string): string => {
  if (
    message.includes("already exists") ||
    message.includes("email address already")
  ) {
    return `${message} Try using different credentials, or switch to sign in if you already have an account.`;
  }

  return message;
};

export function LoginPage({ onLogin, onContinueAsGuest }: LoginPageProps) {
  const { checkAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [focusedField, setFocusedField] = useState<LoginField | null>(null);
  const [values, setValues] = useState<LoginFormValues>({
    identifier: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: APP_CONFIG.defaultPhonePrefix,
    city: "",
    area: "",
  });
  const [errors, setErrors] = useState<LoginFormErrors>(
    createEmptyLoginErrors(),
  );

  const setFieldValue = (field: LoginField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const setFieldError = (field: LoginField, value: string) => {
    setErrors((prev) => ({ ...prev, [field]: value }));
  };

  const validateField = (field: LoginField): string => {
    return validateLoginField(field, values, isSignUp);
  };

  const validateForSubmit = (): LoginFormErrors => {
    return validateLoginForm(values, isSignUp);
  };

  const canSubmit = (() => {
    if (isLoading) {
      return false;
    }

    if (!isSignUp) {
      return values.identifier.trim() !== "" && values.password !== "";
    }

    const validationErrors = validateForSubmit();
    return Object.values(validationErrors).every((value) => value === "");
  })();

  const handleSignUp = async () => {
    const parsedIdentifier = parseAuthIdentifier(values.identifier);
    const normalizedPhone = normalizeJordanPhone(values.phone);
    const normalizedCity = values.city.trim();
    const normalizedArea = values.area.trim();

    if (!parsedIdentifier.email && !parsedIdentifier.phone) {
      setFieldError("identifier", "Enter a valid email or Jordanian phone number");
      setGeneralError("Please enter a valid email address or Jordanian phone number.");
      return;
    }

    if (!normalizedPhone) {
      setFieldError("phone", "Enter a valid Jordanian phone number");
      setGeneralError("Please enter a valid Jordanian phone number.");
      return;
    }

    if (!normalizedCity) {
      setFieldError("city", "City is required");
      setGeneralError("Please enter your city.");
      return;
    }

    if (!normalizedArea) {
      setFieldError("area", "Area is required");
      setGeneralError("Please enter your area.");
      return;
    }

    const response = await api.auth.register(
      parsedIdentifier.email || "",
      values.password,
      `${values.firstName.trim()} ${values.lastName.trim()}`,
      normalizedPhone,
      normalizedCity,
      normalizedArea,
    );

    if (!response.success || !response.data) {
      const baseMessage =
        response.error ||
        extractErrorMessage(response, "Registration failed. Please try again.");
      setGeneralError(appendDuplicateAccountHint(baseMessage));
      return;
    }

    await checkAuth();

    const user = response.data.user;

    onLogin({
      id: user?.id,
      firstName: user?.firstName || values.firstName.trim(),
      lastName: user?.lastName || values.lastName.trim(),
      email: user?.email || parsedIdentifier.email || values.identifier.trim(),
      phone: user?.phone || normalizedPhone,
      avatar: user?.avatar,
      joinedDate: formatJoinedDateLabel(user?.joinedDate),
    });
  };

  const handleSignIn = async () => {
    const response = await api.auth.login({
      email: values.identifier.trim(),
      password: values.password,
    });

    if (!response.success) {
      const message = extractErrorMessage(
        response,
        "Invalid email or password. Please try again.",
      );
      setGeneralError(message);
      return;
    }

    await checkAuth();

    const user = response.user;

    onLogin({
      id: user?.id,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || values.identifier.trim(),
      phone: user?.phone || "",
      avatar: user?.avatar,
      joinedDate: formatJoinedDateLabel(user?.joinedDate),
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setGeneralError("");

    const validationErrors = validateForSubmit();
    setErrors(validationErrors);

    const hasValidationErrors = Object.values(validationErrors).some(
      (value) => value !== "",
    );

    if (hasValidationErrors) {
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } catch (error) {
      setGeneralError(toExceptionMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp((prev) => !prev);
    setGeneralError("");
    setErrors(createEmptyLoginErrors());
    setFocusedField(null);
  };

  const handleFieldFocus = (field: LoginField) => {
    setFocusedField(field);
  };

  const handleFieldBlur = (field: LoginField) => {
    setFocusedField(null);
    if (field === "password" && !isSignUp) {
      return;
    }

    setFieldError(field, validateField(field));
  };

  return (
    <LoginForm
      isSignUp={isSignUp}
      isLoading={isLoading}
      generalError={generalError}
      canSubmit={canSubmit}
      values={values}
      errors={errors}
      focusedField={focusedField}
      showPassword={showPassword}
      showConfirmPassword={showConfirmPassword}
      onSubmit={handleSubmit}
      onToggleAuthMode={toggleAuthMode}
      onContinueAsGuest={onContinueAsGuest}
      onFieldChange={setFieldValue}
      onFieldFocus={handleFieldFocus}
      onFieldBlur={handleFieldBlur}
      onTogglePasswordVisibility={() => setShowPassword((prev) => !prev)}
      onToggleConfirmPasswordVisibility={() =>
        setShowConfirmPassword((prev) => !prev)
      }
    />
  );
}
