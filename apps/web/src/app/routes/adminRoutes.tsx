import { Suspense, lazy } from "react";
import { Route } from "react-router-dom";
import { LoadingState } from "../../shared/ui/loading-state";
import { ADMIN_PERMISSIONS } from "../../features/admin/adminPermissions";
import { lazyImportWithRetry } from "../../shared/lib/lazyImportWithRetry";

const AdminRoute = lazy(() =>
  import("../../features/admin/components/AdminRoute").then((m) => ({
    default: m.AdminRoute,
  })),
);
const AdminPermissionRoute = lazy(() =>
  import("../../features/admin/components/AdminPermissionRoute").then((m) => ({
    default: m.AdminPermissionRoute,
  })),
);
const AdminLayout = lazy(() =>
  import("../../features/admin/components/AdminLayout").then((m) => ({
    default: m.AdminLayout,
  })),
);
const AdminDashboard = lazy(() =>
  import("../../features/admin/components/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const UsersManagement = lazy(() =>
  import("../../features/admin/components/UsersManagement").then((m) => ({
    default: m.UsersManagement,
  })),
);
const UserDetailAdminPage = lazy(() =>
  import("../../features/admin/components/UserDetailAdminPage").then((m) => ({
    default: m.UserDetailAdminPage,
  })),
);
const ListingsManagement = lazy(() =>
  import("../../features/admin/components/ListingsManagement").then((m) => ({
    default: m.ListingsManagement,
  })),
);
const CategoriesManagement = lazy(() =>
  import("../../features/admin/components/CategoriesManagement").then((m) => ({
    default: m.CategoriesManagement,
  })),
);
const RolesManagement = lazy(() =>
  import("../../features/admin/components/RolesManagement").then((m) => ({
    default: m.RolesManagement,
  })),
);
const ReviewsModeration = lazy(() =>
  import("../../features/admin/components/ReviewsModeration").then((m) => ({
    default: m.ReviewsModeration,
  })),
);
const PostCommentsModeration = lazy(() =>
  import("../../features/admin/components/PostCommentsModeration").then((m) => ({
    default: m.PostCommentsModeration,
  })),
);
const AuditLogViewer = lazy(() =>
  import("../../features/admin/components/AuditLogViewer").then((m) => ({
    default: m.AuditLogViewer,
  })),
);
const SystemSettingsPanel = lazy(
  lazyImportWithRetry(
    () =>
      import("../../features/admin/components/SystemSettingsPanel").then((m) => ({
        default: m.SystemSettingsPanel,
      })),
    "lazy-import-retry:system-settings-panel",
  ),
);
const ChatInspection = lazy(() =>
  import("../../features/admin/components/ChatInspection").then((m) => ({
    default: m.ChatInspection,
  })),
);
const LocationsManagement = lazy(() =>
  import("../../features/admin/components/LocationsManagement").then((m) => ({
    default: m.LocationsManagement,
  })),
);
const ReportsQueue = lazy(() =>
  import("../../features/admin/components/ReportsQueue").then((m) => ({
    default: m.ReportsQueue,
  })),
);
const FraudDetectionPanel = lazy(() =>
  import("../../features/admin/components/FraudDetectionPanel").then((m) => ({
    default: m.FraudDetectionPanel,
  })),
);
const AdminBannersManagement = lazy(() =>
  import("../../features/admin/components/AdminBannersManagement").then((m) => ({
    default: m.AdminBannersManagement,
  })),
);

/**
 * Renders the admin route sub-tree.
 * All admin components are lazy-loaded and permission-gated.
 */
export function renderAdminRoutes() {
  return (
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
        <Route
          path="users"
          element={
            <AdminPermissionRoute
              requiredPermission={ADMIN_PERMISSIONS.usersView}
            >
              <UsersManagement />
            </AdminPermissionRoute>
          }
        />
        <Route
          path="users/:id"
          element={
            <AdminPermissionRoute
              requiredPermission={ADMIN_PERMISSIONS.usersView}
            >
              <UserDetailAdminPage />
            </AdminPermissionRoute>
          }
        />
        <Route
          path="listings"
          element={
            <AdminPermissionRoute
              requiredPermission={ADMIN_PERMISSIONS.postsView}
            >
              <ListingsManagement />
            </AdminPermissionRoute>
          }
        />
        <Route
          path="comments"
          element={
            <AdminPermissionRoute
              requiredPermission={ADMIN_PERMISSIONS.commentsView}
            >
              <PostCommentsModeration />
            </AdminPermissionRoute>
          }
        />
        <Route
          path="reviews"
          element={
            <AdminPermissionRoute
              requiredPermission={ADMIN_PERMISSIONS.reviewsView}
            >
              <ReviewsModeration />
            </AdminPermissionRoute>
          }
        />
        <Route
          path="categories"
          element={
            <AdminPermissionRoute
              requiredPermission={ADMIN_PERMISSIONS.categoriesManage}
            >
              <CategoriesManagement />
            </AdminPermissionRoute>
          }
        />
        <Route
          path="roles"
          element={
            <AdminPermissionRoute
              requiredPermission={ADMIN_PERMISSIONS.rolesManage}
            >
              <RolesManagement />
            </AdminPermissionRoute>
          }
        />
        <Route
          path="audit-log"
          element={
            <AdminPermissionRoute
              requiredPermission={ADMIN_PERMISSIONS.auditView}
            >
              <AuditLogViewer />
            </AdminPermissionRoute>
          }
        />
        <Route
          path="settings"
          element={
            <AdminPermissionRoute
              requiredPermission={ADMIN_PERMISSIONS.settingsManage}
            >
              <SystemSettingsPanel />
            </AdminPermissionRoute>
          }
        />
        <Route
          path="chats"
          element={
            <AdminPermissionRoute
              requiredPermission={ADMIN_PERMISSIONS.chatView}
            >
              <ChatInspection />
            </AdminPermissionRoute>
          }
        />
        <Route
          path="locations"
          element={
            <AdminPermissionRoute
              requiredPermission={ADMIN_PERMISSIONS.locationsManage}
            >
              <LocationsManagement />
            </AdminPermissionRoute>
          }
        />
        <Route
          path="reports"
          element={
            <AdminPermissionRoute
              requiredPermission={ADMIN_PERMISSIONS.reportsView}
            >
              <ReportsQueue />
            </AdminPermissionRoute>
          }
        />
        <Route
          path="fraud"
          element={
            <AdminPermissionRoute
              requiredPermission={ADMIN_PERMISSIONS.fraudView}
            >
              <FraudDetectionPanel />
            </AdminPermissionRoute>
          }
        />
        <Route
          path="banners"
          element={
            <AdminPermissionRoute
              requiredPermission={ADMIN_PERMISSIONS.bannersManage}
            >
              <AdminBannersManagement />
            </AdminPermissionRoute>
          }
        />
      </Route>
    </Route>
  );
}
