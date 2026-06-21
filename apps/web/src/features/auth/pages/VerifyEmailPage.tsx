import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react";

import { api } from "../../../services/api";
import type { Language } from "../../../types";
import { Alert, AlertDescription } from "../../../shared/ui/alert";
import { Button } from "../../../shared/ui/button";
import { PageShell } from "../../../shared/ui/page-shell";
import { AuthPageLayout } from "../components/AuthPageLayout";
import { useAuth } from "../../../contexts/AuthContext";
import { resolveHasAdminAccessFromPayload } from "../../../contexts/authUtils";
import {
  resolveLoginRole,
  readAuthPermissions,
} from "./loginAuthHelpers";

interface VerifyEmailPageProps {
  language: Language;
  onLogin?: (userData: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    city?: string;
    area?: string;
    avatar?: string;
    role?: "user" | "admin";
    hasAdminAccess?: boolean;
    permissions?: string[];
  }) => void;
}

type VerifyStep = "verifying" | "success" | "autologin" | "error";

type VerifyEmailCopy = {
  verifyingTitle: string;
  verifyingSubtitle: string;
  successTitle: string;
  successBody: string;
  successBodyAutoLogin: string;
  errorTitle: string;
  errorBody: string;
  goToLogin: string;
  resendVerification: string;
  resending: string;
  resendSuccess: string;
  noTokenError: string;
};

const verifyEmailCopyByLanguage: Record<Language, VerifyEmailCopy> = {
  en: {
    verifyingTitle: "Verifying your email",
    verifyingSubtitle: "Please wait while we verify your email address...",
    successTitle: "Email verified!",
    successBody:
      "Your email address has been verified. You can now sign in to your account.",
    successBodyAutoLogin: "Your email has been verified. Taking you to your account...",
    errorTitle: "Verification failed",
    errorBody:
      "The verification link may have expired or is invalid. Please try requesting a new one.",
    goToLogin: "Go to sign in",
    resendVerification: "Resend verification email",
    resending: "Sending...",
    resendSuccess:
      "If an account exists with this email, a verification link has been sent.",
    noTokenError: "No verification token found. Please check your email link.",
  },
  ar: {
    verifyingTitle: "جارٍ التحقق من بريدك الإلكتروني",
    verifyingSubtitle:
      "يرجى الانتظار بينما نتحقق من عنوان بريدك الإلكتروني...",
    successTitle: "تم التحقق من البريد الإلكتروني!",
    successBody:
      "تم التحقق من عنوان بريدك الإلكتروني. يمكنك الآن تسجيل الدخول إلى حسابك.",
    successBodyAutoLogin: "تم التحقق من بريدك الإلكتروني. جارٍ تحويلك إلى حسابك...",
    errorTitle: "فشل التحقق",
    errorBody:
      "قد يكون رابط التحقق منتهي الصلاحية أو غير صالح. يرجى طلب رابط جديد.",
    goToLogin: "الذهاب إلى تسجيل الدخول",
    resendVerification: "إعادة إرسال بريد التحقق",
    resending: "جارٍ الإرسال...",
    resendSuccess:
      "إذا كان هناك حساب مرتبط بهذا البريد الإلكتروني، فقد تم إرسال رابط التحقق.",
    noTokenError:
      "لم يتم العثور على رمز التحقق. يرجى التحقق من رابط البريد الإلكتروني.",
  },
};

