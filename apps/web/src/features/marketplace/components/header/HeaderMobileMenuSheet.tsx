import {
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { type ComponentType } from "react";
import { type Category } from "../../../../types/api";
import { type Language, translations } from "../../../../translations";
import { Button } from "../../../../shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../../../shared/ui/sheet";
import {
  resolveCategoryName,
} from "../../../../shared/lib/categoryVisuals";
import { cn } from "../../../../shared/ui/utils";
import { type HeaderActionHandlers } from "./headerTypes";

interface HeaderMobileMenuSheetProps extends HeaderActionHandlers {
  language: Language;
  isRTL: boolean;
  isAuthenticated: boolean;
  authLoading: boolean;
  isAdmin: boolean;
  unreadMessagesCount: number;
  categories: Category[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MobileActionRowProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
  badge?: string;
}

function MobileActionRow({
  icon: Icon,
  label,
  onClick,
  danger = false,
  badge,
}: MobileActionRowProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-auto w-full justify-start gap-3 rounded-lg px-4 py-3",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-muted",
      )}
    >
      <Icon
        className={cn("h-5 w-5", danger ? "text-destructive" : "text-primary")}
      />
      <span>{label}</span>
      {badge && (
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
          {badge}
        </span>
      )}
    </Button>
  );
}

export function HeaderMobileMenuSheet({
  language,
  isRTL,
  isAuthenticated,
  authLoading,
  isAdmin,
  unreadMessagesCount,
  categories,
  isOpen,
  onOpenChange,
  onShowProfile,

  onShowMessages,
  onShowSettings,
  onShowAdminDashboard,
  onLogout,
  onCategoryClick,
}: HeaderMobileMenuSheetProps) {
  const t = translations[language];
  const normalizedUnread = Math.max(0, Math.floor(unreadMessagesCount));

  const closeAndRun = (action?: () => void) => {
    onOpenChange(false);
    action?.();
  };

  const onCategorySelected = (categoryName: string) => {
    onOpenChange(false);
    onCategoryClick?.(categoryName);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "p-1 text-primary hover:bg-muted sm:p-2 md:hidden transition-all duration-300 z-60",
            isOpen && "relative bg-muted rounded-lg"
          )}
          aria-label={language === "ar" ? "القائمة" : "Menu"}
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={isRTL ? "right" : "left"}
        hideCloseButton
        className="w-80 overflow-y-auto border-border bg-background"
      >
        <SheetHeader>
          <SheetTitle>{t.menu || "Menu"}</SheetTitle>
          <SheetDescription>
            {t.menuDescription || "Access your profile and settings"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4 pb-6">
          {!authLoading && isAuthenticated ? (
            <div className="space-y-2">
              <h3 className="px-4 text-sm text-muted-foreground">
                {language === "ar" ? "الحساب" : "Account"}
              </h3>
              <div className="space-y-1">
                <MobileActionRow
                  icon={User}
                  label={language === "ar" ? "ملفي الشخصي" : "My Profile"}
                  onClick={() => closeAndRun(onShowProfile)}
                />
                <MobileActionRow
                  icon={MessageCircle}
                  label={language === "ar" ? "الرسائل" : "Messages"}
                  onClick={() => closeAndRun(onShowMessages)}
                  badge={normalizedUnread > 0 ? String(normalizedUnread > 99 ? "99+" : normalizedUnread) : undefined}
                />
                <MobileActionRow
                  icon={Settings}
                  label={language === "ar" ? "الإعدادات" : "Settings"}
                  onClick={() => closeAndRun(onShowSettings)}
                />
                {isAdmin && (
                  <MobileActionRow
                    icon={Shield}
                    label={language === "ar" ? "لوحة الإدارة" : "Admin Dashboard"}
                    onClick={() => closeAndRun(onShowAdminDashboard)}
                  />
                )}
              </div>
            </div>
          ) : !authLoading ? (
            <div className="space-y-2">
              <Button
                onClick={() => closeAndRun(onShowProfile)}
                className="h-auto w-full justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-primary-foreground hover:bg-primary/90"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">
                  {language === "ar" ? "تسجيل الدخول" : "Sign In"}
                </span>
              </Button>
            </div>
          ) : null}

          <div className="space-y-2">
            <h3 className="px-4 text-sm text-muted-foreground">
              {language === "ar" ? "التصنيفات" : "Categories"}
            </h3>
            <div className="space-y-1">
              {categories.map((category) => {
                const categoryName = resolveCategoryName(category, language);

                return (
                  <Button
                    key={String(category.id || category.name)}
                    variant="ghost"
                    onClick={() => onCategorySelected(category.name)}
                    className="h-auto w-full justify-start rounded-lg px-4 py-3 text-foreground hover:bg-muted"
                  >
                    <span>{categoryName}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {!authLoading && isAuthenticated && (
            <div className="mt-6 pt-4 border-t border-border">
              <MobileActionRow
                icon={LogOut}
                label={language === "ar" ? "تسجيل الخروج" : "Logout"}
                onClick={() => closeAndRun(onLogout)}
                danger
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
