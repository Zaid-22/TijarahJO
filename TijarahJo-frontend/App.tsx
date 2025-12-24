import { useState, useEffect, useMemo } from "react";
import { Product, Language, UserProfile } from "./types";
import { translations } from "./translations";
// Mock products removed - using real backend API only
// import { mockUsers } from "./data/mockUsers"; // Unused
import { categoryData } from "./data/categoryData";
import { api } from "./services/api";
import { Button } from "./components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./components/ui/pagination";
import { toast } from "sonner";
// import { Toaster } from "./components/ui/sonner"; // Moved to main.tsx
import {
  Search,
  Loader2,
  Grid3x3,
  LayoutGrid,
  Columns,
  List,
  User,
} from "lucide-react";
import { ProductCard } from "./components/figma/ProductCard";
import { ProfilePage } from "./components/figma/ProfilePage";
import { SettingsPage } from "./components/figma/SettingsPage";
import { FavoritesPage } from "./components/figma/FavoritesPage";
import { AllProductsPage } from "./components/figma/AllProductsPage";
import { SellItemPage } from "./components/figma/SellItemPage";
import { ProductDetailsPage } from "./components/figma/ProductDetailsPage";
import { SellerProfilePage } from "./components/figma/SellerProfilePage";
import { EditProfilePage } from "./components/figma/EditProfilePage";
import { SearchResultsPage } from "./components/figma/SearchResultsPage";
import { LoginPage } from "./components/figma/LoginPage";
import { Footer } from "./components/figma/Footer";
import { ElectronicsPage } from "./components/figma/ElectronicsPage";
import { MobilePhonesTabletsPage } from "./components/figma/MobilePhonesTabletsPage";
import { ComputersLaptopsPage } from "./components/figma/ComputersLaptopsPage";
import { HomeAppliancesPage } from "./components/figma/HomeAppliancesPage";
import { FurniturePage } from "./components/figma/FurniturePage";
import { VehiclesPage } from "./components/figma/VehiclesPage";
import { FashionClothingPage } from "./components/figma/FashionClothingPage";
import { HealthBeautyPage } from "./components/figma/HealthBeautyPage";
import { SportsFitnessPage } from "./components/figma/SportsFitnessPage";
import { BooksStationeryPage } from "./components/figma/BooksStationeryPage";
import { ToysGamesPage } from "./components/figma/ToysGamesPage";
import { RealEstatePage } from "./components/figma/RealEstatePage";
import { PetsAnimalsPage } from "./components/figma/PetsAnimalsPage";
import { ServicesPage } from "./components/figma/ServicesPage";
import { OtherPage } from "./components/figma/OtherPage";
import { Header } from "./components/figma/Header";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useFavorites } from "./hooks/useFavorites";
import { useDebounce } from "./hooks/useDebounce";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";
import { DEBOUNCE_DELAY } from "./constants";
// import { idGenerators } from "./utils/idGenerator"; // Unused
import { useAuth } from "./contexts/AuthContext";

