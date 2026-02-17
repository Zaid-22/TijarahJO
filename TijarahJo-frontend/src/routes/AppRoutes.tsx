import { Suspense, lazy, type ReactElement } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useParams,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Language, UserProfile, ViewMode } from "../types";
import { api } from "../services/api";
import { deferredToast } from "../utils/toast";
import { translations } from "../translations";
import { DEBOUNCE_DELAY } from "../constants";
import { useDebounce } from "../hooks/useDebounce";
import { useProducts } from "../hooks/useProducts";
import { useFavorites } from "../hooks/useFavorites";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  ROUTES_REQUIRING_MARKETPLACE_DATA,
  applyLoginUserDataToProfile,
  buildCreatePostPayload,
  CreatePostInput,
  decodeCategoryParam,
  getCategoryTranslation,
  resolveCurrentUserId,
  toEditProfileFormProfile,
  toProfilePageUserProfile,
} from "./appRoutesUtils";
import { useProductDetailsRouteData } from "./useProductDetailsRouteData";

const HomePage = lazy(() =>
  import("../pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const ChatPage = lazy(() =>
  import("../pages/ChatPage").then((m) => ({ default: m.ChatPage })),
);
const SellerProfilePage = lazy(() =>
  import("../pages/SellerProfilePage").then((m) => ({
    default: m.SellerProfilePage,
  })),
);

const SettingsPage = lazy(() =>
  import("../pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const FavoritesPage = lazy(() =>
  import("../pages/FavoritesPage").then((m) => ({ default: m.FavoritesPage })),
);
const AllProductsPage = lazy(() =>
  import("../pages/AllProductsPage").then((m) => ({
    default: m.AllProductsPage,
  })),
);
const SellItemPage = lazy(() =>
  import("../pages/SellItemPage").then((m) => ({ default: m.SellItemPage })),
);
const ProductDetailsPage = lazy(() =>
  import("../pages/ProductDetailsPage").then((m) => ({
    default: m.ProductDetailsPage,
  })),
);

const EditProfilePage = lazy(() =>
  import("../pages/EditProfilePage").then((m) => ({ default: m.EditProfilePage })),
);
const SearchResultsPage = lazy(() =>
  import("../pages/SearchResultsPage").then((m) => ({
    default: m.SearchResultsPage,
  })),
);
const ProfilePage = lazy(() =>
  import("../pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const FAQPage = lazy(() =>
  import("../pages/FAQPage").then((m) => ({ default: m.FAQPage })),
);
const LoginPage = lazy(() =>
  import("../pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const CategoryPage = lazy(() =>
  import("../pages/CategoryPage").then((m) => ({ default: m.CategoryPage })),
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
  const normalizedPathname = location.pathname.toLowerCase().replace(/\/+$/, "");
  const pathSegments = normalizedPathname.split("/").filter(Boolean);
  const primarySegment = pathSegments[0] || "";
  const shouldLoadMarketplaceData =
    primarySegment.length === 0 ||
    ROUTES_REQUIRING_MARKETPLACE_DATA.has(primarySegment);

  const debouncedSearchQuery = useDebounce(
    props.searchQuery,
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

  const t = translations[props.language];
  const isRTL = props.language === "ar";
  const translateCategory = (category: string) =>
    getCategoryTranslation(category, props.language);

  const redirectToLogin = () => navigate("/login");
  const requireAuth = (element: ReactElement) =>
    props.isAuthenticated ? element : <Navigate to="/login" replace />;

  const createPost = async (product: CreatePostInput) => {
    const result = await api.posts.createPost(
      buildCreatePostPayload(product, props.userProfile),
    );
    if (!result.success) {
      throw new Error(result.message || "Failed to create post");
    }

    await fetchPostsFromBackend();
    return result;
  };

  const updatePost = async (updatedProduct: {
    id: string;
    name: string;
    description?: string;
    price: number;
    category: string;
    status?: "ACTIVE" | "SOLD" | "DELETED";
    images?: string[];
  }) => {
    await api.posts.updatePost({
      id: updatedProduct.id,
      title: updatedProduct.name,
      description: updatedProduct.description,
      price: updatedProduct.price,
      category: updatedProduct.category,
      status: updatedProduct.status,
      images: updatedProduct.images || [],
    });

    await fetchPostsFromBackend();
  };

  const deletePost = async (postId: string) => {
    await api.posts.deletePost(postId);
    await fetchPostsFromBackend();
  };

  // Helper to handle category pages based on URL param
  const CategoryRouteWrapper = () => {
    const { categoryName } = useParams();
    const decodedCategory = decodeCategoryParam(categoryName);

    if (!decodedCategory) {
      return <Navigate to="/" replace />;
    }

    return (
      <CategoryPage
        categoryName={decodedCategory}
        onBack={() => navigate("/")}
        products={availableProducts}
        onProductClick={(id: string) => navigate(`/product/${id}`)}
        favoriteIds={favoriteIds}
        onFavoriteToggle={toggleFavorite}
        language={props.language}
        isAuthenticated={props.isAuthenticated}
        currentUserDisplayName={props.isAuthenticated ? props.currentUserDisplayName : undefined}
      />
    );
  };

  const ProductDetailsRouteWrapper = () => {
    const { id } = useParams();
    const { resolvedProduct, isLoadingRouteProduct, isOwnProduct } =
      useProductDetailsRouteData({
        id,
        availableProducts,
        isLoadingProducts: isLoadingProductsFromRouteData,
        isAuthenticated: props.isAuthenticated,
        userProfile: props.userProfile,
      });

    if (isLoadingRouteProduct) {
      return (
        <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
          Loading product...
        </div>
      );
    }

    if (!resolvedProduct) {
      return (
        <div className="p-10 text-center">
          Product not found.{" "}
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 underline"
          >
            Go Home
          </button>
        </div>
      );
    }

    return (
      <ProductDetailsPage
        product={resolvedProduct}
        onBack={() => navigate(-1)}
        allProducts={availableProducts}
        language={props.language}
        onProductClick={(pid: string) => navigate(`/product/${pid}`)}
        onSellerClick={() => {
          if (isOwnProduct) navigate("/profile");
          else {
            const targetSellerId = String(resolvedProduct.sellerId || "").trim();
            if (!targetSellerId) {
              deferredToast.error("Seller profile unavailable");
              return;
            }
            navigate(`/seller/${targetSellerId}`);
          }
        }}
        onChatWithSeller={() => {
          const targetSellerId = String(resolvedProduct.sellerId || "").trim();
          if (!targetSellerId) {
            deferredToast.error("Seller chat unavailable");
            return;
          }

          if (!props.isAuthenticated) {
            navigate("/login");
            return;
          }

          const currentUserId = resolveCurrentUserId(
            props.userProfile,
            localStorage.getItem("tijarahjo_token"),
          );
          if (currentUserId && currentUserId === targetSellerId) {
            deferredToast.error("You cannot chat with yourself");
            return;
          }

          navigate(`/chat/${targetSellerId}`);
        }}
        isOwnProduct={isOwnProduct}
        onUpdateProduct={async (updatedProduct: any) => {
          try {
            await updatePost(updatedProduct);
            deferredToast.success("Post updated");
          } catch (e) {
            deferredToast.error("Error updating");
          }
        }}
        onDeleteProduct={async (pid: string) => {
          try {
            await deletePost(pid);
            deferredToast.success("Post deleted");
            navigate("/");
          } catch (e) {
            deferredToast.error("Error deleting");
          }
        }}
        favoriteIds={favoriteIds}
        onFavoriteToggle={toggleFavorite}
        isAuthenticated={props.isAuthenticated}
        currentUserDisplayName={props.currentUserDisplayName}
      />
    );
  };

  // Seller logic removed for now
  // const SellerProfileRouteWrapper = () => { ... }

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
            onSave={async (updatedProfile) => {
              const resolvedUserId = resolveCurrentUserId(
                props.userProfile,
                localStorage.getItem("tijarahjo_token"),
              );
              if (!resolvedUserId) {
                const message = "Unable to resolve account ID. Please sign in again.";
                deferredToast.error(message);
                throw new Error(message);
              }

              const trimmedFirstName = updatedProfile.firstName.trim();
              const trimmedLastName = updatedProfile.lastName.trim();
              const normalizedEmail = (
                updatedProfile.email || props.userProfile.email
              ).trim();
              if (!normalizedEmail) {
                const message = "Email is required to update your profile.";
                deferredToast.error(message);
                throw new Error(message);
              }

              try {
                await api.users.updateUser(resolvedUserId, {
                  Email: normalizedEmail,
                  FirstName: trimmedFirstName,
                  LastName: trimmedLastName,
                  Phone: updatedProfile.phone?.trim() || null,
                });

                props.setUserProfile({
                  ...props.userProfile,
                  ...updatedProfile,
                  id: resolvedUserId,
                  firstName: trimmedFirstName,
                  lastName: trimmedLastName,
                  email: normalizedEmail,
                  name:
                    `${trimmedFirstName} ${trimmedLastName}`.trim() ||
                    normalizedEmail,
                });

                deferredToast.success("Profile updated");
                navigate("/profile");
              } catch (error) {
                const errorMessage =
                  error instanceof Error
                    ? error.message
                    : "Failed to update profile";
                deferredToast.error(errorMessage);
                throw error;
              }
            }}
            language={props.language}
          />,
        )}
      />

      {/* Dynamic Routes */}
        <Route
          path="/category/:categoryName"
          element={<CategoryRouteWrapper />}
        />
        <Route path="/product/:id" element={<ProductDetailsRouteWrapper />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
