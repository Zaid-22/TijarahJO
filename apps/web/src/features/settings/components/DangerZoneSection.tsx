import { Trash2, LogOut } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { Label } from "../../../shared/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import type { SettingsTranslations } from "../../../translations/settings";

interface DangerZoneSectionProps {
  text: SettingsTranslations;
  onLogout?: () => void;
  onDeleteAccount?: () => void | Promise<void>;
}

export function DangerZoneSection({
  text,
  onLogout,
  onDeleteAccount,
}: DangerZoneSectionProps) {
  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-destructive">
              {text.dangerZone}
            </CardTitle>
            <CardDescription>{text.dangerDesc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <LogOut className="w-4 h-4 text-destructive" />
                <Label className="text-destructive">{text.logout}</Label>
              </div>
              <p className="text-sm text-muted-foreground">{text.logoutDesc}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/40 text-destructive hover:bg-destructive/15"
              onClick={onLogout}
              aria-label={text.logout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Trash2 className="w-4 h-4 text-destructive" />
                <Label className="text-destructive">{text.deleteAccount}</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {text.deleteAccountDesc}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/40 text-destructive hover:bg-destructive/15"
              aria-label={text.deleteAccount}
              onClick={onDeleteAccount}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
