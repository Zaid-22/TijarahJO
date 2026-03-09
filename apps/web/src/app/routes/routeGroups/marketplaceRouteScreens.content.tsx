import { lazy } from "react";
import { useLocation } from "react-router-dom";
import {
  buildCurrentPath,
  resolveBackPathFromLocationState,
} from "../../../shared/lib/backNavigation";
import { useMarketplaceRouteContext } from "./marketplaceRouteContext";
import { type MarketplaceRouteDefinition } from "./marketplaceRouteDefinitions";

const FAQPage = lazy(() =>
  import("../../../pages/FAQPage").then((m) => ({ default: m.FAQPage })),
);
const TermsPage = lazy(() =>
  import("../../../pages/TermsPage").then((m) => ({ default: m.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import("../../../pages/PrivacyPage").then((m) => ({
    default: m.PrivacyPage,
  })),
);
const HelpCenterPage = lazy(() =>
  import("../../../pages/HelpCenterPage").then((m) => ({
    default: m.HelpCenterPage,
  })),
);
const NotificationsPage = lazy(() =>
  import("../../../pages/NotificationsPage").then((m) => ({
    default: m.NotificationsPage,
  })),
);

export function FaqMarketplaceRouteScreen() {
  const { appProps, navigate } = useMarketplaceRouteContext();
  const location = useLocation();
  const backPath = resolveBackPathFromLocationState({
    locationState: location.state,
    currentPath: buildCurrentPath(location.pathname, location.search),
    fallbackPath: "/",
  });

  return (
    <FAQPage language={appProps.language} onBack={() => navigate(backPath)} />
  );
}

export function TermsMarketplaceRouteScreen() {
  const { appProps, navigate } = useMarketplaceRouteContext();
  const location = useLocation();
  const backPath = resolveBackPathFromLocationState({
    locationState: location.state,
    currentPath: buildCurrentPath(location.pathname, location.search),
    fallbackPath: "/",
  });

  return (
    <TermsPage language={appProps.language} onBack={() => navigate(backPath)} />
  );
}

export function PrivacyMarketplaceRouteScreen() {
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
      onBack={() => navigate(backPath)}
    />
  );
}

export function HelpMarketplaceRouteScreen() {
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
      onBack={() => navigate(backPath)}
    />
  );
}

export function NotificationsMarketplaceRouteScreen() {
  const { appProps, navigate } = useMarketplaceRouteContext();

  return (
    <NotificationsPage
      language={appProps.language}
      onBack={() => navigate("/")}
      onNavigate={(path) => navigate(path)}
    />
  );
}

export const marketplaceContentRoutes: MarketplaceRouteDefinition[] = [
  {
    path: "/faq",
    Screen: FaqMarketplaceRouteScreen,
  },
  {
    path: "/terms",
    Screen: TermsMarketplaceRouteScreen,
  },
  {
    path: "/privacy",
    Screen: PrivacyMarketplaceRouteScreen,
  },
  {
    path: "/help",
    Screen: HelpMarketplaceRouteScreen,
  },
  {
    path: "/notifications",
    Screen: NotificationsMarketplaceRouteScreen,
  },
];
