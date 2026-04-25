/* eslint-disable max-lines */
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  Users,
  Copy,
  DollarSign,
  Star,
  Ban,
  Eye,
  Trash2,
  UserX,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../../shared/ui/button";
import { Badge } from "../../../shared/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { ConfirmActionDialog } from "../../../shared/ui/confirm-action-dialog";
import { api } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { userHasAdminPermission } from "../../../contexts/authUtils";
import type {
  FraudSignalsResult,
  FraudSignal,
  FraudPostCandidate,
  FraudReviewCandidate,
  FraudUserCandidate,
} from "../../../services/api/admin";
import { formatCompactTime } from "../../../shared/lib/dateTime";
import { logger } from "../../../shared/lib/logger";
import { ADMIN_PERMISSIONS } from "../adminPermissions";

const SIGNAL_META: Record<
  string,
  { label: string; icon: typeof AlertTriangle; description: string }
> = {
  RAPID_REGISTRATION: {
    label: "Rapid Account Creation",
    icon: Users,
    description: "Multiple accounts created in a short time frame.",
  },
  DUPLICATE_LISTINGS: {
    label: "Duplicate Listings",
    icon: Copy,
    description: "Same title + category posted multiple times in 24h.",
  },
  PRICE_ANOMALY: {
    label: "Suspicious Pricing",
    icon: DollarSign,
    description: "Listings priced below 10% of category average.",
  },
  REVIEW_BOMBING: {
    label: "Review Bombing",
    icon: Star,
    description: "5+ negative reviews on a single seller in 24h.",
  },
};

const SEVERITY_STYLES: Record<string, string> = {
  HIGH: "bg-red-100 text-red-800 border-red-200",
  MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
  LOW: "bg-green-100 text-green-800 border-green-200",
};

const SEVERITY_DOT: Record<string, string> = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-amber-500",
  LOW: "bg-green-500",
};

type PendingAction =
  | { type: "suspend-user"; user: FraudUserCandidate }
  | { type: "block-post"; post: FraudPostCandidate }
  | { type: "delete-review"; review: FraudReviewCandidate };

