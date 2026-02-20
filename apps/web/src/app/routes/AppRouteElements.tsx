import { lazy, type ReactElement } from "react";
import { Navigate, Route, type NavigateFunction } from "react-router-dom";
import { Language, Product, UserProfile, ViewMode } from "../../types";
import { deferredToast } from "../../utils/toast";
import {
  applyLoginUserDataToProfile,
  CreatePostInput,
  toEditProfileFormProfile,
  toProfilePageUserProfile,
} from "./appRoutesUtils";
import { CategoryRouteWrapper } from "./CategoryRouteWrapper";
import { ProductDetailsRouteWrapper } from "./ProductDetailsRouteWrapper";
import type { UpdateProductInput } from "./usePostActions";
import type { EditProfileFormProfile } from "../../features/profile/types";

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
  import("../../pages/EditProfilePage").then((m) => ({
    default: m.EditProfilePage,
  })),
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

interface BaseAppRouteProps {
  language: Language;
  isAuthenticated: boolean;
  userProfile: UserProfile;
  darkMode: boolean;
  setDarkMode: (enabled: boolean) => void;
  toggleLanguage: () => void;
  logout: () => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
  currentUserDisplayName: string;
  setSearchQuery: (query: string) => void;
  setActiveSearchQuery: (query: string) => void;
  activeSearchQuery: string;
  searchQuery: string;
}

interface MarketplaceRouteState {
  availableProducts: Product[];
  isLoadingProductsFromRouteData: boolean;
  productsError: string | null;
  displayedItems: Product[];
  favoriteIds: string[];
  toggleFavorite: (productId: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  t: Record<string, string>;
  isRTL: boolean;
  translateCategory: (category: string) => string;
  currentUserId?: string;
}

interface PostActions {
  createPost: (product: CreatePostInput) => Promise<unknown>;
  updatePost: (product: UpdateProductInput) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
}

interface AppRouteElementsParams {
  appProps: BaseAppRouteProps;
  routeState: MarketplaceRouteState;
  postActions: PostActions;
  saveProfile: (profile: EditProfileFormProfile) => Promise<void> | void;
  navigate: NavigateFunction;
  redirectToLogin: () => void;
  requireAuth: (element: ReactElement) => ReactElement;
}

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
      <Route
        path="/"
        element={
          <HomePage
            language={appProps.language}
            isAuthenticated={appProps.isAuthenticated}
            t={routeState.t}
            isRTL={routeState.isRTL}
            darkMode={appProps.darkMode}
            searchQuery={appProps.searchQuery}
            setSearchQuery={appProps.setSearchQuery}
            setShowLoginPrompt={(show) => show && redirectToLogin()}
            setShowSellItem={(show) => {
              if (!show) return;
              if (!appProps.isAuthenticated) {
                redirectToLogin();
                return;
              }
              navigate("/sell");
            }}
            setShowAllProducts={(show) => show && navigate("/products")}
            setSelectedCategoryForPage={(cat) =>
              cat && navigate(`/category/${encodeURIComponent(cat)}`)
            }
            isLoadingProducts={routeState.isLoadingProductsFromRouteData}
            productsError={routeState.productsError}
            displayedItems={routeState.displayedItems}
            viewMode={routeState.viewMode}
            setViewMode={routeState.setViewMode}
            onProductClick={(id) => navigate(`/product/${id}`)}
            favoriteIds={routeState.favoriteIds}
            toggleFavorite={routeState.toggleFavorite}
            currentUserId={
              appProps.isAuthenticated ? routeState.currentUserId : undefined
            }
            currentUserDisplayName={appProps.currentUserDisplayName}
            currentPage={routeState.currentPage}
            totalPages={routeState.totalPages}
            isLoading={routeState.isLoading}
            goToNextPage={routeState.goToNextPage}
            goToPreviousPage={routeState.goToPreviousPage}
            getCategoryTranslation={routeState.translateCategory}
          />
        }
      />

