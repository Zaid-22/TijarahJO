import { useReducer } from "react";
import {
  LoginFormErrors,
  LoginFormValues,
  LoginField,
  createEmptyLoginErrors,
} from "./loginValidation";

type LoginStep = "credentials" | "twoFactor";
type AuthMode = "signIn" | "signUp";

interface LoginState {
  step: LoginStep;
  mode: AuthMode;
  isLoading: boolean;
  generalError: string;
  values: LoginFormValues;
  errors: LoginFormErrors;
  twoFactorToken: string;
  twoFactorCode: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  focusedField: LoginField | null;
}

type LoginAction =
  | { type: "SET_MODE"; mode: AuthMode }
  | { type: "SET_FIELD"; field: LoginField; value: string }
  | { type: "SET_ERROR"; field: LoginField; error: string }
  | { type: "SET_ERRORS"; errors: LoginFormErrors }
  | { type: "SET_GENERAL_ERROR"; error: string }
  | { type: "START_LOADING" }
  | { type: "STOP_LOADING" }
  | { type: "ENTER_TWO_FACTOR"; token: string; message: string }
  | { type: "CANCEL_TWO_FACTOR" }
  | { type: "SET_TWO_FACTOR_CODE"; code: string }
  | { type: "TOGGLE_PASSWORD" }
  | { type: "TOGGLE_CONFIRM_PASSWORD" }
  | { type: "SET_FOCUSED_FIELD"; field: LoginField | null }
  | { type: "RESET"; initialValues?: Partial<LoginFormValues> };

function loginReducer(state: LoginState, action: LoginAction): LoginState {
  switch (action.type) {
    case "SET_MODE":
      return {
        ...state,
        mode: action.mode,
        step: "credentials",
        twoFactorToken: "",
        twoFactorCode: "",
        generalError: "",
        errors: createEmptyLoginErrors(),
        focusedField: null,
      };

    case "SET_FIELD":
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: {
          ...state.errors,
          [action.field]: state.errors[action.field]
            ? ""
            : state.errors[action.field], // Clear error on change if it exists
        },
      };

    case "SET_ERROR":
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error },
      };

    case "SET_ERRORS":
      return {
        ...state,
        errors: action.errors,
      };

    case "SET_GENERAL_ERROR":
      return {
        ...state,
        generalError: action.error,
      };

    case "START_LOADING":
      return {
        ...state,
        isLoading: true,
      };

    case "STOP_LOADING":
      return {
        ...state,
        isLoading: false,
      };

    case "ENTER_TWO_FACTOR":
      return {
        ...state,
        mode: "signIn",
        step: "twoFactor",
        twoFactorToken: action.token,
        twoFactorCode: "",
        generalError: action.message, // For the "two factor needed" prompt
      };

    case "CANCEL_TWO_FACTOR":
      return {
        ...state,
        step: "credentials",
        twoFactorToken: "",
        twoFactorCode: "",
        generalError: "",
      };

    case "SET_TWO_FACTOR_CODE":
      return {
        ...state,
        twoFactorCode: action.code,
      };

    case "TOGGLE_PASSWORD":
      return {
        ...state,
        showPassword: !state.showPassword,
      };

    case "TOGGLE_CONFIRM_PASSWORD":
      return {
        ...state,
        showConfirmPassword: !state.showConfirmPassword,
      };

    case "SET_FOCUSED_FIELD":
      return {
        ...state,
        focusedField: action.field,
      };

    case "RESET":
      return createInitialLoginState(action.initialValues);

    default:
      return state;
  }
}

function createInitialLoginState(
  initialValues?: Partial<LoginFormValues>,
): LoginState {
  return {
    step: "credentials",
    mode: "signIn",
    isLoading: false,
    generalError: "",
    values: {
      identifier: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "", // Default APP_CONFIG.defaultPhonePrefix logic handles this normally, keeping empty for prefix input
      city: "",
      area: "",
      ...initialValues,
    },
    errors: createEmptyLoginErrors(),
    twoFactorToken: "",
    twoFactorCode: "",
    showPassword: false,
    showConfirmPassword: false,
    focusedField: null,
  };
}

export function useLoginReducer(initialValues?: Partial<LoginFormValues>) {
  return useReducer(loginReducer, initialValues, createInitialLoginState);
}
