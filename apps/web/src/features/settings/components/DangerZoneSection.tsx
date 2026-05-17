import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "../../../shared/ui/button";
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
    <Card className="border-destructive/20 shadow-sm overflow-hidden bg-card/50">
      <CardHeader className="pb-4 border-b border-destructive/10 bg-destructive/2">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-inner">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-destructive tracking-tight">
              {text.dangerZone}
            </CardTitle>
            <CardDescription className="text-sm font-medium opacity-70">
              {text.dangerDesc}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-destructive/10">
        {/* Logout Item */}
        <div className="flex items-center justify-between p-5 transition-colors duration-200">
          <div className="flex items-center gap-4 max-w-[70%]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground transition-colors truncate">
                {text.logout}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {text.logoutDesc}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl px-4 font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all active:scale-95"
            onClick={onLogout}
          >
            {text.logout}
          </Button>
        </div>

        {/* Delete Account Item */}
        <div className="flex items-center justify-between p-5 transition-colors duration-200">
          <div className="flex items-center gap-4 max-w-[70%]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground transition-colors truncate">
                {text.deleteAccount}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {text.deleteAccountDesc}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl px-4 font-semibold border-destructive/20 text-destructive hover:bg-destructive hover:text-white dark:hover:bg-destructive/90 transition-all active:scale-95 shadow-sm"
            onClick={onDeleteAccount}
          >
            {text.deleteAccount}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