export function VerifyEmailPage({ language, onLogin }: VerifyEmailPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const copy = verifyEmailCopyByLanguage[language];
  const isRTL = language === "ar";
  const { setSession } = useAuth();

  const [step, setStep] = useState<VerifyStep>("verifying");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendEmail, setResendEmail] = useState(() => searchParams.get("email") || "");
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verifiedRef = useRef(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const token = searchParams.get("token") || "";

  const startCooldown = (seconds = 60) => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(seconds);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);
  useEffect(() => () => { if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current); }, []);

  useEffect(() => {
    if (verifiedRef.current) {
      return;
    }
    verifiedRef.current = true;

    if (!token) {
      setStep("error");
      setErrorMessage(copy.noTokenError);
      return;
    }

    const verify = async () => {
      try {
        const result = await api.auth.verifyEmail(token);
        if (result.success) {
          // Backend returned user data + JWT cookie — log them in immediately.
          if (result.user?.id || result.user?.email) {
            const userData = {
              id: result.user.id,
              firstName: result.user.firstName || "",
              lastName: result.user.lastName || "",
              email: result.user.email || "",
              phone: result.user.phone,
              city: result.user.city,
              area: result.user.area,
              avatar: result.user.avatar,
              role: resolveLoginRole(result.user),
              hasAdminAccess: resolveHasAdminAccessFromPayload(result.user),
              permissions: readAuthPermissions(result.user),
            };

            setSession({
              id: userData.id || "",
              email: userData.email,
              name: `${userData.firstName} ${userData.lastName}`.trim() || userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              avatar: userData.avatar,
              role: userData.role || "user",
              hasAdminAccess: userData.hasAdminAccess,
              permissions: userData.permissions,
            });

            onLogin?.(userData);

            setStep("autologin");
            setMessage(copy.successBodyAutoLogin);

            // Navigate to home after a short pause so the success state is visible.
            redirectTimerRef.current = setTimeout(() => navigate("/", { replace: true }), 1200);
          } else {
            // Fallback: verified but no JWT (e.g. role resolution failed on backend).
            setStep("success");
            setMessage(result.message || copy.successBody);
          }
        } else {
          setStep("error");
          setErrorMessage(result.message || copy.errorBody);
        }
      } catch {
        setStep("error");
        setErrorMessage(copy.errorBody);
      }
    };

    void verify();
  }, [token, copy.noTokenError, copy.successBody, copy.successBodyAutoLogin, copy.errorBody, navigate, onLogin, setSession]);

  const handleResend = async () => {
    if (isResending || resendCooldown > 0) {
      return;
    }

    const emailToSend = resendEmail.trim().toLowerCase();
    if (!emailToSend) {
      setErrorMessage(
        language === "ar"
          ? "يرجى إدخال عنوان بريدك الإلكتروني لإعادة الإرسال."
          : "Please enter your email address to resend the verification link.",
      );
      return;
    }

    setIsResending(true);
    setErrorMessage("");

    try {
      const result = await api.auth.resendVerificationEmail(emailToSend);
      setMessage(result.message || copy.resendSuccess);
      startCooldown(60);
    } catch {
      setErrorMessage(copy.errorBody);
    } finally {
      setIsResending(false);
    }
  };


  return (
    <PageShell tone="account">
      <AuthPageLayout
        direction={isRTL ? "rtl" : "ltr"}
        title={
          step === "verifying"
            ? copy.verifyingTitle
            : step === "success" || step === "autologin"
              ? copy.successTitle
              : copy.errorTitle
        }
        subtitle={step === "verifying" ? copy.verifyingSubtitle : undefined}
        footer={
          step !== "autologin" ? (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {copy.goToLogin}
              </button>
            </div>
          ) : undefined
        }
      >
        {step === "verifying" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}

        {(step === "success" || step === "autologin") && (
          <div className="space-y-6">
            {message && (
              <Alert className="border-green-500/30 bg-green-500/5 px-3 py-2.5 shadow-none">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription
                  className="text-sm font-medium text-foreground"
                  dir="auto"
                >
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                {step === "autologin" ? (
                  <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                )}
              </div>
            </div>

            {step === "success" && (
              <Button
                type="button"
                className="w-full h-11"
                onClick={() => navigate("/login")}
              >
                {copy.goToLogin}
              </Button>
            )}
          </div>
        )}

        {step === "error" && (
          <div className="space-y-6">
            {errorMessage && (
              <Alert
                variant="destructive"
                className="border-destructive/30 bg-destructive/5 px-3 py-2.5 shadow-none [&>svg]:text-destructive"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription
                  className="text-sm font-medium text-destructive"
                  dir="auto"
                >
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="border-primary/30 bg-primary/5 px-3 py-2.5 shadow-none">
                <Mail className="h-4 w-4 text-primary" />
                <AlertDescription
                  className="text-sm font-medium text-foreground"
                  dir="auto"
                >
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                className="w-full h-11"
                onClick={() => navigate("/login")}
              >
                {copy.goToLogin}
              </Button>

              {!resendEmail && (
                <input
                  type="email"
                  dir="ltr"
                  placeholder={language === "ar" ? "أدخل بريدك الإلكتروني" : "Enter your email address"}
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={handleResend}
                disabled={isResending || resendCooldown > 0}
              >
                {isResending
                  ? copy.resending
                  : resendCooldown > 0
                    ? (language === "ar" ? `إعادة الإرسال خلال ${resendCooldown}ث` : `Resend in ${resendCooldown}s`)
                    : copy.resendVerification}
              </Button>
            </div>
          </div>
        )}
      </AuthPageLayout>
    </PageShell>
  );
}
