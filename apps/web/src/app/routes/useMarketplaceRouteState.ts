import { Language, UserProfile, ViewMode } from "../../types";
import { DEBOUNCE_DELAY } from "../../constants";
import { useDebounce } from "../../shared/hooks/useDebounce";
import { useProducts } from "../../features/marketplace/hooks/useProducts";
import { useFavorites } from "../../features/marketplace/hooks/useFavorites";
import { useInfiniteScroll } from "../../shared/hooks/useInfiniteScroll";
import { useLocalStorage } from "../../shared/hooks/useLocalStorage";
import { translations } from "../../translations";
import {
  getCategoryTranslation,
  resolveCurrentUserId,
  shouldLoadFavoritesForPath,
  shouldLoadProductsForPath,
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
  const shouldLoadProductsData = shouldLoadProductsForPath(pathname);
  const shouldLoadFavoritesData = shouldLoadFavoritesForPath(pathname);

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
    enabled: shouldLoadProductsData,
  });

  const { favoriteIds, toggleFavorite } = useFavorites({
    enabled: shouldLoadFavoritesData,
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
    shouldLoadProductsData,
    shouldLoadFavoritesData,
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
