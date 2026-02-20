import { api } from "../services/api";
import { User } from "../types";
import {
  AuthFallbackUser,
  debugAuthError,
  debugAuthLog,
  normalizeMessage,
} from "./authContextUtils";

type HydrationResult = {
  user: User;
  shouldAbort: boolean;
};

interface PerformAuthLoginParams {
  email: string;
  password: string;
  resolveAuthUser: (payload: unknown, fallback: AuthFallbackUser) => User;
  hydrateAuthenticatedUser: (
    candidateUser: User,
    fallbackEmail: string,
    source: "login" | "signup",
  ) => Promise<HydrationResult>;
  persistAuthenticatedSession: (user: User) => void;
  setAuthError: (message: string) => void;
  getErrorMessage: (value: unknown) => string;
}

export async function performAuthLogin({
  email,
  password,
  resolveAuthUser,
  hydrateAuthenticatedUser,
  persistAuthenticatedSession,
  setAuthError,
  getErrorMessage,
}: PerformAuthLoginParams): Promise<boolean> {
  try {
    setAuthError("");
    debugAuthLog("[AuthContext] Attempting login with:", email);
    const response = await api.auth.login({
      email,
      password,
    });

    debugAuthLog("[AuthContext] Login response:", {
      success: response.success,
      hasUser: !!response.user,
      message: response.message,
      user: response.user,
    });

    if (!response.success) {
      setAuthError(
        normalizeMessage(
          response.message,
          "Login failed. Please check your credentials and try again.",
        ),
      );
      debugAuthError(
        "[AuthContext] Login failed:",
        response.message || "Unknown error",
      );
      return false;
    }

    let user = resolveAuthUser(response.user, {
      email,
      name: email,
      role: "user",
    });
    const hydrationResult = await hydrateAuthenticatedUser(user, email, "login");
    if (hydrationResult.shouldAbort) {
      return false;
    }
    user = hydrationResult.user;

    persistAuthenticatedSession(user);
    window.dispatchEvent(new CustomEvent("authSessionChanged"));
    debugAuthLog("[AuthContext] Login successful, user set:", user);
    return true;
  } catch (error) {
    debugAuthError("[AuthContext] Login error:", error);
    setAuthError(
      normalizeMessage(getErrorMessage(error), "Login failed. Please try again."),
    );
    return false;
  }
}

interface PerformAuthRegisterParams {
  email: string;
  password: string;
  name: string;
  phone: string;
  city: string;
  area: string;
  resolveAuthUser: (payload: unknown, fallback: AuthFallbackUser) => User;
  hydrateAuthenticatedUser: (
    candidateUser: User,
    fallbackEmail: string,
    source: "login" | "signup",
  ) => Promise<HydrationResult>;
  persistAuthenticatedSession: (user: User) => void;
  setAuthError: (message: string) => void;
  getErrorMessage: (value: unknown) => string;
}

export async function performAuthRegister({
  email,
  password,
  name,
  phone,
  city,
  area,
  resolveAuthUser,
  hydrateAuthenticatedUser,
  persistAuthenticatedSession,
  setAuthError,
  getErrorMessage,
}: PerformAuthRegisterParams): Promise<boolean> {
  try {
    setAuthError("");
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const response: {
      success: boolean;
      data?: {
        success?: boolean;
        user?: unknown;
        message?: string;
      };
      error?: string;
    } = await api.auth.register(
      email,
      password,
      name.trim(),
      phone.trim(),
      city.trim(),
      area.trim(),
    );

    const authResponse = response.success ? response.data : null;

    if (authResponse && authResponse.success) {
      let transformedUser = resolveAuthUser(authResponse.user, {
        email,
        firstName,
        lastName,
        name: name || email,
        role: "user",
      });
      const hydrationResult = await hydrateAuthenticatedUser(
        transformedUser,
        email,
        "signup",
      );
      if (hydrationResult.shouldAbort) {
        return false;
      }
      transformedUser = hydrationResult.user;

      persistAuthenticatedSession(transformedUser);
      window.dispatchEvent(new CustomEvent("authSessionChanged"));
      return true;
    }

    const registerFailureMessage = normalizeMessage(
      authResponse?.message || response.error,
      "Registration failed. Please verify your details and try again.",
    );
    setAuthError(registerFailureMessage);
    debugAuthError("[AuthContext] Register failed:", registerFailureMessage);
    return false;
  } catch (error) {
    debugAuthError("Register error:", error);
    setAuthError(
      normalizeMessage(getErrorMessage(error), "Registration failed. Please try again."),
    );
    return false;
  }
}
