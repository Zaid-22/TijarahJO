import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Tags,
  Shield,
  ShoppingBag,
  MessageSquare,
  MessageCircle,
  MapPin,
  Flag,
  FileText,
  Settings2,
  LogOut,
  Menu,
  X,
  Home,
} from "lucide-react";
import { Button } from "../../../shared/ui/button";
import { useAuth } from "../../../contexts/AuthContext";
import { AdminGlobalSearch } from "./AdminGlobalSearch";

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { label: "Users", path: "/admin/users", icon: Users },
    { label: "Listings", path: "/admin/listings", icon: ShoppingBag },
    { label: "Reviews", path: "/admin/reviews", icon: MessageSquare },
    { label: "Chats", path: "/admin/chats", icon: MessageCircle },
    { label: "Categories", path: "/admin/categories", icon: Tags },
    { label: "Roles", path: "/admin/roles", icon: Shield },
    { label: "Locations", path: "/admin/locations", icon: MapPin },
    { label: "Reports", path: "/admin/reports", icon: Flag },
    { label: "Audit Log", path: "/admin/audit-log", icon: FileText },
    { label: "Settings", path: "/admin/settings", icon: Settings2 },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar - Desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Header */}
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <span className="text-xl font-bold text-primary">
              TijarahJo Admin
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Close admin sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
            {navItems.map((item) => {
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
          <div className="ml-auto text-xs text-muted-foreground">
            Press{" "}
            <kbd className="px-1.5 py-0.5 text-[10px] bg-muted border border-border rounded">
              /
            </kbd>{" "}
            to search
          </div>
        </div>
        {/* Mobile Header */}
        <div className="flex h-16 items-center border-b border-border bg-card px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open admin sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <span className="ml-4 text-lg font-semibold">Admin Dashboard</span>
        </div>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
