import { Suspense, lazy, useEffect, useState, type ReactElement } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useParams,
  Navigate,
} from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Product, Language, UserProfile, ViewMode } from "../types";
import { toast } from "sonner";
import { api } from "../services/api";
import { APP_CONFIG } from "../constants/appConfig";

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

  // Data
  availableProducts: Product[];
  favoriteIds: string[];
  isLoadingProducts: boolean;
  productsError: string | null;

  // Actions
  toggleFavorite: (id: string) => void;
  fetchPostsFromBackend: () => Promise<void>;
  setDarkMode: (enabled: boolean) => void;
  toggleLanguage: () => void;
  logout: () => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;

  // HomePage specific
  t: any;
  isRTL: boolean;
  displayedItems: Product[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  currentUserDisplayName: string;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  getCategoryTranslation: (key: string) => string;

  // Search
  setSearchQuery: (q: string) => void;
  setActiveSearchQuery: (q: string) => void;
  activeSearchQuery: string;
  searchQuery: string;
  setShowLoginPrompt: (show: boolean) => void;
  setLoginRedirectAction: (action: "sell" | "profile" | null) => void;
  showLoginPrompt: boolean;
  loginRedirectAction: "sell" | "profile" | null;
}

export function AppRoutes(props: AppRoutesProps) {
  const navigate = useNavigate();
  const redirectToLogin = () => navigate("/login");
  const requireAuth = (element: ReactElement) =>
    props.isAuthenticated ? element : <Navigate to="/login" replace />;

  type CreatePostInput = {
    name: string;
    description?: string;
    price: number;
    category: string;
    location?: string;
    area?: string;
    image?: string;
    images?: string[];
  };

  const decodeJwtPayload = (jwtToken: string): Record<string, unknown> | null => {
    const payloadPart = jwtToken.split(".")[1];
    if (!payloadPart) {
      return null;
    }

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

    try {
      return JSON.parse(atob(padded)) as Record<string, unknown>;
    } catch {
      return null;
    }
  };

  const resolveCurrentUserId = (): string | null => {
    const profileId = String(props.userProfile.id || "").trim();
    if (/^\d+$/.test(profileId)) {
      return profileId;
    }

    const token = localStorage.getItem("tijarahjo_token");
    if (!token) {
      return null;
    }

    const payload = decodeJwtPayload(token);
    const tokenUserId = String(
      payload?.nameid ?? payload?.sub ?? payload?.id ?? "",
    ).trim();
    return /^\d+$/.test(tokenUserId) ? tokenUserId : null;
  };

  const resolvePostCity = (preferredCity?: string): string => {
    const city = String(
      preferredCity || props.userProfile.city || APP_CONFIG.defaultCity,
    ).trim();
    return city || APP_CONFIG.defaultCity;
  };

  const resolvePostArea = (preferredArea?: string): string =>
    String(preferredArea || props.userProfile.area || "").trim();

  const resolvePostPhone = (): string => {
    const phone = String(
      props.userProfile.phone || APP_CONFIG.defaultPhonePrefix,
    ).trim();
    return phone || APP_CONFIG.defaultPhonePrefix;
  };

  const buildCreatePostPayload = (product: CreatePostInput) => ({
    // Ensure API receives only valid image URL strings.
    images:
      (product.images?.length
        ? product.images
        : [product.image]
      ).filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      ),
    title: product.name,
    description: product.description || "",
    price: product.price,
    category: product.category,
    city: resolvePostCity(product.location),
    area: resolvePostArea(product.area),
    phone: resolvePostPhone(),
  });

  const createPost = async (product: CreatePostInput) => {
    const result = await api.posts.createPost(buildCreatePostPayload(product));
    if (!result.success) {
      throw new Error(result.message || "Failed to create post");
    }

    await props.fetchPostsFromBackend();
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

    await props.fetchPostsFromBackend();
  };

  const deletePost = async (postId: string) => {
    await api.posts.deletePost(postId);
    await props.fetchPostsFromBackend();
  };

  // Helper to handle category pages based on URL param
  const CategoryRouteWrapper = () => {
    const { categoryName } = useParams();
    let decodedCategory = String(categoryName || "").trim();
    if (decodedCategory) {
      try {
        decodedCategory = decodeURIComponent(decodedCategory).trim();
      } catch {
        // Keep raw value if URL contains malformed encoding instead of crashing the route.
      }
    }

    if (!decodedCategory) {
      return <Navigate to="/" replace />;
    }

    return (
      <CategoryPage
        categoryName={decodedCategory}
        onBack={() => navigate("/")}
        products={props.availableProducts}
        onProductClick={(id: string) => navigate(`/product/${id}`)}
        favoriteIds={props.favoriteIds}
        onFavoriteToggle={props.toggleFavorite}
        language={props.language}
        isAuthenticated={props.isAuthenticated}
        currentUserDisplayName={props.isAuthenticated ? props.currentUserDisplayName : undefined}
      />
    );
  };

  const ProductDetailsRouteWrapper = () => {
    const { id } = useParams();
    const isLoadingProducts = props.isLoadingProducts;
    const product = props.availableProducts.find((p) => p.id === id);
    const [fallbackProduct, setFallbackProduct] = useState<Product | null>(null);
    const [isLoadingFallbackProduct, setIsLoadingFallbackProduct] =
      useState(false);
    const CURRENT_USER_ID = props.userProfile.id;

    useEffect(() => {
      let isCancelled = false;

      setFallbackProduct(null);

      if (!id || isLoadingProducts || product) {
        setIsLoadingFallbackProduct(false);
        return;
      }

      setIsLoadingFallbackProduct(true);

      (async () => {
        try {
          const fetchedProduct = await api.posts.getPost(id);
          if (isCancelled) {
            return;
          }
          setFallbackProduct(fetchedProduct);
        } catch {
          if (!isCancelled) {
            setFallbackProduct(null);
          }
        } finally {
          if (!isCancelled) {
            setIsLoadingFallbackProduct(false);
          }
        }
      })();

      return () => {
        isCancelled = true;
      };
    }, [id, isLoadingProducts, product]);

    const resolvedProduct = product || fallbackProduct;

    if ((isLoadingProducts || isLoadingFallbackProduct) && !resolvedProduct) {
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

    const normalizedSellerName = String(resolvedProduct.seller || "")
      .trim()
      .toLowerCase();
    const normalizedCurrentUserDisplayName = String(props.userProfile.name || "")
      .trim()
      .toLowerCase();
    const isOwnProduct =
      props.isAuthenticated &&
      (resolvedProduct.sellerId === CURRENT_USER_ID ||
        (normalizedSellerName.length > 0 &&
          normalizedSellerName === normalizedCurrentUserDisplayName));

    return (
      <ProductDetailsPage
        product={resolvedProduct}
        onBack={() => navigate(-1)}
        allProducts={props.availableProducts}
        language={props.language}
        onProductClick={(pid: string) => navigate(`/product/${pid}`)}
        onSellerClick={() => {
          if (isOwnProduct) navigate("/profile");
          else {
            const targetSellerId = String(resolvedProduct.sellerId || "").trim();
            if (!targetSellerId) {
              toast.error("Seller profile unavailable");
              return;
            }
            navigate(`/seller/${targetSellerId}`);
          }
        }}
        onChatWithSeller={() => {
          const targetSellerId = String(resolvedProduct.sellerId || "").trim();
          if (!targetSellerId) {
            toast.error("Seller chat unavailable");
            return;
          }

          if (!props.isAuthenticated) {
            navigate("/login");
            return;
          }

          const currentUserId = resolveCurrentUserId();
          if (currentUserId && currentUserId === targetSellerId) {
            toast.error("You cannot chat with yourself");
            return;
          }

          navigate(`/chat/${targetSellerId}`);
        }}
        isOwnProduct={isOwnProduct}
        onUpdateProduct={async (updatedProduct: any) => {
          try {
            await updatePost(updatedProduct);
            toast.success("Post updated");
          } catch (e) {
            toast.error("Error updating");
          }
        }}
        onDeleteProduct={async (pid: string) => {
          try {
            await deletePost(pid);
            toast.success("Post deleted");
            navigate("/");
          } catch (e) {
            toast.error("Error deleting");
          }
        }}
        favoriteIds={props.favoriteIds}
        onFavoriteToggle={props.toggleFavorite}
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
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
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
              t={props.t}
              isRTL={props.isRTL}
              darkMode={props.darkMode}
              searchQuery={props.searchQuery}
              setSearchQuery={props.setSearchQuery}
              setShowLoginPrompt={(show) => show && redirectToLogin()}
              setLoginRedirectAction={props.setLoginRedirectAction}
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
              setShowCategoryPage={() => {}} // No-op, use onCategoryClick
              setSelectedCategoryForPage={(cat) =>
                cat && navigate(`/category/${encodeURIComponent(cat)}`)
              }
              isLoadingProducts={props.isLoadingProducts}
              productsError={props.productsError}
              displayedItems={props.displayedItems}
              viewMode={props.viewMode}
              setViewMode={props.setViewMode}
              onProductClick={(id) => navigate(`/product/${id}`)}
              favoriteIds={props.favoriteIds}
              toggleFavorite={props.toggleFavorite}
              currentUserDisplayName={props.currentUserDisplayName}
              currentPage={props.currentPage}
              totalPages={props.totalPages}
              isLoading={props.isLoading}
              goToNextPage={props.goToNextPage}
              goToPreviousPage={props.goToPreviousPage}
              getCategoryTranslation={props.getCategoryTranslation}
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
            favoriteIds={props.favoriteIds}
            products={props.availableProducts}
            onRemoveFavorite={props.toggleFavorite}
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
                toast.success(
                  props.language === "ar"
                    ? "تم نشر المنشور!"
                    : "Post created!",
                );
                navigate("/");
              } catch (e) {
                toast.error(
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
            products={props.availableProducts}
            onProductClick={(id) => navigate(`/product/${id}`)}
            favoriteIds={props.favoriteIds}
            onFavoriteToggle={props.toggleFavorite}
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
            products={props.availableProducts}
            onBack={() => navigate("/")}
            onProductClick={(id) => navigate(`/product/${id}`)}
            language={props.language}
            favoriteIds={props.favoriteIds}
            onFavoriteToggle={props.toggleFavorite}
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
            products={props.availableProducts}
            onProductClick={(id) => navigate(`/product/${id}`)}
            onDeleteProduct={async (pid) => {
              try {
                await deletePost(pid);
                toast.success("Post deleted");
              } catch (e) {
                toast.error("Error deleting post");
              }
            }}
            onUpdateProduct={async (updatedProduct) => {
              try {
                await updatePost(updatedProduct);
                toast.success("Post updated");
              } catch (e) {
                toast.error("Error updating post");
              }
            }}
            onAddProduct={async (product) => {
              try {
                await createPost(product);
                toast.success("Post created");
              } catch (e) {
                toast.error(
                  e instanceof Error ? e.message : "Error creating post",
                );
              }
            }}
            onAddProductClick={() => navigate("/sell")}
            onSettingsClick={() => navigate("/settings")}
            onEditProfileClick={() => navigate("/profile/edit")}
            language={props.language}
            userProfile={{
              id: props.userProfile.id,
              name: props.userProfile.name,
              firstName: props.userProfile.firstName || "",
              lastName: props.userProfile.lastName || "",
              email: props.userProfile.email,
              phone: props.userProfile.phone,
              location: props.userProfile.location,
              city: props.userProfile.city,
              area: props.userProfile.area,
              bio: props.userProfile.bio,
              avatar: props.userProfile.avatar,
              joinedDate: props.userProfile.joinedDate,
            }}
            favoriteIds={props.favoriteIds}
            onFavoriteToggle={props.toggleFavorite}
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
              const resolvedName =
                `${userData.firstName} ${userData.lastName}`.trim() ||
                userData.email;
              props.setUserProfile({
                ...props.userProfile,
                id:
                  userData.id ||
                  props.userProfile.id ||
                  userData.email,
                name: resolvedName,
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phone: userData.phone || props.userProfile.phone,
                avatar: userData.avatar || props.userProfile.avatar,
                joinedDate: userData.joinedDate || props.userProfile.joinedDate,
              });
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
            profile={{
              id: props.userProfile.id,
              name: props.userProfile.name,
              firstName: props.userProfile.firstName || "",
              lastName: props.userProfile.lastName || "",
              email: props.userProfile.email,
              phone: props.userProfile.phone,
              city: props.userProfile.city || "",
              area: props.userProfile.area || "",
              location: props.userProfile.location,
              bio: props.userProfile.bio,
              avatar: props.userProfile.avatar,
              joinedDate: props.userProfile.joinedDate,
            }}
            onSave={async (updatedProfile) => {
              const resolvedUserId = resolveCurrentUserId();
              if (!resolvedUserId) {
                const message = "Unable to resolve account ID. Please sign in again.";
                toast.error(message);
                throw new Error(message);
              }

              const trimmedFirstName = updatedProfile.firstName.trim();
              const trimmedLastName = updatedProfile.lastName.trim();
              const normalizedEmail = (
                updatedProfile.email || props.userProfile.email
              ).trim();
              if (!normalizedEmail) {
                const message = "Email is required to update your profile.";
                toast.error(message);
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

                toast.success("Profile updated");
                navigate("/profile");
              } catch (error) {
                const errorMessage =
                  error instanceof Error
                    ? error.message
                    : "Failed to update profile";
                toast.error(errorMessage);
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
