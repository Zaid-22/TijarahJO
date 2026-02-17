import { useState } from "react";
import { AlertCircle, Loader2, Lock, Mail, MapPin, Phone, User } from "lucide-react";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Logo } from "../components/ui/logo";
import { APP_CONFIG } from "../constants/appConfig";
import { api } from "../services/api";
import { normalizeJordanPhone } from "../utils/phone";
import { AuthInputField } from "./login/AuthInputField";
import {
  calculatePasswordStrength,
  extractApiCode,
  extractApiMessage,
  formatJoinedDateLabel,
  parseAuthIdentifier,
} from "./login/loginUtils";

const BACKEND_CONNECTION_MESSAGE = `Cannot connect to backend. Please make sure the backend is running on ${APP_CONFIG.backendHostUrl}`;

type LoginField =
  | "identifier"
  | "password"
  | "confirmPassword"
  | "firstName"
  | "lastName"
  | "phone"
  | "city"
  | "area";

interface LoginFormValues {
  identifier: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  area: string;
}

interface LoginFormErrors {
  identifier: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  area: string;
}

interface LoginPageProps {
  onLogin: (userData: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    token: string;
    phone?: string;
    avatar?: string;
    joinedDate?: string;
  }) => void;
  onContinueAsGuest: () => void;
}

