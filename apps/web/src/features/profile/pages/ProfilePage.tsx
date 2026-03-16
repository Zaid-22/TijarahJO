import { translations, Language } from "../../../translations";
import { Post } from "../../../types";
import { CreatePostInput } from "../../../app/routes/appRoutesUtils";
import { UpdatePostInput } from "../../../app/routes/usePostActions";
import type { ProfilePageUserProfile } from "../types";
import { getProfileListings } from "../profileListings";
import { ProfileHeaderSection } from "../components/ProfileHeaderSection";
import { ProfileSidebarSection } from "../components/ProfileSidebarSection";
import { ProfileListingsSection } from "../components/ProfileListingsSection";
import { ProfileReviewsSection } from "../components/ProfileReviewsSection";
import { SubpageHeader } from "../../../shared/ui/subpage-header";
import { PageShell } from "../../../shared/ui/page-shell";
import { Button } from "../../../shared/ui/button";
import { Settings } from "lucide-react";

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
  currentUserDisplayName?: string;
}

export function ProfilePage({
  onBackToMarketplace,
  posts = [],
  onPostClick,
  onDeletePost,
  onUpdatePost,
  onAddPost,
  onAddPostClick,
  onSettingsClick,
  onEditProfileClick,
  language = "en",
  userProfile,
  favoriteIds = [],
  onFavoriteToggle,
  isAuthenticated = false,
  currentUserDisplayName,
}: ProfilePageProps) {
  const t = translations[language];
  const isRTL = language === "ar";

  const { activeListings, soldListings, normalizedCurrentUserId } =
    getProfileListings(posts, userProfile, currentUserDisplayName);

  return (
    <PageShell tone="account">
      <SubpageHeader
        onBack={onBackToMarketplace}
        isRTL={isRTL}
        backLabel={t.backToMarketplace}
        title={t.myProfile}
        showLogo={false}
        rightContent={
          onSettingsClick ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onSettingsClick}
              aria-label={language === "ar" ? "الإعدادات" : "Settings"}
            >
              <Settings className={`w-4 h-4 me-2`} />
              <span className="hidden sm:inline">
                {language === "ar" ? "الإعدادات" : "Settings"}
              </span>
            </Button>
          ) : null
        }
      />
      <ProfileHeaderSection
        userProfile={userProfile}
        isRTL={isRTL}
        t={t}
        activeListingsCount={activeListings.length}
        onEditProfileClick={onEditProfileClick}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ProfileSidebarSection userProfile={userProfile} t={t} />

          <div className="lg:col-span-2">
            <ProfileListingsSection
              language={language}
              isRTL={isRTL}
              t={t}
              userProfile={userProfile}
              activeListings={activeListings}
              soldListings={soldListings}
              favoriteIds={favoriteIds}
              isAuthenticated={isAuthenticated}
              currentUserId={
                isAuthenticated ? normalizedCurrentUserId || undefined : undefined
              }
              currentUserDisplayName={currentUserDisplayName}
              onPostClick={onPostClick}
              onDeletePost={onDeletePost}
              onUpdatePost={onUpdatePost}
              onAddPost={onAddPost}
              onAddPostClick={onAddPostClick}
              onFavoriteToggle={onFavoriteToggle}
            />
          </div>
        </div>

        {userProfile.id && (
          <div className="mt-6">
            <ProfileReviewsSection 
              userId={userProfile.id} 
              language={language} 
              t={t} 
            />
          </div>
        )}
      </div>
    </PageShell>
  );
}
