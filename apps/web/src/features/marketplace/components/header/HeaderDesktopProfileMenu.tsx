import { useState } from "react";
import {
  ChevronDown,
  Heart,
  LogOut,
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
  >;

export function HeaderDesktopProfileMenu({
  language,
  isAuthenticated,
  authLoading,
  isAdmin,
  currentUserDisplayName,
  userAvatar,
  onShowProfile,
  onShowFavorites,
  onShowSettings,
  onShowAdminDashboard,
  onLogout,
}: HeaderDesktopProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isRTL = language === "ar";
  const iconSpacingClass = isRTL ? "ml-2.5" : "mr-2.5";
  
  // Premium menu item styling with micro-animations
  const menuItemClass =
    "group flex h-10 cursor-pointer items-center rounded-xl px-3 text-sm font-semibold text-slate-700 outline-hidden transition-all duration-200 hover:bg-primary/5 hover:text-primary focus:bg-primary/5 focus:text-primary dark:text-slate-200 dark:hover:bg-primary/10";
  
  const iconClass = cn(
    "h-4.5 w-4.5 text-slate-400 transition-all duration-300 group-hover:text-primary",
    iconSpacingClass,
    // Add a subtle bounce/move effect on hover
    isRTL ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"
  );

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
        {isRTL ? "تسجيل الدخول" : "Sign In"}
      </Button>
    );
  }

  return (
    <DropdownMenu onOpenChange={setIsOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        {/* 
          Premium Unified Pill: 
          No internal borders or backgrounds for the chevron.
          The entire pill reacts as one single element.
        */}
        <Button
          variant="ghost"
          className={cn(
            "group hidden h-10 items-center gap-1.5 rounded-full p-1 transition-colors duration-300 hover:bg-slate-100 sm:flex dark:hover:bg-slate-800",
            // Logical padding to keep it balanced in both LTR and RTL
            isRTL ? "pl-2.5 pr-1 flex-row-reverse" : "pr-2.5 pl-1 flex-row"
          )}
          aria-label={
            isRTL ? "فتح قائمة الحساب" : "Open account menu"
          }
        >
          <Avatar className="h-8 w-8 transition-transform duration-300 group-hover:scale-105">
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
              "h-4 w-4 text-slate-500 transition-all duration-300 ease-in-out group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-100",
              isOpen && "rotate-180 text-slate-900 dark:text-slate-100"
            )}
            strokeWidth={2.5}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56 rounded-2xl border border-slate-200/60 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95"
      >
        <DropdownMenuItem
          onClick={onShowProfile}
          className={menuItemClass}
        >
          <User className={iconClass} />
          {isRTL ? "ملفي الشخصي" : "My Profile"}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onShowFavorites}
          className={menuItemClass}
        >
          <Heart className={iconClass} />
          {isRTL ? "المفضلة" : "Favorites"}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onShowSettings}
          className={menuItemClass}
        >
          <Settings className={iconClass} />
          {isRTL ? "الإعدادات" : "Settings"}
        </DropdownMenuItem>

        {isAdmin && (
          <DropdownMenuItem
            onClick={onShowAdminDashboard}
            className={menuItemClass}
          >
            <Shield className={iconClass} />
            {isRTL ? "لوحة الإدارة" : "Admin Dashboard"}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="mx-1 my-1 border-slate-100 dark:border-slate-800" />

        <DropdownMenuItem
          onClick={onLogout}
          className="group flex h-10 cursor-pointer items-center rounded-xl px-3 text-sm font-semibold text-rose-600 outline-hidden transition-all duration-200 hover:bg-rose-50 focus:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          <LogOut 
            className={cn(
              "h-4.5 w-4.5 text-rose-400 transition-all duration-300 group-hover:text-rose-600",
              iconSpacingClass,
              isRTL ? "group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"
            )} 
          />
          {isRTL ? "تسجيل الخروج" : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