const createEmptyErrors = (): LoginFormErrors => ({
  identifier: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  phone: "",
  city: "",
  area: "",
});

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
  const [errors, setErrors] = useState<LoginFormErrors>(createEmptyErrors());

  const setFieldValue = (field: LoginField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const setFieldError = (field: LoginField, value: string) => {
    setErrors((prev) => ({ ...prev, [field]: value }));
  };

  const validateIdentifier = (value: string): string => {
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
  };

  const validatePassword = (value: string): string => {
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
  };

  const validateConfirmPassword = (value: string): string => {
    if (!value) {
      return "Please confirm your password";
    }

    if (value !== values.password) {
      return "Passwords do not match";
    }

    return "";
  };

  const validateFirstName = (value: string): string => {
    if (!value.trim()) {
      return "First name is required";
    }

    return "";
  };

  const validateLastName = (value: string): string => {
    if (!value.trim()) {
      return "Last name is required";
    }

    return "";
  };

  const validatePhone = (value: string): string => {
    if (!value.trim()) {
      return "Phone number is required";
    }

    if (!normalizeJordanPhone(value)) {
      return "Enter a valid Jordanian phone number";
    }

    return "";
  };

  const validateCity = (value: string): string => {
    if (!value.trim()) {
      return "City is required";
    }

    return "";
  };

  const validateArea = (value: string): string => {
    if (!value.trim()) {
      return "Area is required";
    }

    return "";
  };

  const validateField = (field: LoginField): string => {
    switch (field) {
      case "identifier":
        return validateIdentifier(values.identifier);
      case "password":
        return validatePassword(values.password);
      case "confirmPassword":
        return validateConfirmPassword(values.confirmPassword);
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
  };

  const validateForSubmit = (): LoginFormErrors => {
    const nextErrors = createEmptyErrors();

    nextErrors.identifier = validateIdentifier(values.identifier);
    nextErrors.password = validatePassword(values.password);

    if (isSignUp) {
      nextErrors.confirmPassword = validateConfirmPassword(values.confirmPassword);
      nextErrors.firstName = validateFirstName(values.firstName);
      nextErrors.lastName = validateLastName(values.lastName);
      nextErrors.phone = validatePhone(values.phone);
      nextErrors.city = validateCity(values.city);
      nextErrors.area = validateArea(values.area);
    }

    return nextErrors;
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

  const persistToken = async (token: string): Promise<boolean> => {
    localStorage.setItem("tijarahjo_token", token);
    window.dispatchEvent(new CustomEvent("authTokenSet", { detail: { token } }));
    await new Promise((resolve) => setTimeout(resolve, 200));

    const savedToken = localStorage.getItem("tijarahjo_token");
    return Boolean(savedToken && savedToken === token);
  };

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

    const token = response.data.token;
    if (!token) {
      setGeneralError("Registration failed. No token received from server.");
      return;
    }

    const tokenPersisted = await persistToken(token);
    if (!tokenPersisted) {
      setGeneralError(
        "Registration failed. Please try logging in with your new account.",
      );
      return;
    }

    const user = response.data.user;

    onLogin({
      id: user?.id,
      firstName: user?.firstName || values.firstName.trim(),
      lastName: user?.lastName || values.lastName.trim(),
      email: user?.email || parsedIdentifier.email || values.identifier.trim(),
      token,
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

    if (!response.token) {
      setGeneralError("Login failed. No token received from server.");
      return;
    }

    const tokenPersisted = await persistToken(response.token);
    if (!tokenPersisted) {
      setGeneralError("Login failed. Authentication token is invalid.");
      return;
    }

    const user = response.user;

    onLogin({
      id: user?.id,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || values.identifier.trim(),
      token: response.token,
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
    setErrors(createEmptyErrors());
    setFocusedField(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <Logo size="lg" className="mx-auto mb-3 sm:mb-4" />
          <h1 className="text-black dark:text-white mb-2 text-2xl sm:text-3xl">
            {isSignUp ? "Sign Up" : "Sign In"}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-4">
            {isSignUp
              ? "Create your TijarahJo account to start buying and selling"
              : "Sign in to access your TijarahJo account"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          {generalError && (
            <Alert variant="destructive" className="mb-4 sm:mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{generalError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" autoComplete="off" noValidate>
            {isSignUp && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInputField
                  id="firstName"
                  name="firstName"
                  label="First Name"
                  required
                  placeholder="first name"
                  value={values.firstName}
                  error={errors.firstName}
                  disabled={isLoading}
                  type="text"
                  autoComplete="given-name"
                  icon={User}
                  focused={focusedField === "firstName"}
                  onChange={(value) => setFieldValue("firstName", value)}
                  onFocus={() => setFocusedField("firstName")}
                  onBlur={() => {
                    setFocusedField(null);
                    setFieldError("firstName", validateField("firstName"));
                  }}
                />

                <AuthInputField
                  id="lastName"
                  name="lastName"
                  label="Last Name"
                  required
                  placeholder="last name"
                  value={values.lastName}
                  error={errors.lastName}
                  disabled={isLoading}
                  type="text"
                  autoComplete="family-name"
                  icon={User}
                  focused={focusedField === "lastName"}
                  onChange={(value) => setFieldValue("lastName", value)}
                  onFocus={() => setFocusedField("lastName")}
                  onBlur={() => {
                    setFocusedField(null);
                    setFieldError("lastName", validateField("lastName"));
                  }}
                />
              </div>
            )}

            {isSignUp && (
              <AuthInputField
                id="phone"
                name="phone"
                label="Phone Number"
                required
                placeholder="+9627XXXXXXXX"
                value={values.phone}
                error={errors.phone}
                disabled={isLoading}
                type="text"
                autoComplete="tel"
                icon={Phone}
                focused={focusedField === "phone"}
                onChange={(value) => setFieldValue("phone", value)}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => {
                  setFocusedField(null);
                  setFieldError("phone", validateField("phone"));
                }}
              />
            )}

            {isSignUp && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInputField
                  id="city"
                  name="city"
                  label="City"
                  required
                  placeholder="City"
                  value={values.city}
                  error={errors.city}
                  disabled={isLoading}
                  type="text"
                  autoComplete="address-level2"
                  icon={MapPin}
                  focused={focusedField === "city"}
                  onChange={(value) => setFieldValue("city", value)}
                  onFocus={() => setFocusedField("city")}
                  onBlur={() => {
                    setFocusedField(null);
                    setFieldError("city", validateField("city"));
                  }}
                />

                <AuthInputField
                  id="area"
                  name="area"
                  label="Area"
                  required
                  placeholder="Area"
                  value={values.area}
                  error={errors.area}
                  disabled={isLoading}
                  type="text"
                  autoComplete="address-level3"
                  icon={MapPin}
                  focused={focusedField === "area"}
                  onChange={(value) => setFieldValue("area", value)}
                  onFocus={() => setFocusedField("area")}
                  onBlur={() => {
                    setFocusedField(null);
                    setFieldError("area", validateField("area"));
                  }}
                />
              </div>
            )}

            <AuthInputField
              id="authIdentifier"
              name="authIdentifier"
              label="Email or Phone"
              required={isSignUp}
              placeholder="email address or phone number"
              value={values.identifier}
              error={errors.identifier}
              disabled={isLoading}
              type="text"
              autoComplete="off"
              icon={Mail}
              focused={focusedField === "identifier"}
              onChange={(value) => setFieldValue("identifier", value)}
              onFocus={() => setFocusedField("identifier")}
              onBlur={() => {
                setFocusedField(null);
                setFieldError("identifier", validateField("identifier"));
              }}
            />

            <AuthInputField
              id="password"
              name="password"
              label="Password"
              required={isSignUp}
              placeholder="password"
              value={values.password}
              error={errors.password}
              disabled={isLoading}
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              icon={Lock}
              focused={focusedField === "password"}
              showToggle
              showValue={showPassword}
              onToggleValue={() => setShowPassword((prev) => !prev)}
              preventClipboardActions
              onChange={(value) => setFieldValue("password", value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => {
                setFocusedField(null);
                if (isSignUp) {
                  setFieldError("password", validateField("password"));
                }
              }}
            />

            {isSignUp && (
              <AuthInputField
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                required
                placeholder="confirm password"
                value={values.confirmPassword}
                error={errors.confirmPassword}
                disabled={isLoading}
                type="password"
                autoComplete="new-password"
                icon={Lock}
                focused={focusedField === "confirmPassword"}
                showToggle
                showValue={showConfirmPassword}
                onToggleValue={() => setShowConfirmPassword((prev) => !prev)}
                preventClipboardActions
                onChange={(value) => setFieldValue("confirmPassword", value)}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => {
                  setFocusedField(null);
                  setFieldError("confirmPassword", validateField("confirmPassword"));
                }}
              />
            )}

            <Button
              type="submit"
              className="w-full h-14 text-base transition-all duration-300"
              style={{
                backgroundColor: canSubmit && !isLoading ? "#0A4ABF" : "#9CA3AF",
                color: "white",
                cursor: canSubmit && !isLoading ? "pointer" : "not-allowed",
                opacity: canSubmit && !isLoading ? 1 : 0.6,
              }}
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isSignUp ? "Creating Account..." : "Signing In..."}</span>
                </div>
              ) : (
                <span>{isSignUp ? "Create Account" : "Sign In"}</span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button onClick={toggleAuthMode} className="font-medium hover:underline" style={{ color: "#0A4ABF" }}>
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={onContinueAsGuest}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
