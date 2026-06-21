/* eslint-disable max-lines */
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "../../../constants/appConfig";
import { useAuth } from "../../../contexts/AuthContext";
import { persistAuthSessionHint } from "../../../contexts/authContextUtils";
import { api } from "../../../services/api";
import { debugError } from "../../../services/api/client";
import { normalizeJordanPhone } from "../../../utils/phone";
import { getLoginCopy } from "../loginCopy";
import { PageShell } from "../../../shared/ui/page-shell";
import { resolveHasAdminAccessFromPayload } from "../../../contexts/authUtils";

import { LoginForm } from "../LoginForm";
import {
  formatJoinedDateLabel,
  parseAuthIdentifier,
} from "../loginUtils";
import {
  LoginField,
  LoginFormErrors,
  validateLoginForm,
  validateLoginField,
} from "../loginValidation";
import { useLoginReducer } from "../useLoginReducer";
import type { Language } from "../../../types";
import { useLocationOptions } from "../../../shared/hooks/useLocationOptions";

import {
  extractErrorMessage,
  toExceptionMessage,
  appendDuplicateAccountHint,
  normalizeTwoFactorCode,
  resolveLoginRole,
  readAuthString,
  readAuthPermissions,
  readAuthPositiveInt,
} from "./loginAuthHelpers";

interface LoginPageProps {
  onLogin: (userData: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    city?: string;
    area?: string;
    cityId?: number;
    areaId?: number;
    avatar?: string;
    joinedDate?: string;
    role?: "user" | "admin";
    hasAdminAccess?: boolean;
    permissions?: string[];
  }) => void;
  onContinueAsGuest: () => void;
  language: Language;
  isModal?: boolean;
  onSuccess?: () => void;
  allowSignup?: boolean;
}

