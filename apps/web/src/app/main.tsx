/// <reference types="vite/client" />
import { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../contexts/AuthContext";
import { serverQueryClient } from "../shared/query/queryClient";
import { ErrorBoundary } from "../shared/ui/error-boundary";
import { LoadingState } from "../shared/ui/loading-state";
import App from "./App";
import "../styles/globals.css";

const AdminRoute = lazy(() =>
  import("../features/admin/components/AdminRoute").then((m) => ({
    default: m.AdminRoute,
  })),
);
const AdminLayout = lazy(() =>
  import("../features/admin/components/AdminLayout").then((m) => ({
    default: m.AdminLayout,
  })),
);
const AdminDashboard = lazy(() =>
  import("../features/admin/components/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const UsersManagement = lazy(() =>
  import("../features/admin/components/UsersManagement").then((m) => ({
    default: m.UsersManagement,
  })),
);
const UserDetailAdminPage = lazy(() =>
  import("../features/admin/components/UserDetailAdminPage").then((m) => ({
    default: m.UserDetailAdminPage,
  })),
);
const ListingsManagement = lazy(() =>
  import("../features/admin/components/ListingsManagement").then((m) => ({
    default: m.ListingsManagement,
  })),
);
const CategoriesManagement = lazy(() =>
  import("../features/admin/components/CategoriesManagement").then((m) => ({
    default: m.CategoriesManagement,
  })),
);
const RolesManagement = lazy(() =>
  import("../features/admin/components/RolesManagement").then((m) => ({
    default: m.RolesManagement,
  })),
);
const ReviewsModeration = lazy(() =>
  import("../features/admin/components/ReviewsModeration").then((m) => ({
    default: m.ReviewsModeration,
  })),
);
const AuditLogViewer = lazy(() =>
  import("../features/admin/components/AuditLogViewer").then((m) => ({
    default: m.AuditLogViewer,
  })),
);
const SystemSettingsPanel = lazy(() =>
  import("../features/admin/components/SystemSettingsPanel").then((m) => ({
    default: m.SystemSettingsPanel,
  })),
);
const ChatInspection = lazy(() =>
  import("../features/admin/components/ChatInspection").then((m) => ({
    default: m.ChatInspection,
  })),
);
const LocationsManagement = lazy(() =>
  import("../features/admin/components/LocationsManagement").then((m) => ({
    default: m.LocationsManagement,
  })),
);
const ReportsQueue = lazy(() =>
  import("../features/admin/components/ReportsQueue").then((m) => ({
    default: m.ReportsQueue,
  })),
);
const FraudDetectionPanel = lazy(() =>
  import("../features/admin/components/FraudDetectionPanel").then((m) => ({
    default: m.FraudDetectionPanel,
  })),
);
const AdminBannersManagement = lazy(() =>
  import("../features/admin/components/AdminBannersManagement").then((m) => ({
    default: m.AdminBannersManagement,
  })),
);
const Toaster = lazy(() =>
  import("../shared/ui/sonner").then((m) => ({ default: m.Toaster })),
);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <ErrorBoundary>
    <QueryClientProvider client={serverQueryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/admin"
              element={
                <Suspense fallback={<LoadingState />}>
                  <AdminRoute />
                </Suspense>
              }
            >
              <Route
                element={
                  <Suspense fallback={<LoadingState />}>
                    <AdminLayout />
                  </Suspense>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UsersManagement />} />
                <Route path="users/:id" element={<UserDetailAdminPage />} />
                <Route path="listings" element={<ListingsManagement />} />
                <Route path="reviews" element={<ReviewsModeration />} />
                <Route path="categories" element={<CategoriesManagement />} />
                <Route path="roles" element={<RolesManagement />} />
                <Route path="audit-log" element={<AuditLogViewer />} />
                <Route path="settings" element={<SystemSettingsPanel />} />
                <Route path="chats" element={<ChatInspection />} />
                <Route path="locations" element={<LocationsManagement />} />
                <Route path="reports" element={<ReportsQueue />} />
                <Route path="fraud" element={<FraudDetectionPanel />} />
                <Route path="banners" element={<AdminBannersManagement />} />
              </Route>
            </Route>
            <Route path="/*" element={<App />} />
          </Routes>
          <Suspense fallback={null}>
            <Toaster position="top-center" richColors expand={true} />
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>,
);
