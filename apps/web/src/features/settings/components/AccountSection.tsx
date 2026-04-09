import { User, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { Separator } from "../../../shared/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import type { SettingsTranslations } from "../../../translations/settings";

interface AccountSectionProps {
  text: SettingsTranslations;
  displayName: string;
  displayEmail: string;
  displayPhone: string;
  displayLocation: string;
  onEditProfileClick?: () => void;
}

export function AccountSection({
  text,
  displayName,
  displayEmail,
  displayPhone,
  displayLocation,
  onEditProfileClick,
}: AccountSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/20">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle>{text.accountSettings}</CardTitle>
              <CardDescription className="break-words">
                {text.accountDesc}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onEditProfileClick}
            className="w-full sm:w-auto whitespace-nowrap border-primary text-primary hover:bg-muted"
          >
            {text.editProfile || "Edit Profile"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {text.fullName}
          </p>
          <div className="text-foreground">{displayName}</div>
        </div>

        <Separator />
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{text.email}</p>
          <div className="flex items-center gap-2 text-foreground">
            <Mail className="w-4 h-4 opacity-50" />
            {displayEmail}
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{text.phone}</p>
          <div className="flex items-center gap-2 text-foreground">
            <Phone className="w-4 h-4 opacity-50" />
            {displayPhone}
          </div>
        </div>
        <Separator />
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {text.currentLocation}
          </p>
          <div className="flex items-center gap-2 text-foreground">
            <MapPin className="w-4 h-4 opacity-50" />
            {displayLocation}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
