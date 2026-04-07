import { FormEvent, useState } from "react";
import { AlertCircle, CheckCircle2, KeyRound, Lock, Mail } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { api } from "../../../services/api";
import type { Language } from "../../../types";
import { Alert, AlertDescription } from "../../../shared/ui/alert";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { Label } from "../../../shared/ui/label";
import { PageShell } from "../../../shared/ui/page-shell";
import { SubpageHeader } from "../../../shared/ui/subpage-header";
import { AuthPageLayout } from "../components/AuthPageLayout";
import {
  buildCurrentPath,
  resolveBackPathFromLocationState,
} from "../../../shared/lib/backNavigation";

interface ForgotPasswordPageProps {
  language: Language;
}

type ResetStep = "request" | "confirm" | "complete";

type ForgotPasswordCopy = {
  title: string;
  subtitle: string;
  emailLabel: string;
  emailPlaceholder: string;
  codeLabel: string;
  codePlaceholder: string;
  newPasswordLabel: string;
  newPasswordPlaceholder: string;
  confirmPasswordLabel: string;
  confirmPasswordPlaceholder: string;
  sendCode: string;
  sendingCode: string;
  resetPassword: string;
  resettingPassword: string;
  backToLogin: string;
  codeSentHint: string;
  successTitle: string;
  successBody: string;
  errors: {
    backendConnection: string;
    emailRequired: string;
    emailInvalid: string;
    codeRequired: string;
    passwordRequired: string;
    passwordMinLength: string;
    passwordMismatch: string;
    requestFailed: string;
    confirmFailed: string;
  };
};

