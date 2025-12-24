import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "../ui/sheet";
import { Logo } from "../ui/logo";
import { translations, Language } from "../../translations";
import { 
  ArrowLeft, 
  Search, 
  Heart,
  User,
  Plus,
  Languages as LanguagesIcon,
  Settings,
  LogOut,
  Menu
} from "lucide-react";
import { useState } from "react";
import { categoryData } from "../../data/categoryData";

interface HeaderProps {
  language: Language;
  isAuthenticated?: boolean;
  currentUserName?: string;
  userAvatar?: string;
  userFirstName?: string;
  userLastName?: string;
  showBackButton?: boolean;
  showLogo?: boolean;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: () => void;
  onBack?: () => void;
  onShowFavorites?: () => void;
  onShowProfile?: () => void;
  onShowSettings?: () => void;
  onShowSellItem?: () => void;
  onLogout?: () => void;
  onToggleLanguage?: () => void;
  onCategoryClick?: (categoryName: string) => void;
  darkMode?: boolean;
}

export function Header({
  language,
  isAuthenticated = false,
  currentUserName,
  userAvatar,
  userFirstName,
  userLastName,
  showBackButton = false,
  showLogo = true,
  showSearch = true,
  searchQuery = "",
  onSearchChange,
  onSearchSubmit,
  onBack,
  onShowFavorites,
  onShowProfile,
  onShowSettings,
  onShowSellItem,
  onLogout,
  onToggleLanguage,
  onCategoryClick,
  darkMode = false
}: HeaderProps) {
  const t = translations[language];
  const isRTL = language === "ar";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim() && onSearchSubmit) {
      e.preventDefault();
      onSearchSubmit();
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setIsMobileMenuOpen(false);
    if (onCategoryClick) {
      onCategoryClick(categoryName);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-gray-800 shadow-sm backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Left Section - Logo/Menu/Back Button */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {showBackButton ? (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onBack}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 p-1 sm:p-2 flex-shrink-0"
                style={{ color: "#0A4ABF" }}
              >
                <ArrowLeft className={`w-5 h-5 sm:w-6 sm:h-6 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
            ) : (
              <>
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden p-1 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
                      style={{ color: "#0A4ABF" }}
                    >
                      <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side={isRTL ? "right" : "left"}
                    className="w-80 dark:bg-[#111111] dark:border-gray-800 overflow-y-auto"
                  >
                    <SheetHeader>
                      <SheetTitle className="dark:text-white">
                        {t.menu || "Menu"}
                      </SheetTitle>
                      <SheetDescription className="dark:text-gray-400">
                        {t.menuDescription || "Access your profile and settings"}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4 pb-6">
                      {/* User Actions Section */}
                      {isAuthenticated ? (
                        <div className="space-y-2">
                          <h3 className="px-4 text-sm text-gray-500 dark:text-gray-400">
                            {language === "ar" ? "الحساب" : "Account"}
                          </h3>
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                onShowProfile?.();
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                              <User className="w-5 h-5 text-[#0A4ABF] dark:text-[#3E7EFF]" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {language === "ar" ? "ملفي الشخصي" : "My Profile"}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                onShowFavorites?.();
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                              <Heart className="w-5 h-5 text-[#0A4ABF] dark:text-[#3E7EFF]" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {language === "ar" ? "المفضلة" : "Favorites"}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                onShowSettings?.();
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                              <Settings className="w-5 h-5 text-[#0A4ABF] dark:text-[#3E7EFF]" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {language === "ar" ? "الإعدادات" : "Settings"}
                              </span>
                            </button>
                            <div className="h-px bg-gray-200 dark:bg-gray-800 my-2" />
                            <button
                              type="button"
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                onLogout?.();
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                            >
                              <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                              <span className="text-red-600 dark:text-red-400">
                                {language === "ar" ? "تسجيل الخروج" : "Logout"}
                              </span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              onShowProfile?.();
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0A4ABF] dark:bg-[#3E7EFF] text-white hover:opacity-90 rounded-lg transition-opacity"
                          >
                            <User className="w-5 h-5" />
                            <span className="font-medium">
                              {language === "ar" ? "تسجيل الدخول" : "Sign In"}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Categories Section */}
                      <div className="space-y-2">
                        <h3 className="px-4 text-sm text-gray-500 dark:text-gray-400">
                          {language === "ar" ? "التصنيفات" : "Categories"}
                        </h3>
                        <div className="space-y-1">
                          {categoryData.map((category) => {
                            const CategoryIcon = category.icon;
                            const categoryName = language === "ar" ? category.nameAr : category.name;
                            return (
                              <button
                                key={category.name}
                                type="button"
                                onClick={() => handleCategoryClick(category.name)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              >
                                <CategoryIcon className="w-5 h-5" style={{ color: category.color }} />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {categoryName}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                {showLogo && <Logo size="md" darkMode={darkMode} />}
              </>
            )}
          </div>

          {/* Center Section - Search */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <div className="relative w-full">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500`} />
                <Input 
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className={`${isRTL ? 'pr-12' : 'pl-12'} h-11 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-[#0A4ABF] dark:focus:border-[#3E7EFF] rounded-full dark:text-white dark:placeholder:text-gray-500`}
                />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange?.("")}
                    className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Right Section - Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {isAuthenticated && (
              <Button 
                size="sm"
                className="hover:opacity-90 shadow-sm dark:shadow-[#0A4ABF]/20 h-9 sm:h-10 px-2 sm:px-4"
                style={{ backgroundColor: "#0A4ABF", color: "white" }}
                onClick={onShowSellItem}
              >
                <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-2">{t.sellItem}</span>
              </Button>
            )}
            
            {/* Desktop Only - Profile */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden sm:flex hover:opacity-80 transition-opacity rounded-full focus:outline-none">
                    <Avatar className="w-10 h-10 border-2 border-[#0A4ABF] dark:border-[#3E7EFF]">
                      <AvatarImage src={userAvatar} alt={currentUserName || 'User'} />
                      <AvatarFallback 
                        style={{ backgroundColor: "#0A4ABF", color: "white" }}
                        className="dark:bg-[#3E7EFF] text-sm"
                      >
                        {(userFirstName?.[0] || currentUserName?.[0] || 'U')}
                        {(userLastName?.[0] || '')}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 dark:bg-[#111111] dark:border-gray-800">
                  <DropdownMenuItem
                    onClick={onShowProfile}
                    className="cursor-pointer dark:hover:bg-gray-800 dark:text-white"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {language === "ar" ? "ملفي الشخصي" : "My Profile"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onShowFavorites}
                    className="cursor-pointer dark:hover:bg-gray-800 dark:text-white"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    {language === "ar" ? "المفضلة" : "Favorites"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onShowSettings}
                    className="cursor-pointer dark:hover:bg-gray-800 dark:text-white"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {language === "ar" ? "الإعدادات" : "Settings"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-gray-800" />
                  <DropdownMenuItem
                    onClick={onLogout}
                    className="cursor-pointer dark:hover:bg-gray-800 text-red-600 dark:text-red-400"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {language === "ar" ? "تسجيل الخروج" : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                size="sm"
                variant="outline"
                className="hidden sm:flex hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-[#3E7EFF] dark:border-gray-700 px-4"
                style={{ color: "#0A4ABF", borderColor: "#0A4ABF" }}
                onClick={onShowProfile}
              >
                {language === "ar" ? "تسجيل الدخول" : "Sign In"}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        {showSearch && (
          <div className="md:hidden pb-4">
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500`} />
              <Input 
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onKeyDown={handleKeyPress}
                className={`${isRTL ? 'pr-12' : 'pl-12'} h-11 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-[#0A4ABF] dark:focus:border-[#3E7EFF] rounded-full dark:text-white dark:placeholder:text-gray-500`}
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}