export default function App() {
  // Debug: Log that App is rendering (disabled in production)
  // console.log("App component is rendering...");

  // Get current user from AuthContext
  const { user, isAuthenticated, loading: authLoading, logout, checkAuth } = useAuth();
  
  // Current user information from AuthContext
  const CURRENT_USER_ID = user?.id || "";
  const CURRENT_USER_NAME = user?.name || user?.firstName || "Guest";

  // Set document title and favicon
  // IMPORTANT: All hooks must be called before any conditional returns
  useEffect(() => {
    // Set page title
    document.title = "TijarahJo - Jordan's Marketplace";

    // Create and set favicon using SVG
    const svg = `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="32" width="60" height="56" rx="6" fill="#0A4ABF"/>
        <path d="M32 32V24C32 17.373 37.373 12 44 12H56C62.627 12 68 17.373 68 24V32" stroke="#0A4ABF" stroke-width="6" stroke-linecap="round" fill="none"/>
        <circle cx="50" cy="58" r="12" fill="white"/>
        <text x="50" y="64" font-size="18" font-weight="700" fill="#0A4ABF" text-anchor="middle">T</text>
      </svg>
    `;

    // Convert SVG to data URL
    const svgBlob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);

    // Check if favicon link exists, if not create it
    let favicon = document.querySelector(
      "link[rel*='icon']"
    ) as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }

    // Set the favicon
    favicon.href = url;

    // Cleanup
    return () => {
      URL.revokeObjectURL(url);
    };
  }, []);

  // Persist navigation state to localStorage
  const [showProfile, setShowProfile] = useLocalStorage("tijarahjo_show_profile", false);
  const [showSettings, setShowSettings] = useLocalStorage("tijarahjo_show_settings", false);
  const [showFavorites, setShowFavorites] = useLocalStorage("tijarahjo_show_favorites", false);
  const [showAllProducts, setShowAllProducts] = useLocalStorage("tijarahjo_show_all_products", false);
  const [showSellItem, setShowSellItem] = useLocalStorage("tijarahjo_show_sell_item", false);
  const [showSellerProfile, setShowSellerProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useLocalStorage("tijarahjo_show_edit_profile", false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginRedirectAction, setLoginRedirectAction] = useState<
    "sell" | "profile" | null
  >(null);
  // Persist selectedProductId to maintain navigation state on page reload
  const [selectedProductId, setSelectedProductId] = useLocalStorage<string | null>(
    "tijarahjo_selected_product_id",
    null
  );
  const [availableProducts, setAvailableProducts] =
    useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productDetailsOrigin, setProductDetailsOrigin] = useLocalStorage<
    | "marketplace"
    | "favorites"
    | "allProducts"
    | "searchResults"
    | "categoryPage"
    | "profile"
    | null
  >("tijarahjo_product_details_origin", null);
  const [productDetailsOriginCategory, setProductDetailsOriginCategory] = useLocalStorage<string | null>(
    "tijarahjo_product_details_origin_category",
    null
  ); // Track which category user came from
  const [profileOrigin, setProfileOrigin] = useState<
    "marketplace" | "favorites" | "searchResults" | "settings" | null
  >(null);
  // Removed unused settingsOrigin state
  const [searchQuery, setSearchQuery] = useLocalStorage("tijarahjo_search_query", "");
  const [showSearchResults, setShowSearchResults] = useLocalStorage("tijarahjo_show_search_results", false);
  const [activeSearchQuery, setActiveSearchQuery] = useLocalStorage("tijarahjo_active_search_query", "");
  const [showCategoryPage, setShowCategoryPage] = useLocalStorage("tijarahjo_show_category_page", false);
  const [selectedCategoryForPage, setSelectedCategoryForPage] = useLocalStorage<string | null>(
    "tijarahjo_selected_category",
    null
  );

  // Authentication state is now managed by AuthContext via useAuth()
  // Removed duplicate isAuthenticated from useLocalStorage since it's provided by useAuth()
  const [darkMode, setDarkMode] = useLocalStorage("tijarahjo_dark_mode", false);
  const [language, setLanguage] = useLocalStorage<Language>(
    "tijarahjo_language",
    "en"
  );
  const [viewMode, setViewMode] = useLocalStorage<
    "grid-4" | "grid-3" | "grid-2" | "list"
  >("tijarahjo_view_mode", "grid-4");

  // Use favorites hook with localStorage persistence
  const { favoriteIds, toggleFavorite } = useFavorites();

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, DEBOUNCE_DELAY.SEARCH);

  // User profile state - initialize from AuthContext user
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: CURRENT_USER_ID,
    name: CURRENT_USER_NAME,
    firstName: user?.firstName || "",
    middleName: undefined,
    lastName: user?.lastName || "",
    username: user?.username || "",
    email: user?.email || "",
    phone: "",
    city: "",
    area: "",
    location: "",
    bio: "",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    joinedDate: "Jan 2024",
  });

  const t = translations[language];
  const isRTL = language === "ar";

  // Update document direction when language changes
  useEffect(() => {
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [isRTL, language]);

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Function to fetch posts from backend (reusable for refetching after CRUD operations)
  const fetchPostsFromBackend = async () => {
    setIsLoadingProducts(true);
    setProductsError(null);

    try {
      const response = await api.posts.getPosts();

      if (response.success) {
        // Always use database data, even if empty array
        if (response.posts && response.posts.length > 0) {
          setAvailableProducts(response.posts);
          setProductsError(null); // Clear any previous errors
        } else {
          // Show empty state, don't use mock data, don't show error
          setAvailableProducts([]);
          setProductsError(null); // No error - database is just empty
        }
      } else {
        // Response was not successful
        const errorMsg = response.error?.message || "Failed to load posts from backend";
        setProductsError(errorMsg);
        setAvailableProducts([]);
      }
    } catch (error) {
      console.error("Error fetching posts from backend:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load products from database.";
      setProductsError(errorMessage);
      setAvailableProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Fetch posts from backend on component mount
  useEffect(() => {
    fetchPostsFromBackend();
  }, []); // Only run once on mount

  // Validate persisted product ID when products are loaded
  // Clear it if the product no longer exists (e.g., was deleted)
  // Only validate after products have finished loading
  useEffect(() => {
    if (selectedProductId && !isLoadingProducts && availableProducts.length > 0) {
      const productExists = availableProducts.some((p) => p.id === selectedProductId);
      if (!productExists) {
        console.log("[App] Persisted product ID not found in available products, clearing navigation state");
        setSelectedProductId(null);
        setProductDetailsOrigin(null);
        setProductDetailsOriginCategory(null);
      }
    }
  }, [availableProducts, selectedProductId, isLoadingProducts]);

  // Clear navigation state when explicitly navigating away (not on mount)
  // Navigation state is now persisted to maintain page state on reload
  // This allows users to refresh the page and stay on the same view

  // Sync userProfile with AuthContext user when user changes
  useEffect(() => {
    if (user && isAuthenticated) {
      // Update userProfile from AuthContext user
      const fullName = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "";
      setUserProfile((prev) => ({
        ...prev,
        id: user.id || prev.id,
        name: fullName,
        firstName: user.firstName || prev.firstName || "",
        lastName: user.lastName || prev.lastName || "",
        username: user.username || prev.username || "",
        email: user.email || prev.email || "",
        avatar: user.avatar || prev.avatar,
      }));

      // Fetch full user profile data from backend
      const fetchUserProfile = async () => {
        try {
          const response = await api.auth.getCurrentUser();
          if (response.success && response.data) {
            const backendUser = response.data as any;
            const firstName = backendUser.FirstName || backendUser.firstName || user.firstName || "";
            const lastName = backendUser.LastName || backendUser.lastName || user.lastName || "";
            const fullName = backendUser.Name || `${firstName} ${lastName}`.trim() || user.email || "";
            
            setUserProfile({
              id: (backendUser.Id || backendUser.id || user.id || "").toString(),
              name: fullName,
              firstName: firstName,
              lastName: lastName,
              username: backendUser.Username || backendUser.username || user.username || "",
              email: backendUser.Email || backendUser.email || user.email || "",
              phone: backendUser.Phone || backendUser.phone || "",
              city: backendUser.City || backendUser.city || "",
              area: backendUser.Area || backendUser.area || "",
              location: backendUser.Location || backendUser.location || backendUser.City || backendUser.city || "",
              bio: backendUser.Bio || backendUser.bio || "",
              avatar: backendUser.Avatar || backendUser.avatar || user.avatar || "",
              joinedDate: backendUser.JoinedDate 
                ? new Date(backendUser.JoinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : backendUser.joinDate
                ? new Date(backendUser.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                : "Jan 2024",
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Keep the user data from AuthContext even if profile fetch fails
        }
      };

      fetchUserProfile();
    } else if (!isAuthenticated) {
      // Reset to guest state if not authenticated
      setUserProfile({
        id: "",
        name: "Guest",
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        phone: "",
        city: "",
        area: "",
        location: "",
        bio: "",
        avatar: "",
        joinedDate: "Jan 2024",
      });
    }
  }, [user, isAuthenticated]); // Update when user or isAuthenticated changes

  // Memoize filtered products for better performance
  // IMPORTANT: All hooks must be called before any conditional returns
  const filteredProducts = useMemo(() => {
    let products = availableProducts;

    // Filter out SOLD and DELETED products from main marketplace feed
    products = products.filter(
      (p) => p.status !== "SOLD" && p.status !== "DELETED"
    );

    // Filter by debounced search query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();

      products = products.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(query);
        const categoryMatch = p.category.toLowerCase().includes(query);
        const locationMatch = p.location.toLowerCase().includes(query);
        const sellerMatch = p.seller.toLowerCase().includes(query);

        return nameMatch || categoryMatch || locationMatch || sellerMatch;
      });
    }

    return products;
  }, [availableProducts, debouncedSearchQuery]);

  // Use infinite scroll hook for pagination
  const {
    displayedItems,
    isLoading,
    currentPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPreviousPage,
  } = useInfiniteScroll({
    items: filteredProducts,
    itemsPerPage: 12,
  });

  // Show loading state while checking authentication
  // IMPORTANT: This must come AFTER all hooks are called
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ar" : "en"));
  };

  const getCategoryTranslation = (category: string) => {
    // Find category in categoryData and return appropriate language name
    const categoryItem = categoryData.find((cat) => cat.name === category);
    if (categoryItem) {
      return language === "ar" ? categoryItem.nameAr : categoryItem.name;
    }

    // Fallback to translations object for backwards compatibility
    if (t[category as keyof typeof t]) {
      return t[category as keyof typeof t] as string;
    }

    // Final fallback
    return category;
  };

  // Show login prompt when needed (for sellers)
  if (showLoginPrompt) {
    return (
      <LoginPage
        onLogin={async (userData) => {
          console.log("[App] onLogin called with userData:", userData);
          
          // Verify we have a token before proceeding
          const token = localStorage.getItem("tijarahjo_token");
          if (!token) {
            console.error("[App] CRITICAL: onLogin called but no token in localStorage!");
            // Don't close login prompt if there's no token
            return;
          }

          // Trigger AuthContext to check authentication immediately
          console.log("[App] Triggering AuthContext to validate token...");
          await checkAuth();
          
          // Wait a bit for AuthContext to update state
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Verify token is still there (AuthContext might have removed it if invalid)
          const currentToken = localStorage.getItem("tijarahjo_token");
          if (!currentToken) {
            console.error("[App] Token was removed by AuthContext - authentication failed");
            return; // Don't close login prompt if authentication failed
          }
          
          // Check if user is actually authenticated now
          // Note: isAuthenticated might not have updated yet due to React state batching
          // So we'll proceed if token exists and hasn't been removed
          
          console.log("[App] Authentication verified, closing login prompt and updating user profile");
          
          // Close login prompt
          setShowLoginPrompt(false);
          
          // Create or load user profile from userData (AuthContext will update separately)
          if (userData) {
            const fullName =
              `${userData.firstName} ${userData.lastName}`.trim() || userData.email || "User";
            setUserProfile({
              id: userData.username || userData.email || "", // Temporary ID until AuthContext updates
              name: fullName,
              firstName: userData.firstName,
              middleName: undefined,
              lastName: userData.lastName,
              username: userData.username,
              email: userData.email,
              phone: userData.phone || "",
              city: "",
              area: "",
              location: "",
              bio: "",
              avatar: userData.avatar || "",
              joinedDate:
                userData.joinedDate ||
                new Date().toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                }),
            });
          }

          // Execute the action that required login
          if (loginRedirectAction === "sell") {
            setShowSellItem(true);
          } else if (loginRedirectAction === "profile") {
            setShowProfile(true);
          }
          setLoginRedirectAction(null);
        }}
        onContinueAsGuest={() => {
          // Close the login prompt, stay as guest
          setShowLoginPrompt(false);
          setLoginRedirectAction(null);
        }}
      />
    );
  }

  if (showProfile) {
    // Check if user is authenticated before showing profile
    if (!isAuthenticated) {
      setShowProfile(false);
      setShowLoginPrompt(true);
      setLoginRedirectAction("profile");
      return null;
    }

    return (
      <ProfilePage
        onBackToMarketplace={() => {
          setShowProfile(false);
          // Navigate back to where the user came from
          if (profileOrigin === "favorites") {
            setShowFavorites(true);
          } else if (profileOrigin === "searchResults") {
            setShowSearchResults(true);
          } else if (profileOrigin === "settings") {
            setShowSettings(true);
          }
          // Reset origin
          setProfileOrigin(null);
        }}
        products={availableProducts}
        onProductClick={(id) => {
          setShowProfile(false);
          setSelectedProductId(id);
          setProductDetailsOrigin("profile");
        }}
        onDeleteProduct={async (id) => {
          try {
            console.log("[App] Deleting post:", id);
            
            // Delete from backend
            const result = await api.posts.deletePost(id);
            
            if (result.success) {
              console.log("[App] Post deleted successfully");
              toast.success(
                language === "ar"
                  ? "تم حذف المنشور بنجاح!"
                  : "Post deleted successfully!"
              );
              // Refresh from backend to ensure UI is in sync
              await fetchPostsFromBackend();
            } else {
              console.error("[App] Failed to delete post:", result.error);
              const errorMessage = result.error || 
                (language === "ar"
                  ? "فشل في حذف المنشور"
                  : "Failed to delete post");
              toast.error(errorMessage);
            }
          } catch (error) {
            console.error("[App] Error deleting post:", error);
            const errorMessage = error instanceof Error 
              ? error.message 
              : (language === "ar"
                  ? "حدث خطأ أثناء حذف المنشور"
                  : "An error occurred while deleting the post");
            toast.error(errorMessage);
          }
        }}
        onUpdateProduct={async (product) => {
          try {
            console.log("[App] Updating post from profile:", product.id);
            
            // Update in backend
            const result = await api.posts.updatePost({
              id: product.id,
              title: product.name,
              description: product.description || "",
              price: product.price,
              category: product.category,
              images: product.images || [],
            });
            
            if (result.success) {
              console.log("[App] Post updated successfully from profile");
              toast.success(
                language === "ar"
                  ? "تم تحديث المنشور بنجاح!"
                  : "Post updated successfully!"
              );
              // Refresh from backend to ensure UI is in sync
              await fetchPostsFromBackend();
            } else {
              console.error("[App] Failed to update post:", result.message);
              toast.error(
                result.message ||
                (language === "ar"
                  ? "فشل في تحديث المنشور"
                  : "Failed to update post")
              );
            }
          } catch (error) {
            console.error("[App] Error updating post:", error);
            toast.error(
              language === "ar"
                ? "حدث خطأ أثناء تحديث المنشور"
                : "An error occurred while updating the post"
            );
          }
        }}
        onAddProductClick={() => {
          setShowProfile(false);
          setShowSellItem(true);
        }}
        onSettingsClick={() => {
          setShowProfile(false);
          setShowSettings(true);
          setProfileOrigin(null); // Clear origin when going to settings
        }}
        onEditProfileClick={() => {
          setShowProfile(false);
          setShowEditProfile(true);
        }}
        language={language}
        userProfile={{
          id: userProfile.id,
          name: userProfile.name,
          firstName: userProfile.firstName || "",
          lastName: userProfile.lastName || "",
          username: userProfile.username || "",
          email: userProfile.email,
          phone: userProfile.phone,
          location: userProfile.location,
          city: userProfile.city,
          area: userProfile.area,
          bio: userProfile.bio,
          avatar: userProfile.avatar,
          joinedDate: userProfile.joinedDate,
        }}
        favoriteIds={favoriteIds}
        onFavoriteToggle={toggleFavorite}
        isAuthenticated={isAuthenticated}
        currentUserName={CURRENT_USER_NAME}
      />
    );
  }

  if (showEditProfile) {
    return (
      <EditProfilePage
        onBack={() => setShowEditProfile(false)}
        profile={{
          id: userProfile.id,
          name: userProfile.name,
          firstName: userProfile.firstName || "",
          lastName: userProfile.lastName || "",
          username: userProfile.username || "",
          email: userProfile.email,
          phone: userProfile.phone,
          city: userProfile.city || "",
          area: userProfile.area || "",
          location: userProfile.location,
          bio: userProfile.bio,
          avatar: userProfile.avatar,
          joinedDate: userProfile.joinedDate,
        }}
        onSave={async (updatedProfile) => {
          try {
            // Get current user ID from AuthContext
            const userId = user?.id || CURRENT_USER_ID;
            
            if (!userId) {
              toast.error("User ID not found. Please log in again.");
              return;
            }

            // Get current user data from backend to preserve fields not in profile
            // We need the full UserModel (with HashedPassword) from /users/{id} endpoint
            let currentUser: any = null;
            const userIdInt = parseInt(userId);
            
            if (!isNaN(userIdInt) && userIdInt > 0) {
              try {
                // Use api.users.getUser to get full user data with HashedPassword
                currentUser = await api.users.getUser(userId);
                if (currentUser) {
                  console.log("[App] Got full user data:", currentUser);
                }
              } catch (error) {
                console.warn("[App] Failed to get full user data:", error);
              }
            }
            
            // Fallback to /auth/me if /users/{id} failed (but this won't have HashedPassword)
            if (!currentUser) {
              const currentUserResponse = await api.auth.getCurrentUser();
              if (!currentUserResponse.success || !currentUserResponse.data) {
                toast.error("Failed to get current user data. Please try again.");
                return;
              }
              currentUser = currentUserResponse.data as any;
              console.warn("[App] Using /auth/me data, HashedPassword may be missing");
            }
            
            // Map frontend UserProfile to backend UserModel format
            // Note: HashedPassword is now optional - backend will preserve existing password if not provided
            const userUpdateData: any = {
              UserID: userIdInt || parseInt(currentUser.UserID || currentUser.userID || currentUser.Id || currentUser.id || "0"),
              Username: updatedProfile.username || currentUser.Username || currentUser.username || "",
              Email: updatedProfile.email || currentUser.Email || currentUser.email || "",
              FirstName: updatedProfile.firstName || currentUser.FirstName || currentUser.firstName || "",
              LastName: updatedProfile.lastName || currentUser.LastName || currentUser.lastName || "",
              Status: currentUser.Status || currentUser.status || 1, // Active
              RoleID: currentUser.RoleID || currentUser.roleID || 2, // User role
              IsDeleted: currentUser.IsDeleted || currentUser.isDeleted || false,
            };

            // Only include HashedPassword if we have it (for password changes)
            // Backend will preserve existing password if not provided
            if (currentUser.HashedPassword || currentUser.hashedPassword) {
              userUpdateData.HashedPassword = currentUser.HashedPassword || currentUser.hashedPassword;
            } else {
              // Password not available - backend will keep existing password
              console.log("[App] HashedPassword not available, backend will preserve existing password");
            }

            // Include JoinDate if available (backend will preserve it anyway)
            if (currentUser.JoinDate || currentUser.joinDate) {
              userUpdateData.JoinDate = currentUser.JoinDate || currentUser.joinDate;
            }

            console.log("[App] Updating user profile:", userUpdateData);

            // Call backend API to update user
            try {
              console.log("[App] Calling updateUser API with:", userUpdateData);
              const updatedUserData = await api.users.updateUser(userId, userUpdateData);

              console.log("[App] Profile update successful, response:", updatedUserData);

              // Update local state with saved data
              setUserProfile({
                id: updatedProfile.id,
                name: `${updatedProfile.firstName} ${updatedProfile.middleName || ''} ${updatedProfile.lastName}`.trim(),
                firstName: updatedProfile.firstName,
                lastName: updatedProfile.lastName,
                username: updatedProfile.username,
                email: updatedProfile.email,
                // Note: phone, city, area, bio, avatar are NOT stored in database
                // They are kept in local state only for UI purposes
                phone: updatedProfile.phone,
                city: updatedProfile.city,
                area: updatedProfile.area,
                location: updatedProfile.location,
                bio: updatedProfile.bio,
                avatar: updatedProfile.avatar || "",
                joinedDate: updatedProfile.joinedDate,
              });
              
              // Refresh auth state to get updated user data
              if (user) {
                console.log("[App] Profile updated, refreshing auth state");
                // The AuthContext will automatically refresh on next check
              }

              toast.success(
                language === "ar"
                  ? "تم تحديث الملف الشخصي بنجاح!"
                  : "Profile updated successfully!"
              );
              
              // Navigate back to profile page AFTER successful save
              setShowEditProfile(false);
              setShowProfile(true);
            } catch (updateError) {
              console.error("[App] Error calling updateUser API:", updateError);
              const errorMessage = updateError instanceof Error ? updateError.message : "Unknown error";
              toast.error(
                language === "ar"
                  ? `حدث خطأ أثناء تحديث الملف الشخصي: ${errorMessage}`
                  : `An error occurred while updating your profile: ${errorMessage}`
              );
              // Don't navigate on error - stay on edit page so user can fix and retry
            }
          } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("An error occurred while updating your profile. Please try again.");
          }
        }}
        language={language}
      />
    );
  }

  if (showSettings) {
    return (
      <SettingsPage
        onBackToMarketplace={() => setShowSettings(false)}
        language={language}
        darkMode={darkMode}
        onDarkModeChange={(enabled) => setDarkMode(enabled)}
        onLanguageChange={toggleLanguage}
        onLogout={async () => {
          await logout();
          setShowSettings(false);
        }}
        userProfile={{
          name: userProfile.name,
          username: userProfile.username || "",
          email: userProfile.email,
          phone: userProfile.phone,
          location: userProfile.location,
        }}
        onEditProfileClick={() => {
          setShowSettings(false);
          setShowEditProfile(true);
        }}
      />
    );
  }

  if (showFavorites) {
    return (
      <FavoritesPage
        onBackToMarketplace={() => setShowFavorites(false)}
        language={language}
        favoriteIds={favoriteIds}
        products={availableProducts}
        onRemoveFavorite={toggleFavorite}
        onProductClick={(id) => {
          setShowFavorites(false);
          setSelectedProductId(id);
          setProductDetailsOrigin("favorites");
        }}
      />
    );
  }

  if (showSellItem) {
    return (
      <SellItemPage
        language={language}
        onBack={() => setShowSellItem(false)}
        onSubmit={async (product) => {
          try {
            console.log("[App] Creating new post:", product);
            
            // Call API to create post in backend
            const result = await api.posts.createPost({
              title: product.name,
              description: product.description || "",
              price: product.price,
              category: product.category,
              city: product.location || userProfile.city || "Amman",
              area: product.area || userProfile.area || "",
              images: product.images || [product.image].filter(Boolean),
              phone: userProfile.phone || "+962",
            });

            if (result.success) {
              console.log("[App] Post created successfully:", result.post);
              toast.success(
                language === "ar"
                  ? "تم نشر المنشور بنجاح!"
                  : "Post created successfully!"
              );
              
              // Refresh posts from backend to show the new post
              await fetchPostsFromBackend();
              setShowSellItem(false);
            } else {
              console.error("[App] Failed to create post:", result.message);
              toast.error(
                result.message || 
                (language === "ar" 
                  ? "فشل في إنشاء المنشور" 
                  : "Failed to create post")
              );
            }
          } catch (error) {
            console.error("[App] Error creating post:", error);
            toast.error(
              language === "ar"
                ? "حدث خطأ أثناء إنشاء المنشور"
                : "An error occurred while creating the post"
            );
          }
        }}
        userProfile={userProfile}
        onGoToSettings={() => {
          setShowSellItem(false);
          setShowEditProfile(true);
        }}
        darkMode={darkMode}
      />
    );
  }

  if (showAllProducts) {
    return (
      <AllProductsPage
        onBack={() => setShowAllProducts(false)}
        language={language}
        products={availableProducts}
        onProductClick={(id) => {
          setShowAllProducts(false);
          setSelectedProductId(id);
          setProductDetailsOrigin("allProducts");
        }}
        favoriteIds={favoriteIds}
        onFavoriteToggle={toggleFavorite}
        isAuthenticated={isAuthenticated}
        darkMode={darkMode}
      />
    );
  }

  // Show category pages - each category has its own dedicated page
  if (showCategoryPage && selectedCategoryForPage) {
    const commonProps = {
      onBack: () => {
        setShowCategoryPage(false);
        setSelectedCategoryForPage(null);
      },
      products: availableProducts,
      onProductClick: (id: string) => {
        setShowCategoryPage(false);
        setSelectedProductId(id);
        setProductDetailsOrigin("categoryPage");
        setProductDetailsOriginCategory(selectedCategoryForPage);
      },
      favoriteIds,
      onFavoriteToggle: toggleFavorite,
      language,
      isAuthenticated,
      currentUserName: isAuthenticated ? CURRENT_USER_NAME : undefined,
      userAvatar: isAuthenticated ? userProfile.avatar : undefined,
      userFirstName: isAuthenticated ? userProfile.firstName : undefined,
      userLastName: isAuthenticated ? userProfile.lastName : undefined,
      onShowFavorites: () => {
        setShowCategoryPage(false);
        setShowFavorites(true);
      },
      onShowSellItem: () => {
        setShowCategoryPage(false);
        if (!isAuthenticated) {
          setShowLoginPrompt(true);
          setLoginRedirectAction(null);
        } else {
          setShowSellItem(true);
        }
      },
      onShowProfile: () => {
        setShowCategoryPage(false);
        if (!isAuthenticated) {
          setShowLoginPrompt(true);
          setLoginRedirectAction(null);
        } else {
          setShowProfile(true);
        }
      },
      onShowMyPosts: () => {
        setShowCategoryPage(false);
        if (isAuthenticated) {
          setShowProfile(true);
        }
      },
      onShowSettings: () => {
        setShowCategoryPage(false);
        setShowSettings(true);
      },
      onLogout: async () => {
        await logout();
      },
      onToggleLanguage: () => {
        setLanguage(language === "en" ? "ar" : "en");
      },
      onCategoryClick: (categoryName: string) => {
        setSelectedCategoryForPage(categoryName);
      },
    };

    // Route to specific category page
    switch (selectedCategoryForPage) {
      case "Electronics":
        return <ElectronicsPage {...commonProps} />;
      case "Mobile Phones & Tablets":
        return <MobilePhonesTabletsPage {...commonProps} />;
      case "Computers & Laptops":
        return <ComputersLaptopsPage {...commonProps} />;
      case "Home Appliances":
        return <HomeAppliancesPage {...commonProps} />;
      case "Furniture":
        return <FurniturePage {...commonProps} />;
      case "Vehicles":
        return <VehiclesPage {...commonProps} />;
      case "Fashion & Clothing":
        return <FashionClothingPage {...commonProps} />;
      case "Health & Beauty":
        return <HealthBeautyPage {...commonProps} />;
      case "Sports & Fitness":
        return <SportsFitnessPage {...commonProps} />;
      case "Books & Stationery":
        return <BooksStationeryPage {...commonProps} />;
      case "Toys & Games":
        return <ToysGamesPage {...commonProps} />;
      case "Real Estate":
        return <RealEstatePage {...commonProps} />;
      case "Pets & Animals":
        return <PetsAnimalsPage {...commonProps} />;
      case "Services":
        return <ServicesPage {...commonProps} />;
      case "Other":
        return <OtherPage {...commonProps} />;
      default:
        return null;
    }
  }

  // Show search results page
  if (showSearchResults) {
    return (
      <SearchResultsPage
        searchQuery={activeSearchQuery}
        products={availableProducts}
        onBack={() => {
          setShowSearchResults(false);
          setActiveSearchQuery("");
          setSearchQuery("");
        }}
        onProductClick={(id) => {
          setShowSearchResults(false);
          setSelectedProductId(id);
          setProductDetailsOrigin("searchResults");
        }}
        language={language}
        favoriteIds={favoriteIds}
        onFavoriteToggle={toggleFavorite}
        isAuthenticated={isAuthenticated}
        onSearch={(newQuery) => {
          setActiveSearchQuery(newQuery);
          setSearchQuery(newQuery);
        }}
      />
    );
  }

  // Show product details page
  if (selectedProductId !== null && !showSellerProfile) {
    const product = availableProducts.find((p) => p.id === selectedProductId);
    
    // If we have a selectedProductId but products are still loading, show loading state
    if (isLoadingProducts && !product) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      );
    }
    
    if (product) {
      // Check if product belongs to current user
      // Compare sellerId with user.id for proper ownership check
      // Also check seller name/username as fallback for compatibility
      // Guest users should never see edit/delete buttons
      const isOwnProduct =
        isAuthenticated &&
        (product.sellerId === CURRENT_USER_ID ||
          product.seller === CURRENT_USER_NAME ||
          product.seller === user?.username);

      return (
        <ProductDetailsPage
          product={product}
          onBack={() => {
            setSelectedProductId(null);
            // Navigate back to where the user came from
            if (productDetailsOrigin === "favorites") {
              setShowFavorites(true);
            } else if (productDetailsOrigin === "allProducts") {
              setShowAllProducts(true);
            } else if (productDetailsOrigin === "searchResults") {
              setShowSearchResults(true);
            } else if (productDetailsOrigin === "categoryPage") {
              // Restore the category page the user came from
              if (productDetailsOriginCategory) {
                setSelectedCategoryForPage(productDetailsOriginCategory);
                setShowCategoryPage(true);
              }
            } else if (productDetailsOrigin === "profile") {
              // Return to profile page
              setShowProfile(true);
            }
            // Reset origin
            setProductDetailsOrigin(null);
            setProductDetailsOriginCategory(null);
          }}
          allProducts={availableProducts}
          language={language}
          onProductClick={(id) => {
            // Scroll to top immediately when clicking product
            window.scrollTo(0, 0);
            setSelectedProductId(id);
            // Keep the same origin when navigating between product details
          }}
          onSellerClick={() => {
            if (isOwnProduct) {
              // If it's the user's own product, show their profile
              setShowProfile(true);
            } else {
              // If it's another seller's product, show seller profile
              setShowSellerProfile(true);
            }
          }}
          isOwnProduct={isOwnProduct}
          onUpdateProduct={async (updatedProduct) => {
            try {
              // Find the current product to compare status
              const currentProduct = availableProducts.find(
                (p) => p.id === updatedProduct.id
              );
              const statusChanged =
                currentProduct &&
                currentProduct.status !== updatedProduct.status;

              // If status changed, update status separately
              if (statusChanged && updatedProduct.status) {
                console.log(
                  "[App] Status changed, updating post status:",
                  updatedProduct.status
                );
                const statusResult = await api.posts.updatePostStatus({
                  id: updatedProduct.id,
                  status: updatedProduct.status,
                });

                if (!statusResult.success) {
                  console.error(
                    "[App] Failed to update post status:",
                    statusResult.message
                  );
                  toast.error(
                    language === "ar"
                      ? "فشل في تحديث حالة المنشور"
                      : "Failed to update post status"
                  );
                  return;
                }
              }

              // Update other post fields (title, description, price, etc.)
              // Only update if there are actual changes (not just status)
              const hasOtherChanges =
                !currentProduct ||
                currentProduct.name !== updatedProduct.name ||
                currentProduct.description !== updatedProduct.description ||
                currentProduct.price !== updatedProduct.price ||
                currentProduct.category !== updatedProduct.category ||
                JSON.stringify(currentProduct.images || []) !==
                  JSON.stringify(updatedProduct.images || []);

              if (hasOtherChanges) {
                console.log("[App] Updating post fields");
                const result = await api.posts.updatePost({
                  id: updatedProduct.id,
                  title: updatedProduct.name,
                  description: updatedProduct.description,
                  price: updatedProduct.price,
                  category: updatedProduct.category,
                  images: updatedProduct.images || [],
                });

                if (result.success) {
                  console.log("[App] Post updated successfully");
                  toast.success(
                    language === "ar"
                      ? "تم تحديث المنشور بنجاح!"
                      : "Post updated successfully!"
                  );
                } else {
                  console.error("[App] Failed to update post:", result.message);
                  toast.error(
                    result.message ||
                      (language === "ar"
                        ? "فشل في تحديث المنشور"
                        : "Failed to update post")
                  );
                }
              } else if (statusChanged) {
                // Only status changed, show success message
                toast.success(
                  language === "ar"
                    ? "تم تحديث حالة المنشور بنجاح!"
                    : "Post status updated successfully!"
                );
              }

              // Refresh from backend to ensure UI is in sync
              await fetchPostsFromBackend();
            } catch (error) {
              console.error("[App] Error updating product:", error);
              toast.error(
                language === "ar"
                  ? "حدث خطأ أثناء تحديث المنشور"
                  : "An error occurred while updating the post"
              );
            }
          }}
          onDeleteProduct={async (id) => {
            try {
              console.log("[App] Deleting post from details:", id);
              
              // Delete from backend
              const result = await api.posts.deletePost(id);
              
              if (result.success) {
                console.log("[App] Post deleted successfully");
                toast.success(
                  language === "ar"
                    ? "تم حذف المنشور بنجاح!"
                    : "Post deleted successfully!"
                );
                // Refresh from backend to ensure UI is in sync
                await fetchPostsFromBackend();
                // Close product details if deleted
                setSelectedProductId(null);
              } else {
                console.error("[App] Failed to delete post:", result.error);
                const errorMessage = result.error || 
                  (language === "ar"
                    ? "فشل في حذف المنشور"
                    : "Failed to delete post");
                toast.error(errorMessage);
              }
            } catch (error) {
              console.error("[App] Error deleting post:", error);
              const errorMessage = error instanceof Error 
                ? error.message 
                : (language === "ar"
                    ? "حدث خطأ أثناء حذف المنشور"
                    : "An error occurred while deleting the post");
              toast.error(errorMessage);
            }
          }}
          favoriteIds={favoriteIds}
          onFavoriteToggle={toggleFavorite}
          isAuthenticated={isAuthenticated}
          currentUserName={CURRENT_USER_NAME}
        />
      );
    }
  }

  // Show seller profile page
  if (showSellerProfile) {
    const product = availableProducts.find((p) => p.id === selectedProductId);
    if (product) {
      const sellerProducts = availableProducts.filter(
        (p) => p.seller === product.seller
      );

      // Create seller object from product data
      // Ensure sellerId is always a string (standardize ID types)
      // product.sellerId is already typed as string, but provide fallback for safety
      const sellerId: string = product.sellerId || `seller-${product.id}`;

      // Fetch seller data to get actual joined date and avatar
      // We'll use a state to store this, but for now use a placeholder
      // The actual data should be fetched when the seller profile page loads
      const seller = {
        id: sellerId,
        name: product.seller,
        activeListings: sellerProducts.length,
        joinedDate: "Jan 2024", // Will be updated when seller data is fetched
        location: product.location,
        area: product.area,
        initials: product.seller
          .split(" ")
          .map((n) => n[0])
          .join(""),
        color: "#0A4ABF",
        bio: `Trusted seller on TijarahJo. Based in ${product.location}${
          product.area ? `, ${product.area}` : ""
        }. Fast responses and quality items.`,
        phone: product.phone || "",
      };

      return (
        <SellerProfilePage
          seller={seller}
          products={sellerProducts}
          onBack={() => setShowSellerProfile(false)}
          onProductClick={(id) => {
            setShowSellerProfile(false);
            setSelectedProductId(id);
          }}
          favoriteIds={favoriteIds}
          onFavoriteToggle={toggleFavorite}
          language={language}
          isAuthenticated={isAuthenticated}
        />
      );
    }
  }

  // console.log("App rendering main content...");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a]">
      <Header
        language={language}
        isAuthenticated={isAuthenticated}
        currentUserName={userProfile.name}
        userAvatar={userProfile.avatar}
        userFirstName={userProfile.firstName}
        userLastName={userProfile.lastName}
        showBackButton={false}
        showLogo={true}
        showSearch={true}
        searchQuery={searchQuery}
        onSearchChange={(query: string) => setSearchQuery(query)}
        onSearchSubmit={() => {
          setActiveSearchQuery(searchQuery.trim());
          setShowSearchResults(true);
        }}
        onShowFavorites={() => setShowFavorites(true)}
        onShowProfile={() => {
          if (isAuthenticated) {
            setProfileOrigin("marketplace");
            setShowProfile(true);
          } else {
            setShowLoginPrompt(true);
            setLoginRedirectAction(null);
          }
        }}
        onShowSettings={() => setShowSettings(true)}
        onShowSellItem={() => setShowSellItem(true)}
        onLogout={async () => await logout()}
        onToggleLanguage={toggleLanguage}
        onCategoryClick={(categoryName) => {
          setSelectedCategoryForPage(categoryName);
          setShowCategoryPage(true);
        }}
        darkMode={darkMode}
      />

      {/* Hero Banner */}
      <section
        className="relative py-16 px-4 overflow-hidden"
        style={{
          background: darkMode
            ? "linear-gradient(135deg, #0A4ABF 0%, #1a5fd9 100%)"
            : "linear-gradient(135deg, #0A4ABF 0%, #3E7EFF 100%)",
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 dark:bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 dark:bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#3E7EFF]/20 dark:bg-[#3E7EFF]/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto text-center text-white">
          <h2 className="mb-4 text-base sm:text-lg font-medium animate-fade-in">
            {t.heroTitle}
          </h2>
          <p className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 max-w-2xl mx-auto animate-fade-in">
            {t.heroSubtitle}
          </p>

          {/* Sign In Message for Unauthenticated Users */}
          {!isAuthenticated && (
            <div className="mb-8 p-6 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 max-w-2xl mx-auto animate-fade-in shadow-2xl">
              <div className="flex items-center justify-center gap-3 mb-4">
                <User className="w-6 h-6 text-white" />
                <h3 className="text-xl text-white">
                  {language === "ar"
                    ? "ابدأ البيع اليوم"
                    : "Start Selling Today"}
                </h3>
              </div>
              <p className="text-white/90 mb-6">
                {language === "ar"
                  ? "انشر منتجاتك واصل إلى المشترين في جميع أنحاء الأردن"
                  : "Post your items and reach buyers across Jordan"}
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button
                  size="lg"
                  className="hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
                  style={{
                    backgroundColor: "white",
                    color: "#0A4ABF",
                  }}
                  onClick={() => {
                    setShowLoginPrompt(true);
                    setLoginRedirectAction("sell");
                  }}
                >
                  <User className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {language === "ar" ? "ابدأ البيع" : "Start Selling"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
                  style={{
                    borderColor: "white",
                    color: "white",
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    borderWidth: "2px",
                  }}
                  onClick={() => {
                    const mainContent = document.querySelector("main");
                    mainContent?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                >
                  {t.browseItems}
                </Button>
              </div>
            </div>
          )}

          {isAuthenticated && (
            <div className="flex gap-4 justify-center flex-wrap animate-fade-in">
              <Button
                size="lg"
                className="hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: "white",
                  color: "#0A4ABF",
                }}
                onClick={() => setShowSellItem(true)}
              >
                {t.startSelling}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="hover:scale-105 transition-transform shadow-lg hover:bg-white/20 dark:hover:bg-white/10"
                style={{
                  borderColor: "white",
                  color: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  borderWidth: "2px",
                }}
                onClick={() => {
                  const mainContent = document.querySelector("main");
                  mainContent?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
              >
                {t.browseItems}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-100/40 dark:bg-blue-950/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-100/30 dark:bg-purple-950/20 rounded-full blur-3xl" />
        </div>

        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-black dark:text-white mb-2">
              {t.categoriesTitle}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t.categoriesSubtitle}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="group hover:bg-blue-50 dark:hover:bg-blue-950/30 dark:text-[#3E7EFF] transition-all duration-200 shadow-sm hover:shadow-md"
            style={{ color: "#0A4ABF" }}
            onClick={() => setShowAllProducts(true)}
          >
            <span className="mr-2">{t.viewAll}</span>
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {categoryData.map((category, index) => {
            return (
              <button
                key={`category-${category.name}-${index}`}
                type="button"
                onClick={() => {
                  // Open dedicated category page
                  setSelectedCategoryForPage(category.name);
                  setShowCategoryPage(true);
                }}
                className="group relative rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 aspect-[4/3]"
                style={{
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                }}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ objectFit: "cover" }}
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative z-10 h-full flex items-end p-4 sm:p-5">
                  <div className="text-white transition-all duration-300 text-sm sm:text-base font-semibold drop-shadow-lg">
                    {getCategoryTranslation(category.name)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Add CSS animation for fade in */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `,
          }}
        />
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* View Controls Only */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div></div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid-4")}
                  className={`h-9 w-9 sm:h-8 sm:w-8 p-0 transition-all duration-200 ${
                    viewMode === "grid-4"
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : ""
                  }`}
                  style={{
                    color: viewMode === "grid-4" ? "#0A4ABF" : "#6B7280",
                  }}
                  title="4 Columns Grid"
                >
                  <Grid3x3 className="w-5 h-5 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid-3")}
                  className={`h-9 w-9 sm:h-8 sm:w-8 p-0 transition-all duration-200 ${
                    viewMode === "grid-3"
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : ""
                  }`}
                  style={{
                    color: viewMode === "grid-3" ? "#0A4ABF" : "#6B7280",
                  }}
                  title="3 Columns Grid"
                >
                  <LayoutGrid className="w-5 h-5 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid-2")}
                  className={`h-9 w-9 sm:h-8 sm:w-8 p-0 transition-all duration-200 ${
                    viewMode === "grid-2"
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : ""
                  }`}
                  style={{
                    color: viewMode === "grid-2" ? "#0A4ABF" : "#6B7280",
                  }}
                  title="2 Columns Grid"
                >
                  <Columns className="w-5 h-5 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`h-9 w-9 sm:h-8 sm:w-8 p-0 transition-all duration-200 ${
                    viewMode === "list" ? "bg-blue-50 dark:bg-blue-900/30" : ""
                  }`}
                  style={{
                    color: viewMode === "list" ? "#0A4ABF" : "#6B7280",
                  }}
                  title="List View"
                >
                  <List className="w-5 h-5 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingProducts && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
            <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 mb-4 animate-spin" />
            <h3 className="text-black dark:text-white mb-2">
              {language === "ar"
                ? "جارٍ تحميل المنتجات..."
                : "Loading products..."}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
              {language === "ar"
                ? "جاري جلب البيانات من قاعدة البيانات"
                : "Fetching data from database"}
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoadingProducts && productsError && (
          <div className="col-span-full flex flex-col items-center justify-center py-8 px-4 mb-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm text-center">
              {productsError}
            </p>
            {productsError.includes("Cannot connect") && (
              <p className="text-yellow-700 dark:text-yellow-300 text-xs text-center mt-2">
                {language === "ar"
                  ? "تأكد من تشغيل الخادم الخلفي على http://localhost:5033"
                  : "Make sure the backend server is running on http://localhost:5033"}
              </p>
            )}
          </div>
        )}

        {/* Product Grid */}
        {!isLoadingProducts && (
          <div
            className={`grid ${
              viewMode === "grid-4"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : viewMode === "grid-3"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : viewMode === "grid-2"
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1"
            } gap-4 sm:gap-5 md:gap-6 transition-all duration-300`}
          >
            {displayedItems.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
                <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-black dark:text-white mb-2">
                  {searchQuery
                    ? language === "ar"
                      ? "لا توجد نتائج"
                      : "No results found"
                    : language === "ar"
                    ? "لا توجد منتجات"
                    : "No products found"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                  {searchQuery
                    ? language === "ar"
                      ? `لم نتمكن من العثور على أي منتجات تطابق "${searchQuery}"`
                      : `We couldn't find any products matching "${searchQuery}"`
                    : language === "ar"
                    ? "جرب فئة أخرى أو أضف منتات جديدة"
                    : "Try a different category or add new products"}
                </p>
                {searchQuery && (
                  <Button
                    onClick={() => setSearchQuery("")}
                    className="mt-4"
                    style={{
                      backgroundColor: "#0A4ABF",
                      color: "white",
                    }}
                  >
                    {language === "ar" ? "مسح البحث" : "Clear Search"}
                  </Button>
                )}
              </div>
            ) : (
              displayedItems.map((product, index) => (
                <ProductCard
                  key={
                    product.id
                      ? `product-${product.id}`
                      : `product-${index}-${
                          product.name?.substring(0, 10) || "item"
                        }`
                  }
                  product={product}
                  onProductClick={(id) => {
                    window.scrollTo(0, 0);
                    setShowProfile(false);
                    setSelectedProductId(id);
                    setProductDetailsOrigin("marketplace");
                  }}
                  viewMode={viewMode}
                  isFavorite={favoriteIds.includes(product.id)}
                  onFavoriteToggle={toggleFavorite}
                  isAuthenticated={isAuthenticated}
                  currentUserName={
                    isAuthenticated ? CURRENT_USER_NAME : undefined
                  }
                />
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {displayedItems.length > 0 && totalPages > 1 && (
          <div className="mt-12 mb-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1 || isLoading}
                  />
                </PaginationItem>

                {/* Page Numbers */}
                {(() => {
                  const pages = [];
                  const maxVisiblePages = 5;

                  if (totalPages <= maxVisiblePages + 2) {
                    // Show all pages if total is small
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={currentPage === i}
                            onClick={() => !isLoading && goToPage(i)}
                            disabled={isLoading}
                          >
                            {i}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                  } else {
                    // Always show first page
                    pages.push(
                      <PaginationItem key={1}>
                        <PaginationLink
                          isActive={currentPage === 1}
                          onClick={() => !isLoading && goToPage(1)}
                          disabled={isLoading}
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                    );

                    // Show ellipsis if current page is far from start
                    if (currentPage > 3) {
                      pages.push(
                        <PaginationItem key="ellipsis-start">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    // Show pages around current page
                    const startPage = Math.max(2, currentPage - 1);
                    const endPage = Math.min(totalPages - 1, currentPage + 1);

                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={currentPage === i}
                            onClick={() => !isLoading && goToPage(i)}
                            disabled={isLoading}
                          >
                            {i}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }

                    // Show ellipsis if current page is far from end
                    if (currentPage < totalPages - 2) {
                      pages.push(
                        <PaginationItem key="ellipsis-end">
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    // Always show last page
                    pages.push(
                      <PaginationItem key={totalPages}>
                        <PaginationLink
                          isActive={currentPage === totalPages}
                          onClick={() => !isLoading && goToPage(totalPages)}
                          disabled={isLoading}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }

                  return pages;
                })()}

                <PaginationItem>
                  <PaginationNext
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages || isLoading}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <Loader2
                className="w-6 h-6 animate-spin"
                style={{ color: "#0A4ABF" }}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {language === "ar" ? "جارٍ التحميل..." : "Loading..."}
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notifications moved to main.tsx to prevent DOM manipulation errors */}

      {/* Footer */}
      <Footer language={language} />
    </div>
  );
}