export function LoginPage({
  onLogin,
  onContinueAsGuest,
  language,
  isModal,
  onSuccess,
  allowSignup = true,
}: LoginPageProps) {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const copy = getLoginCopy(language);
  const googleAuthEnabled = APP_CONFIG.googleAuthEnabled;
  const validationMessages = copy.validation;
  const backendConnectionMessage = copy.errors.backendConnection;
  const [state, dispatch] = useLoginReducer({
    phone: "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isResendingTwoFactor, setIsResendingTwoFactor] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitInFlightRef = useRef(false);

  const {
    cityNames,
    areaNames,
    isLoadingCities,
    isLoadingAreas,
  } = useLocationOptions(state.values.city, language);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleError = params.get("googleError");
    const twoFactorRequired = params.get("twoFactorRequired");
    const queryTwoFactorToken = params.get("twoFactorToken");
    const queryTwoFactorMessage = params.get("twoFactorMessage");

    if (googleError) {
      const normalizedMessage =
        googleError.trim() || copy.errors.googleAuthFailedFallback;
      dispatch({ type: "SET_GENERAL_ERROR", error: normalizedMessage });
    }

    if (twoFactorRequired === "1") {
      if (queryTwoFactorToken) {
        dispatch({
          type: "ENTER_TWO_FACTOR",
          token: queryTwoFactorToken.trim(),
          message: queryTwoFactorMessage?.trim() || copy.errors.twoFactorRequiredPrompt,
        });
      } else {
        api.auth.getTwoFactorChallenge().then((res) => {
          if (res.success && res.twoFactorToken) {
            dispatch({
              type: "ENTER_TWO_FACTOR",
              token: res.twoFactorToken,
              message:
                queryTwoFactorMessage?.trim() ||
                res.message ||
                copy.errors.twoFactorRequiredPrompt,
            });
          } else {
            dispatch({
              type: "SET_GENERAL_ERROR",
              error: res.message || "Failed to retrieve two-factor challenge.",
            });
          }
        });
      }
    }

    if (!googleError && !twoFactorRequired) {
      return;
    }

    params.delete("googleError");
    params.delete("twoFactorRequired");
    params.delete("twoFactorToken");
    params.delete("twoFactorMessage");
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [
    copy.errors.googleAuthFailedFallback,
    copy.errors.twoFactorRequiredPrompt,
    dispatch,
  ]);

  const setFieldValue = (field: LoginField, value: string) => {
    dispatch({ type: "SET_FIELD", field, value });
  };

  // ─── Resend cooldown timer ────────────────────────────────────────────────
  const startResendCooldown = (seconds = 60) => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }
    setResendCooldown(seconds);
    cooldownTimerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimerRef.current!);
          cooldownTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (state.step === "emailVerification") {
      startResendCooldown(60);
    } else {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
      setResendCooldown(0);
    }
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, [state.step]);
  // ─────────────────────────────────────────────────────────────────────────

  const handleFieldValueChange = (field: LoginField, value: string) => {
    setFieldValue(field, value);

    if (field === "city" && value !== state.values.city && state.values.area) {
      dispatch({ type: "SET_FIELD", field: "area", value: "" });
    }
  };

  const setFieldError = (field: LoginField, value: string) => {
    dispatch({ type: "SET_ERROR", field, error: value });
  };

  const validateField = (field: LoginField): string => {
    return validateLoginField(
      field,
      state.values,
      state.mode === "signUp",
      validationMessages,
    );
  };

  const validateForSubmit = (): LoginFormErrors => {
    return validateLoginForm(
      state.values,
      state.mode === "signUp",
      validationMessages,
    );
  };

  const canSubmit = (() => {
    if (state.isLoading) {
      return false;
    }

    if (state.step === "twoFactor") {
      return normalizeTwoFactorCode(state.twoFactorCode).length === 6;
    }

    if (state.mode === "signIn") {
      return (
        state.values.identifier.trim() !== "" && state.values.password !== ""
      );
    }

    const validationErrors = validateForSubmit();
    return Object.values(validationErrors).every((value) => value === "");
  })();

  const cityOptions = cityNames.map((cityName) => ({
    value: cityName,
    label: cityName,
  }));

  const areaOptions = areaNames.map((areaName) => ({
    value: areaName,
    label: areaName,
  }));

  const finalizeAuthenticatedLogin = async (fallbackUser: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    city?: string;
    area?: string;
    cityId?: number;
    areaId?: number;
    avatar?: string;
    joinedDate?: string;
    role?: "user" | "admin";
    hasAdminAccess?: boolean;
    permissions?: string[];
  }) => {
    localStorage.removeItem("tijarahjo_logged_out");
    persistAuthSessionHint();

    // We already have a valid session cookie from the login/signup response.
    // Sync the context state immediately to prevent AuthRouteElements from unmounting
    // us prematurely, and prevent race conditions with checkAuth.
    // Optionally fetch the extended user metadata if needed.
    let finalUser = fallbackUser;

    try {
      const currentUserResponse = await api.auth.getCurrentUser();
      if (currentUserResponse.success && currentUserResponse.data) {
        const authenticatedUser = typeof currentUserResponse.data === "object" && currentUserResponse.data !== null
          ? (currentUserResponse.data as Record<string, unknown>)
          : null;

        if (authenticatedUser) {
           finalUser = {
             ...fallbackUser,
             id: readAuthString(authenticatedUser, "Id", "id", "UserID", "userID") || fallbackUser.id,
             firstName: readAuthString(authenticatedUser, "FirstName", "firstName") || fallbackUser.firstName,
             lastName: readAuthString(authenticatedUser, "LastName", "lastName") || fallbackUser.lastName,
             email: readAuthString(authenticatedUser, "Email", "email") || fallbackUser.email,
             phone: readAuthString(authenticatedUser, "Phone", "phone") || fallbackUser.phone,
             city: readAuthString(authenticatedUser, "City", "city") || fallbackUser.city,
             area: readAuthString(authenticatedUser, "Area", "area") || fallbackUser.area,
             cityId:
               readAuthPositiveInt(authenticatedUser, "CityId", "cityId") ??
               fallbackUser.cityId,
             areaId:
               readAuthPositiveInt(authenticatedUser, "AreaId", "areaId") ??
               fallbackUser.areaId,
             avatar: readAuthString(authenticatedUser, "Avatar", "avatar") || fallbackUser.avatar,
             joinedDate: formatJoinedDateLabel(
               readAuthString(authenticatedUser, "JoinedDate", "joinedDate", "JoinDate", "joinDate") || fallbackUser.joinedDate,
               language,
             ),
             role: resolveLoginRole(authenticatedUser) || fallbackUser.role,
             hasAdminAccess:
               resolveHasAdminAccessFromPayload(authenticatedUser) ||
               fallbackUser.hasAdminAccess,
             permissions:
               readAuthPermissions(authenticatedUser).length > 0
                 ? readAuthPermissions(authenticatedUser)
                 : (fallbackUser.permissions ?? []),
           };
        }
      }
    } catch(err) {
      // Ignore non-critical fetch errors, login already succeeded on backend
    }

    setSession({
      id: finalUser.id || "",
      email: finalUser.email || "",
      name: `${finalUser.firstName || ""} ${finalUser.lastName || ""}`.trim() || finalUser.email,
      firstName: finalUser.firstName,
      lastName: finalUser.lastName,
      avatar: finalUser.avatar,
      role: finalUser.role || "user",
      hasAdminAccess: finalUser.hasAdminAccess,
      permissions: finalUser.permissions,
    });

    onLogin({
      id: finalUser.id,
      firstName: finalUser.firstName,
      lastName: finalUser.lastName,
      email: finalUser.email,
      phone: finalUser.phone,
      city: finalUser.city,
      area: finalUser.area,
      cityId: finalUser.cityId,
      areaId: finalUser.areaId,
      avatar: finalUser.avatar,
      joinedDate: finalUser.joinedDate,
      role: finalUser.role,
      hasAdminAccess: finalUser.hasAdminAccess,
      permissions: finalUser.permissions,
    });
  };

  const handleSignUp = async () => {
    const parsedIdentifier = parseAuthIdentifier(state.values.identifier);
    const normalizedPhone = normalizeJordanPhone(state.values.phone);
    const normalizedCity = state.values.city.trim();
    const normalizedArea = state.values.area.trim();

    if (!parsedIdentifier.email) {
      setFieldError("identifier", validationMessages.emailInvalid);
      dispatch({
        type: "SET_GENERAL_ERROR",
        error: copy.errors.signUpIdentifierMustBeEmail,
      });
      return;
    }

    if (!normalizedPhone) {
      setFieldError("phone", validationMessages.phoneInvalid);
      dispatch({
        type: "SET_GENERAL_ERROR",
        error: copy.errors.signUpInvalidPhonePrompt,
      });
      return;
    }

    if (!normalizedCity) {
      setFieldError("city", validationMessages.cityRequired);
      dispatch({
        type: "SET_GENERAL_ERROR",
        error: copy.errors.signUpCityRequiredPrompt,
      });
      return;
    }

    if (!normalizedArea) {
      setFieldError("area", validationMessages.areaRequired);
      dispatch({
        type: "SET_GENERAL_ERROR",
        error: copy.errors.signUpAreaRequiredPrompt,
      });
      return;
    }

    const response = await api.auth.signup({
      email: parsedIdentifier.email || "",
      password: state.values.password,
      firstName: state.values.firstName.trim(),
      lastName: state.values.lastName.trim(),
      phone: normalizedPhone,
      city: normalizedCity,
      area: normalizedArea,
      avatar: avatarPreview?.startsWith("http") ? avatarPreview : undefined,
    });

    if (!response.success) {
      const baseMessage = extractErrorMessage(
        response,
        copy.errors.registrationFailedFallback,
        backendConnectionMessage,
      );
      const finalMessage = appendDuplicateAccountHint(
        baseMessage,
        copy.errors.duplicateHintSuffix,
      );

      // If the error is specifically about a duplicate phone number, highlight
      // the phone field so the user immediately knows which field to correct.
      const lowerMessage = finalMessage.toLowerCase();
      if (
        lowerMessage.includes("phone number") &&
        (lowerMessage.includes("already exists") || lowerMessage.includes("already registered") || lowerMessage.includes("already in use"))
      ) {
        setFieldError(
          "phone",
          language === "ar"
            ? "رقم الهاتف مستخدم بالفعل. يرجى استخدام رقم مختلف أو تسجيل الدخول."
            : "This phone number is already registered. Please use a different number or sign in.",
        );
      }

      dispatch({
        type: "SET_GENERAL_ERROR",
        error: finalMessage,
      });
      return;
    }

    // Signup succeeded but email verification is required — show verification panel.
    // Persist the selected avatar (as a data URL) to sessionStorage so that
    // VerifyEmailPage can upload it after the user clicks the verification link
    // and is auto-logged in. Without this the avatar is lost when the user
    // navigates away to check their email.
    if (response.requiresEmailVerification) {
      if (avatarFile && avatarPreview && avatarPreview.startsWith("data:")) {
        try {
          sessionStorage.setItem("pending_signup_avatar", avatarPreview);
        } catch {
          // sessionStorage may be full or unavailable — silently ignore.
        }
      } else {
        sessionStorage.removeItem("pending_signup_avatar");
      }
      dispatch({
        type: "ENTER_EMAIL_VERIFICATION",
        email: parsedIdentifier.email || state.values.identifier.trim(),
        message: response.message || (language === "ar"
          ? "تم إنشاء حسابك. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب."
          : "Account created. Please check your email to verify your account."),
      });
      return;
    }

    let user = response.user;
    if (user?.id && avatarFile) {
      try {
        const uploadRes = await api.users.uploadAvatar(user.id, avatarFile);
        user = { ...user, avatar: uploadRes.avatarUrl };
      } catch (err) {
        debugError("Failed to upload avatar", err);
      }
    }

    await finalizeAuthenticatedLogin({
      id: user?.id,
      firstName: user?.firstName || state.values.firstName.trim(),
      lastName: user?.lastName || state.values.lastName.trim(),
      email:
        user?.email || parsedIdentifier.email || state.values.identifier.trim(),
      phone: user?.phone || normalizedPhone,
      city: user?.city || normalizedCity,
      area: user?.area || normalizedArea,
      avatar: user?.avatar,
      joinedDate: user?.joinedDate,
      role: resolveLoginRole(user),
      hasAdminAccess: resolveHasAdminAccessFromPayload(user),
      permissions: readAuthPermissions(user),
    });
  };

  const handleSignIn = async () => {
    const response = await api.auth.login({
      email: state.values.identifier.trim(),
      password: state.values.password,
    });

    if (!response.success) {
      // Check if login failed because email is not verified
      if (response.requiresEmailVerification) {
        dispatch({
          type: "ENTER_EMAIL_VERIFICATION",
          email: state.values.identifier.trim(),
          message: response.message || (language === "ar"
            ? "يرجى التحقق من بريدك الإلكتروني قبل تسجيل الدخول."
            : "Please verify your email address before logging in."),
        });
        return;
      }

      const message = extractErrorMessage(
        response,
        copy.errors.loginFailedFallback,
        backendConnectionMessage,
      );
      dispatch({ type: "SET_GENERAL_ERROR", error: message });
      return;
    }

    if (response.requiresTwoFactor) {
      if (!response.twoFactorToken) {
        dispatch({
          type: "SET_GENERAL_ERROR",
          error: copy.errors.twoFactorSessionExpired,
        });
        return;
      }

      dispatch({
        type: "ENTER_TWO_FACTOR",
        token: response.twoFactorToken,
        message: response.message || copy.errors.twoFactorRequiredPrompt,
      });
      return;
    }

    const user = response.user;
    await finalizeAuthenticatedLogin({
      id: user?.id,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || state.values.identifier.trim(),
      phone: user?.phone || "",
      city: user?.city || "",
      area: user?.area || "",
      avatar: user?.avatar,
      joinedDate: user?.joinedDate,
      role: resolveLoginRole(user),
      hasAdminAccess: resolveHasAdminAccessFromPayload(user),
      permissions: readAuthPermissions(user),
    });
  };

  const handleTwoFactorVerification = async () => {
    const normalizedCode = normalizeTwoFactorCode(state.twoFactorCode);
    if (normalizedCode.length !== 6) {
      dispatch({
        type: "SET_GENERAL_ERROR",
        error: copy.errors.twoFactorCodeInvalid,
      });
      return;
    }

    if (!state.twoFactorToken.trim()) {
      dispatch({
        type: "SET_GENERAL_ERROR",
        error: copy.errors.twoFactorSessionExpired,
      });
      return;
    }

    const response = await api.auth.verifyTwoFactorLogin(
      state.twoFactorToken,
      normalizedCode,
    );

    if (!response.success) {
      const message = extractErrorMessage(
        response,
        copy.errors.twoFactorCodeInvalid,
        backendConnectionMessage,
      );
      dispatch({ type: "SET_GENERAL_ERROR", error: message });
      return;
    }

    if (response.requiresTwoFactor) {
      dispatch({
        type: "SET_GENERAL_ERROR",
        error: copy.errors.twoFactorSessionExpired,
      });
      return;
    }

    const user = response.user;
    await finalizeAuthenticatedLogin({
      id: user?.id,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || state.values.identifier.trim(),
      phone: user?.phone || "",
      city: user?.city || "",
      area: user?.area || "",
      avatar: user?.avatar,
      joinedDate: user?.joinedDate,
      role: resolveLoginRole(user),
      hasAdminAccess: resolveHasAdminAccessFromPayload(user),
      permissions: readAuthPermissions(user),
    });
  };

  const handleResendTwoFactor = async () => {
    if (
      state.isLoading ||
      isResendingTwoFactor ||
      !state.values.identifier.trim() ||
      !state.values.password
    ) {
      return;
    }

    setIsResendingTwoFactor(true);
    dispatch({ type: "SET_GENERAL_ERROR", error: "" });

    try {
      const response = await api.auth.login({
        email: state.values.identifier.trim(),
        password: state.values.password,
      });

      if (!response.success) {
        const message = extractErrorMessage(
          response,
          copy.errors.loginFailedFallback,
          backendConnectionMessage,
        );
        dispatch({ type: "SET_GENERAL_ERROR", error: message });
        return;
      }

      if (response.requiresTwoFactor) {
        if (!response.twoFactorToken) {
          dispatch({
            type: "SET_GENERAL_ERROR",
            error: copy.errors.twoFactorSessionExpired,
          });
          return;
        }

        dispatch({
          type: "ENTER_TWO_FACTOR",
          token: response.twoFactorToken,
          message: response.message || copy.errors.twoFactorRequiredPrompt,
        });
        return;
      }

      const user = response.user;
      await finalizeAuthenticatedLogin({
        id: user?.id,
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || state.values.identifier.trim(),
        phone: user?.phone || "",
        city: user?.city || "",
        area: user?.area || "",
        avatar: user?.avatar,
        joinedDate: user?.joinedDate,
        role: resolveLoginRole(user),
        hasAdminAccess: resolveHasAdminAccessFromPayload(user),
        permissions: readAuthPermissions(user),
      });
    } catch (error) {
      dispatch({
        type: "SET_GENERAL_ERROR",
        error: toExceptionMessage(
          error,
          copy.errors.unexpected,
          backendConnectionMessage,
        ),
      });
    } finally {
      setIsResendingTwoFactor(false);
    }
  };

  const handleGoogleAuth = () => {
    if (!googleAuthEnabled) {
      dispatch({
        type: "SET_GENERAL_ERROR",
        error: copy.errors.googleAuthFailedFallback,
      });
      return;
    }

    dispatch({ type: "SET_GENERAL_ERROR", error: "" });
    // Clear the logged-out flag so checkAuth will detect the new JWT
    // session when Google OAuth redirects back to the frontend.
    localStorage.removeItem("tijarahjo_logged_out");
    // Ensure the frontend probes the backend for the session upon return
    localStorage.setItem("tijarahjo_has_authenticated", "true");

    const authModeStr = state.mode === "signUp" ? "signup" : "login";
    window.location.assign(api.auth.getGoogleAuthStartUrl(authModeStr));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (state.isLoading || submitInFlightRef.current) {
      return;
    }

    if (state.step === "twoFactor") {
      submitInFlightRef.current = true;
      dispatch({ type: "START_LOADING" });
      try {
        await handleTwoFactorVerification();
      } catch (error) {
        dispatch({
          type: "SET_GENERAL_ERROR",
          error: toExceptionMessage(
            error,
            copy.errors.twoFactorCodeInvalid,
            backendConnectionMessage,
          ),
        });
      } finally {
        submitInFlightRef.current = false;
        dispatch({ type: "STOP_LOADING" });
      }
      return;
    }

    const validationErrors = validateForSubmit();
    dispatch({ type: "SET_ERRORS", errors: validationErrors });

    const hasValidationErrors = Object.values(validationErrors).some(
      (value) => value !== "",
    );

    if (hasValidationErrors) {
      dispatch({ type: "SET_GENERAL_ERROR", error: "" });
      return;
    }

    submitInFlightRef.current = true;
    dispatch({ type: "START_LOADING" });
    try {
      if (state.mode === "signUp") {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } catch (error) {
      dispatch({
        type: "SET_GENERAL_ERROR",
        error: toExceptionMessage(
          error,
          copy.errors.unexpected,
          backendConnectionMessage,
        ),
      });
    } finally {
      submitInFlightRef.current = false;
      dispatch({ type: "STOP_LOADING" });
    }
  };

  const toggleAuthMode = () => {
    if (!allowSignup && state.mode === "signIn") {
      return;
    }
    dispatch({
      type: "SET_MODE",
      mode: state.mode === "signUp" ? "signIn" : "signUp",
    });
  };

  const handleFieldFocus = (field: LoginField) => {
    dispatch({ type: "SET_FOCUSED_FIELD", field });
  };

  const handleFieldBlur = (field: LoginField) => {
    dispatch({ type: "SET_FOCUSED_FIELD", field: null });
    if (field === "password" && state.mode === "signIn") {
      return;
    }

    setFieldError(field, validateField(field));
  };

  const handleCancelTwoFactor = () => {
    dispatch({ type: "CANCEL_TWO_FACTOR" });
  };

  const handleCancelEmailVerification = () => {
    dispatch({ type: "CANCEL_EMAIL_VERIFICATION" });
  };

  const handleResendVerification = async () => {
    if (isResendingVerification || resendCooldown > 0 || !state.emailVerificationEmail) {
      return;
    }

    setIsResendingVerification(true);
    dispatch({ type: "SET_GENERAL_ERROR", error: "" });

    try {
      const result = await api.auth.resendVerificationEmail(
        state.emailVerificationEmail,
      );
      dispatch({
        type: "SET_GENERAL_ERROR",
        error: result.message || (language === "ar"
          ? "تم إرسال رابط التحقق إلى بريدك الإلكتروني."
          : "A verification link has been sent to your email."),
      });
      // Restart the 60-second cooldown after a successful resend
      startResendCooldown(60);
    } catch {
      dispatch({
        type: "SET_GENERAL_ERROR",
        error: language === "ar"
          ? "تعذر إرسال بريد التحقق. حاول مرة أخرى."
          : "Failed to resend verification email. Please try again.",
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      dispatch({
        type: "SET_GENERAL_ERROR",
        error: language === "ar"
          ? "حجم الملف كبير جداً. الحد الأقصى هو 10 ميغابايت."
          : "File size too large. Maximum size is 10MB.",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      dispatch({
        type: "SET_GENERAL_ERROR",
        error: language === "ar"
          ? "الرجاء اختيار صورة صالحة (JPG, PNG, GIF)."
          : "Please select an image file (JPG, PNG, or GIF).",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(String(reader.result || ""));
      setAvatarFile(file);
    };
    reader.readAsDataURL(file);
  };

  const formComponent = (
    <>
      <input
        id="auth-avatar-upload"
        name="avatar"
        aria-label={copy.form.uploadPhotoOptional}
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleAvatarUpload}
        accept="image/*"
      />
      <LoginForm
        language={language}
        isSignUp={state.mode === "signUp"}
      showGoogleAuth={googleAuthEnabled}
      isLoading={state.isLoading}
      generalError={state.generalError}
      canSubmit={canSubmit}
        values={state.values}
        errors={state.errors}
        cityOptions={cityOptions}
        isLoadingCities={isLoadingCities}
        areaOptions={areaOptions}
        isAreaDisabled={!state.values.city || isLoadingAreas || areaOptions.length === 0}
        copy={copy}
      focusedField={state.focusedField}
      showPassword={state.showPassword}
      showConfirmPassword={state.showConfirmPassword}
      isTwoFactorStep={state.step === "twoFactor"}
      twoFactorCode={state.twoFactorCode}
      onSubmit={handleSubmit}
      onToggleAuthMode={toggleAuthMode}
      onForgotPassword={() => {
        if (isModal) {
          onSuccess?.();
        }
        navigate("/forgot-password");
      }}
      onContinueWithGoogle={handleGoogleAuth}
      onContinueAsGuest={onContinueAsGuest}
      onCancelTwoFactor={handleCancelTwoFactor}
      onResendTwoFactor={handleResendTwoFactor}
      isResendingTwoFactor={isResendingTwoFactor}
      onTwoFactorCodeChange={(value) =>
        dispatch({
          type: "SET_TWO_FACTOR_CODE",
          code: normalizeTwoFactorCode(value),
        })
      }
        onFieldChange={handleFieldValueChange}
      onFieldFocus={handleFieldFocus}
      onFieldBlur={handleFieldBlur}
      onTogglePasswordVisibility={() => dispatch({ type: "TOGGLE_PASSWORD" })}
      onToggleConfirmPasswordVisibility={() =>
        dispatch({ type: "TOGGLE_CONFIRM_PASSWORD" })
      }
      avatarPreview={avatarPreview}
      onAvatarClick={() => fileInputRef.current?.click()}
      isModal={isModal}
      isEmailVerificationStep={state.step === "emailVerification"}
      emailVerificationEmail={state.emailVerificationEmail}
      onCancelEmailVerification={handleCancelEmailVerification}
      onResendVerificationEmail={handleResendVerification}
      isResendingVerification={isResendingVerification}
      resendCooldown={resendCooldown}
      allowSignup={allowSignup}
    />
    </>
  );

  if (isModal) {
    return formComponent;
  }

  return (
    <PageShell tone="account">
      {formComponent}
    </PageShell>
  );
}
