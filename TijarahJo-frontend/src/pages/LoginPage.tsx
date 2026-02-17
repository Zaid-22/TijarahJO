import { Logo } from "../components/ui/logo";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Alert, AlertDescription } from "../components/ui/alert";
import { api } from "../services/api";
import { useState } from "react";
import { APP_CONFIG } from "../constants/appConfig";
import { normalizeJordanPhone } from "../utils/phone";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  AlertCircle,
  Loader2,
} from "lucide-react";

const DEBUG_LOGIN =
  Boolean((import.meta as any).env?.DEV) &&
  (import.meta as any).env?.VITE_DEBUG_LOGIN === "true";

const debugLoginLog = (...args: any[]) => {
  if (DEBUG_LOGIN) {
    console.log(...args);
  }
};

const BACKEND_CONNECTION_MESSAGE = `Cannot connect to backend. Please make sure the backend is running on ${APP_CONFIG.backendHostUrl}`;

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

// Email validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const parseAuthIdentifier = (
  value: string,
): { email: string | null; phone: string | null } => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { email: null, phone: null };
  }

  if (isValidEmail(trimmed)) {
    return { email: trimmed.toLowerCase(), phone: null };
  }

  return { email: null, phone: normalizeJordanPhone(trimmed) };
};

const formatJoinedDateLabel = (value?: unknown): string => {
  if (typeof value === "string" && value.trim()) {
    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    }
    return value.trim();
  }

  return new Date().toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

// Password strength calculator
const calculatePasswordStrength = (
  password: string,
): {
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
} => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;

  let score = 0;
  let label = "";
  let color = "";

  if (metRequirements === 0 || password.length === 0) {
    score = 0;
    label = "";
    color = "#E5E7EB";
  } else if (metRequirements <= 2) {
    score = 25;
    label = "Weak";
    color = "#EF4444"; // Red
  } else if (metRequirements === 3) {
    score = 50;
    label = "Good";
    color = "#F97316"; // Orange
  } else if (metRequirements === 4) {
    score = 75;
    label = "Strong";
    color = "#10B981"; // Green
  } else {
    score = 100;
    label = "Very Strong";
    color = "#10B981"; // Green
  }

  return { score, label, color, requirements };
};

