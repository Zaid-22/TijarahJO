import { useState } from "react";
import {
  ChevronDown,
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
import {
  resolveAvatarSrc,
  getAvatarInitial,
} from "../../../../shared/lib/avatar";
import { Button } from "../../../../shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../../shared/ui/dropdown-menu";
import { cn } from "../../../../shared/ui/utils";
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

  onShowMessages,
  onShowSettings,
  onShowAdminDashboard,
  onLogout,
}: HeaderDesktopProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const iconSpacingClass = language === "ar" ? "ml-2" : "mr-2";
  const menuItemClass =
    "group h-[38px] cursor-pointer rounded-xl px-3 text-sm font-bold text-slate-700 outline-hidden transition-all duration-200 hover:bg-primary/[0.04] hover:text-primary focus:bg-primary/[0.04] focus:text-primary dark:text-slate-200 dark:hover:bg-primary/10";
  const iconClass = `h-4.5 w-4.5 text-slate-400 group-hover:text-primary transition-colors duration-200 ${iconSpacingClass}`;

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
    <DropdownMenu onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "hidden h-10 items-center gap-2 rounded-full border border-slate-200/80 bg-white/40 p-0.5 transition-all duration-300 hover:bg-white/80 hover:shadow-sm sm:flex",
            language === "ar"
              ? "flex-row-reverse pl-3 pr-0.5"
              : "flex-row pl-0.5 pr-3",
          )}
          aria-label={
            language === "ar" ? "فتح قائمة الحساب" : "Open account menu"
          }
        >
          <Avatar className="h-9 w-9 border border-white/50 shadow-md">
            <AvatarImage
              src={resolveAvatarSrc(userAvatar) || undefined}
              alt={currentUserDisplayName || "User"}
              className="object-cover object-center"
            />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
              {getAvatarInitial(currentUserDisplayName)}
            </AvatarFallback>
          </Avatar>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform duration-300 ease-in-out",
              isOpen && "rotate-180 text-primary",
            )}
            strokeWidth={2.5}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-3xl border border-slate-200/60 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95"
      >
        <DropdownMenuItem
          onClick={onShowProfile}
          className={`${menuItemClass} cursor-pointer`}
        >
          <User className={iconClass} />
          {language === "ar" ? "ملفي الشخصي" : "My Profile"}
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
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          onClick={onLogout}
          className="group h-[38px] cursor-pointer rounded-xl px-3 text-sm font-bold text-rose-600 outline-hidden transition-all duration-200 hover:bg-rose-50 focus:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          <LogOut className={`h-4.5 w-4.5 text-rose-500 transition-colors duration-200 group-hover:text-rose-700 ${iconSpacingClass}`} />
          {language === "ar" ? "تسجيل الخروج" : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
