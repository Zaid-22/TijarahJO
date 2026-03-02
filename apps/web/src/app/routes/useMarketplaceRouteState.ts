import { Language, UserProfile } from "../../types";
import { DEBOUNCE_DELAY } from "../../constants";
import { useDebounce } from "../../shared/hooks/useDebounce";
import { usePosts } from "../../features/marketplace/hooks/usePosts";
import { useFavorites } from "../../features/marketplace/hooks/useFavorites";
import { useMarketplaceDiscoveryState } from "../../shared/hooks/useMarketplaceDiscoveryState";
import { translations } from "../../translations";
import {
  getCategoryTranslation,
  resolveCurrentUserId,
  shouldLoadFavoritesForPath,
  shouldLoadPostsForPath,
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
  const shouldLoadPostsData = shouldLoadPostsForPath(pathname);
  const shouldLoadFavoritesData = shouldLoadFavoritesForPath(pathname);

  const debouncedSearchQuery = useDebounce(
    searchQuery,
    DEBOUNCE_DELAY.SEARCH,
  );

  const {
    availablePosts,
    isLoadingPosts: isLoadingPostsFromRouteData,
    postsError,
    filteredPosts,
    fetchPostsFromBackend,
  } = usePosts(debouncedSearchQuery, {
    enabled: shouldLoadPostsData,
  });

  const { favoriteIds, toggleFavorite } = useFavorites({
    enabled: shouldLoadFavoritesData,
  });

  const {
    viewMode,
    setViewMode,
    displayedResults: displayedPosts,
    pagination,
  } = useMarketplaceDiscoveryState({
    items: filteredPosts,
    itemsPerPage: 12,
  });

  const t = translations[language];
  const isRTL = language === "ar";
  const translateCategory = (category: string) =>
    getCategoryTranslation(category, language);
  const currentUserId = resolveCurrentUserId(userProfile) || undefined;

  return {
    shouldLoadPostsData,
    shouldLoadFavoritesData,
    availablePosts,
    isLoadingPostsFromRouteData,
    postsError,
    displayedPosts,
    favoriteIds,
    toggleFavorite,
    viewMode,
    setViewMode,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    isLoading: pagination.isLoading,
    goToNextPage: pagination.onNext,
    goToPreviousPage: pagination.onPrevious,
    fetchPostsFromBackend,
    t,
    isRTL,
    translateCategory,
    currentUserId,
  };
}
