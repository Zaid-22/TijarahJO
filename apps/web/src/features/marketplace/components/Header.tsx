import { ArrowLeft, MessageCircle, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Suspense, lazy, useState } from "react";
import { Button } from "../../../shared/ui/button";
import { Logo } from "../../../shared/ui/logo";
import { type Language } from "../../../translations";
import { useCatalogCategories } from "../../../shared/hooks/useCatalogCategories";
import { cn } from "../../../shared/ui/utils";
import { HeaderMobileMenuSheet } from "./header/HeaderMobileMenuSheet";
import { HeaderSearchInput } from "./header/HeaderSearchInput";

const HeaderDesktopProfileMenu = lazy(() =>
  import("./header/HeaderDesktopProfileMenu").then((m) => ({
    default: m.HeaderDesktopProfileMenu,
  })),
);
const HeaderNotificationsDropdown = lazy(() =>
  import("./header/HeaderNotificationsDropdown").then((m) => ({
    default: m.HeaderNotificationsDropdown,
  })),
);

interface HeaderProps {
  language: Language;
  isAuthenticated?: boolean;
  authLoading?: boolean;
  currentUserDisplayName?: string;
  userAvatar?: string;
  showBackButton?: boolean;
  showLogo?: boolean;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: () => void;
  onBack?: () => void;
  onShowFavorites?: () => void;
  onShowMessages?: () => void;
  onShowProfile?: () => void;
  onShowSettings?: () => void;
  onShowAdminDashboard?: () => void;
  onShowCreatePost?: () => void;
  onLogout?: () => void;
  onCategoryClick?: (categoryName: string) => void;
  onNotificationsNavigate?: (url: string) => void;
  darkMode?: boolean;
  isAdmin?: boolean;
  isMaintenanceMode?: boolean;
  unreadMessagesCount?: number;
}

