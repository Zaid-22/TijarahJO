import { Navigate, useParams } from "react-router-dom";
import { Product, Language } from "../types";
import { CategoryPage } from "../pages/CategoryPage";
import { decodeCategoryParam } from "./appRoutesUtils";

interface CategoryRouteWrapperProps {
  language: Language;
  isAuthenticated: boolean;
  currentUserDisplayName: string;
  availableProducts: Product[];
  favoriteIds: string[];
  onFavoriteToggle: (postId: string) => void;
  onBack: () => void;
  onOpenProduct: (postId: string) => void;
}

export function CategoryRouteWrapper({
  language,
  isAuthenticated,
  currentUserDisplayName,
  availableProducts,
  favoriteIds,
  onFavoriteToggle,
  onBack,
  onOpenProduct,
}: CategoryRouteWrapperProps) {
  const { categoryName } = useParams();
  const decodedCategory = decodeCategoryParam(categoryName);

  if (!decodedCategory) {
    return <Navigate to="/" replace />;
  }

  return (
    <CategoryPage
      categoryName={decodedCategory}
      onBack={onBack}
      products={availableProducts}
      onProductClick={onOpenProduct}
      favoriteIds={favoriteIds}
      onFavoriteToggle={onFavoriteToggle}
      language={language}
      isAuthenticated={isAuthenticated}
      currentUserDisplayName={
        isAuthenticated ? currentUserDisplayName : undefined
      }
    />
  );
}
