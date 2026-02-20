import { translations, Language } from "../translations";
import { Product } from "../types";
import { CreatePostInput } from "../app/routes/appRoutesUtils";
import type { ProfilePageUserProfile } from "../features/profile/types";
import { getProfileListings } from "../features/profile/profileListings";
import { ProfileHeaderSection } from "../features/profile/components/ProfileHeaderSection";
import { ProfileSidebarSection } from "../features/profile/components/ProfileSidebarSection";
import { ProfileListingsSection } from "../features/profile/components/ProfileListingsSection";

interface ProfilePageProps {
  onBackToMarketplace: () => void;
  products: Product[];
  onProductClick?: (productId: string) => void;
  onDeleteProduct?: (productId: string) => void;
  onUpdateProduct?: (product: Product) => void;
  onAddProduct?: (product: CreatePostInput) => void | Promise<void>;
  onAddProductClick?: () => void;
  onSettingsClick?: () => void;
  onEditProfileClick?: () => void;
  language?: Language;
  userProfile: ProfilePageUserProfile;
  favoriteIds?: string[];
  onFavoriteToggle?: (productId: string) => void;
  isAuthenticated?: boolean;
  currentUserDisplayName?: string;
}

export function ProfilePage({
  onBackToMarketplace,
  products = [],
  onProductClick,
  onDeleteProduct,
  onUpdateProduct,
  onAddProduct,
  onAddProductClick,
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
    getProfileListings(products, userProfile, currentUserDisplayName);

  return (
    <div className="bg-gray-50 dark:bg-[#1a1a1a]">
      <ProfileHeaderSection
        userProfile={userProfile}
        isRTL={isRTL}
        t={t}
        activeListingsCount={activeListings.length}
        onBackToMarketplace={onBackToMarketplace}
        onSettingsClick={onSettingsClick}
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
              onProductClick={onProductClick}
              onDeleteProduct={onDeleteProduct}
              onUpdateProduct={onUpdateProduct}
              onAddProduct={onAddProduct}
              onAddProductClick={onAddProductClick}
              onFavoriteToggle={onFavoriteToggle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
