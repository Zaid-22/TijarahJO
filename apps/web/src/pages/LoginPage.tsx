import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../constants/appConfig";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { normalizeJordanPhone } from "../utils/phone";
import { LoginForm } from "../features/auth/LoginForm";
import { getLoginCopy } from "../features/auth/loginCopy";
import { PageShell } from "../shared/ui/page-shell";
import { SubpageHeader } from "../shared/ui/subpage-header";
import {
  buildCurrentPath,
  resolveBackPathFromLocationState,
} from "../shared/lib/backNavigation";
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
import type { Language } from "../types";

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
  language: Language;
}

const extractErrorMessage = (
  payload: unknown,
  fallback: string,
  backendConnectionMessage: string,
): string => {
  if (extractApiCode(payload) === "CONNECTION_REFUSED") {
    return backendConnectionMessage;
  }

  return extractApiMessage(payload) || fallback;
};

const toExceptionMessage = (
  error: unknown,
  fallbackMessage: string,
  backendConnectionMessage: string,
): string => {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  if (
    error.message.includes("Failed to fetch") ||
    error.message.includes("ERR_CONNECTION_REFUSED")
  ) {
    return backendConnectionMessage;
  }

  return error.message;
};

const appendDuplicateAccountHint = (
  message: string,
  duplicateHintSuffix: string,
): string => {
  if (
    message.includes("already exists") ||
    message.includes("email address already")
  ) {
    return `${message} ${duplicateHintSuffix}`;
  }

  return message;
};

const normalizeTwoFactorCode = (value: string): string => {
  return value.replace(/\D+/g, "");
};

