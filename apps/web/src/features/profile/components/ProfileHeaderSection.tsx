import { Calendar, Edit, MapPin, User } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/ui/avatar";
import type { ProfilePageUserProfile } from "../types";

interface ProfileHeaderSectionProps {
  userProfile: ProfilePageUserProfile;
  isRTL: boolean;
  t: Record<string, string>;
  activeListingsCount: number;
  onEditProfileClick?: () => void;
}

export function ProfileHeaderSection({
  userProfile,
  isRTL,
  t,
  activeListingsCount,
  onEditProfileClick,
}: ProfileHeaderSectionProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary to-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 pb-6">
          <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-background">
            <AvatarImage src={userProfile.avatar} className="object-cover object-center" />
            <AvatarFallback className="bg-muted text-muted-foreground">
              <User className="h-8 w-8 sm:h-9 sm:w-9" />
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 w-full text-primary-foreground sm:w-auto">
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
                  {t.memberSince} {userProfile.joinedDate}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-background text-primary hover:bg-muted"
                onClick={onEditProfileClick}
              >
                <Edit className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                <span className="hidden xs:inline">{t.editProfile}</span>
                <span className="xs:hidden">{t.editProfile}</span>
              </Button>
            </div>
          </div>

          <div className="w-full sm:w-auto flex justify-center sm:justify-start gap-6 rounded-lg bg-background/10 p-4 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-2xl">{activeListingsCount}</div>
              <div className="text-sm opacity-90">{t.activeListings}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
