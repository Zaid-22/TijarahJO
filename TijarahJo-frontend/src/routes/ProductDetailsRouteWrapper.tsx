import { useParams } from "react-router-dom";
import { ProductDetailsPage } from "../pages/ProductDetailsPage";
import { Language, Product, UserProfile } from "../types";
import { deferredToast } from "../utils/toast";
import { resolveCurrentUserId } from "./appRoutesUtils";
import { useProductDetailsRouteData } from "./useProductDetailsRouteData";
import { UpdateProductInput } from "./usePostActions";

interface ProductDetailsRouteWrapperProps {
  language: Language;
  availableProducts: Product[];
  isLoadingProducts: boolean;
  isAuthenticated: boolean;
  userProfile: UserProfile;
  favoriteIds: string[];
  currentUserDisplayName: string;
  onFavoriteToggle: (postId: string) => void;
  onOpenProduct: (postId: string) => void;
  onBack: () => void;
  onNavigateHome: () => void;
  onNavigateProfile: () => void;
  onNavigateSeller: (sellerId: string) => void;
  onNavigateChat: (sellerId: string) => void;
  onNavigateLogin: () => void;
  onUpdateProduct: (updatedProduct: UpdateProductInput) => Promise<void>;
  onDeleteProduct: (postId: string) => Promise<void>;
}

export function ProductDetailsRouteWrapper({
  language,
  availableProducts,
  isLoadingProducts,
  isAuthenticated,
  userProfile,
  favoriteIds,
  currentUserDisplayName,
  onFavoriteToggle,
  onOpenProduct,
  onBack,
  onNavigateHome,
  onNavigateProfile,
  onNavigateSeller,
  onNavigateChat,
  onNavigateLogin,
  onUpdateProduct,
  onDeleteProduct,
}: ProductDetailsRouteWrapperProps) {
  const { id } = useParams();
  const { resolvedProduct, isLoadingRouteProduct, isOwnProduct } =
    useProductDetailsRouteData({
      id,
      availableProducts,
      isLoadingProducts,
      isAuthenticated,
      userProfile,
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
          onClick={onNavigateHome}
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
      onBack={onBack}
      allProducts={availableProducts}
      language={language}
      onProductClick={onOpenProduct}
      onSellerClick={() => {
        if (isOwnProduct) {
          onNavigateProfile();
          return;
        }

        const targetSellerId = String(resolvedProduct.sellerId || "").trim();
        if (!targetSellerId) {
          deferredToast.error("Seller profile unavailable");
          return;
        }

        onNavigateSeller(targetSellerId);
      }}
      onChatWithSeller={() => {
        const targetSellerId = String(resolvedProduct.sellerId || "").trim();
        if (!targetSellerId) {
          deferredToast.error("Seller chat unavailable");
          return;
        }

        if (!isAuthenticated) {
          onNavigateLogin();
          return;
        }

        const currentUserId = resolveCurrentUserId(userProfile);
        if (currentUserId && currentUserId === targetSellerId) {
          deferredToast.error("You cannot chat with yourself");
          return;
        }

        onNavigateChat(targetSellerId);
      }}
      isOwnProduct={isOwnProduct}
      onUpdateProduct={async (updatedProduct) => {
        try {
          await onUpdateProduct(updatedProduct);
          deferredToast.success("Post updated");
        } catch {
          deferredToast.error("Error updating");
        }
      }}
      onDeleteProduct={async (postId) => {
        try {
          await onDeleteProduct(postId);
          deferredToast.success("Post deleted");
          onNavigateHome();
        } catch {
          deferredToast.error("Error deleting");
        }
      }}
      favoriteIds={favoriteIds}
      onFavoriteToggle={onFavoriteToggle}
      isAuthenticated={isAuthenticated}
      currentUserDisplayName={currentUserDisplayName}
    />
  );
}
