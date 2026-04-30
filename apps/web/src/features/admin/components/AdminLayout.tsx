import { useState } from "react";
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

export function AdminLayout() {
  return <AdminLayoutInner />;
}

function AdminLayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showWarning, minutesLeft, resetTimer } = useSessionTimeout();

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Users", path: "/admin/users", icon: Users, permission: ADMIN_PERMISSIONS.usersView },
    { label: "Listings", path: "/admin/listings", icon: ShoppingBag, permission: ADMIN_PERMISSIONS.postsView },
    { label: "Comments", path: "/admin/comments", icon: MessageSquare, permission: ADMIN_PERMISSIONS.commentsView },
    { label: "Reviews", path: "/admin/reviews", icon: Star, permission: ADMIN_PERMISSIONS.reviewsView },
    { label: "Categories", path: "/admin/categories", icon: Tags, permission: ADMIN_PERMISSIONS.categoriesManage },
    { label: "Roles", path: "/admin/roles", icon: Shield, permission: ADMIN_PERMISSIONS.rolesManage },
    { label: "Locations", path: "/admin/locations", icon: MapPin, permission: ADMIN_PERMISSIONS.locationsManage },
    { label: "Reports", path: "/admin/reports", icon: Flag, permission: ADMIN_PERMISSIONS.reportsView },
    { label: "Banners", path: "/admin/banners", icon: Image, permission: ADMIN_PERMISSIONS.bannersManage },
    { label: "Audit Log", path: "/admin/audit-log", icon: FileText, permission: ADMIN_PERMISSIONS.auditView },
    { label: "Settings", path: "/admin/settings", icon: Settings2, permission: ADMIN_PERMISSIONS.settingsManage },
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
    <div dir="ltr" className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar - Desktop & Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-border bg-card transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-between pl-4 pr-2">
            <span className="text-xl font-bold text-primary truncate">
              TijarahJo Admin
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10 bg-transparent text-foreground hover:bg-muted rounded-xl transition-all"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
            {visibleNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  type="button"
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => navigate(item.path)}
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
              <span className="font-medium">Marketplace</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start gap-3 rounded-lg px-4 py-3 text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar - Desktop */}
        <div className="hidden md:flex h-14 items-center border-b border-border bg-card px-6 gap-4">
          <AdminGlobalSearch />
          <div className="ml-auto flex items-center gap-3">
            <AdminNotificationsBell />
            <span className="text-xs text-muted-foreground">
              Press{" "}
              <kbd className="px-1.5 py-0.5 text-xs bg-muted border border-border rounded">
                /
              </kbd>{" "}
              to search
            </span>
          </div>
        </div>

        {/* Session Timeout Warning */}
        {showWarning && (
          <div className="bg-amber-100 border-b border-amber-300 px-6 py-2 flex items-center justify-between">
            <span className="text-sm text-amber-800 font-medium">
              ⏱ Session expires in {minutesLeft} minute
              {minutesLeft !== 1 ? "s" : ""}. Move your mouse or press a key to
              stay logged in.
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-amber-800"
              onClick={resetTimer}
            >
              Dismiss
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
                aria-label="Open sidebar"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </Button>
            </div>
            
            {/* Centered Title */}
            <div className="absolute inset-x-0 flex justify-center pointer-events-none">
              <span className="text-lg font-bold tracking-tight text-foreground">
                Admin Dashboard
              </span>
            </div>
            
            {/* Right Placeholder for symmetry */}
            <div className="flex-1" />
          </div>
        )}

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
