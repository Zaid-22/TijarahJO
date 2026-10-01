import { lazy } from "react";
import { useLocation } from "react-router-dom";
import {
  buildCurrentPath,
  resolveBackPathFromLocationState,
} from "../../../shared/lib/backNavigation";
import { useMarketplaceRouteContext } from "./marketplaceRouteContext";
import { type MarketplaceRouteDefinition } from "./marketplaceRouteDefinitions";
import { APP_ROUTE_PATHS } from "../routeConfig";

const FAQPage = lazy(() =>
  import("../../../features/settings/pages/FAQPage").then((m) => ({ default: m.FAQPage })),
);
const TermsPage = lazy(() =>
  import("../../../features/settings/pages/TermsPage").then((m) => ({ default: m.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import("../../../features/settings/pages/PrivacyPage").then((m) => ({
    default: m.PrivacyPage,
  })),
);
const HelpCenterPage = lazy(() =>
  import("../../../features/settings/pages/HelpCenterPage").then((m) => ({
    default: m.HelpCenterPage,
  })),
);
const NotificationsPage = lazy(() =>
  import("../../../features/marketplace/pages/NotificationsPage").then((m) => ({
    default: m.NotificationsPage,
  })),
);

function FaqMarketplaceRouteScreen() {
  const { appProps, navigate } = useMarketplaceRouteContext();
  const location = useLocation();
  const backPath = resolveBackPathFromLocationState({
    locationState: location.state,
    currentPath: buildCurrentPath(location.pathname, location.search),
    fallbackPath: "/",
  });

  return (
    <FAQPage
      language={appProps.language}
      onBack={() => {
        if (window.history.length > 2 && location.state && (location.state as { fromPath?: string }).fromPath) {
          navigate(-1);
        } else {
          navigate(backPath);
        }
      }}
    />
  );
}

function TermsMarketplaceRouteScreen() {
  const { appProps, navigate } = useMarketplaceRouteContext();
  const location = useLocation();
  const backPath = resolveBackPathFromLocationState({
    locationState: location.state,
    currentPath: buildCurrentPath(location.pathname, location.search),
    fallbackPath: "/",
  });

  return (
    <TermsPage
      language={appProps.language}
      onBack={() => {
        if (window.history.length > 2 && location.state && (location.state as { fromPath?: string }).fromPath) {
          navigate(-1);
        } else {
          navigate(backPath);
        }
      }}
    />
  );
}

function PrivacyMarketplaceRouteScreen() {
  const { appProps, navigate } = useMarketplaceRouteContext();
  const location = useLocation();
  const backPath = resolveBackPathFromLocationState({
    locationState: location.state,
    currentPath: buildCurrentPath(location.pathname, location.search),
    fallbackPath: "/",
  });

  return (
    <PrivacyPage
      language={appProps.language}
      onBack={() => {
        if (window.history.length > 2 && location.state && (location.state as { fromPath?: string }).fromPath) {
          navigate(-1);
        } else {
          navigate(backPath);
        }
      }}
    />
  );
}

function HelpMarketplaceRouteScreen() {
  const { appProps, navigate } = useMarketplaceRouteContext();
  const location = useLocation();
  const backPath = resolveBackPathFromLocationState({
    locationState: location.state,
    currentPath: buildCurrentPath(location.pathname, location.search),
    fallbackPath: "/",
  });

  return (
    <HelpCenterPage
      language={appProps.language}
      onBack={() => {
        if (window.history.length > 2 && location.state && (location.state as { fromPath?: string }).fromPath) {
          navigate(-1);
        } else {
          navigate(backPath);
        }
      }}
    />
  );
}

function NotificationsMarketplaceRouteScreen() {
  const { appProps, navigate } = useMarketplaceRouteContext();

  return (
    <NotificationsPage
      language={appProps.language}
      onBack={() => {
        if (window.history.length > 2) {
          navigate(-1);
        } else {
          navigate(APP_ROUTE_PATHS.home);
        }
      }}
      onNavigate={(path) => navigate(path)}
    />
  );
}

export const marketplaceContentRoutes: MarketplaceRouteDefinition[] = [
  {
    path: APP_ROUTE_PATHS.faq,
    Screen: FaqMarketplaceRouteScreen,
  },
  {
    path: APP_ROUTE_PATHS.terms,
    Screen: TermsMarketplaceRouteScreen,
  },
  {
    path: APP_ROUTE_PATHS.privacy,
    Screen: PrivacyMarketplaceRouteScreen,
  },
  {
    path: APP_ROUTE_PATHS.help,
    Screen: HelpMarketplaceRouteScreen,
  },
  {
    path: APP_ROUTE_PATHS.notifications,
    Screen: NotificationsMarketplaceRouteScreen,
  },
];
