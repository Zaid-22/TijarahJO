import {
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
} from "lucide-react";
import { Alert, AlertDescription } from "../../shared/ui/alert";
import { Button } from "../../shared/ui/button";
import { Logo } from "../../shared/ui/logo";
import { AuthInputField } from "./AuthInputField";
import type { Language } from "../../types";
import {
  LoginField,
  LoginFormErrors,
  LoginFormValues,
} from "./loginValidation";
import type { LoginCopy } from "./loginCopy";

interface LoginFormProps {
  language: Language;
  isSignUp: boolean;
  showGoogleAuth: boolean;
  isLoading: boolean;
  generalError: string;
  canSubmit: boolean;
  values: LoginFormValues;
  errors: LoginFormErrors;
  copy: LoginCopy;
  focusedField: LoginField | null;
  showPassword: boolean;
  showConfirmPassword: boolean;
  isTwoFactorStep: boolean;
  twoFactorCode: string;
  onSubmit: (event: React.FormEvent) => void;
  onToggleAuthMode: () => void;
  onForgotPassword: () => void;
  onContinueWithGoogle: () => void;
  onContinueAsGuest: () => void;
  onCancelTwoFactor: () => void;
  onTwoFactorCodeChange: (value: string) => void;
  onFieldChange: (field: LoginField, value: string) => void;
  onFieldFocus: (field: LoginField) => void;
  onFieldBlur: (field: LoginField) => void;
  onTogglePasswordVisibility: () => void;
  onToggleConfirmPasswordVisibility: () => void;
}

