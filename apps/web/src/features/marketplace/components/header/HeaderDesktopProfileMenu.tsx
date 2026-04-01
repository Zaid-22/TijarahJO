import {
  Heart,
  LogOut,
  MessageCircle,
  Settings,
  Shield,
  User,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../../shared/ui/avatar";
import { resolveAvatarSrc } from "../../../../shared/lib/avatar";
import { Button } from "../../../../shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../shared/ui/dropdown-menu";
import { type HeaderActionHandlers, type HeaderIdentity } from "./headerTypes";

type HeaderDesktopProfileMenuProps = HeaderActionHandlers &
  Pick<
    HeaderIdentity,
    | "language"
    | "isAuthenticated"
    | "isAdmin"
    | "currentUserDisplayName"
    | "userAvatar"
    | "unreadMessagesCount"
  >;

export function HeaderDesktopProfileMenu({
  language,
  isAuthenticated,
  isAdmin,
  currentUserDisplayName,
  userAvatar,
  unreadMessagesCount,
  onShowProfile,
  onShowFavorites,
  onShowMessages,
  onShowSettings,
  onShowAdminDashboard,
  onLogout,
}: HeaderDesktopProfileMenuProps) {
  const iconSpacingClass = language === "ar" ? "ml-2" : "mr-2";

  if (!isAuthenticated) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="hidden h-10 rounded-full border border-primary/35 bg-background/85 px-5 font-semibold text-primary shadow-sm hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md sm:flex"
        onClick={onShowProfile}
      >
        {language === "ar" ? "تسجيل الدخول" : "Sign In"}
      </Button>
    );
  }

  const normalizedUnread = Math.max(0, Math.floor(unreadMessagesCount));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-10 w-10 rounded-full border border-border/60 bg-background/70 p-0 shadow-sm transition-all duration-200 hover:scale-105 hover:border-primary/35 hover:bg-primary/5 sm:flex"
          aria-label={
            language === "ar" ? "فتح قائمة الحساب" : "Open account menu"
          }
        >
          <Avatar className="h-9 w-9 border border-border/70 bg-muted shadow-sm ring-2 ring-background">
            <AvatarImage
              src={resolveAvatarSrc(userAvatar)}
              alt={currentUserDisplayName || "User"}
              className="object-cover object-center"
            />
            <AvatarFallback className="bg-muted text-muted-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onShowProfile} className="cursor-pointer">
          <User className={`h-4 w-4 ${iconSpacingClass}`} />
          {language === "ar" ? "ملفي الشخصي" : "My Profile"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onShowFavorites} className="cursor-pointer">
          <Heart className={`h-4 w-4 ${iconSpacingClass}`} />
          {language === "ar" ? "المفضلة" : "Favorites"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onShowMessages} className="cursor-pointer">
          <MessageCircle className={`h-4 w-4 ${iconSpacingClass}`} />
          <span>{language === "ar" ? "الرسائل" : "Messages"}</span>
          {normalizedUnread > 0 && (
            <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
              {normalizedUnread > 99 ? "99+" : normalizedUnread}
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onShowSettings} className="cursor-pointer">
          <Settings className={`h-4 w-4 ${iconSpacingClass}`} />
          {language === "ar" ? "الإعدادات" : "Settings"}
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem
            onClick={onShowAdminDashboard}
            className="cursor-pointer"
          >
            <Shield className={`h-4 w-4 ${iconSpacingClass}`} />
            {language === "ar" ? "لوحة الإدارة" : "Admin Dashboard"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className={`h-4 w-4 ${iconSpacingClass}`} />
          {language === "ar" ? "تسجيل الخروج" : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
