import { useCallback, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Tags,
  Shield,
  ShoppingBag,
  Star,
  MessageSquare,
  MapPin,
  Flag,
  FileText,
  Settings2,
  LogOut,
  Menu,
  Home,
  Image,
} from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { useAuth } from "../../../contexts/AuthContext";
import { userHasAdminPermission } from "../../../contexts/authUtils";
import { AdminGlobalSearch } from "./AdminGlobalSearch";
import { AdminNotificationsBell } from "./AdminNotificationsBell";
import { useSessionTimeout } from "../hooks/useSessionTimeout";
import { ADMIN_PERMISSIONS } from "../adminPermissions";
import { useAppSettings } from "../../../contexts/AppSettingsContext";

const ADMIN_LAYOUT_COPY = {
  en: {
    title: "TijarahJo Admin",
    dashboard: "Dashboard",
    users: "Users",
    listings: "Listings",
    comments: "Comments",
    reviews: "Reviews",
    categories: "Categories",
    roles: "Roles",
    locations: "Locations",
    reports: "Reports",
    banners: "Banners",
    auditLog: "Audit Log",
    settings: "Settings",
    marketplace: "Marketplace",
    logout: "Logout",
    closeSidebar: "Close sidebar",
    openSidebar: "Open sidebar",
    navigation: "Administration navigation",
    searchHint: "Press / to search",
    dismiss: "Dismiss",
  },
  ar: {
    title: "إدارة تجارة جو",
    dashboard: "لوحة التحكم",
    users: "المستخدمون",
    listings: "الإعلانات",
    comments: "التعليقات",
    reviews: "التقييمات",
    categories: "الفئات",
    roles: "الأدوار",
    locations: "المواقع",
    reports: "البلاغات",
    banners: "اللافتات",
    auditLog: "سجل التدقيق",
    settings: "الإعدادات",
    marketplace: "السوق",
    logout: "تسجيل الخروج",
    closeSidebar: "إغلاق القائمة الجانبية",
    openSidebar: "فتح القائمة الجانبية",
    navigation: "تنقل لوحة الإدارة",
    searchHint: "اضغط / للبحث",
    dismiss: "إخفاء",
  },
} as const;

export function AdminLayout() {
  return <AdminLayoutInner />;
}

function AdminLayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout, user } = useAuth();
  const { language } = useAppSettings();
  const copy = ADMIN_LAYOUT_COPY[language];
  const isRtl = language === "ar";
  const navigate = useNavigate();
  const location = useLocation();
  const expireSession = useCallback(async () => {
    await logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);
  const { showWarning, minutesLeft, resetTimer } = useSessionTimeout(expireSession);

  const navItems = [
    { label: copy.dashboard, path: "/admin", icon: LayoutDashboard },
    { label: copy.users, path: "/admin/users", icon: Users, permission: ADMIN_PERMISSIONS.usersView },
    { label: copy.listings, path: "/admin/listings", icon: ShoppingBag, permission: ADMIN_PERMISSIONS.postsView },
    { label: copy.comments, path: "/admin/comments", icon: MessageSquare, permission: ADMIN_PERMISSIONS.commentsView },
    { label: copy.reviews, path: "/admin/reviews", icon: Star, permission: ADMIN_PERMISSIONS.reviewsView },
    { label: copy.categories, path: "/admin/categories", icon: Tags, permission: ADMIN_PERMISSIONS.categoriesManage },
    { label: copy.roles, path: "/admin/roles", icon: Shield, permission: ADMIN_PERMISSIONS.rolesManage },
    { label: copy.locations, path: "/admin/locations", icon: MapPin, permission: ADMIN_PERMISSIONS.locationsManage },
    { label: copy.reports, path: "/admin/reports", icon: Flag, permission: ADMIN_PERMISSIONS.reportsView },
    { label: copy.banners, path: "/admin/banners", icon: Image, permission: ADMIN_PERMISSIONS.bannersManage },
    { label: copy.auditLog, path: "/admin/audit-log", icon: FileText, permission: ADMIN_PERMISSIONS.auditView },
    { label: copy.settings, path: "/admin/settings", icon: Settings2, permission: ADMIN_PERMISSIONS.settingsManage },
  ];

  const visibleNavItems = navItems.filter(
    (item) =>
      !item.permission || userHasAdminPermission(user, item.permission),
  );

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="flex h-screen overflow-hidden bg-background text-foreground"
    >
      {/* Sidebar - Desktop & Mobile */}
      <aside
        className={`fixed inset-y-0 start-0 z-50 w-64 flex flex-col border-e border-border bg-card transform transition-transform duration-300 ease-in-out ${
          sidebarOpen
            ? "translate-x-0"
            : isRtl
              ? "translate-x-full"
              : "-translate-x-full"
        } md:relative md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-between ps-4 pe-2">
            <span className="text-xl font-bold text-primary truncate">
              {copy.title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10 bg-transparent text-foreground hover:bg-muted rounded-xl transition-all"
              aria-label={copy.closeSidebar}
              onClick={() => setSidebarOpen(false)}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>

          {/* Nav Items */}
          <nav
            className="flex-1 overflow-y-auto py-4 px-2 space-y-1"
            aria-label={copy.navigation}
          >
            {visibleNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => navigate(item.path)}
                  aria-current={isActive ? "page" : undefined}
                  className={`w-full justify-start gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="space-y-2 border-t border-border p-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/")}
              className="w-full justify-start gap-3 rounded-lg px-4 py-3 text-foreground transition-colors hover:bg-muted"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">{copy.marketplace}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 rounded-lg px-4 py-3 text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">{copy.logout}</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar - Desktop */}
        <div className="hidden md:flex h-14 items-center border-b border-border bg-card px-6 gap-4">
          <AdminGlobalSearch />
          <div className="ms-auto flex items-center gap-3">
            <AdminNotificationsBell />
            <span className="text-xs text-muted-foreground">
              {copy.searchHint.split("/")[0]}
              <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded">
                /
              </kbd>{" "}
              {copy.searchHint.split("/")[1]}
            </span>
          </div>
        </div>

        {/* Session Timeout Warning */}
        {showWarning && (
          <div className="bg-amber-100 border-b border-amber-300 px-6 py-2 flex items-center justify-between">
            <span className="text-sm text-amber-800 font-medium">
              {language === "ar"
                ? `⏱ تنتهي الجلسة خلال ${minutesLeft} دقيقة. حرّك المؤشر أو اضغط مفتاحًا للبقاء مسجلاً.`
                : `⏱ Session expires in ${minutesLeft} minute${minutesLeft !== 1 ? "s" : ""}. Move your mouse or press a key to stay logged in.`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-800"
              onClick={resetTimer}
            >
              {copy.dismiss}
            </Button>
          </div>
        )}

        {/* Mobile Header - Only show trigger when sidebar is closed */}
        {!sidebarOpen && (
          <div className="relative flex h-16 items-center border-b border-border bg-card px-4 md:hidden">
            {/* Left Button */}
            <div className="flex-1 flex justify-start z-10">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 bg-transparent text-foreground hover:bg-muted rounded-xl transition-all"
                aria-label={copy.openSidebar}
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
            
            {/* Centered Title */}
            <div className="absolute inset-x-0 flex justify-center pointer-events-none">
              <span className="text-lg font-bold tracking-tight text-foreground">
                {copy.dashboard}
              </span>
            </div>
            
            {/* Right Placeholder for symmetry */}
            <div className="flex-1" />
          </div>
        )}

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