export function LoginPage({ onLogin, onContinueAsGuest }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Field errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");

  // General error from backend
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Focus states
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);

  // Validate individual fields
  const validateEmail = (value: string): string => {
    if (!value.trim()) return "Email or phone is required";
    if (isSignUp) {
      const parsedIdentifier = parseAuthIdentifier(value);
      if (!parsedIdentifier.email && !parsedIdentifier.phone) {
        return "Enter a valid email or Jordanian phone number";
      }
    }
    return "";
  };

  const validatePassword = (value: string): string => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";

    // Strong password validation - only for sign up
    if (isSignUp) {
      const strength = calculatePasswordStrength(value);
      const { requirements } = strength;

      if (!requirements.hasUpperCase)
        return "Password must contain at least one uppercase letter";
      if (!requirements.hasLowerCase)
        return "Password must contain at least one lowercase letter";
      if (!requirements.hasNumber)
        return "Password must contain at least one number";
      if (!requirements.hasSpecialChar)
        return "Password must contain at least one special character (!@#$%^&*...)";
    }

    return "";
  };

  const validateConfirmPassword = (value: string): string => {
    if (!value) return "Please confirm your password";
    if (value !== password) return "Passwords do not match";
    return "";
  };

  const validateFirstName = (value: string): string => {
    if (!value.trim()) return "First name is required";
    return "";
  };

  const validateLastName = (value: string): string => {
    if (!value.trim()) return "Last name is required";
    return "";
  };

  // Check if form is valid
  const isFormValid = (): boolean => {
    if (isSignUp) {
      return (
        firstName.trim() !== "" &&
        lastName.trim() !== "" &&
        email.trim() !== "" &&
        password !== "" &&
        confirmPassword !== "" &&
        !validateEmail(email) &&
        !validatePassword(password) &&
        !validateConfirmPassword(confirmPassword) &&
        !validateFirstName(firstName) &&
        !validateLastName(lastName)
      );
    } else {
      return email.trim() !== "" && password !== "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (isSignUp) {
      // Validate all fields
      const emailErr = validateEmail(email);
      const passwordErr = validatePassword(password);
      const confirmPasswordErr = validateConfirmPassword(confirmPassword);
      const firstNameErr = validateFirstName(firstName);
      const lastNameErr = validateLastName(lastName);

      setEmailError(emailErr);
      setPasswordError(passwordErr);
      setConfirmPasswordError(confirmPasswordErr);
      setFirstNameError(firstNameErr);
      setLastNameError(lastNameErr);

      if (emailErr || confirmPasswordErr || firstNameErr || lastNameErr) {
        return;
      }

      // Call backend API for registration
      setIsLoading(true);
      try {
        const parsedIdentifier = parseAuthIdentifier(email);
        if (!parsedIdentifier.email && !parsedIdentifier.phone) {
          setEmailError("Enter a valid email or Jordanian phone number");
          setGeneralError(
            "Please enter a valid email address or Jordanian phone number.",
          );
          setIsLoading(false);
          return;
        }

        const response = await api.auth.register(
          parsedIdentifier.email || "",
          password,
          `${firstName.trim()} ${lastName.trim()}`,
          parsedIdentifier.phone || undefined,
          APP_CONFIG.defaultCity,
          undefined, // No area provided in signup form
        );

        // Log the full response for debugging
        debugLoginLog("[SignUp] Full API response:", response);
        debugLoginLog("[SignUp] Response success:", response.success);
        debugLoginLog("[SignUp] Response data:", response.data);

        // Check for errors - response might be successful HTTP but have Success: false in data
        if (!response.success || !response.data) {
          // Handle backend errors with better messages
          debugLoginLog("[SignUp] Registration failed - no success or no data");
          debugLoginLog("[SignUp] Response error:", (response as any).error);

          let errorMessage =
            response.message ||
            (response as any).error?.message ||
            (typeof (response as any).error === "string"
              ? (response as any).error
              : null) ||
            ((response as any).error?.code === "CONNECTION_REFUSED"
              ? BACKEND_CONNECTION_MESSAGE
              : "Registration failed. Please try again.");

          // Add helpful suggestion for duplicate account errors
          if (
            errorMessage &&
            (errorMessage.includes("already exists") ||
              errorMessage.includes("email address already"))
          ) {
            errorMessage +=
              " Try using different credentials, or switch to sign in if you already have an account.";
          }

          setGeneralError(errorMessage);
          setIsLoading(false);
          return;
        }

        // Check if data contains success: false (register() transforms backend response)
        const responseData = response.data as any;
        debugLoginLog("[SignUp] Response data success:", responseData.success);
        debugLoginLog(
          "[SignUp] Response data token:",
          responseData.token ? "exists" : "missing",
        );
        debugLoginLog("[SignUp] Response data message:", responseData.message);

        // Check both formats (transformed and raw backend response)
        // IMPORTANT: Only proceed if sign-up was actually successful
        const isSuccess =
          responseData.success === true || responseData.Success === true;
        const hasToken = !!(
          responseData.token ||
          responseData.Token ||
          responseData.data?.token ||
          responseData.data?.Token
        );

        if (!isSuccess || !hasToken) {
          const errorMessage =
            responseData.message ||
            responseData.Message ||
            response.message ||
            "Registration failed. Please check your information and try again.";
          debugLoginLog(
            "[SignUp] Registration failed - success is false or no token:",
            errorMessage,
          );
          debugLoginLog("[SignUp] Response data for debugging:", {
            success: responseData.success,
            Success: responseData.Success,
            hasToken: hasToken,
            token: responseData.token ? "exists" : "missing",
            Token: responseData.Token ? "exists" : "missing",
          });
          setGeneralError(errorMessage);
          setIsLoading(false);
          return; // CRITICAL: Don't call onLogin if sign-up failed
        }

        // Extract data from response (responseData already declared above)
        // register() returns transformed format with lowercase keys
        const user = responseData.user || responseData.User;
        const token =
          responseData.token ||
          responseData.Token ||
          responseData.data?.token ||
          responseData.data?.Token;

        // Double-check we have a token before proceeding
        if (!token) {
          console.error(
            "[SignUp] CRITICAL: No token found even though checks passed!",
          );
          setGeneralError(
            "Registration failed. No token received from server.",
          );
          setIsLoading(false);
          return; // CRITICAL: Don't call onLogin without a token
        }

        // Verify the user was actually created by checking if we have user data
        if (!user || (!user.id && !user.Id)) {
          console.warn(
            "[SignUp] Warning: User object missing or incomplete:",
            user,
          );
          // Still proceed if we have a token - user data might be fetched later
        }

        debugLoginLog(
          "[SignUp] Sign-up successful! Saving token and calling onLogin",
        );

        // Save token FIRST
        localStorage.setItem("tijarahjo_token", token);

        // Trigger a custom event to notify AuthContext to check authentication
        // This ensures AuthContext picks up the token immediately
        window.dispatchEvent(
          new CustomEvent("authTokenSet", { detail: { token } }),
        );

        // Wait a moment for AuthContext to process the token
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Verify token is still there (in case AuthContext cleared it due to invalid token)
        const verifyToken = localStorage.getItem("tijarahjo_token");
        if (!verifyToken || verifyToken !== token) {
          console.error(
            "[SignUp] Token was removed by AuthContext - authentication validation failed",
          );
          setGeneralError(
            "Registration failed. Please try logging in with your new account.",
          );
          setIsLoading(false);
          return; // Don't call onLogin if token validation failed
        }

        debugLoginLog(
          "[SignUp] Token verified, proceeding with onLogin callback",
        );

        // Only call onLogin if we have a valid token (sign-up was successful)
        onLogin({
          id:
            user?.id?.toString() ||
            user?.Id?.toString() ||
            user?.UserID?.toString(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email:
            user?.email ||
            user?.Email ||
            parsedIdentifier.email ||
            "",
          token: token,
          phone:
            user?.phone ||
            user?.Phone ||
            parsedIdentifier.phone ||
            "",
          avatar: user?.avatar || user?.Avatar,
          joinedDate: formatJoinedDateLabel(
            user?.joinedDate || user?.JoinedDate || user?.JoinDate,
          ),
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Registration error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message.includes("Failed to fetch") ||
              error.message.includes("ERR_CONNECTION_REFUSED")
              ? BACKEND_CONNECTION_MESSAGE
              : error.message
            : "An unexpected error occurred. Please try again.";
        setGeneralError(errorMessage);
        setIsLoading(false);
      }
    } else {
      // Login
      setIsLoading(true);
      try {
        // Call API directly to get full response for onLogin callback
        const response = await api.auth.login({
          email: email.trim(),
          password: password,
        });

        // Check for errors - response might be successful HTTP but have Success: false in data
        if (!response.success) {
          // Handle backend errors with better messages
          const errorMessage =
            response.message ||
            (response as any).error?.message ||
            (typeof (response as any).error === "string"
              ? (response as any).error
              : null) ||
            ((response as any).error?.code === "CONNECTION_REFUSED"
              ? BACKEND_CONNECTION_MESSAGE
              : "Invalid email or password. Please try again.");
          setGeneralError(errorMessage);
          setIsLoading(false);
          return;
        }

        // Check if response contains Success: false (backend returned error in 200 response)
        const responseAny = response as any;
        if (responseAny.data && responseAny.data.Success === false) {
          const errorMessage =
            responseAny.data.Message ||
            "Invalid email or password. Please try again.";
          setGeneralError(errorMessage);
          setIsLoading(false);
          return;
        }

        // Extract user and token from response
        const user =
          responseAny.user || responseAny.data?.user || responseAny.data?.User;
        const token =
          responseAny.token ||
          responseAny.data?.token ||
          responseAny.data?.Token;

        // Verify we have a token
        if (!token) {
          setGeneralError("Login failed. No token received from server.");
          setIsLoading(false);
          return;
        }

        // Ensure AuthContext picks up token in the same tab.
        localStorage.setItem("tijarahjo_token", token);
        window.dispatchEvent(
          new CustomEvent("authTokenSet", { detail: { token } }),
        );
        await new Promise((resolve) => setTimeout(resolve, 200));
        const verifyToken = localStorage.getItem("tijarahjo_token");
        if (!verifyToken || verifyToken !== token) {
          setGeneralError("Login failed. Authentication token is invalid.");
          setIsLoading(false);
          return;
        }

        // Call onLogin with user data for App.tsx state updates
        // If user object is missing, use defaults and let AuthContext fetch full user data
        const firstName = user?.firstName || user?.FirstName || "";
        const lastName = user?.lastName || user?.LastName || "";
        const userEmail = user?.email || user?.Email || email;

        onLogin({
          id:
            user?.id?.toString() ||
            user?.Id?.toString() ||
            user?.UserID?.toString(),
          firstName: firstName,
          lastName: lastName,
          email: userEmail,
          token: token,
          phone: user?.phone || user?.Phone || "",
          avatar: user?.avatar || user?.Avatar,
          joinedDate: formatJoinedDateLabel(
            user?.joinedDate || user?.JoinedDate || user?.JoinDate,
          ),
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Login error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message.includes("Failed to fetch") ||
              error.message.includes("ERR_CONNECTION_REFUSED")
              ? BACKEND_CONNECTION_MESSAGE
              : error.message
            : "An unexpected error occurred. Please try again.";
        setGeneralError(errorMessage);
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
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

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          {generalError && (
            <Alert variant="destructive" className="mb-4 sm:mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {generalError}
              </AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-5"
            autoComplete="off"
            noValidate
          >
            {/* Sign Up Only - First Name & Last Name */}
            {isSignUp && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="firstName"
                    className="text-sm text-black dark:text-white"
                  >
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div
                      className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-300"
                      style={{
                        backgroundColor:
                          firstNameFocused || firstName
                            ? "rgba(10, 74, 191, 0.1)"
                            : "#F5F6FA",
                      }}
                    >
                      <User
                        className="w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300"
                        style={{
                          color:
                            firstNameFocused || firstName
                              ? "#0A4ABF"
                              : "#9CA3AF",
                        }}
                      />
                    </div>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      placeholder="first name"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        setFirstNameError("");
                      }}
                      onBlur={() => {
                        setFirstNameFocused(false);
                        setFirstNameError(validateFirstName(firstName));
                      }}
                      onFocus={() => setFirstNameFocused(true)}
                      className="pl-11 sm:pl-16 h-12 sm:h-14 rounded-xl border-2 transition-all duration-300 text-sm sm:text-base text-black dark:text-white bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      style={{
                        borderColor: firstNameError
                          ? "#EF4444"
                          : firstNameFocused
                            ? "#0A4ABF"
                            : "#E5E7EB",
                        boxShadow: firstNameFocused
                          ? "0 0 0 4px rgba(10, 74, 191, 0.08)"
                          : "none",
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  {firstNameError && (
                    <p className="text-xs text-red-500 mt-1">
                      {firstNameError}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="lastName"
                    className="text-sm text-black dark:text-white"
                  >
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div
                      className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-300"
                      style={{
                        backgroundColor:
                          lastNameFocused || lastName
                            ? "rgba(10, 74, 191, 0.1)"
                            : "#F5F6FA",
                      }}
                    >
                      <User
                        className="w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300"
                        style={{
                          color:
                            lastNameFocused || lastName ? "#0A4ABF" : "#9CA3AF",
                        }}
                      />
                    </div>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      placeholder="last name"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        setLastNameError("");
                      }}
                      onBlur={() => {
                        setLastNameFocused(false);
                        setLastNameError(validateLastName(lastName));
                      }}
                      onFocus={() => setLastNameFocused(true)}
                      className="pl-11 sm:pl-16 h-12 sm:h-14 rounded-xl border-2 transition-all duration-300 text-sm sm:text-base text-black dark:text-white bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      style={{
                        borderColor: lastNameError
                          ? "#EF4444"
                          : lastNameFocused
                            ? "#0A4ABF"
                            : "#E5E7EB",
                        boxShadow: lastNameFocused
                          ? "0 0 0 4px rgba(10, 74, 191, 0.08)"
                          : "none",
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  {lastNameError && (
                    <p className="text-xs text-red-500 mt-1">{lastNameError}</p>
                  )}
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="authIdentifier"
                className="text-sm text-black dark:text-white"
              >
                Email or Phone{" "}
                {isSignUp && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <div
                  className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-300"
                  style={{
                    backgroundColor:
                      emailFocused || email
                        ? "rgba(10, 74, 191, 0.1)"
                        : "#F5F6FA",
                  }}
                >
                  <Mail
                    className="w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300"
                    style={{
                      color: emailFocused || email ? "#0A4ABF" : "#9CA3AF",
                    }}
                  />
                </div>
                <Input
                  id="authIdentifier"
                  name="authIdentifier"
                  type="text"
                  autoComplete="off"
                  placeholder="email address or phone number"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  onBlur={() => {
                    setEmailFocused(false);
                    setEmailError(validateEmail(email));
                  }}
                  onFocus={() => setEmailFocused(true)}
                  className="pl-11 sm:pl-16 h-12 sm:h-14 rounded-xl border-2 transition-all duration-300 text-sm sm:text-base text-black dark:text-white bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  style={{
                    borderColor: emailError
                      ? "#EF4444"
                      : emailFocused
                        ? "#0A4ABF"
                        : "#E5E7EB",
                    boxShadow: emailFocused
                      ? "0 0 0 4px rgba(10, 74, 191, 0.08)"
                      : "none",
                  }}
                  disabled={isLoading}
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-500 mt-1">{emailError}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm text-black dark:text-white"
              >
                Password {isSignUp && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <div
                  className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-300"
                  style={{
                    backgroundColor:
                      passwordFocused || password
                        ? "rgba(10, 74, 191, 0.1)"
                        : "#F5F6FA",
                  }}
                >
                  <Lock
                    className="w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300"
                    style={{
                      color:
                        passwordFocused || password ? "#0A4ABF" : "#9CA3AF",
                    }}
                  />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  onBlur={() => {
                    setPasswordFocused(false);
                    if (isSignUp) {
                      setPasswordError(validatePassword(password));
                    }
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onCopy={(e) => e.stopPropagation()}
                  onCut={(e) => e.stopPropagation()}
                  onPaste={(e) => e.stopPropagation()}
                  className="pl-11 sm:pl-16 pr-12 sm:pr-14 h-12 sm:h-14 rounded-xl border-2 transition-all duration-300 text-sm sm:text-base text-black dark:text-white bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  style={{
                    borderColor: passwordError
                      ? "#EF4444"
                      : passwordFocused
                        ? "#0A4ABF"
                        : "#E5E7EB",
                    boxShadow: passwordFocused
                      ? "0 0 0 4px rgba(10, 74, 191, 0.08)"
                      : "none",
                  }}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-red-500 mt-1">{passwordError}</p>
              )}
            </div>

            {/* Confirm Password - Sign Up Only */}
            {isSignUp && (
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm text-black dark:text-white"
                >
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div
                    className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-300"
                    style={{
                      backgroundColor:
                        confirmPasswordFocused || confirmPassword
                          ? "rgba(10, 74, 191, 0.1)"
                          : "#F5F6FA",
                    }}
                  >
                    <Lock
                      className="w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300"
                      style={{
                        color:
                          confirmPasswordFocused || confirmPassword
                            ? "#0A4ABF"
                            : "#9CA3AF",
                      }}
                    />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="confirm password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setConfirmPasswordError("");
                    }}
                    onBlur={() => {
                      setConfirmPasswordFocused(false);
                      setConfirmPasswordError(
                        validateConfirmPassword(confirmPassword),
                      );
                    }}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onCopy={(e) => e.stopPropagation()}
                    onCut={(e) => e.stopPropagation()}
                    onPaste={(e) => e.stopPropagation()}
                    className="pl-11 sm:pl-16 pr-12 sm:pr-14 h-12 sm:h-14 rounded-xl border-2 transition-all duration-300 text-sm sm:text-base text-black dark:text-white bg-white dark:bg-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    style={{
                      borderColor: confirmPasswordError
                        ? "#EF4444"
                        : confirmPasswordFocused
                          ? "#0A4ABF"
                          : "#E5E7EB",
                      boxShadow: confirmPasswordFocused
                        ? "0 0 0 4px rgba(10, 74, 191, 0.08)"
                        : "none",
                    }}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition-colors p-1"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p className="text-xs text-red-500 mt-1">
                    {confirmPasswordError}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-14 text-base transition-all duration-300"
              style={{
                backgroundColor:
                  isFormValid() && !isLoading ? "#0A4ABF" : "#9CA3AF",
                color: "white",
                cursor: isFormValid() && !isLoading ? "pointer" : "not-allowed",
                opacity: isFormValid() && !isLoading ? 1 : 0.6,
              }}
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    {isSignUp ? "Creating Account..." : "Signing In..."}
                  </span>
                </div>
              ) : (
                <span>{isSignUp ? "Create Account" : "Sign In"}</span>
              )}
            </Button>
          </form>

          {/* Toggle Sign Up/Sign In */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setGeneralError("");
                  setEmailError("");
                  setPasswordError("");
                  setConfirmPasswordError("");
                  setFirstNameError("");
                  setLastNameError("");
                }}
                className="font-medium hover:underline"
                style={{ color: "#0A4ABF" }}
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>

          {/* Continue as Guest */}
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
