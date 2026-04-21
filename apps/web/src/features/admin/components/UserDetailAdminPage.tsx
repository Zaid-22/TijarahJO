import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Ban,
  Calendar,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldBan,
  User,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { Badge } from "../../../shared/ui/badge";
import { api } from "../../../services/api";
import { AdminUserDetails } from "../../../services/api/admin";
import { LoadingState } from "../../../shared/ui/loading-state";
import { resolveAvatarSrc, getAvatarInitial } from "../../../shared/lib/avatar";
import { formatCompactDate } from "../../../shared/lib/dateTime";
import { SuspendUserDialog } from "./users/SuspendUserDialog";
import { logger } from "../../../shared/lib/logger";
import { emitAuthSessionChanged } from "../../../contexts/authContextUtils";
import { APP_ROUTE_BUILDERS } from "../../../app/routes/routeConfig";
import {
  buildCurrentPath,
  resolveBackPathFromLocationState,
} from "../../../shared/lib/backNavigation";

export function UserDetailAdminPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [userDetails, setUserDetails] = useState<AdminUserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendDurationHours, setSuspendDurationHours] = useState("24");
  const [isSuspending, setIsSuspending] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setLoadError(null);
      const details = await api.admin.getUserDetails(parseInt(id, 10));

      if (details) {
        setUserDetails(details);
      } else {
        setLoadError("User not found.");
      }
    } catch (error) {
      logger.warn("[UserDetailAdminPage] Failed to fetch user details", error);
      setLoadError("Failed to fetch user details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  const currentPath = buildCurrentPath(location.pathname, location.search);
  const backPath = resolveBackPathFromLocationState({
    locationState: location.state,
    currentPath,
    fallbackPath: "/admin/users",
  });
  const handleBack = () => navigate(backPath);

  if (isLoading) {
    return (
      <LoadingState
        label="Loading user details..."
        minHeightClassName="min-h-screen"
      />
    );
  }

  if (loadError || !userDetails) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
        </Button>
        <div className="p-8 text-center text-destructive bg-destructive/10 rounded-lg">
          {loadError || "User details could not be loaded."}
        </div>
      </div>
    );
  }

  const { user, recentPosts, recentReviews } = userDetails;
  const userId = String(user.id || user.userID || id || "");
  const displayName = `${String(user.firstName || "")} ${String(user.lastName || "")}`.trim() || String(user.email || `User #${userId}`);
  const suspendedUntil = user.suspendedUntil
    ? new Date(user.suspendedUntil)
    : null;
  const isTimedSuspended =
    user.status === 1 &&
    suspendedUntil !== null &&
    !Number.isNaN(suspendedUntil.getTime()) &&
    suspendedUntil.getTime() > Date.now();
  const isEnabled = user.status === 1;
  const isActive = isEnabled && !isTimedSuspended;

  const handleStatusChange = async (nextStatus: "active" | "banned") => {
    if (!userId) return;

    try {
      const success = await api.users.updateUserStatus(userId, nextStatus);
      if (success) {
        emitAuthSessionChanged();
        toast.success(
          nextStatus === "active"
            ? `User ${isTimedSuspended ? "unsuspended" : "activated"}`
            : "User banned",
        );
        await fetchDetails();
      } else {
        toast.error("Failed to update user status");
      }
    } catch (error) {
      logger.warn("[UserDetailAdminPage] Failed to update user status", error);
      toast.error("Error updating user status");
    }
  };

  const handleSuspendUser = async () => {
    if (!userId) return;
    const durationHours =
      suspendDurationHours === "null" ? null : Number(suspendDurationHours);

    setIsSuspending(true);
    try {
      const result = await api.admin.suspendUser(
        parseInt(userId, 10),
        durationHours,
      );

      if (result.success) {
        toast.success(result.message ?? "User suspended successfully");
        setSuspendDialogOpen(false);
        await fetchDetails();
      } else {
        toast.error(result.message ?? "Failed to suspend user");
      }
    } catch (error) {
      logger.warn("[UserDetailAdminPage] Suspend user failed", error);
      toast.error("Failed to suspend user");
    } finally {
      setIsSuspending(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to Users"
            onClick={handleBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            User Details{" "}
            <span className="text-muted-foreground font-normal text-lg">
              #{userId}
            </span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(APP_ROUTE_BUILDERS.sellerProfile(userId), {
                state: { fromPath: currentPath },
              })
            }
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            Open Profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/comments?userId=${userId}`)}
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            Recent Comments
          </Button>
          {isEnabled && (
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => {
                setSuspendDurationHours("24");
                setSuspendDialogOpen(true);
              }}
            >
              <ShieldBan className="w-3.5 h-3.5 mr-1.5" />
              {isTimedSuspended ? "Change Suspension" : "Suspend"}
            </Button>
          )}
          {isActive ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void handleStatusChange("banned")}
            >
              <Ban className="w-3.5 h-3.5 mr-1.5" />
              Ban
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => void handleStatusChange("active")}
            >
              <UserCheck className="w-3.5 h-3.5 mr-1.5" />
              {isTimedSuspended ? "Unsuspend" : "Activate"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="md:col-span-1 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center overflow-hidden border border-border text-3xl font-semibold">
                {resolveAvatarSrc(user.avatar as string | undefined) ? (
                  <img
                    src={resolveAvatarSrc(user.avatar as string | undefined)!}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{getAvatarInitial((user.firstName || user.email || "") as string)}</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {String(user.firstName)} {String(user.lastName)}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="break-all">{String(user.email)}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{user.phone ? String(user.phone) : "No phone number"}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>
                  Location IDs: {user.cityID ? String(user.cityID) : "None"}, {user.areaID ? String(user.areaID) : "None"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  Joined{" "}
                  {formatCompactDate(
                    String(user.joinDate || user.joinedDate || new Date().toISOString()),
                  )}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border mt-4 flex flex-wrap gap-2">
              <Badge variant={user.roleID === 1 ? "default" : "secondary"}>
                {user.roleID === 1 ? "Admin" : "User"}
              </Badge>
              <Badge
                variant={isActive ? "outline" : "destructive"}
                className={
                  isActive ? "border-primary/30 text-primary" : ""
                }
              >
                {isTimedSuspended
                  ? `Suspended until ${suspendedUntil!.toLocaleString()}`
                  : isActive
                    ? "Active"
                    : "Banned"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Activity Cards */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex justify-between items-center">
                Recent Posts
                <span className="text-sm font-normal text-muted-foreground">
                  {recentPosts.length} items
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPosts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No recent posts found.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {recentPosts.map((post: any) => (
                    <div
                      key={post.postID || post.postId}
                      className="py-3 flex justify-between items-center gap-3"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {post.title || "Untitled"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {post.categoryName} • {post.price ?? 0} JOD •{" "}
                          {formatCompactDate(post.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {post.status === 0 ? "Active" : "Blocked"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(
                              APP_ROUTE_BUILDERS.postDetails(
                                String(post.postID || post.postId),
                              ),
                            )
                          }
                        >
                          Open
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex justify-between items-center">
                Recent Received Reviews
                <span className="text-sm font-normal text-muted-foreground">
                  {recentReviews.length} items
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentReviews.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No reviews received yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {recentReviews.map((review: any) => (
                    <div key={review.reviewID || review.id} className="py-3">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-1 text-yellow-500">
                          {"★".repeat(review.rating || 0)}
                          {"☆".repeat(Math.max(0, 5 - (review.rating || 0)))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatCompactDate(review.createdAt || new Date().toISOString())}
                        </span>
                      </div>
                      <p className="text-sm italic">
                        {review.comment || "No comment provided."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <SuspendUserDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        userName={displayName}
        durationHours={suspendDurationHours}
        onDurationChange={setSuspendDurationHours}
        onSuspend={() => void handleSuspendUser()}
        isSuspending={isSuspending}
      />
    </div>
  );
}
