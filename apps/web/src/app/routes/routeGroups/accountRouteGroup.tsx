import { lazy, type ReactElement } from "react";
import { Route, type NavigateFunction } from "react-router-dom";
import { deferredToast } from "../../../utils/toast";
import { api } from "../../../services/api";
import {
  toEditProfileFormProfile,
  toProfilePageUserProfile,
} from "../appRoutesUtils";
import { APP_ROUTE_BUILDERS, APP_ROUTE_PATHS } from "../routeConfig";
import type {
  BaseAppRouteProps,
  MarketplaceRouteState,
  PostActions,
} from "../AppRouteTypes";
import type { EditProfileFormProfile } from "../../../features/profile/types";

const ChatPage = lazy(() =>
  import("../../../features/chat/pages/ChatPage").then((m) => ({ default: m.ChatPage })),
);
const SettingsPage = lazy(() =>
  import("../../../features/settings/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const FavoritesPage = lazy(() =>
  import("../../../features/marketplace/pages/FavoritesPage").then((m) => ({ default: m.FavoritesPage })),
);
const SellItemPage = lazy(() =>
  import("../../../features/marketplace/pages/SellItemPage").then((m) => ({ default: m.SellItemPage })),
);
const EditProfilePage = lazy(() =>
  import("../../../features/profile/pages/EditProfilePage").then((m) => ({
    default: m.EditProfilePage,
  })),
);
const ProfilePage = lazy(() =>
  import("../../../features/profile/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);

interface AccountRouteGroupParams {
  appProps: BaseAppRouteProps;
  routeState: MarketplaceRouteState;
  postActions: PostActions;
  saveProfile: (profile: EditProfileFormProfile) => Promise<void> | void;
  navigate: NavigateFunction;
  requireAuth: (element: ReactElement) => ReactElement;
  promptLoginModal?: () => void;
}

export function renderAccountRouteGroup({
  appProps,
  routeState,
  postActions,
  saveProfile,
  navigate,
  requireAuth,
  promptLoginModal,
}: AccountRouteGroupParams) {
  const openSupportEmail = (subject: string) => {
    if (typeof window === "undefined") {
      return;
    }

    window.location.href = `mailto:info@tijarahjo.com?subject=${encodeURIComponent(subject)}`;
  };
  const currentUserId = appProps.isAuthenticated
    ? routeState.currentUserId
    : undefined;
  const sharedUserRouteProps = {
    isAuthenticated: appProps.isAuthenticated,
    currentUserId,
    currentUserDisplayName: appProps.currentUserDisplayName,
  } as const;
  const sharedPostRouteProps = {
    availablePosts: routeState.availablePosts,
    favoriteIds: routeState.favoriteIds,
    onFavoriteToggle: routeState.toggleFavorite,
  } as const;

  return (
    <>
      <Route
        path={APP_ROUTE_PATHS.settings}
        element={requireAuth(
          <SettingsPage
            onBackToMarketplace={() => navigate(APP_ROUTE_PATHS.home)}
            language={appProps.language}
            darkMode={appProps.darkMode}
            onDarkModeChange={appProps.setDarkMode}
            onLanguageChange={appProps.toggleLanguage}
            onLogout={async () => {
              await appProps.logout();
              navigate(APP_ROUTE_PATHS.home);
            }}
            userProfile={{
              name: appProps.userProfile.name,
              email: appProps.userProfile.email,
              phone: appProps.userProfile.phone,
              location: appProps.userProfile.location,
            }}
            onEditProfileClick={() => navigate(APP_ROUTE_PATHS.profileEdit)}
            onOpenHelpCenter={() =>
              navigate(APP_ROUTE_PATHS.help, { state: { fromPath: APP_ROUTE_PATHS.settings } })
            }
            onContactSupport={() =>
              openSupportEmail(
                appProps.language === "ar"
                  ? "دعم TijarahJo"
                  : "TijarahJo Support",
              )
            }
            onReportIssue={() =>
              openSupportEmail(
                appProps.language === "ar"
                  ? "بلاغ مشكلة في TijarahJo"
                  : "TijarahJo Issue Report",
              )
            }
            onOpenTerms={() =>
              navigate(APP_ROUTE_PATHS.terms, { state: { fromPath: APP_ROUTE_PATHS.settings } })
            }
            onOpenPrivacy={() =>
              navigate(APP_ROUTE_PATHS.privacy, { state: { fromPath: APP_ROUTE_PATHS.settings } })
            }
            onDeleteAccount={async () => {
              const fallbackSupportSubject = appProps.language === "ar"
                ? "طلب حذف حساب TijarahJo"
                : "TijarahJo Account Deletion Request";
              const resolvedUserId = String(
                routeState.currentUserId || appProps.userProfile.id || "",
              ).trim();

              if (!/^[0-9]+$/.test(resolvedUserId)) {
                deferredToast.error(
                  appProps.language === "ar"
                    ? "لا يمكن تحديد معرف الحساب الحالي. تم فتح بريد الدعم."
                    : "Could not resolve your account ID. Support email has been opened.",
                );
                openSupportEmail(fallbackSupportSubject);
                return;
              }

              const result = await api.users.deleteUser(resolvedUserId);
              if (!result.success) {
                deferredToast.error(
                  result.message ||
                    (appProps.language === "ar"
                      ? "تعذر حذف الحساب. حاول مرة أخرى."
                      : "Failed to delete account. Please try again."),
                );
                return;
              }

              await appProps.logout();
              deferredToast.success(
                appProps.language === "ar"
                  ? "تم حذف الحساب بنجاح."
                  : "Account deleted successfully.",
              );
              navigate(APP_ROUTE_PATHS.login, { replace: true });
            }}
          />,
        )}
      />

      <Route
        path={APP_ROUTE_PATHS.favorites}
        element={requireAuth(
          <FavoritesPage
            onBackToMarketplace={() => navigate(APP_ROUTE_PATHS.home)}
            language={appProps.language}
            favoriteIds={routeState.favoriteIds}
            posts={sharedPostRouteProps.availablePosts}
            onRemoveFavorite={routeState.toggleFavorite}
            onPostClick={(id) =>
              navigate(APP_ROUTE_BUILDERS.postDetails(id), {
                state: { fromPath: APP_ROUTE_PATHS.favorites },
              })
            }
            isAuthenticated={sharedUserRouteProps.isAuthenticated}
            currentUserId={sharedUserRouteProps.currentUserId}
            onRequireAuth={() => promptLoginModal?.()}
          />,
        )}
      />

      <Route
        path={APP_ROUTE_PATHS.sell}
        element={requireAuth(
          <SellItemPage
            language={appProps.language}
            onBack={() => navigate(APP_ROUTE_PATHS.home)}
            onSubmit={async (post) => {
              try {
                await postActions.createPost(post);
                deferredToast.success(
                  appProps.language === "ar"
                    ? "تم نشر المنشور!"
                    : "Post created!",
                );
                navigate(APP_ROUTE_PATHS.home);
              } catch (error) {
                deferredToast.error(
                  error instanceof Error ? error.message : "Error creating post",
                );
              }
            }}
            userProfile={appProps.userProfile}
            darkMode={appProps.darkMode}
          />,
        )}
      />

      <Route
        path={APP_ROUTE_PATHS.profile}
        element={requireAuth(
          <ProfilePage
            onBackToMarketplace={() => navigate(APP_ROUTE_PATHS.home)}
            posts={sharedPostRouteProps.availablePosts}
            onPostClick={(id) =>
              navigate(APP_ROUTE_BUILDERS.postDetails(id), {
                state: { fromPath: APP_ROUTE_PATHS.profile },
              })
            }
            onDeletePost={async (postId) => {
              try {
                await postActions.deletePost(postId);
                deferredToast.success("Post deleted");
              } catch {
                deferredToast.error("Error deleting post");
              }
            }}
            onUpdatePost={async (updatedPost) => {
              try {
                await postActions.updatePost(updatedPost);
                deferredToast.success("Post updated");
              } catch {
                deferredToast.error("Error updating post");
              }
            }}
            onAddPost={async (post) => {
              try {
                await postActions.createPost(post);
                deferredToast.success("Post created");
              } catch (error) {
                deferredToast.error(
                  error instanceof Error ? error.message : "Error creating post",
                );
              }
            }}
            onAddPostClick={() => navigate(APP_ROUTE_PATHS.sell)}
            onSettingsClick={() => navigate(APP_ROUTE_PATHS.settings)}
            onEditProfileClick={() => navigate(APP_ROUTE_PATHS.profileEdit)}
            language={appProps.language}
            userProfile={toProfilePageUserProfile(appProps.userProfile)}
            favoriteIds={sharedPostRouteProps.favoriteIds}
            onFavoriteToggle={sharedPostRouteProps.onFavoriteToggle}
            isAuthenticated={sharedUserRouteProps.isAuthenticated}
            currentUserDisplayName={sharedUserRouteProps.currentUserDisplayName}
          />,
        )}
      />

      <Route
        path={APP_ROUTE_PATHS.chat}
        element={requireAuth(<ChatPage language={appProps.language} />)}
      />
      <Route
        path={APP_ROUTE_PATHS.chatUser}
        element={requireAuth(<ChatPage language={appProps.language} />)}
      />

      <Route
        path={APP_ROUTE_PATHS.profileEdit}
        element={requireAuth(
          <EditProfilePage
            onBack={() => navigate(APP_ROUTE_PATHS.profile)}
            profile={toEditProfileFormProfile(appProps.userProfile)}
            onSave={saveProfile}
            language={appProps.language}
          />,
        )}
      />
    </>
  );
}
