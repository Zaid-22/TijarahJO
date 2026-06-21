import { lazy } from "react";
import { Route, type NavigateFunction } from "react-router-dom";
import {
  applyLoginUserDataToProfile,
  isProfileCompleteForRouting,
} from "../appRoutesUtils";
import type { BaseAppRouteProps } from "../AppRouteTypes";
import { APP_ROUTE_PATHS } from "../routeConfig";
import { userHasAdminAccess } from "../../../contexts/authUtils";
import {
  buildCurrentPath,
  resolveBackPathFromHistoryState,
} from "../../../shared/lib/backNavigation";

const LoginPage = lazy(() =>
  import("../../../features/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const ForgotPasswordPage = lazy(() =>
  import("../../../features/auth/pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const CompleteProfilePage = lazy(() =>
  import("../../../features/auth/pages/CompleteProfilePage").then((m) => ({
    default: m.CompleteProfilePage,
  })),
);
const VerifyEmailPage = lazy(() =>
  import("../../../features/auth/pages/VerifyEmailPage").then((m) => ({
    default: m.VerifyEmailPage,
  })),
);

interface AuthRouteGroupParams {
  appProps: BaseAppRouteProps;
  navigate: NavigateFunction;
}

export function renderAuthRouteGroup({
  appProps,
  navigate,
}: AuthRouteGroupParams) {
  return (
    <>
      <Route
        path={APP_ROUTE_PATHS.login}
        element={
          <LoginPage
            onLogin={(userData) => {
              const nextProfile = applyLoginUserDataToProfile(
                appProps.userProfile,
                userData,
              );
              appProps.setUserProfile(nextProfile);

              const currentPath = buildCurrentPath(
                window.location.pathname,
                window.location.search,
              );
              const safePath = resolveBackPathFromHistoryState({
                historyState: window.history.state,
                currentPath,
                fallbackPath: "/",
                blockedPathnames: ["/login"],
              });
              const intendedPath = userHasAdminAccess({
                role: userData.role ?? "user",
                hasAdminAccess: userData.hasAdminAccess,
                permissions: userData.permissions,
              })
                ? APP_ROUTE_PATHS.admin
                : safePath;

              if (
                !isProfileCompleteForRouting(userData)
              ) {
                navigate(APP_ROUTE_PATHS.completeProfile, {
                  replace: true,
                  state: { fromPath: intendedPath },
                });
                return;
              }

              if (
                userHasAdminAccess({
                  role: userData.role ?? "user",
                  hasAdminAccess: userData.hasAdminAccess,
                  permissions: userData.permissions,
                })
              ) {
                navigate(APP_ROUTE_PATHS.admin, { replace: true });
                return;
              }
              navigate(safePath, { replace: true });
            }}
            onContinueAsGuest={() => {
              void appProps.loginAsGuest().finally(() => {
                navigate(APP_ROUTE_PATHS.home, { replace: true });
              });
            }}
            language={appProps.language}
            allowSignup={appProps.registrationEnabled}
          />
        }
      />

      <Route
        path={APP_ROUTE_PATHS.forgotPassword}
        element={<ForgotPasswordPage language={appProps.language} />}
      />

      <Route
        path={APP_ROUTE_PATHS.completeProfile}
        element={<CompleteProfilePage />}
      />

      <Route
        path={APP_ROUTE_PATHS.verifyEmail}
        element={
          <VerifyEmailPage
            language={appProps.language}
            onLogin={(userData) => {
              const nextProfile = applyLoginUserDataToProfile(appProps.userProfile, userData);
              appProps.setUserProfile(nextProfile);
            }}
          />
        }
      />
    </>
  );
}