const forgotPasswordCopyByLanguage: Record<Language, ForgotPasswordCopy> = {
  en: {
    title: "Reset your password",
    subtitle: "We will send a verification code to your email.",
    emailLabel: "Email address",
    emailPlaceholder: "name@example.com",
    codeLabel: "Verification code",
    codePlaceholder: "6-digit code",
    newPasswordLabel: "New password",
    newPasswordPlaceholder: "Enter new password",
    confirmPasswordLabel: "Confirm new password",
    confirmPasswordPlaceholder: "Re-enter new password",
    sendCode: "Send verification code",
    sendingCode: "Sending code...",
    resetPassword: "Reset password",
    resettingPassword: "Resetting password...",
    backToLogin: "Back to sign in",
    codeSentHint:
      "If an account exists for this email, a verification code has been sent.",
    successTitle: "Password updated",
    successBody: "Your password has been reset. You can now sign in.",
    errors: {
      backendConnection: "Unable to connect to the server. Please try again later.",
      emailRequired: "Email is required.",
      emailInvalid: "Enter a valid email address.",
      codeRequired: "Verification code is required.",
      passwordRequired: "New password is required.",
      passwordMinLength: "Password must be at least 8 characters.",
      passwordMismatch: "Passwords do not match.",
      requestFailed: "Could not send a verification code. Please try again.",
      confirmFailed: "Could not reset password. Please check your code.",
    },
  },
  ar: {
    title: "إعادة تعيين كلمة المرور",
    subtitle: "سنرسل رمز تحقق إلى بريدك الإلكتروني.",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "name@example.com",
    codeLabel: "رمز التحقق",
    codePlaceholder: "رمز مكوّن من 6 أرقام",
    newPasswordLabel: "كلمة المرور الجديدة",
    newPasswordPlaceholder: "أدخل كلمة المرور الجديدة",
    confirmPasswordLabel: "تأكيد كلمة المرور الجديدة",
    confirmPasswordPlaceholder: "أعد إدخال كلمة المرور الجديدة",
    sendCode: "إرسال رمز التحقق",
    sendingCode: "جارٍ إرسال الرمز...",
    resetPassword: "إعادة تعيين كلمة المرور",
    resettingPassword: "جارٍ إعادة التعيين...",
    backToLogin: "العودة إلى تسجيل الدخول",
    codeSentHint:
      "إذا كان هناك حساب مرتبط بهذا البريد، فسيتم إرسال رمز تحقق إليه.",
    successTitle: "تم تحديث كلمة المرور",
    successBody: "تمت إعادة تعيين كلمة المرور. يمكنك تسجيل الدخول الآن.",
    errors: {
      backendConnection: "فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.",
      emailRequired: "البريد الإلكتروني مطلوب.",
      emailInvalid: "أدخل بريدًا إلكترونيًا صالحًا.",
      codeRequired: "رمز التحقق مطلوب.",
      passwordRequired: "كلمة المرور الجديدة مطلوبة.",
      passwordMinLength: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
      passwordMismatch: "كلمتا المرور غير متطابقتين.",
      requestFailed: "تعذر إرسال رمز التحقق. حاول مرة أخرى.",
      confirmFailed: "تعذر إعادة تعيين كلمة المرور. تحقق من الرمز.",
    },
  },
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage({ language }: ForgotPasswordPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const copy = forgotPasswordCopyByLanguage[language];
  const isRTL = language === "ar";
  const currentPath = buildCurrentPath(location.pathname, location.search);
  const backPath = resolveBackPathFromLocationState({
    locationState: location.state,
    currentPath,
    fallbackPath: "/login",
    blockedPathnames: ["/forgot-password"],
  });
  const iconPositionClass = isRTL ? "right-3" : "left-3";
  const inputPaddingClass = "ps-9";

  const [step, setStep] = useState<ResetStep>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRequestLoading, setIsRequestLoading] = useState(false);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const backendConnectionMessage = copy.errors.backendConnection;

  const validateEmail = (): string => {
    const normalized = email.trim();
    if (!normalized) {
      return copy.errors.emailRequired;
    }

    if (!emailPattern.test(normalized)) {
      return copy.errors.emailInvalid;
    }

    return "";
  };

  const handleRequestCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    const emailError = validateEmail();
    if (emailError) {
      setErrorMessage(emailError);
      return;
    }

    setIsRequestLoading(true);
    try {
      const result = await api.auth.requestPasswordReset(email.trim());
      if (!result.success) {
        setErrorMessage(
          result.message ||
            (result.error?.code === "CONNECTION_REFUSED"
              ? backendConnectionMessage
              : copy.errors.requestFailed),
        );
        return;
      }

      setStep("confirm");
      setInfoMessage(result.message || copy.codeSentHint);
    } catch {
      setErrorMessage(copy.errors.requestFailed);
    } finally {
      setIsRequestLoading(false);
    }
  };

  const handleConfirmReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    const emailError = validateEmail();
    if (emailError) {
      setErrorMessage(emailError);
      return;
    }

    if (!code.trim()) {
      setErrorMessage(copy.errors.codeRequired);
      return;
    }

    if (!newPassword) {
      setErrorMessage(copy.errors.passwordRequired);
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(copy.errors.passwordMinLength);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(copy.errors.passwordMismatch);
      return;
    }

    setIsConfirmLoading(true);
    try {
      const result = await api.auth.confirmPasswordReset(
        email.trim(),
        code.trim(),
        newPassword,
      );

      if (!result.success) {
        setErrorMessage(
          result.message ||
            (result.error?.code === "CONNECTION_REFUSED"
              ? backendConnectionMessage
              : copy.errors.confirmFailed),
        );
        return;
      }

      setStep("complete");
      setInfoMessage(result.message || copy.successBody);
    } catch {
      setErrorMessage(copy.errors.confirmFailed);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  return (
    <PageShell tone="account">
      <SubpageHeader
        onBack={() => navigate(backPath, { replace: true })}
        isRTL={isRTL}
        backLabel={copy.backToLogin}
        onLogoClick={() => navigate("/")}
      />
        <AuthPageLayout
          direction={isRTL ? "rtl" : "ltr"}
          title={copy.title}
          subtitle={copy.subtitle}
          footer={
            step !== "complete" ? (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copy.backToLogin}
                </button>
              </div>
            ) : undefined
          }
        >
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
              </Alert>
            )}

            {infoMessage && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-sm">{infoMessage}</AlertDescription>
              </Alert>
            )}

            {step === "request" && (
              <form className="space-y-4" onSubmit={handleRequestCode} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="reset-email">{copy.emailLabel}</Label>
                  <div className="relative">
                    <Mail
                      className={`pointer-events-none absolute ${iconPositionClass} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`}
                    />
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={copy.emailPlaceholder}
                      autoComplete="email"
                      className={inputPaddingClass}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11" disabled={isRequestLoading}>
                  {isRequestLoading ? copy.sendingCode : copy.sendCode}
                </Button>
              </form>
            )}

            {step === "confirm" && (
              <form className="space-y-4" onSubmit={handleConfirmReset} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="confirm-email">{copy.emailLabel}</Label>
                  <div className="relative">
                    <Mail
                      className={`pointer-events-none absolute ${iconPositionClass} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`}
                    />
                    <Input
                      id="confirm-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={copy.emailPlaceholder}
                      autoComplete="email"
                      className={inputPaddingClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verification-code">{copy.codeLabel}</Label>
                  <div className="relative">
                    <KeyRound
                      className={`pointer-events-none absolute ${iconPositionClass} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`}
                    />
                    <Input
                      id="verification-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={code}
                      onChange={(event) => setCode(event.target.value)}
                      placeholder={copy.codePlaceholder}
                      autoComplete="one-time-code"
                      className={inputPaddingClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">{copy.newPasswordLabel}</Label>
                  <div className="relative">
                    <Lock
                      className={`pointer-events-none absolute ${iconPositionClass} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`}
                    />
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder={copy.newPasswordPlaceholder}
                      autoComplete="new-password"
                      className={inputPaddingClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">
                    {copy.confirmPasswordLabel}
                  </Label>
                  <div className="relative">
                    <Lock
                      className={`pointer-events-none absolute ${iconPositionClass} top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground`}
                    />
                    <Input
                      id="confirm-new-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder={copy.confirmPasswordPlaceholder}
                      autoComplete="new-password"
                      className={inputPaddingClass}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-11" disabled={isConfirmLoading}>
                  {isConfirmLoading ? copy.resettingPassword : copy.resetPassword}
                </Button>
              </form>
            )}

            {step === "complete" && (
              <div className="space-y-4 text-center">
                <h2 className="text-lg text-foreground">{copy.successTitle}</h2>
                <p className="text-sm text-muted-foreground">{copy.successBody}</p>
                <Button
                  type="button"
                  className="w-full h-11"
                  onClick={() => navigate("/login")}
                >
                  {copy.backToLogin}
                </Button>
              </div>
            )}

        </AuthPageLayout>
      </PageShell>
    );
  }
