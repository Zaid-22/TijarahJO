import { useLocation, useNavigate, useParams } from "react-router-dom";
import { buildCurrentPath, resolveBackPathFromLocationState } from "../../../shared/lib/backNavigation";
import { UnifiedProfilePage } from "../../profile/components/UnifiedProfilePage";
import { useSellerProfileData } from "../hooks/useSellerProfileData";
import type {
  ProfilePageUserProfile,
  UnifiedProfileViewModel,
} from "../../profile/types";
import type { Language } from "../../../translations";
import type { UpdatePostInput } from "../../../app/routes/usePostActions";

interface SellerProfilePageProps {
  language: Language;
  favoriteIds?: string[];
  onFavoriteToggle?: (postId: string) => void;
  isAuthenticated?: boolean;
  currentUserId?: string;
  currentUserDisplayName?: string;
  onSettingsClick?: () => void;
  onEditProfileClick?: () => void;
  onAddPostClick?: () => void;
  onDeletePost?: (postId: string) => void | Promise<void>;
  onUpdatePost?: (post: UpdatePostInput) => void | Promise<void>;
}

export function SellerProfilePage({
  language,
  favoriteIds = [],
  onFavoriteToggle,
  isAuthenticated = false,
  currentUserId,
  currentUserDisplayName,
  onSettingsClick,
  onEditProfileClick,
  onAddPostClick,
  onDeletePost,
  onUpdatePost,
}: SellerProfilePageProps) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const profileUserId = String(userId || "").trim();
  const isOwner =
    isAuthenticated &&
    profileUserId.length > 0 &&
    String(currentUserId || "").trim() === profileUserId;
  const { activeListings, soldListings, reviews, isLoading, sellerProfile, reload } =
    useSellerProfileData(profileUserId);
  const currentPath = buildCurrentPath(location.pathname, location.search);
  const safeBackPath = resolveBackPathFromLocationState({
    locationState: location.state,
    currentPath,
    fallbackPath: "/",
  });

  const resolvedProfile: ProfilePageUserProfile = {
    id: profileUserId,
    name: sellerProfile?.name || `${language === "ar" ? "مستخدم" : "User"} ${profileUserId}`,
    firstName: "",
    lastName: "",
    email: "",
    phone: sellerProfile?.phone || "",
    location: sellerProfile?.location || (language === "ar" ? "الأردن" : "Jordan"),
    city: undefined,
    area: undefined,
    bio: sellerProfile?.bio || "",
    avatar: sellerProfile?.avatar,
    joinedDate: sellerProfile?.joinDate || "2024",
  };

  const viewModel: UnifiedProfileViewModel = {
    mode: isOwner ? "owner" : "public",
    profileUserId,
    profile: resolvedProfile,
    canEditProfile: isOwner,
    canManageListings: isOwner,
    canChat: !isOwner,
    canCall: true,
    canReview: !isOwner && isAuthenticated,
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
      currentUserId={currentUserId}
      currentUserDisplayName={currentUserDisplayName}
      onBack={() => navigate(safeBackPath)}
      backLabel={language === "ar" ? "العودة" : "Back"}
      title={isOwner ? (language === "ar" ? "ملفي الشخصي" : "My Profile") : (language === "ar" ? "ملف البائع" : "Seller Profile")}
      loadingLabel={
        isOwner
          ? language === "ar"
            ? "جارٍ تحميل ملفك..."
            : "Loading your profile..."
          : language === "ar"
            ? "جارٍ تحميل ملف البائع..."
            : "Loading seller profile..."
      }
      onFavoriteToggle={onFavoriteToggle}
      onPostClick={(postId) =>
        navigate(`/post/${postId}`, {
          state: {
            fromPath: currentPath,
          },
        })
      }
      onSettingsClick={isOwner ? onSettingsClick : undefined}
      onEditProfileClick={isOwner ? onEditProfileClick : undefined}
      onAddPostClick={isOwner ? onAddPostClick : undefined}
      onChatWithSeller={
        !isOwner
          ? () =>
              navigate(`/chat/${profileUserId}`, {
                state: {
                  fromPath: currentPath,
                },
              })
          : undefined
      }
      onDeletePost={isOwner ? onDeletePost : undefined}
      onUpdatePost={isOwner ? onUpdatePost : undefined}
      onReload={reload}
    />
  );
}
