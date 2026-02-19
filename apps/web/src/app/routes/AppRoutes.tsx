import { Suspense, lazy, type ReactElement } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Language, UserProfile } from "../../types";
import { deferredToast } from "../../utils/toast";
import {
  applyLoginUserDataToProfile,
  toEditProfileFormProfile,
  toProfilePageUserProfile,
} from "./appRoutesUtils";
import { CategoryRouteWrapper } from "./CategoryRouteWrapper";
import { ProductDetailsRouteWrapper } from "./ProductDetailsRouteWrapper";
import { usePostActions } from "./usePostActions";
import { useProfileSaveAction } from "./useProfileSaveAction";
import { useMarketplaceRouteState } from "./useMarketplaceRouteState";

const HomePage = lazy(() =>
  import("../../pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const ChatPage = lazy(() =>
  import("../../pages/ChatPage").then((m) => ({ default: m.ChatPage })),
);
const SellerProfilePage = lazy(() =>
  import("../../pages/SellerProfilePage").then((m) => ({
    default: m.SellerProfilePage,
  })),
);

const SettingsPage = lazy(() =>
  import("../../pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const FavoritesPage = lazy(() =>
  import("../../pages/FavoritesPage").then((m) => ({ default: m.FavoritesPage })),
);
const AllProductsPage = lazy(() =>
  import("../../pages/AllProductsPage").then((m) => ({
    default: m.AllProductsPage,
  })),
);
const SellItemPage = lazy(() =>
  import("../../pages/SellItemPage").then((m) => ({ default: m.SellItemPage })),
);

const EditProfilePage = lazy(() =>
  import("../../pages/EditProfilePage").then((m) => ({ default: m.EditProfilePage })),
);
const SearchResultsPage = lazy(() =>
  import("../../pages/SearchResultsPage").then((m) => ({
    default: m.SearchResultsPage,
  })),
);
const ProfilePage = lazy(() =>
  import("../../pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const FAQPage = lazy(() =>
  import("../../pages/FAQPage").then((m) => ({ default: m.FAQPage })),
);
const LoginPage = lazy(() =>
  import("../../pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);

interface AppRoutesProps {
  language: Language;
  isAuthenticated: boolean;
  userProfile: UserProfile;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  toggleLanguage: () => void;
  logout: () => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
  currentUserDisplayName: string;
  setSearchQuery: (q: string) => void;
  setActiveSearchQuery: (q: string) => void;
  activeSearchQuery: string;
  searchQuery: string;
}

export function AppRoutes(props: AppRoutesProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
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
  } = useMarketplaceRouteState({
    pathname: location.pathname,
    searchQuery: props.searchQuery,
    language: props.language,
    userProfile: props.userProfile,
  });

  const {
    createPost,
    updatePost,
    deletePost,
  } = usePostActions({
    userProfile: props.userProfile,
    fetchPostsFromBackend,
  });
  const saveProfile = useProfileSaveAction({
    navigate,
    userProfile: props.userProfile,
    setUserProfile: props.setUserProfile,
  });
  const redirectToLogin = () => navigate("/login");
  const requireAuth = (element: ReactElement) =>
    props.isAuthenticated ? element : <Navigate to="/login" replace />;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 gap-3">
          <span
            aria-hidden="true"
            className="h-7 w-7 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin"
          />
          <span>Loading...</span>
        </div>
      }
    >
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              language={props.language}
              isAuthenticated={props.isAuthenticated}
              t={t}
              isRTL={isRTL}
              darkMode={props.darkMode}
              searchQuery={props.searchQuery}
              setSearchQuery={props.setSearchQuery}
              setShowLoginPrompt={(show) => show && redirectToLogin()}
              // Navigation Actions -> convert to Navigate
              setShowSellItem={(show) => {
                if (!show) return;
                if (!props.isAuthenticated) {
                  redirectToLogin();
                  return;
                }
                navigate("/sell");
              }}
              setShowAllProducts={(show) => show && navigate("/products")}
              setSelectedCategoryForPage={(cat) =>
                cat && navigate(`/category/${encodeURIComponent(cat)}`)
              }
              isLoadingProducts={isLoadingProductsFromRouteData}
              productsError={productsError}
              displayedItems={displayedItems}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onProductClick={(id) => navigate(`/product/${id}`)}
              favoriteIds={favoriteIds}
              toggleFavorite={toggleFavorite}
              currentUserId={props.isAuthenticated ? currentUserId : undefined}
              currentUserDisplayName={props.currentUserDisplayName}
              currentPage={currentPage}
              totalPages={totalPages}
              isLoading={isLoading}
              goToNextPage={goToNextPage}
              goToPreviousPage={goToPreviousPage}
              getCategoryTranslation={translateCategory}
            />
          }
        />

      <Route
        path="/settings"
        element={requireAuth(
          <SettingsPage
            onBackToMarketplace={() => navigate("/")}
            language={props.language}
            darkMode={props.darkMode}
            onDarkModeChange={props.setDarkMode}
            onLanguageChange={props.toggleLanguage}
            onLogout={async () => {
              await props.logout();
              navigate("/");
            }}
            userProfile={{
              name: props.userProfile.name,
              email: props.userProfile.email,
              phone: props.userProfile.phone,
              location: props.userProfile.location,
            }}
            onEditProfileClick={() => navigate("/profile/edit")}
          />,
        )}
      />

      <Route
        path="/favorites"
        element={requireAuth(
          <FavoritesPage
            onBackToMarketplace={() => navigate("/")}
            language={props.language}
            favoriteIds={favoriteIds}
            products={availableProducts}
            onRemoveFavorite={toggleFavorite}
            onProductClick={(id) => navigate(`/product/${id}`)}
            isAuthenticated={props.isAuthenticated}
            currentUserId={props.isAuthenticated ? currentUserId : undefined}
          />,
        )}
      />

      <Route
        path="/sell"
        element={requireAuth(
          <SellItemPage
            language={props.language}
            onBack={() => navigate("/")}
            onSubmit={async (product) => {
              try {
                await createPost(product);
                deferredToast.success(
                  props.language === "ar"
                    ? "تم نشر المنشور!"
                    : "Post created!",
                );
                navigate("/");
              } catch (e) {
                deferredToast.error(
                  e instanceof Error ? e.message : "Error creating post",
                );
              }
            }}
            userProfile={props.userProfile}
            onGoToSettings={() => navigate("/profile/edit")}
            darkMode={props.darkMode}
          />,
        )}
      />

      <Route
        path="/products"
        element={
          <AllProductsPage
            onBack={() => navigate("/")}
            language={props.language}
            products={availableProducts}
            onProductClick={(id) => navigate(`/product/${id}`)}
            favoriteIds={favoriteIds}
            onFavoriteToggle={toggleFavorite}
            isAuthenticated={props.isAuthenticated}
            darkMode={props.darkMode}
            currentUserId={props.isAuthenticated ? currentUserId : undefined}
            currentUserDisplayName={props.currentUserDisplayName}
          />
        }
      />

      <Route
        path="/search"
        element={
          <SearchResultsPage
            searchQuery={props.activeSearchQuery}
            products={availableProducts}
            onBack={() => navigate("/")}
            onProductClick={(id) => navigate(`/product/${id}`)}
            language={props.language}
            favoriteIds={favoriteIds}
            onFavoriteToggle={toggleFavorite}
            isAuthenticated={props.isAuthenticated}
            currentUserId={props.isAuthenticated ? currentUserId : undefined}
            currentUserDisplayName={props.currentUserDisplayName}
            onSearch={(newQuery) => {
              props.setActiveSearchQuery(newQuery);
              props.setSearchQuery(newQuery);
            }}
          />
        }
      />

      <Route
        path="/profile"
        element={requireAuth(
          <ProfilePage
            onBackToMarketplace={() => navigate("/")}
            products={availableProducts}
            onProductClick={(id) => navigate(`/product/${id}`)}
            onDeleteProduct={async (pid) => {
              try {
                await deletePost(pid);
                deferredToast.success("Post deleted");
              } catch (e) {
                deferredToast.error("Error deleting post");
              }
            }}
            onUpdateProduct={async (updatedProduct) => {
              try {
                await updatePost(updatedProduct);
                deferredToast.success("Post updated");
              } catch (e) {
                deferredToast.error("Error updating post");
              }
            }}
            onAddProduct={async (product) => {
              try {
                await createPost(product);
                deferredToast.success("Post created");
              } catch (e) {
                deferredToast.error(
                  e instanceof Error ? e.message : "Error creating post",
                );
              }
            }}
            onAddProductClick={() => navigate("/sell")}
            onSettingsClick={() => navigate("/settings")}
            onEditProfileClick={() => navigate("/profile/edit")}
            language={props.language}
            userProfile={toProfilePageUserProfile(props.userProfile)}
            favoriteIds={favoriteIds}
            onFavoriteToggle={toggleFavorite}
            isAuthenticated={props.isAuthenticated}
            currentUserDisplayName={props.currentUserDisplayName}
          />,
        )}
      />

      <Route path="/chat" element={requireAuth(<ChatPage />)} />
      <Route path="/chat/:userId" element={requireAuth(<ChatPage />)} />

      <Route path="/seller/:userId" element={<SellerProfilePage />} />
      <Route
        path="/faq"
        element={
          <FAQPage language={props.language} onBack={() => navigate("/")} />
        }
      />

      <Route
        path="/login"
        element={
          <LoginPage
            onLogin={(userData) => {
              props.setUserProfile(
                applyLoginUserDataToProfile(props.userProfile, userData),
              );
              // Navigate back or to home
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/");
              }
            }}
            onContinueAsGuest={() => navigate("/")}
          />
        }
      />

      <Route
        path="/profile/edit"
        element={requireAuth(
          <EditProfilePage
            onBack={() => navigate("/profile")}
            profile={toEditProfileFormProfile(props.userProfile)}
            onSave={saveProfile}
            language={props.language}
          />,
        )}
      />

      {/* Dynamic Routes */}
        <Route
          path="/category/:categoryName"
          element={
            <CategoryRouteWrapper
              language={props.language}
              isAuthenticated={props.isAuthenticated}
              currentUserId={props.isAuthenticated ? currentUserId : undefined}
              currentUserDisplayName={props.currentUserDisplayName}
              availableProducts={availableProducts}
              favoriteIds={favoriteIds}
              onFavoriteToggle={toggleFavorite}
              onBack={() => navigate("/")}
              onOpenProduct={(id) => navigate(`/product/${id}`)}
            />
          }
        />
        <Route
          path="/product/:id"
          element={
            <ProductDetailsRouteWrapper
              language={props.language}
              availableProducts={availableProducts}
              isLoadingProducts={isLoadingProductsFromRouteData}
              isAuthenticated={props.isAuthenticated}
              userProfile={props.userProfile}
              favoriteIds={favoriteIds}
              currentUserDisplayName={props.currentUserDisplayName}
              onFavoriteToggle={toggleFavorite}
              onOpenProduct={(id) => navigate(`/product/${id}`)}
              onBack={() => navigate(-1)}
              onNavigateHome={() => navigate("/")}
              onNavigateProfile={() => navigate("/profile")}
              onNavigateSeller={(sellerId) => navigate(`/seller/${sellerId}`)}
              onNavigateChat={(sellerId) => navigate(`/chat/${sellerId}`)}
              onNavigateLogin={() => navigate("/login")}
              onUpdateProduct={updatePost}
              onDeleteProduct={deletePost}
            />
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
