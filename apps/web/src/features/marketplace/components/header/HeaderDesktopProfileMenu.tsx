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
import { resolveAvatarSrc, getAvatarInitial } from "../../../../shared/lib/avatar";
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
    | "authLoading"
    | "isAdmin"
    | "currentUserDisplayName"
    | "userAvatar"
    | "unreadMessagesCount"
  >;

export function HeaderDesktopProfileMenu({
  language,
  isAuthenticated,
  authLoading,
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
  const iconSpacingClass = language === "ar" ? "ml-3" : "mr-3";
  const menuItemClass =
    "h-11 rounded-xl px-3 text-sm font-medium text-foreground/90 transition-colors hover:bg-accent/70 focus:bg-accent/70";
  const iconClass = `h-4 w-4 text-muted-foreground/90 ${iconSpacingClass}`;

  if (authLoading) {
    return <div className="hidden h-10 w-24 sm:block" aria-hidden="true" />;
  }

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
          className="hidden h-10 w-10 rounded-full border border-border/60 bg-background/70 p-0 shadow-sm transition-colors duration-200 hover:border-primary/35 hover:bg-primary/5 sm:flex"
          aria-label={
            language === "ar" ? "فتح قائمة الحساب" : "Open account menu"
          }
        >
          <Avatar className="h-9 w-9 border border-border/70 bg-muted shadow-sm ring-2 ring-background">
            <AvatarImage
              src={resolveAvatarSrc(userAvatar) || undefined}
              alt={currentUserDisplayName || "User"}
              className="object-cover object-center"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {getAvatarInitial(currentUserDisplayName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-52 rounded-2xl border border-border/70 bg-background/96 p-2 shadow-xl backdrop-blur-sm"
      >
        <DropdownMenuItem
          onClick={onShowProfile}
          className={`${menuItemClass} cursor-pointer`}
        >
          <User className={iconClass} />
          {language === "ar" ? "ملفي الشخصي" : "My Profile"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onShowFavorites}
          className={`${menuItemClass} cursor-pointer`}
        >
          <Heart className={iconClass} />
          {language === "ar" ? "المفضلة" : "Favorites"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onShowMessages}
          className={`${menuItemClass} cursor-pointer`}
        >
          <MessageCircle className={iconClass} />
          <span>{language === "ar" ? "الرسائل" : "Messages"}</span>
          {normalizedUnread > 0 && (
            <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
              {normalizedUnread > 99 ? "99+" : normalizedUnread}
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onShowSettings}
          className={`${menuItemClass} cursor-pointer`}
        >
          <Settings className={iconClass} />
          {language === "ar" ? "الإعدادات" : "Settings"}
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem
            onClick={onShowAdminDashboard}
            className={`${menuItemClass} cursor-pointer`}
          >
            <Shield className={iconClass} />
            {language === "ar" ? "لوحة الإدارة" : "Admin Dashboard"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="my-2" />
        <DropdownMenuItem
          onClick={onLogout}
          className="h-11 cursor-pointer rounded-xl px-3 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 focus:bg-rose-50 focus:text-rose-700 dark:hover:bg-rose-950/20 dark:focus:bg-rose-950/20 dark:focus:text-rose-400"
        >
          <LogOut className={`h-4 w-4 text-rose-500 ${iconSpacingClass}`} />
          {language === "ar" ? "تسجيل الخروج" : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
