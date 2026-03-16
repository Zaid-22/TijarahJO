import { createContext, type ReactNode, useContext } from "react";
import { type NavigateFunction } from "react-router-dom";
import { Post } from "../../../types";
import type {
  BaseAppRouteProps,
  MarketplaceRouteState,
  PostActions,
} from "../AppRouteTypes";

export interface MarketplaceSharedUserRouteProps {
  isAuthenticated: boolean;
  currentUserId?: string;
  currentUserDisplayName: string;
}

export interface MarketplaceSharedPostRouteProps {
  availablePosts: Post[];
  favoriteIds: string[];
  onFavoriteToggle: (postId: string) => void;
}

export interface MarketplaceRouteContextValue {
  appProps: BaseAppRouteProps;
  routeState: MarketplaceRouteState;
  postActions: PostActions;
  navigate: NavigateFunction;
  redirectToLogin: () => void;
  promptLoginModal: () => void;
  navigateToPost: (postId: string, fallbackFromPath: string) => void;
  sharedUserRouteProps: MarketplaceSharedUserRouteProps;
  sharedPostRouteProps: MarketplaceSharedPostRouteProps;
}

const MarketplaceRouteContext = createContext<
  MarketplaceRouteContextValue | undefined
>(undefined);

interface MarketplaceRouteContextProviderProps {
  value: MarketplaceRouteContextValue;
  children: ReactNode;
}

export function MarketplaceRouteContextProvider({
  value,
  children,
}: MarketplaceRouteContextProviderProps) {
  return (
    <MarketplaceRouteContext.Provider value={value}>
      {children}
    </MarketplaceRouteContext.Provider>
  );
}

export function useMarketplaceRouteContext() {
  const context = useContext(MarketplaceRouteContext);
  if (!context) {
    throw new Error("Missing marketplace route context");
  }

  return context;
}