export function Header({
  language,
  isAuthenticated = false,
  authLoading = false,
  currentUserDisplayName,
  userAvatar,
  showBackButton = false,
  showLogo = true,
  showSearch = true,
  searchQuery = "",
  onSearchChange,
  onSearchSubmit,
  onBack,
  onShowFavorites,
  onShowMessages,
  onShowProfile,
  onShowSettings,
  onShowAdminDashboard,
  onShowCreatePost,
  onLogout,
  onCategoryClick,
  onNotificationsNavigate,
  darkMode = false,
  isAdmin = false,
  isMaintenanceMode = false,
  unreadMessagesCount = 0,
}: HeaderProps) {

  const isRTL = language === "ar";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { categories } = useCatalogCategories({
    enabled: isMobileMenuOpen,
    useInitialFallback: true,
  });
  const normalizedUnreadMessagesCount = Math.max(
    0,
    Math.floor(unreadMessagesCount),
  );
  const actionIconButtonClassName =
    "group relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100";
  const notificationFallbackClassName =
    "h-10 w-10 rounded-full bg-slate-100/50 dark:bg-slate-800/50";
  const shouldShowAuthenticatedActions = !authLoading && isAuthenticated;
  const authIconFallbackClassName =
    "hidden h-10 w-10 rounded-full bg-slate-100/50 dark:bg-slate-800/50 sm:flex";

  return (
    <header className="sticky top-0 z-50 border-b border-border/20 bg-background/80 shadow-md backdrop-blur-xl supports-backdrop-filter:bg-background/60 transition-all duration-300">
      <div className="relative mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 sm:h-18 sm:gap-5">
          {/* Left section: Logo & Mobile Menu */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="group rounded-full border border-border/60 bg-background/70 p-1 text-muted-foreground shadow-sm hover:border-primary/35 hover:bg-primary/5 hover:text-primary sm:p-2"
                aria-label={language === "ar" ? "رجوع" : "Go back"}
              >
                <ArrowLeft
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${isRTL ? "rotate-180 group-hover:translate-x-1" : "group-hover:-translate-x-1"}`}
                />
              </Button>
            ) : (
              <>
                <HeaderMobileMenuSheet
                  language={language}
                  isRTL={isRTL}
                  isAuthenticated={isAuthenticated}
                  authLoading={authLoading}
                  isAdmin={isAdmin}
                  unreadMessagesCount={normalizedUnreadMessagesCount}
                  categories={categories}
                  isOpen={isMobileMenuOpen}
                  onOpenChange={setIsMobileMenuOpen}
                  onShowProfile={onShowProfile}
                  onShowMessages={onShowMessages}
                  onShowSettings={onShowSettings}
                  onShowAdminDashboard={onShowAdminDashboard}
                  onLogout={onLogout}
                  onCategoryClick={onCategoryClick}
                />
                {showLogo && (
                  <div className="flex items-center gap-3">
                    <Link
                      to="/"
                      className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:opacity-90 transition-opacity"
                      aria-label={language === "ar" ? "العودة إلى الرئيسية" : "Go to homepage"}
                    >
                      <Logo size="md" darkMode={darkMode} />
                    </Link>
                    {isAdmin && isMaintenanceMode && (
                      <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600 border border-amber-500/20 uppercase tracking-wider animate-pulse whitespace-nowrap">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {language === "ar" ? "وضع الصيانة" : "Maintenance Mode"}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Middle section: Search Bar */}
          {showSearch && (
            <div className="hidden min-w-0 flex-1 md:flex md:justify-center lg:mx-4">
              <div className="w-full max-w-2xl transition-all duration-300">
                <HeaderSearchInput
                  language={language}
                  isRTL={isRTL}
                  searchQuery={searchQuery}
                  onSearchChange={onSearchChange}
                  onSearchSubmit={onSearchSubmit}
                />
              </div>
            </div>
          )}

          {/* Right section: Profile, Actions & Sell Button */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            {/* Utility Icons Group */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {shouldShowAuthenticatedActions && (
                <Suspense fallback={<div className={notificationFallbackClassName} aria-hidden="true" />}>
                  <HeaderNotificationsDropdown
                    language={language}
                    unreadCount={normalizedUnreadMessagesCount}
                    onNavigate={onNotificationsNavigate}
                  />
                </Suspense>
              )}



              {shouldShowAuthenticatedActions && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={actionIconButtonClassName}
                  onClick={onShowMessages}
                  aria-label={language === "ar" ? "الرسائل" : "Messages"}
                >
                  <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
                  {normalizedUnreadMessagesCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-xs font-bold text-destructive-foreground leading-none">
                      {normalizedUnreadMessagesCount > 99 ? "99+" : normalizedUnreadMessagesCount}
                    </span>
                  )}
                </Button>
              )}
            </div>

            {/* Active Group: Profile & Create Post */}
            <div className="flex items-center gap-3 sm:gap-4">
              {authLoading ? (
                <div className="hidden h-10 w-24 sm:block" aria-hidden="true" />
              ) : isAuthenticated ? (
                <Suspense fallback={<div className={authIconFallbackClassName} aria-hidden="true" />}>
                  <HeaderDesktopProfileMenu
                    language={language}
                    isAuthenticated={isAuthenticated}
                    authLoading={authLoading}
                    isAdmin={isAdmin}
                    currentUserDisplayName={currentUserDisplayName}
                    userAvatar={userAvatar}
                    onShowProfile={onShowProfile}
                    onShowFavorites={onShowFavorites}
                    onShowMessages={onShowMessages}
                    onShowSettings={onShowSettings}
                    onShowAdminDashboard={onShowAdminDashboard}
                    onLogout={onLogout}
                  />
                </Suspense>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="hidden h-10 rounded-full border border-primary/35 bg-background/85 px-5 font-semibold text-primary shadow-sm hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md sm:flex"
                  onClick={onShowProfile}
                >
                  {language === "ar" ? "تسجيل الدخول" : "Sign In"}
                </Button>
              )}

              {shouldShowAuthenticatedActions && (
                <Button
                  size="sm"
                  className="h-10 rounded-full bg-linear-to-b from-primary to-primary/90 px-4 text-primary-foreground transition-all duration-300 hover:brightness-110 active:scale-95 sm:px-5"
                  onClick={onShowCreatePost}
                >
                  <Plus className={cn("h-4 w-4", language === "ar" ? "ml-1.5" : "mr-1.5")} strokeWidth={2.5} />
                  <span className="text-sm font-bold tracking-tight">
                    <span className="sr-only sm:not-sr-only">
                      {language === "ar" ? "إنشاء منشور" : "Create Post"}
                    </span>
                    <span className="sm:hidden" aria-hidden="true">
                      {language === "ar" ? "نشر" : "Post"}
                    </span>
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {showSearch && (
          <div className="md:hidden pb-4">
            <HeaderSearchInput
              language={language}
              isRTL={isRTL}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              onSearchSubmit={onSearchSubmit}
            />
          </div>
        )}
      </div>
    </header>
  );
}
