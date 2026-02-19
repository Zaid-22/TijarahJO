/// <reference types="vite/client" />
import { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import { ErrorBoundary } from "../shared/ui/error-boundary";
import App from "./App";
import "../styles/globals.css";

const AdminRoute = lazy(() =>
  import("../features/admin/components/AdminRoute").then((m) => ({ default: m.AdminRoute })),
);
const AdminLayout = lazy(() =>
  import("../features/admin/components/AdminLayout").then((m) => ({ default: m.AdminLayout })),
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
const Toaster = lazy(() =>
  import("../shared/ui/sonner").then((m) => ({ default: m.Toaster })),
);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <ErrorBoundary>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/admin"
            element={
              <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
                <AdminRoute />
              </Suspense>
            }
          >
            <Route
              element={
                <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
                  <AdminLayout />
                </Suspense>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="categories" element={<CategoriesManagement />} />
              <Route path="roles" element={<RolesManagement />} />
            </Route>
          </Route>
          <Route path="/*" element={<App />} />
        </Routes>
        <Suspense fallback={null}>
          <Toaster position="top-center" richColors expand={true} />
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </ErrorBoundary>,
);
