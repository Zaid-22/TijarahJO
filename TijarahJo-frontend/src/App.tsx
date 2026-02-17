import { useEffect, useLayoutEffect } from "react";
import { translations } from "./translations";
import { categoryData } from "./data/categoryData";
import { Loader2 } from "lucide-react";
import { COLORS } from "./constants/colors";
import { useNavigate, useLocation } from "react-router-dom";

// Components
import { Footer } from "./components/figma/Footer";
import { Header } from "./components/figma/Header";
import { ScrollToTop } from "./components/ui/ScrollToTop";

// Hooks
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useFavorites } from "./hooks/useFavorites";
import { useDebounce } from "./hooks/useDebounce";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";
import { DEBOUNCE_DELAY } from "./constants";
import { useAuth } from "./contexts/AuthContext";
import { AppRoutes } from "./routes/AppRoutes";
import { useProducts } from "./hooks/useProducts";
import { useUserProfile } from "./hooks/useUserProfile";
import { useAppTheme } from "./hooks/useAppTheme";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const normalizedPathname = location.pathname
    .toLowerCase()
    .replace(/\/+$/, "");
  const pathSegments = normalizedPathname.split("/").filter(Boolean);
  const primarySegment = pathSegments[0] || "";
  const isAuthRoute = primarySegment === "login";
  const hasLocalPageHeader = new Set([
    "profile",
    "settings",
    "products",
    "favorites",
    "sell",
    "faq",
    "product",
    "category",
    "seller",
  ]).has(primarySegment);
  const shouldShowGlobalHeader = !isAuthRoute && !hasLocalPageHeader;

  // Custom Hooks
  const { userProfile, setUserProfile, currentUserDisplayName } = useUserProfile();
  const {
    darkMode,
    setDarkMode,
    language,
    toggleLanguage,
    viewMode,
    setViewMode,
    isRTL,
  } = useAppTheme();

  // Search State
  const [searchQuery, setSearchQuery] = useLocalStorage(
    "tijarahjo_search_query",
    "",
  );
  const [activeSearchQuery, setActiveSearchQuery] = useLocalStorage(
    "tijarahjo_active_search_query",
    "",
  );
  const debouncedSearchQuery = useDebounce(searchQuery, DEBOUNCE_DELAY.SEARCH);

  // Products Data
  const {
    availableProducts,
    isLoadingProducts,
    productsError,
    filteredProducts,
    fetchPostsFromBackend,
  } = useProducts(debouncedSearchQuery);

  // Favorites
  const { favoriteIds, toggleFavorite } = useFavorites();

  // Login Modal State

  // Effects
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      const previous = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";
      return () => {
        window.history.scrollRestoration = previous;
      };
    }
  }, []);

  useEffect(() => {
    const dedupeGlobalFooters = () => {
      const footers = Array.from(
        document.querySelectorAll<HTMLElement>(
          'footer[data-app-global-footer="true"]',
        ),
      );

      footers.forEach((footer, index) => {
        if (index > 0) {
          footer.remove();
        }
      });
    };

    dedupeGlobalFooters();

    const observer = new MutationObserver(() => {
      dedupeGlobalFooters();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.title = "TijarahJo - Jordan's Marketplace";
    // Favicon Setup
    const svg = `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="32" width="60" height="56" rx="6" fill="${COLORS.PRIMARY}"/>
        <path d="M32 32V24C32 17.373 37.373 12 44 12H56C62.627 12 68 17.373 68 24V32" stroke="${COLORS.PRIMARY}" stroke-width="6" stroke-linecap="round" fill="none"/>
        <circle cx="50" cy="58" r="12" fill="white"/>
        <text x="50" y="64" font-size="18" font-weight="700" fill="${COLORS.PRIMARY}" text-anchor="middle">T</text>
      </svg>
    `;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    let favicon = document.querySelector(
      "link[rel*='icon']",
    ) as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = url;
    return () => URL.revokeObjectURL(url);
  }, []);

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

  const getCategoryTranslation = (category: string) => {
    const categoryItem = categoryData.find((cat) => cat.name === category);
    if (categoryItem)
      return language === "ar" ? categoryItem.nameAr : categoryItem.name;
    return category;
  };

  const t = translations[language];

  const globalHeader = shouldShowGlobalHeader ? (
    <Header
      language={language}
      isAuthenticated={isAuthenticated}
      currentUserDisplayName={userProfile.name}
      userAvatar={userProfile.avatar}
      userFirstName={userProfile.firstName}
      userLastName={userProfile.lastName}
      showBackButton={false}
      showLogo={true}
      showSearch={true}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSearchSubmit={() => {
        setActiveSearchQuery(searchQuery.trim());
        navigate("/search");
      }}
      onShowFavorites={() => navigate("/favorites")}
      onShowProfile={() => {
        if (isAuthenticated) navigate("/profile");
        else navigate("/login");
      }}
      onShowSettings={() => navigate("/settings")}
      onShowSellItem={() => navigate("/sell")}
      onLogout={logout}
      onCategoryClick={(cat) => navigate(`/category/${encodeURIComponent(cat)}`)}
      darkMode={darkMode}
    />
  ) : null;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] flex flex-col">
        {globalHeader}
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] flex flex-col">
      {globalHeader}

      <div className="flex-1">
        <AppRoutes
          language={language}
          isAuthenticated={isAuthenticated}
          userProfile={userProfile}
          darkMode={darkMode}
          // Data
          availableProducts={availableProducts}
          favoriteIds={favoriteIds}
          isLoadingProducts={isLoadingProducts}
          productsError={productsError}
          // Actions
          toggleFavorite={toggleFavorite}
          fetchPostsFromBackend={fetchPostsFromBackend}
          setDarkMode={setDarkMode}
          toggleLanguage={toggleLanguage}
          logout={logout}
          setUserProfile={setUserProfile}
          // HomePage specific
          t={t}
          isRTL={isRTL}
          displayedItems={displayedItems}
          viewMode={viewMode}
          setViewMode={setViewMode}
          currentPage={currentPage}
          totalPages={totalPages}
          isLoading={isLoading}
          currentUserDisplayName={currentUserDisplayName}
          goToNextPage={goToNextPage}
          goToPreviousPage={goToPreviousPage}
          getCategoryTranslation={getCategoryTranslation}
          // Search
          setSearchQuery={setSearchQuery}
          setActiveSearchQuery={setActiveSearchQuery}
          activeSearchQuery={activeSearchQuery}
          searchQuery={searchQuery}
          setShowLoginPrompt={() => {}} // Deprecated
          setLoginRedirectAction={() => {}} // Deprecated
          showLoginPrompt={false} // Deprecated
          loginRedirectAction={null} // Deprecated
        />
      </div>

      {!isAuthRoute && <Footer language={language} />}
      <ScrollToTop />
    </div>
  );
}
