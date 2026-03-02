import { Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import type { ProfilePageUserProfile } from "../types";

interface ProfileSidebarSectionProps {
  userProfile: ProfilePageUserProfile;
  t: Record<string, string>;
}

export function ProfileSidebarSection({
  userProfile,
  t,
}: ProfileSidebarSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.contactInformation}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-primary" />
            <div>
              <div className="text-sm opacity-60">{t.phone}</div>
              <div>{userProfile.phone}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.about}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm opacity-80">{userProfile.bio}</p>
        </CardContent>
      </Card>
    </div>
  );
}
