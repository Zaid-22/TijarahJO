import { AlertCircle, Loader2, Lock, Mail, MapPin, Phone, User } from "lucide-react";
import { Alert, AlertDescription } from "../../shared/ui/alert";
import { Button } from "../../shared/ui/button";
import { Logo } from "../../shared/ui/logo";
import { AuthInputField } from "./AuthInputField";
import {
  LoginField,
  LoginFormErrors,
  LoginFormValues,
} from "./loginValidation";

interface LoginFormProps {
  isSignUp: boolean;
  isLoading: boolean;
  generalError: string;
  canSubmit: boolean;
  values: LoginFormValues;
  errors: LoginFormErrors;
  focusedField: LoginField | null;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onToggleAuthMode: () => void;
  onContinueAsGuest: () => void;
  onFieldChange: (field: LoginField, value: string) => void;
  onFieldFocus: (field: LoginField) => void;
  onFieldBlur: (field: LoginField) => void;
  onTogglePasswordVisibility: () => void;
  onToggleConfirmPasswordVisibility: () => void;
}

export function LoginForm({
  isSignUp,
  isLoading,
  generalError,
  canSubmit,
  values,
  errors,
  focusedField,
  showPassword,
  showConfirmPassword,
  onSubmit,
  onToggleAuthMode,
  onContinueAsGuest,
  onFieldChange,
  onFieldFocus,
  onFieldBlur,
  onTogglePasswordVisibility,
  onToggleConfirmPasswordVisibility,
}: LoginFormProps) {
  const canInteract = canSubmit && !isLoading;
  const submitButtonClassName = canInteract
    ? "bg-[#0A4ABF] text-white hover:bg-[#083a95]"
    : "bg-gray-400 text-white cursor-not-allowed opacity-60 hover:bg-gray-400";

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

          <form
            onSubmit={onSubmit}
            className="space-y-4 sm:space-y-5"
            autoComplete="off"
            noValidate
          >
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
                  onChange={(value) => onFieldChange("firstName", value)}
                  onFocus={() => onFieldFocus("firstName")}
                  onBlur={() => onFieldBlur("firstName")}
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
                  onChange={(value) => onFieldChange("lastName", value)}
                  onFocus={() => onFieldFocus("lastName")}
                  onBlur={() => onFieldBlur("lastName")}
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
                onChange={(value) => onFieldChange("phone", value)}
                onFocus={() => onFieldFocus("phone")}
                onBlur={() => onFieldBlur("phone")}
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
                  onChange={(value) => onFieldChange("city", value)}
                  onFocus={() => onFieldFocus("city")}
                  onBlur={() => onFieldBlur("city")}
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
                  onChange={(value) => onFieldChange("area", value)}
                  onFocus={() => onFieldFocus("area")}
                  onBlur={() => onFieldBlur("area")}
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
              onChange={(value) => onFieldChange("identifier", value)}
              onFocus={() => onFieldFocus("identifier")}
              onBlur={() => onFieldBlur("identifier")}
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
              onToggleValue={onTogglePasswordVisibility}
              preventClipboardActions
              onChange={(value) => onFieldChange("password", value)}
              onFocus={() => onFieldFocus("password")}
              onBlur={() => onFieldBlur("password")}
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
                onToggleValue={onToggleConfirmPasswordVisibility}
                preventClipboardActions
                onChange={(value) => onFieldChange("confirmPassword", value)}
                onFocus={() => onFieldFocus("confirmPassword")}
                onBlur={() => onFieldBlur("confirmPassword")}
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
              <button
                type="button"
                onClick={onToggleAuthMode}
                className="font-medium text-[#0A4ABF] hover:underline"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
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
