import { lazy } from "react";
import { Route } from "react-router-dom";
import type { AppRouteElementsParams } from "./AppRouteTypes";
import { renderAccountRouteGroup } from "./routeGroups/accountRouteGroup";
import { renderAuthRouteGroup } from "./routeGroups/authRouteGroup";
import { renderMarketplaceRouteGroup } from "./routeGroups/marketplaceRouteGroup";
import {
  buildCurrentPath,
  resolveBackPathFromHistoryState,
} from "../../shared/lib/backNavigation";

const NotFoundPage = lazy(() =>
  import("../../pages/NotFoundPage").then((module) => ({
    default: module.NotFoundPage,
  })),
);

export function renderAppRouteElements({
  appProps,
  routeState,
  postActions,
  saveProfile,
  navigate,
  redirectToLogin,
  requireAuth,
}: AppRouteElementsParams) {
  return (
    <>
      {renderMarketplaceRouteGroup({
        appProps,
        routeState,
        postActions,
        navigate,
        redirectToLogin,
      })}

      {renderAccountRouteGroup({
        appProps,
        routeState,
        postActions,
        saveProfile,
        navigate,
        requireAuth,
      })}

      {renderAuthRouteGroup({
        appProps,
        navigate,
      })}

      <Route
        path="*"
        element={
          <NotFoundPage
            language={appProps.language}
            attemptedPath={
              typeof window === "undefined"
                ? ""
                : `${window.location.pathname}${window.location.search}`
            }
            onGoHome={() => navigate("/")}
            onGoBack={() => {
              const currentPath = buildCurrentPath(
                window.location.pathname,
                window.location.search,
              );
              const backPath = resolveBackPathFromHistoryState({
                historyState: window.history.state,
                currentPath,
                fallbackPath: "/",
              });
              navigate(backPath, { replace: true });
            }}
          />
        }
      />
    </>
  );
}