export function LoginForm({
  language,
  isSignUp,
  showGoogleAuth,
  isLoading,
  generalError,
  canSubmit,
  values,
  errors,
  copy,
  focusedField,
  showPassword,
  showConfirmPassword,
  isTwoFactorStep,
  twoFactorCode,
  onSubmit,
  onToggleAuthMode,
  onForgotPassword,
  onContinueWithGoogle,
  onContinueAsGuest,
  onCancelTwoFactor,
  onTwoFactorCodeChange,
  onFieldChange,
  onFieldFocus,
  onFieldBlur,
  onTogglePasswordVisibility,
  onToggleConfirmPasswordVisibility,
}: LoginFormProps) {
  const isRTL = language === "ar";
  const canInteract = canSubmit && !isLoading;
  const submitButtonClassName = canInteract
    ? "bg-primary text-primary-foreground hover:bg-primary/90"
    : "bg-muted text-muted-foreground cursor-not-allowed opacity-70 hover:bg-muted";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-content-70vh flex items-center justify-center p-4 sm:p-6 lg:p-8"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <Logo size="lg" className="mx-auto mb-3 sm:mb-4" />
          <h1 className="mb-2 text-2xl sm:text-3xl text-foreground">
            {isTwoFactorStep
              ? copy.form.twoFactorTitle
              : isSignUp
                ? copy.form.signUpTitle
                : copy.form.signInTitle}
          </h1>
          <p className="px-4 text-sm sm:text-base text-muted-foreground">
            {isTwoFactorStep
              ? copy.form.twoFactorSubtitle
              : isSignUp
                ? copy.form.signUpSubtitle
                : copy.form.signInSubtitle}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-xl p-4 sm:p-6 lg:p-8">
          {generalError && (
            <Alert
              variant="destructive"
              className="mb-4 sm:mb-6"
              aria-live="polite"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {generalError}
              </AlertDescription>
            </Alert>
          )}

          <form
            onSubmit={onSubmit}
            className="space-y-4 sm:space-y-5"
            autoComplete="off"
            noValidate
          >
            {showGoogleAuth && !isTwoFactorStep && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full border-border bg-background text-foreground text-sm font-medium hover:bg-muted"
                  onClick={onContinueWithGoogle}
                  disabled={isLoading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-5 h-5"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path
                      className="fill-amber-400"
                      d="M43.6 20.5H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 6 1.2 8.1 3.2l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
                    />
                    <path
                      className="fill-red-500"
                      d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 6 1.2 8.1 3.2l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                    />
                    <path
                      className="fill-green-500"
                      d="M24 44c5.2 0 10.1-2 13.8-5.3l-6.4-5.4C29.3 34.9 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z"
                    />
                    <path
                      className="fill-blue-600"
                      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4 5.4l.1-.1 6.4 5.4C37.3 39.1 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"
                    />
                  </svg>
                  <span>{copy.form.continueWithGoogle}</span>
                </Button>

                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-border" />
                  <span className="absolute bg-card px-3 text-xs text-muted-foreground">
                    {copy.form.orUseEmail}
                  </span>
                </div>
              </>
            )}

            {isTwoFactorStep && (
              <AuthInputField
                id="twoFactorCode"
                name="twoFactorCode"
                label={copy.form.twoFactorCodeLabel}
                required
                placeholder={copy.form.twoFactorCodePlaceholder}
                value={twoFactorCode}
                error=""
                disabled={isLoading}
                type="text"
                autoComplete="one-time-code"
                icon={Shield}
                focused={false}
                onChange={onTwoFactorCodeChange}
                onFocus={() => {}}
                onBlur={() => {}}
                isRTL={isRTL}
              />
            )}

            {!isTwoFactorStep && isSignUp && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInputField
                  id="firstName"
                  name="firstName"
                  label={copy.form.firstNameLabel}
                  required
                  placeholder={copy.form.firstNamePlaceholder}
                  value={values.firstName}
                  error={errors.firstName}
                  disabled={isLoading}
                  type="text"
                  autoComplete="given-name"
                  icon={User}
                  focused={focusedField === "firstName"}
                  onChange={(value) => onFieldChange("firstName", value)}
                  onFocus={() => onFieldFocus("firstName")}
                  onBlur={() => onFieldBlur("firstName")}
                  isRTL={isRTL}
                />

                <AuthInputField
                  id="lastName"
                  name="lastName"
                  label={copy.form.lastNameLabel}
                  required
                  placeholder={copy.form.lastNamePlaceholder}
                  value={values.lastName}
                  error={errors.lastName}
                  disabled={isLoading}
                  type="text"
                  autoComplete="family-name"
                  icon={User}
                  focused={focusedField === "lastName"}
                  onChange={(value) => onFieldChange("lastName", value)}
                  onFocus={() => onFieldFocus("lastName")}
                  onBlur={() => onFieldBlur("lastName")}
                  isRTL={isRTL}
                />
              </div>
            )}

            {!isTwoFactorStep && isSignUp && (
              <AuthInputField
                id="phone"
                name="phone"
                label={copy.form.phoneLabel}
                required
                placeholder={copy.form.phonePlaceholder}
                value={values.phone}
                error={errors.phone}
                disabled={isLoading}
                type="text"
                autoComplete="tel"
                icon={Phone}
                focused={focusedField === "phone"}
                onChange={(value) => onFieldChange("phone", value)}
                onFocus={() => onFieldFocus("phone")}
                onBlur={() => onFieldBlur("phone")}
                isRTL={isRTL}
              />
            )}

            {!isTwoFactorStep && isSignUp && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInputField
                  id="city"
                  name="city"
                  label={copy.form.cityLabel}
                  required
                  placeholder={copy.form.cityPlaceholder}
                  value={values.city}
                  error={errors.city}
                  disabled={isLoading}
                  type="text"
                  autoComplete="address-level2"
                  icon={MapPin}
                  focused={focusedField === "city"}
                  onChange={(value) => onFieldChange("city", value)}
                  onFocus={() => onFieldFocus("city")}
                  onBlur={() => onFieldBlur("city")}
                  isRTL={isRTL}
                />

                <AuthInputField
                  id="area"
                  name="area"
                  label={copy.form.areaLabel}
                  required
                  placeholder={copy.form.areaPlaceholder}
                  value={values.area}
                  error={errors.area}
                  disabled={isLoading}
                  type="text"
                  autoComplete="address-level3"
                  icon={MapPin}
                  focused={focusedField === "area"}
                  onChange={(value) => onFieldChange("area", value)}
                  onFocus={() => onFieldFocus("area")}
                  onBlur={() => onFieldBlur("area")}
                  isRTL={isRTL}
                />
              </div>
            )}

            {!isTwoFactorStep && (
              <AuthInputField
                id="authIdentifier"
                name="authIdentifier"
                label={copy.form.identifierLabel}
                required={isSignUp}
                placeholder={copy.form.identifierPlaceholder}
                value={values.identifier}
                error={errors.identifier}
                disabled={isLoading}
                type="text"
                autoComplete="off"
                icon={Mail}
                focused={focusedField === "identifier"}
                onChange={(value) => onFieldChange("identifier", value)}
                onFocus={() => onFieldFocus("identifier")}
                onBlur={() => onFieldBlur("identifier")}
                isRTL={isRTL}
              />
            )}

            {!isTwoFactorStep && (
              <AuthInputField
                id="password"
                name="password"
                label={copy.form.passwordLabel}
                required={isSignUp}
                placeholder={copy.form.passwordPlaceholder}
                value={values.password}
                error={errors.password}
                disabled={isLoading}
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                icon={Lock}
                focused={focusedField === "password"}
                showToggle
                showValue={showPassword}
                onToggleValue={onTogglePasswordVisibility}
                showValueLabel={copy.form.showPassword}
                hideValueLabel={copy.form.hidePassword}
                preventClipboardActions
                onChange={(value) => onFieldChange("password", value)}
                onFocus={() => onFieldFocus("password")}
                onBlur={() => onFieldBlur("password")}
                isRTL={isRTL}
              />
            )}

            {!isTwoFactorStep && !isSignUp && (
              <div className={isRTL ? "text-left" : "text-right"}>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {copy.form.forgotPassword}
                </button>
              </div>
            )}

            {!isTwoFactorStep && isSignUp && (
              <AuthInputField
                id="confirmPassword"
                name="confirmPassword"
                label={copy.form.confirmPasswordLabel}
                required
                placeholder={copy.form.confirmPasswordPlaceholder}
                value={values.confirmPassword}
                error={errors.confirmPassword}
                disabled={isLoading}
                type="password"
                autoComplete="new-password"
                icon={Lock}
                focused={focusedField === "confirmPassword"}
                showToggle
                showValue={showConfirmPassword}
                onToggleValue={onToggleConfirmPasswordVisibility}
                showValueLabel={copy.form.showPassword}
                hideValueLabel={copy.form.hidePassword}
                preventClipboardActions
                onChange={(value) => onFieldChange("confirmPassword", value)}
                onFocus={() => onFieldFocus("confirmPassword")}
                onBlur={() => onFieldBlur("confirmPassword")}
                isRTL={isRTL}
              />
            )}

            <Button
              type="submit"
              className={`w-full h-14 text-base transition-all duration-300 ${submitButtonClassName}`}
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>
                    {isTwoFactorStep
                      ? copy.form.verifyingTwoFactor
                      : isSignUp
                        ? copy.form.creatingAccount
                        : copy.form.signingIn}
                  </span>
                </div>
              ) : (
                <span>
                  {isTwoFactorStep
                    ? copy.form.verifyTwoFactorButton
                    : isSignUp
                      ? copy.form.createAccount
                      : copy.form.signInButton}
                </span>
              )}
            </Button>

            {isTwoFactorStep && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onCancelTwoFactor}
                disabled={isLoading}
              >
                {copy.form.cancelTwoFactor}
              </Button>
            )}
          </form>

          {!isTwoFactorStep && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isSignUp
                  ? copy.form.alreadyHaveAccount
                  : copy.form.dontHaveAccount}{" "}
                <button
                  type="button"
                  onClick={onToggleAuthMode}
                  className="font-medium text-primary hover:underline"
                >
                  {isSignUp ? copy.form.signInLink : copy.form.signUpLink}
                </button>
              </p>
            </div>
          )}

          {!isTwoFactorStep && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {copy.form.continueAsGuest}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
