import { type ReactElement } from "react";
import { Route, type NavigateFunction } from "react-router-dom";
import {
  BaseAppRouteProps,
  MarketplaceRouteState,
  PostActions,
} from "../AppRouteTypes";
import {
  marketplaceCatalogRoutes,
} from "./marketplaceRouteScreens.catalog";
import {
  marketplaceContentRoutes,
} from "./marketplaceRouteScreens.content";
import { marketplaceHomeRoutes } from "./marketplaceRouteScreens.home";
import {
  marketplacePostRoutes,
} from "./marketplaceRouteScreens.post";
import {
  MarketplaceRouteContextProvider,
  type MarketplaceRouteContextValue,
} from "./marketplaceRouteContext";

interface MarketplaceRouteGroupParams {
  appProps: BaseAppRouteProps;
  routeState: MarketplaceRouteState;
  postActions: PostActions;
  navigate: NavigateFunction;
  redirectToLogin: () => void;
}

export function renderMarketplaceRouteGroup({
  appProps,
  routeState,
  postActions,
  navigate,
  redirectToLogin,
}: MarketplaceRouteGroupParams) {
  const currentUserId = appProps.isAuthenticated
    ? routeState.currentUserId
    : undefined;
  const sharedUserRouteProps = {
    isAuthenticated: appProps.isAuthenticated,
    currentUserId,
    currentUserDisplayName: appProps.currentUserDisplayName,
  } as const;
  const sharedPostRouteProps = {
    availablePosts: routeState.availablePosts,
    favoriteIds: routeState.favoriteIds,
    onFavoriteToggle: routeState.toggleFavorite,
  } as const;
  const navigateToPost = (postId: string, fallbackFromPath: string) => {
    const runtimePath =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : fallbackFromPath;
    const fromPath = runtimePath || fallbackFromPath || "/";

    navigate(`/post/${postId}`, {
      state: { fromPath },
    });
  };

  const contextValue: MarketplaceRouteContextValue = {
    appProps,
    routeState,
    postActions,
    navigate,
    redirectToLogin,
    navigateToPost,
    sharedUserRouteProps,
    sharedPostRouteProps,
  };

  const withMarketplaceContext = (element: ReactElement) => (
    <MarketplaceRouteContextProvider value={contextValue}>
      {element}
    </MarketplaceRouteContextProvider>
  );

  const routeDefinitions = [
    ...marketplaceHomeRoutes,
    ...marketplaceCatalogRoutes,
    ...marketplacePostRoutes,
    ...marketplaceContentRoutes,
  ];

  return (
    <>
      {routeDefinitions.map(({ path, Screen }) => (
        <Route
          key={path}
          path={path}
          element={withMarketplaceContext(<Screen />)}
        />
      ))}
    </>
  );
}
