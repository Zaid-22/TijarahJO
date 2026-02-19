import { Language, UserProfile, ViewMode } from "../../types";
import { DEBOUNCE_DELAY } from "../../constants";
import { useDebounce } from "../../shared/hooks/useDebounce";
import { useProducts } from "../../features/marketplace/hooks/useProducts";
import { useFavorites } from "../../features/marketplace/hooks/useFavorites";
import { useInfiniteScroll } from "../../shared/hooks/useInfiniteScroll";
import { useLocalStorage } from "../../shared/hooks/useLocalStorage";
import { translations } from "../../translations";
import {
  ROUTES_REQUIRING_MARKETPLACE_DATA,
  getCategoryTranslation,
  resolveCurrentUserId,
} from "./appRoutesUtils";

interface UseMarketplaceRouteStateParams {
  pathname: string;
  searchQuery: string;
  language: Language;
  userProfile: UserProfile;
}

export function useMarketplaceRouteState({
  pathname,
  searchQuery,
  language,
  userProfile,
}: UseMarketplaceRouteStateParams) {
  const normalizedPathname = pathname.toLowerCase().replace(/\/+$/, "");
  const pathSegments = normalizedPathname.split("/").filter(Boolean);
  const primarySegment = pathSegments[0] || "";
  const shouldLoadMarketplaceData =
    primarySegment.length === 0 ||
    ROUTES_REQUIRING_MARKETPLACE_DATA.has(primarySegment);

  const debouncedSearchQuery = useDebounce(
    searchQuery,
    DEBOUNCE_DELAY.SEARCH,
  );

  const [viewMode, setViewMode] = useLocalStorage<ViewMode>(
    "tijarahjo_view_mode",
    "grid-4",
  );

  const {
    availableProducts,
    isLoadingProducts: isLoadingProductsFromRouteData,
    productsError,
    filteredProducts,
    fetchPostsFromBackend,
  } = useProducts(debouncedSearchQuery, {
    enabled: shouldLoadMarketplaceData,
  });

  const { favoriteIds, toggleFavorite } = useFavorites({
    enabled: shouldLoadMarketplaceData,
  });

  const {
    displayedItems,
    isLoading,
    currentPage,
    totalPages,
    goToNextPage,
    goToPreviousPage,
  } = useInfiniteScroll({
    items: filteredProducts,
    itemsPerPage: 12,
  });

  const t = translations[language];
  const isRTL = language === "ar";
  const translateCategory = (category: string) =>
    getCategoryTranslation(category, language);
  const currentUserId = resolveCurrentUserId(userProfile) || undefined;

  return {
    shouldLoadMarketplaceData,
    availableProducts,
    isLoadingProductsFromRouteData,
    productsError,
    displayedItems,
    favoriteIds,
    toggleFavorite,
    viewMode,
    setViewMode,
    currentPage,
    totalPages,
    isLoading,
    goToNextPage,
    goToPreviousPage,
    fetchPostsFromBackend,
    t,
    isRTL,
    translateCategory,
    currentUserId,
  };
}
