import { lazy } from "react";
import { Route, type NavigateFunction } from "react-router-dom";
import { applyLoginUserDataToProfile } from "../appRoutesUtils";
import type { BaseAppRouteProps } from "../AppRouteTypes";
import { APP_ROUTE_PATHS } from "../routeConfig";
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
              appProps.setUserProfile(
                applyLoginUserDataToProfile(appProps.userProfile, userData),
              );
              
              if (userData.role === "admin") {
                navigate(APP_ROUTE_PATHS.admin, { replace: true });
                return;
              }

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
              navigate(safePath, { replace: true });
            }}
            onContinueAsGuest={() => navigate(APP_ROUTE_PATHS.home)}
            language={appProps.language}
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
    </>
  );
}
