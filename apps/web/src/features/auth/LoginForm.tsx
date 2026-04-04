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
import { AuthInputField } from "./AuthInputField";
import { AuthPhoneField } from "./AuthPhoneField";
import { AuthSelectField } from "./AuthSelectField";
import { AuthGoogleButton } from "./AuthGoogleButton";
import { AuthAvatarUpload } from "./AuthAvatarUpload";
import { JORDAN_CITIES, JORDAN_CITIES_AR } from "./loginUtils";
import { AuthPageLayout } from "./components/AuthPageLayout";
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
  areaOptions: Array<{ value: string; label: string }>;
  isAreaDisabled: boolean;
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
  avatarPreview?: string;
  onAvatarClick?: () => void;
  isModal?: boolean;
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
  areaOptions,
  isAreaDisabled,
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
  avatarPreview,
  onAvatarClick,
  isModal,
}: LoginFormProps) {
  const isRTL = language === "ar";

  const cityOptions = JORDAN_CITIES.map((city) => ({
    value: city,
    label: isRTL ? JORDAN_CITIES_AR[city] || city : city,
  }));

  const canInteract = canSubmit && !isLoading;
  const submitButtonClassName = canInteract
    ? "bg-primary text-primary-foreground hover:bg-primary/90"
    : "bg-muted text-muted-foreground cursor-not-allowed opacity-70 hover:bg-muted";

  const title = isTwoFactorStep
    ? copy.form.twoFactorTitle
    : isSignUp
      ? copy.form.signUpTitle
      : copy.form.signInTitle;

  const subtitle = isTwoFactorStep
    ? copy.form.twoFactorSubtitle
    : isSignUp
      ? copy.form.signUpSubtitle
      : copy.form.signInSubtitle;

  const footer = (
    <>
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
    </>
  );

  const formContent = (
    <>
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
              <AuthGoogleButton
                onContinueWithGoogle={onContinueWithGoogle}
                isLoading={isLoading}
                continueText={copy.form.continueWithGoogle}
                orUseEmailText={copy.form.orUseEmail}
              />
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
              <AuthAvatarUpload
                avatarPreview={avatarPreview}
                onAvatarClick={onAvatarClick}
                tapToUploadText={copy.form.tapToUpload}
                uploadPhotoOptionalText={copy.form.uploadPhotoOptional}
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
              <AuthPhoneField
                id="phone"
                name="phone"
                label={copy.form.phoneLabel}
                required
                placeholder={copy.form.phonePlaceholder}
                value={values.phone}
                error={errors.phone}
                disabled={isLoading}
                icon={Phone}
                focused={focusedField === "phone"}
                autoComplete="tel"
                onChange={(value) => onFieldChange("phone", value)}
                onFocus={() => onFieldFocus("phone")}
                onBlur={() => onFieldBlur("phone")}
                isRTL={isRTL}
              />
            )}

            {!isTwoFactorStep && isSignUp && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthSelectField
                  id="city"
                  name="city"
                  label={copy.form.cityLabel}
                  required
                  value={values.city}
                  options={cityOptions}
                  error={errors.city}
                  disabled={isLoading}
                  autoComplete="address-level2"
                  icon={MapPin}
                  focused={focusedField === "city"}
                  onChange={(value) => onFieldChange("city", value)}
                  onFocus={() => onFieldFocus("city")}
                  onBlur={() => onFieldBlur("city")}
                  isRTL={isRTL}
                />

                <AuthSelectField
                  id="area"
                  name="area"
                  label={copy.form.areaLabel}
                  required
                  value={values.area}
                  options={areaOptions}
                  error={errors.area}
                  disabled={isLoading || isAreaDisabled}
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
                autoComplete="username"
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
              <div className={"text-end"}>
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
    </>
  );

  if (isModal) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="flex flex-col w-full pb-4 items-stretch text-left rtl:text-right">
        <div className="flex flex-col space-y-2 mb-6 text-left rtl:text-right">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        </div>
        {formContent}
        {footer}
      </div>
    );
  }

  return (
    <AuthPageLayout
      direction={isRTL ? "rtl" : "ltr"}
      title={title}
      subtitle={subtitle}
      footer={footer}
    >
      {formContent}
    </AuthPageLayout>
  );
}