export function LoginPage({
  onLogin,
  onContinueAsGuest,
  language,
}: LoginPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();
  const copy = getLoginCopy(language);
  const googleAuthEnabled = APP_CONFIG.googleAuthEnabled;
  const validationMessages = copy.validation;
  const backendConnectionMessage =
    `${copy.errors.backendConnection} ${APP_CONFIG.backendHostUrl}`;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
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
  const isRTL = language === "ar";
  const currentPath = buildCurrentPath(location.pathname, location.search);
  const backPath = resolveBackPathFromLocationState({
    locationState: location.state,
    currentPath,
    fallbackPath: "/",
    blockedPathnames: ["/login", "/forgot-password"],
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleError = params.get("googleError");
    const twoFactorRequired = params.get("twoFactorRequired");
    const queryTwoFactorToken = params.get("twoFactorToken");

    if (googleError) {
      const normalizedMessage =
        googleError.trim() || copy.errors.googleAuthFailedFallback;
      setGeneralError(normalizedMessage);
    }

    if (twoFactorRequired === "1" && queryTwoFactorToken) {
      setIsSignUp(false);
      setTwoFactorToken(queryTwoFactorToken.trim());
      setTwoFactorCode("");
      setGeneralError(copy.errors.twoFactorRequiredPrompt);
    }

    if (!googleError && !(twoFactorRequired === "1" && queryTwoFactorToken)) {
      return;
    }

    params.delete("googleError");
    params.delete("twoFactorRequired");
    params.delete("twoFactorToken");
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [
    copy.errors.googleAuthFailedFallback,
    copy.errors.twoFactorRequiredPrompt,
  ]);

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
    return validateLoginField(field, values, isSignUp, validationMessages);
  };

  const validateForSubmit = (): LoginFormErrors => {
    return validateLoginForm(values, isSignUp, validationMessages);
  };

  const canSubmit = (() => {
    if (isLoading) {
      return false;
    }

    if (!isSignUp && twoFactorToken) {
      return normalizeTwoFactorCode(twoFactorCode).length === 6;
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
      setFieldError("identifier", validationMessages.identifierInvalid);
      setGeneralError(copy.errors.signUpInvalidIdentifierPrompt);
      return;
    }

    if (!normalizedPhone) {
      setFieldError("phone", validationMessages.phoneInvalid);
      setGeneralError(copy.errors.signUpInvalidPhonePrompt);
      return;
    }

    if (!normalizedCity) {
      setFieldError("city", validationMessages.cityRequired);
      setGeneralError(copy.errors.signUpCityRequiredPrompt);
      return;
    }

    if (!normalizedArea) {
      setFieldError("area", validationMessages.areaRequired);
      setGeneralError(copy.errors.signUpAreaRequiredPrompt);
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
        extractErrorMessage(
          response,
          copy.errors.registrationFailedFallback,
          backendConnectionMessage,
        );
      setGeneralError(
        appendDuplicateAccountHint(baseMessage, copy.errors.duplicateHintSuffix),
      );
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
      joinedDate: formatJoinedDateLabel(user?.joinedDate, language),
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
        copy.errors.loginFailedFallback,
        backendConnectionMessage,
      );
      setGeneralError(message);
      return;
    }

    if (response.requiresTwoFactor) {
      if (!response.twoFactorToken) {
        setGeneralError(copy.errors.twoFactorSessionExpired);
        return;
      }

      setTwoFactorToken(response.twoFactorToken);
      setTwoFactorCode("");
      setGeneralError(
        response.message || copy.errors.twoFactorRequiredPrompt,
      );
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
      joinedDate: formatJoinedDateLabel(user?.joinedDate, language),
    });
  };

  const handleTwoFactorVerification = async () => {
    const normalizedCode = normalizeTwoFactorCode(twoFactorCode);
    if (normalizedCode.length !== 6) {
      setGeneralError(copy.errors.twoFactorCodeInvalid);
      return;
    }

    if (!twoFactorToken.trim()) {
      setGeneralError(copy.errors.twoFactorSessionExpired);
      return;
    }

    const response = await api.auth.verifyTwoFactorLogin(
      twoFactorToken,
      normalizedCode,
    );

    if (!response.success) {
      const message = extractErrorMessage(
        response,
        copy.errors.twoFactorCodeInvalid,
        backendConnectionMessage,
      );
      setGeneralError(message);
      return;
    }

    if (response.requiresTwoFactor) {
      setGeneralError(copy.errors.twoFactorSessionExpired);
      return;
    }

    setTwoFactorToken("");
    setTwoFactorCode("");

    await checkAuth();

    const user = response.user;
    onLogin({
      id: user?.id,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || values.identifier.trim(),
      phone: user?.phone || "",
      avatar: user?.avatar,
      joinedDate: formatJoinedDateLabel(user?.joinedDate, language),
    });
  };

  const handleGoogleAuth = () => {
    if (!googleAuthEnabled) {
      setGeneralError(copy.errors.googleAuthFailedFallback);
      return;
    }

    setGeneralError("");
    const mode = isSignUp ? "signup" : "login";
    window.location.assign(api.auth.getGoogleAuthStartUrl(mode));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setGeneralError("");

    if (!isSignUp && twoFactorToken) {
      setIsLoading(true);
      try {
        await handleTwoFactorVerification();
      } catch (error) {
        setGeneralError(
          toExceptionMessage(
            error,
            copy.errors.twoFactorCodeInvalid,
            backendConnectionMessage,
          ),
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

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
      setGeneralError(
        toExceptionMessage(
          error,
          copy.errors.unexpected,
          backendConnectionMessage,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp((prev) => !prev);
    setTwoFactorToken("");
    setTwoFactorCode("");
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

  const handleCancelTwoFactor = () => {
    setTwoFactorToken("");
    setTwoFactorCode("");
    setGeneralError("");
  };

  return (
    <PageShell tone="account">
      <SubpageHeader
        onBack={() => navigate(backPath, { replace: true })}
        isRTL={isRTL}
        backLabel={isRTL ? "العودة إلى السوق" : "Back to marketplace"}
        onLogoClick={() => navigate("/")}
      />
      <LoginForm
        language={language}
        isSignUp={isSignUp}
        showGoogleAuth={googleAuthEnabled}
        isLoading={isLoading}
        generalError={generalError}
        canSubmit={canSubmit}
        values={values}
        errors={errors}
        copy={copy}
        focusedField={focusedField}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        isTwoFactorStep={!isSignUp && !!twoFactorToken}
        twoFactorCode={twoFactorCode}
        onSubmit={handleSubmit}
        onToggleAuthMode={toggleAuthMode}
        onForgotPassword={() => navigate("/forgot-password")}
        onContinueWithGoogle={handleGoogleAuth}
        onContinueAsGuest={onContinueAsGuest}
        onCancelTwoFactor={handleCancelTwoFactor}
        onTwoFactorCodeChange={(value) => setTwoFactorCode(normalizeTwoFactorCode(value))}
        onFieldChange={setFieldValue}
        onFieldFocus={handleFieldFocus}
        onFieldBlur={handleFieldBlur}
        onTogglePasswordVisibility={() => setShowPassword((prev) => !prev)}
        onToggleConfirmPasswordVisibility={() =>
          setShowConfirmPassword((prev) => !prev)
        }
      />
    </PageShell>
  );
}
