import { Navigate, useParams } from "react-router-dom";
import { Post, Language } from "../../types";
import { CategoryPage } from "../../features/marketplace/pages/CategoryPage";
import { decodeCategoryParam } from "./appRoutesUtils";

interface CategoryRouteWrapperProps {
  language: Language;
  isAuthenticated: boolean;
  currentUserDisplayName: string;
  currentUserId?: string;
  availablePosts: Post[];
  favoriteIds: string[];
  onFavoriteToggle: (postId: string) => void;
  onBack: () => void;
  onOpenPost: (postId: string) => void;
  onRequireAuth?: () => void;
}

export function CategoryRouteWrapper({
  language,
  isAuthenticated,
  currentUserDisplayName,
  currentUserId,
  availablePosts,
  favoriteIds,
  onFavoriteToggle,
  onBack,
  onOpenPost,
  onRequireAuth,
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
      posts={availablePosts}
      onPostClick={onOpenPost}
      favoriteIds={favoriteIds}
      onFavoriteToggle={onFavoriteToggle}
      language={language}
      isAuthenticated={isAuthenticated}
      currentUserId={isAuthenticated ? currentUserId : undefined}
      currentUserDisplayName={
        isAuthenticated ? currentUserDisplayName : undefined
      }
      onRequireAuth={onRequireAuth}
    />
  );
}
