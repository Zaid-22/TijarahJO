import { translations, type Language } from "../../../translations";
import type { Post } from "../../../types";
import type { CreatePostInput } from "../../../app/routes/appRoutesUtils";
import type { UpdatePostInput } from "../../../app/routes/usePostActions";
import { UnifiedProfilePage } from "../components/UnifiedProfilePage";
import { useSellerProfileData } from "../../seller-profile/hooks/useSellerProfileData";
import type {
  ProfilePageUserProfile,
  UnifiedProfileViewModel,
} from "../types";

interface ProfilePageProps {
  onBackToMarketplace: () => void;
  posts: Post[];
  onPostClick?: (postId: string) => void;
  onDeletePost?: (postId: string) => void;
  onUpdatePost?: (post: UpdatePostInput) => void;
  onAddPost?: (post: CreatePostInput) => void | Promise<void>;
  onAddPostClick?: () => void;
  onSettingsClick?: () => void;
  onEditProfileClick?: () => void;
  language?: Language;
  userProfile: ProfilePageUserProfile;
  favoriteIds?: string[];
  onFavoriteToggle?: (postId: string) => void;
  isAuthenticated?: boolean;
}

export function ProfilePage({
  onBackToMarketplace,
  posts: _posts = [],
  onPostClick,
  onDeletePost,
  onUpdatePost,
  onAddPost: _onAddPost,
  onAddPostClick,
  onSettingsClick,
  onEditProfileClick,
  language = "en",
  userProfile,
  favoriteIds = [],
  onFavoriteToggle,
  isAuthenticated = false,
}: ProfilePageProps) {
  const t = translations[language];
  const profileUserId = String(userProfile.id || "").trim();
  const { activeListings, soldListings, reviews, isLoading, sellerProfile, reload } =
    useSellerProfileData(profileUserId);

  const resolvedProfile: ProfilePageUserProfile = {
    ...userProfile,
    name: sellerProfile?.name || userProfile.name,
    phone: sellerProfile?.phone || userProfile.phone,
    location: sellerProfile?.location || userProfile.location || userProfile.city || "",
    bio: sellerProfile?.bio || userProfile.bio,
    avatar: sellerProfile?.avatar || userProfile.avatar,
    joinedDate: sellerProfile?.joinDate || userProfile.joinedDate,
  };

  const viewModel: UnifiedProfileViewModel = {
    mode: "owner",
    profileUserId,
    profile: resolvedProfile,
    canEditProfile: true,
    canManageListings: true,
    canChat: false,
    canCall: true,
    canReview: false,
    activeListings,
    soldListings,
    reviews,
  };

  return (
    <UnifiedProfilePage
      language={language}
      isLoading={isLoading}
      viewModel={viewModel}
      isAuthenticated={isAuthenticated}
      favoriteIds={favoriteIds}
      currentUserId={profileUserId || undefined}
      onBack={onBackToMarketplace}
      backLabel={t.backToMarketplace}
      title={t.myProfile}
      loadingLabel={language === "ar" ? "جارٍ تحميل ملفك..." : "Loading your profile..."}
      onFavoriteToggle={onFavoriteToggle}
      onPostClick={onPostClick}
      onSettingsClick={onSettingsClick}
      onEditProfileClick={onEditProfileClick}
      onAddPostClick={onAddPostClick}
      onDeletePost={onDeletePost}
      onUpdatePost={onUpdatePost}
      onReload={reload}
    />
  );
}
