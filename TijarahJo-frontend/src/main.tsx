/// <reference types="vite/client" />
import { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ui/error-boundary";
import App from "./App";
import "./styles/globals.css";

const AdminRoute = lazy(() =>
  import("./components/admin/AdminRoute").then((m) => ({ default: m.AdminRoute })),
);
const AdminLayout = lazy(() =>
  import("./components/admin/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const AdminDashboard = lazy(() =>
  import("./components/admin/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const UsersManagement = lazy(() =>
  import("./components/admin/UsersManagement").then((m) => ({
    default: m.UsersManagement,
  })),
);
const CategoriesManagement = lazy(() =>
  import("./components/admin/CategoriesManagement").then((m) => ({
    default: m.CategoriesManagement,
  })),
);
const RolesManagement = lazy(() =>
  import("./components/admin/RolesManagement").then((m) => ({
    default: m.RolesManagement,
  })),
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
        <Toaster position="top-center" richColors expand={true} />
      </BrowserRouter>
    </AuthProvider>
  </ErrorBoundary>,
);