      <Route
        path="/settings"
        element={requireAuth(
          <SettingsPage
            onBackToMarketplace={() => navigate("/")}
            language={appProps.language}
            darkMode={appProps.darkMode}
            onDarkModeChange={appProps.setDarkMode}
            onLanguageChange={appProps.toggleLanguage}
            onLogout={async () => {
              await appProps.logout();
              navigate("/");
            }}
            userProfile={{
              name: appProps.userProfile.name,
              email: appProps.userProfile.email,
              phone: appProps.userProfile.phone,
              location: appProps.userProfile.location,
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
            language={appProps.language}
            favoriteIds={routeState.favoriteIds}
            products={routeState.availableProducts}
            onRemoveFavorite={routeState.toggleFavorite}
            onProductClick={(id) => navigate(`/product/${id}`)}
            isAuthenticated={appProps.isAuthenticated}
            currentUserId={
              appProps.isAuthenticated ? routeState.currentUserId : undefined
            }
          />,
        )}
      />

      <Route
        path="/sell"
        element={requireAuth(
          <SellItemPage
            language={appProps.language}
            onBack={() => navigate("/")}
            onSubmit={async (product) => {
              try {
                await postActions.createPost(product);
                deferredToast.success(
                  appProps.language === "ar"
                    ? "تم نشر المنشور!"
                    : "Post created!",
                );
                navigate("/");
              } catch (error) {
                deferredToast.error(
                  error instanceof Error ? error.message : "Error creating post",
                );
              }
            }}
            userProfile={appProps.userProfile}
            onGoToSettings={() => navigate("/profile/edit")}
            darkMode={appProps.darkMode}
          />,
        )}
      />

      <Route
        path="/products"
        element={
          <AllProductsPage
            onBack={() => navigate("/")}
            language={appProps.language}
            products={routeState.availableProducts}
            onProductClick={(id) => navigate(`/product/${id}`)}
            favoriteIds={routeState.favoriteIds}
            onFavoriteToggle={routeState.toggleFavorite}
            isAuthenticated={appProps.isAuthenticated}
            darkMode={appProps.darkMode}
            currentUserId={
              appProps.isAuthenticated ? routeState.currentUserId : undefined
            }
            currentUserDisplayName={appProps.currentUserDisplayName}
          />
        }
      />

      <Route
        path="/search"
        element={
          <SearchResultsPage
            searchQuery={appProps.activeSearchQuery}
            products={routeState.availableProducts}
            onBack={() => navigate("/")}
            onProductClick={(id) => navigate(`/product/${id}`)}
            language={appProps.language}
            favoriteIds={routeState.favoriteIds}
            onFavoriteToggle={routeState.toggleFavorite}
            isAuthenticated={appProps.isAuthenticated}
            currentUserId={
              appProps.isAuthenticated ? routeState.currentUserId : undefined
            }
            currentUserDisplayName={appProps.currentUserDisplayName}
            onSearch={(newQuery) => {
              appProps.setActiveSearchQuery(newQuery);
              appProps.setSearchQuery(newQuery);
            }}
          />
        }
      />

      <Route
        path="/profile"
        element={requireAuth(
          <ProfilePage
            onBackToMarketplace={() => navigate("/")}
            products={routeState.availableProducts}
            onProductClick={(id) => navigate(`/product/${id}`)}
            onDeleteProduct={async (postId) => {
              try {
                await postActions.deletePost(postId);
                deferredToast.success("Post deleted");
              } catch {
                deferredToast.error("Error deleting post");
              }
            }}
            onUpdateProduct={async (updatedProduct) => {
              try {
                await postActions.updatePost(updatedProduct);
                deferredToast.success("Post updated");
              } catch {
                deferredToast.error("Error updating post");
              }
            }}
            onAddProduct={async (product) => {
              try {
                await postActions.createPost(product);
                deferredToast.success("Post created");
              } catch (error) {
                deferredToast.error(
                  error instanceof Error ? error.message : "Error creating post",
                );
              }
            }}
            onAddProductClick={() => navigate("/sell")}
            onSettingsClick={() => navigate("/settings")}
            onEditProfileClick={() => navigate("/profile/edit")}
            language={appProps.language}
            userProfile={toProfilePageUserProfile(appProps.userProfile)}
            favoriteIds={routeState.favoriteIds}
            onFavoriteToggle={routeState.toggleFavorite}
            isAuthenticated={appProps.isAuthenticated}
            currentUserDisplayName={appProps.currentUserDisplayName}
          />,
        )}
      />

      <Route path="/chat" element={requireAuth(<ChatPage />)} />
      <Route path="/chat/:userId" element={requireAuth(<ChatPage />)} />

      <Route path="/seller/:userId" element={<SellerProfilePage />} />
      <Route
        path="/faq"
        element={
          <FAQPage language={appProps.language} onBack={() => navigate("/")} />
        }
      />

      <Route
        path="/login"
        element={
          <LoginPage
            onLogin={(userData) => {
              appProps.setUserProfile(
                applyLoginUserDataToProfile(appProps.userProfile, userData),
              );
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
            profile={toEditProfileFormProfile(appProps.userProfile)}
            onSave={saveProfile}
            language={appProps.language}
          />,
        )}
      />

      <Route
        path="/category/:categoryName"
        element={
          <CategoryRouteWrapper
            language={appProps.language}
            isAuthenticated={appProps.isAuthenticated}
            currentUserId={
              appProps.isAuthenticated ? routeState.currentUserId : undefined
            }
            currentUserDisplayName={appProps.currentUserDisplayName}
            availableProducts={routeState.availableProducts}
            favoriteIds={routeState.favoriteIds}
            onFavoriteToggle={routeState.toggleFavorite}
            onBack={() => navigate("/")}
            onOpenProduct={(id) => navigate(`/product/${id}`)}
          />
        }
      />
      <Route
        path="/product/:id"
        element={
          <ProductDetailsRouteWrapper
            language={appProps.language}
            availableProducts={routeState.availableProducts}
            isLoadingProducts={routeState.isLoadingProductsFromRouteData}
            isAuthenticated={appProps.isAuthenticated}
            userProfile={appProps.userProfile}
            favoriteIds={routeState.favoriteIds}
            currentUserDisplayName={appProps.currentUserDisplayName}
            onFavoriteToggle={routeState.toggleFavorite}
            onOpenProduct={(id) => navigate(`/product/${id}`)}
            onBack={() => navigate(-1)}
            onNavigateHome={() => navigate("/")}
            onNavigateProfile={() => navigate("/profile")}
            onNavigateSeller={(sellerId) => navigate(`/seller/${sellerId}`)}
            onNavigateChat={(sellerId) => navigate(`/chat/${sellerId}`)}
            onNavigateLogin={() => navigate("/login")}
            onUpdateProduct={postActions.updatePost}
            onDeleteProduct={postActions.deletePost}
          />
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </>
  );
}
