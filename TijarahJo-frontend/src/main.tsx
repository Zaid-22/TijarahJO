/// <reference types="vite/client" />
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ui/error-boundary";
import App from "./App";
import { AdminRoute } from "./components/admin/AdminRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { UsersManagement } from "./components/admin/UsersManagement";
import { CategoriesManagement } from "./components/admin/CategoriesManagement";
import "./styles/globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin" element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UsersManagement />} />
                <Route path="categories" element={<CategoriesManagement />} />
              </Route>
            </Route>
            <Route path="/*" element={<App />} />
          </Routes>
          <Toaster position="top-center" richColors expand={true} />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>,
);