export function FraudDetectionPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState<FraudSignalsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const canViewUsers = userHasAdminPermission(
    user,
    ADMIN_PERMISSIONS.usersView,
  );
  const canSuspendUsers = userHasAdminPermission(
    user,
    ADMIN_PERMISSIONS.usersManage,
  );
  const canBlockListings = userHasAdminPermission(
    user,
    ADMIN_PERMISSIONS.postsModerate,
  );
  const canDeleteReviews = userHasAdminPermission(
    user,
    ADMIN_PERMISSIONS.reviewsModerate,
  );

  const fetchSignals = async () => {
    try {
      setIsLoading(true);
      const data = await api.admin.getFraudSignals();
      setResult(data);
    } catch (error) {
      logger.warn("[FraudDetectionPanel] Failed to fetch signals", error);
      toast.error("Failed to fetch fraud signals");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchSignals();

    // Auto-refresh every 5 minutes
    const interval = setInterval(
      () => {
        void fetchSignals();
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(interval);
  }, []);

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction.type === "suspend-user") {
        const response = await api.admin.suspendUser(
          pendingAction.user.userID,
          24,
        );
        if (!response.success) {
          toast.error(response.message || "Failed to suspend user");
          return;
        }
        toast.success("User suspended for 24 hours");
      }

      if (pendingAction.type === "block-post") {
        const success = await api.admin.updatePostStatus(
          pendingAction.post.postID,
          1,
        );
        if (!success) {
          toast.error("Failed to block listing");
          return;
        }
        toast.success("Listing blocked");
      }

      if (pendingAction.type === "delete-review") {
        const success = await api.admin.deleteReview(
          pendingAction.review.reviewID,
        );
        if (!success) {
          toast.error("Failed to delete review");
          return;
        }
        toast.success("Review deleted");
      }

      await fetchSignals();
    } catch (error) {
      logger.warn("[FraudDetectionPanel] Action failed", error);
      toast.error("Action failed");
    } finally {
      setPendingAction(null);
    }
  };

  const getActionCopy = () => {
    if (!pendingAction) {
      return { title: "", description: "", confirmLabel: "Confirm" };
    }

    if (pendingAction.type === "suspend-user") {
      return {
        title: "Suspend user for 24 hours?",
        description: `${pendingAction.user.name || pendingAction.user.email} will be temporarily suspended while you review this signal.`,
        confirmLabel: "Suspend",
      };
    }

    if (pendingAction.type === "block-post") {
      return {
        title: "Block this listing?",
        description: `"${pendingAction.post.title}" will be removed from active marketplace results.`,
        confirmLabel: "Block listing",
      };
    }

    return {
      title: "Delete this review?",
      description: `This removes the suspicious ${pendingAction.review.rating}-star review from ${pendingAction.review.reviewerName}.`,
      confirmLabel: "Delete review",
    };
  };

  const getSignalCard = (signal: FraudSignal) => {
    const meta = SIGNAL_META[signal.type] ?? {
      label: signal.type,
      icon: AlertTriangle,
      description: "",
    };
    const Icon = meta.icon;
    const severityStyle =
      SEVERITY_STYLES[signal.severity] ?? SEVERITY_STYLES.LOW;
    const dotColor = SEVERITY_DOT[signal.severity] ?? SEVERITY_DOT.LOW;

    return (
      <Card
        key={signal.type}
        className={`border shadow-sm transition-shadow hover:shadow-md ${signal.severity === "HIGH" ? "ring-2 ring-red-300" : ""}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${signal.severity === "HIGH" ? "bg-red-100" : signal.severity === "MEDIUM" ? "bg-amber-100" : "bg-green-100"}`}
              >
                <Icon
                  className={`w-5 h-5 ${signal.severity === "HIGH" ? "text-red-600" : signal.severity === "MEDIUM" ? "text-amber-600" : "text-green-600"}`}
                />
              </div>
              <CardTitle className="text-sm font-semibold">
                {meta.label}
              </CardTitle>
            </div>
            <Badge className={severityStyle}>
              <span
                className={`inline-block w-2 h-2 rounded-full mr-1.5 ${dotColor}`}
              />
              {signal.severity}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{signal.count}</p>
          <p className="text-xs text-muted-foreground mt-1">{signal.detail}</p>
          <p className="text-xs text-muted-foreground mt-0.5 italic">
            {meta.description}
          </p>
        </CardContent>
      </Card>
    );
  };

  const renderUserRow = (user: FraudUserCandidate) => (
    <div
      key={user.userID}
      className="flex flex-col gap-3 border-b border-border py-3 last:border-0 md:flex-row md:items-center md:justify-between"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {user.name.trim() || "Unnamed user"}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        <p className="text-xs text-muted-foreground">
          Joined {formatCompactTime(user.joinedAt)}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {canViewUsers && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/users/${user.userID}`)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            View
          </Button>
        )}
        {canSuspendUsers && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setPendingAction({ type: "suspend-user", user })}
          >
            <UserX className="mr-1.5 h-3.5 w-3.5" />
            Suspend
          </Button>
        )}
      </div>
    </div>
  );

  const renderPostRow = (post: FraudPostCandidate) => (
    <div
      key={`${post.postID}-${post.signalReason}`}
      className="flex flex-col gap-3 border-b border-border py-3 last:border-0 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{post.title}</p>
        <p className="text-xs text-muted-foreground">
          {post.sellerName} · {post.categoryName} ·{" "}
          {post.price == null ? "No price" : `${post.price} JOD`}
        </p>
        <p className="text-xs text-muted-foreground">{post.signalReason}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {canViewUsers && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/users/${post.userID}`)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Seller
          </Button>
        )}
        {canBlockListings && (
          <Button
            variant="destructive"
            size="sm"
            disabled={post.status === 1}
            onClick={() => setPendingAction({ type: "block-post", post })}
          >
            <Ban className="mr-1.5 h-3.5 w-3.5" />
            Block
          </Button>
        )}
      </div>
    </div>
  );

  const renderReviewRow = (review: FraudReviewCandidate) => (
    <div
      key={review.reviewID}
      className="flex flex-col gap-3 border-b border-border py-3 last:border-0 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {review.rating} star review on {review.reviewedUserName}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          From {review.reviewerName}: {review.comment || "No comment"}
        </p>
        <p className="text-xs text-muted-foreground">{review.signalReason}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {canViewUsers && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/users/${review.reviewedUserID}`)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Seller
          </Button>
        )}
        {canDeleteReviews && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setPendingAction({ type: "delete-review", review })}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );

  const hasActionItems =
    result &&
    (result.rapidRegistrationUsers.length > 0 ||
      result.duplicateListingPosts.length > 0 ||
      result.suspiciousPricePosts.length > 0 ||
      result.reviewBombingReviews.length > 0);
  const actionCopy = getActionCopy();

  if (!result && isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            Fraud Detection
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {result && (
            <span className="text-xs text-muted-foreground">
              Last checked: {formatCompactTime(result.checkedAt)}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchSignals()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Banner */}
      {result && (
        <div
          className={`rounded-lg border p-4 ${
            result.signals.some((s) => s.severity === "HIGH")
              ? "bg-red-50 border-red-200 text-red-900"
              : result.signals.some((s) => s.severity === "MEDIUM")
                ? "bg-amber-50 border-amber-200 text-amber-900"
                : "bg-green-50 border-green-200 text-green-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">
              {result.signals.some((s) => s.severity === "HIGH")
                ? "⚠️ High-severity fraud signals detected — immediate action recommended"
                : result.signals.some((s) => s.severity === "MEDIUM")
                  ? "⚡ Medium-severity signals detected — review recommended"
                  : " All signals are within normal range"}
            </span>
          </div>
        </div>
      )}

      {/* Signal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {result?.signals.map((signal) => getSignalCard(signal))}
      </div>

      {hasActionItems && result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Action queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {result.rapidRegistrationUsers.length > 0 && (
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">
                    Rapid-registration accounts to review
                  </h2>
                </div>
                <div>{result.rapidRegistrationUsers.map(renderUserRow)}</div>
              </section>
            )}

            {result.duplicateListingPosts.length > 0 && (
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <Copy className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">
                    Duplicate listings to review
                  </h2>
                </div>
                <div>{result.duplicateListingPosts.map(renderPostRow)}</div>
              </section>
            )}

            {result.suspiciousPricePosts.length > 0 && (
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">
                    Suspicious prices to review
                  </h2>
                </div>
                <div>{result.suspiciousPricePosts.map(renderPostRow)}</div>
              </section>
            )}

            {result.reviewBombingReviews.length > 0 && (
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">
                    Review bombing to review
                  </h2>
                </div>
                <div>{result.reviewBombingReviews.map(renderReviewRow)}</div>
              </section>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmActionDialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={actionCopy.title}
        description={actionCopy.description}
        confirmLabel={actionCopy.confirmLabel}
        onConfirm={() => {
          void handleConfirmAction();
        }}
      />
    </div>
  );
}
