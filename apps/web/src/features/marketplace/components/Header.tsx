import { ArrowLeft, MessageCircle, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../shared/ui/button";
import { Logo } from "../../../shared/ui/logo";
import { type Language, translations } from "../../../translations";
import { useCatalogCategories } from "../../../shared/hooks/useCatalogCategories";
import { HeaderDesktopProfileMenu } from "./header/HeaderDesktopProfileMenu";
import { HeaderMobileMenuSheet } from "./header/HeaderMobileMenuSheet";
import { HeaderSearchInput } from "./header/HeaderSearchInput";

export interface HeaderProps {
  language: Language;
  isAuthenticated?: boolean;
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
  onShowSellItem?: () => void;
  onLogout?: () => void;
  onCategoryClick?: (categoryName: string) => void;
  darkMode?: boolean;
  isAdmin?: boolean;
  unreadMessagesCount?: number;
}

export function Header({
  language,
  isAuthenticated = false,
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
  onShowSellItem,
  onLogout,
  onCategoryClick,
  darkMode = false,
  isAdmin = false,
  unreadMessagesCount = 0,
}: HeaderProps) {
  const t = translations[language];
  const isRTL = language === "ar";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { categories } = useCatalogCategories();
  const normalizedUnreadMessagesCount = Math.max(
    0,
    Math.floor(unreadMessagesCount),
  );
  const actionIconButtonClassName =
    "group relative h-10 w-10 rounded-full border border-border/60 bg-background/70 p-0 text-muted-foreground shadow-sm hover:border-primary/35 hover:bg-primary/5 hover:text-primary hover:shadow-md transition-all";

  return (
    <header className="sticky top-0 z-50 border-b border-border/35 bg-gradient-to-b from-background via-background/95 to-background/90 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
        <div className="flex h-16 items-center gap-3 sm:h-[4.75rem] sm:gap-5">
          <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
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
                  isAdmin={isAdmin}
                  unreadMessagesCount={normalizedUnreadMessagesCount}
                  categories={categories}
                  isOpen={isMobileMenuOpen}
                  onOpenChange={setIsMobileMenuOpen}
                  onShowProfile={onShowProfile}
                  onShowFavorites={onShowFavorites}
                  onShowMessages={onShowMessages}
                  onShowSettings={onShowSettings}
                  onShowAdminDashboard={onShowAdminDashboard}
                  onLogout={onLogout}
                  onCategoryClick={onCategoryClick}
                />
                {showLogo && <Logo size="md" darkMode={darkMode} />}
              </>
            )}
          </div>

          {showSearch && (
            <div className="mx-1 hidden min-w-0 flex-1 md:block lg:mx-5">
              <HeaderSearchInput
                language={language}
                isRTL={isRTL}
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
                onSearchSubmit={onSearchSubmit}
              />
            </div>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                className={actionIconButtonClassName}
                onClick={onShowMessages}
                aria-label={language === "ar" ? "الرسائل" : "Messages"}
              >
                <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
                {normalizedUnreadMessagesCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold leading-none text-destructive-foreground animate-in zoom-in duration-300 ring-2 ring-background">
                    {normalizedUnreadMessagesCount > 99
                      ? "99+"
                      : normalizedUnreadMessagesCount}
                  </span>
                )}
              </Button>
            )}

            {isAuthenticated && (
              <Button
                size="sm"
                className="h-10 rounded-full bg-primary px-2 text-primary-foreground shadow-lg hover:bg-primary/95 hover:shadow-xl active:scale-95 sm:px-5"
                onClick={onShowSellItem}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span
                  className={`text-sm font-semibold ${isRTL ? "mr-1 sm:mr-2" : "ml-1 sm:ml-2"}`}
                >
                  <span className="sr-only sm:not-sr-only">{t.sellItem}</span>
                  <span className="sm:hidden" aria-hidden="true">
                    {language === "ar" ? "بيع" : "Sell"}
                  </span>
                </span>
              </Button>
            )}

            <HeaderDesktopProfileMenu
              language={language}
              isAuthenticated={isAuthenticated}
              isAdmin={isAdmin}
              currentUserDisplayName={currentUserDisplayName}
              userAvatar={userAvatar}
              unreadMessagesCount={normalizedUnreadMessagesCount}
              onShowProfile={onShowProfile}
              onShowFavorites={onShowFavorites}
              onShowMessages={onShowMessages}
              onShowSettings={onShowSettings}
              onShowAdminDashboard={onShowAdminDashboard}
              onLogout={onLogout}
            />
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
