import { Calendar, Edit, MapPin, Settings } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/ui/avatar";
import type { ProfilePageUserProfile } from "../types";

interface ProfileHeaderSectionProps {
  userProfile: ProfilePageUserProfile;
  isRTL: boolean;
  t: Record<string, string>;
  activeListingsCount: number;
  onBackToMarketplace: () => void;
  onSettingsClick?: () => void;
  onEditProfileClick?: () => void;
}

export function ProfileHeaderSection({
  userProfile,
  isRTL,
  t,
  activeListingsCount,
  onBackToMarketplace,
  onSettingsClick,
  onEditProfileClick,
}: ProfileHeaderSectionProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#0A4ABF] to-[#3E7EFF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 px-2 sm:px-4"
            onClick={onBackToMarketplace}
          >
            ← {t.backToMarketplace || "Back to Marketplace"}
          </Button>
          {onSettingsClick ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              onClick={onSettingsClick}
            >
              <Settings className={`w-5 h-5 ${isRTL ? "ml-2" : "mr-2"}`} />
              <span className="hidden sm:inline">{t.settings || "Settings"}</span>
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pb-6">
          <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-white">
            <AvatarImage src={userProfile.avatar} />
            <AvatarFallback className="text-xl sm:text-2xl">
              {userProfile.firstName?.[0] || ""}
              {userProfile.lastName?.[0] || ""}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-white w-full sm:w-auto">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl">{userProfile.name}</h1>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm opacity-90 mb-3">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>
                  {userProfile.city || userProfile.location}
                  {userProfile.area ? `, ${userProfile.area}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {t.memberSince || "Member since"} {userProfile.joinedDate}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-white text-[#0A4ABF] hover:bg-gray-100"
                onClick={onEditProfileClick}
              >
                <Edit className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                <span className="hidden xs:inline">{t.editProfile || "Edit Profile"}</span>
                <span className="xs:hidden">Edit</span>
              </Button>
            </div>
          </div>

          <div className="w-full sm:w-auto flex justify-center sm:justify-start gap-6 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-2xl">{activeListingsCount}</div>
              <div className="text-sm opacity-90">{t.activeListings || "Active"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
