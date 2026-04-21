import { lazy, Suspense, useEffect, useState } from "react";
import {
  Users,
  ShoppingBag,
  TrendingUp,
  Star,
  UserPlus,
  MessageSquare,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { Badge } from "../../../shared/ui/badge";
import { api } from "../../../services/api";
import type { AdminDashboardStats } from "../../../services/api/admin";
import { logger } from "../../../shared/lib/logger";
import { LoadingState } from "../../../shared/ui/loading-state";

const AdminDashboardCharts = lazy(() =>
  import("./AdminDashboardCharts").then((module) => ({
    default: module.AdminDashboardCharts,
  })),
);

type AdminDashboardAnalytics = {
  weeklyUsers: Record<string, unknown>[];
  categoryData: Record<string, unknown>[];
};

function formatAdminActivityTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(parsed);
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminDashboardAnalytics | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const [statsData, analyticsData] = await Promise.all([
          api.admin.getStats(),
          api.admin.getAnalytics(),
        ]);
        setStats(statsData);
        setAnalytics(analyticsData);
      } catch (error) {
        logger.warn("Failed to fetch dashboard stats", error);
        setLoadError("Failed to load dashboard stats.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <LoadingState label="Loading stats..." minHeightClassName="min-h-64" />
    );
  }

  if (loadError || !stats) {
    return (
      <div className="p-8 text-center text-destructive">
        {loadError ?? "Unexpected error."}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: (stats.totalUsers ?? 0).toLocaleString(),
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/15",
    },
    {
      title: "New Users (7d)",
      value: (stats.newUsersThisWeek ?? 0).toLocaleString(),
      icon: UserPlus,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/15",
    },
    {
      title: "Active Listings",
      value: (stats.activeListings ?? 0).toLocaleString(),
      icon: ShoppingBag,
      color: "text-violet-500",
      bgColor: "bg-violet-500/15",
    },
    {
      title: "Items Sold",
      value: (stats.soldPosts ?? 0).toLocaleString(),
      icon: CheckCircle,
      color: "text-teal-500",
      bgColor: "bg-teal-500/15",
    },
    {
      title: "Blocked Listings",
      value: (stats.blockedListings ?? 0).toLocaleString(),
      icon: ShieldAlert,
      color: "text-red-500",
      bgColor: "bg-red-500/15",
    },
    {
      title: "Total Reviews",
      value: (stats.totalReviews ?? 0).toLocaleString(),
      icon: MessageSquare,
      color: "text-amber-500",
      bgColor: "bg-amber-500/15",
    },
    {
      title: "Avg Rating",
      value: (stats.averageRating ?? 0) > 0 ? `${stats.averageRating} ★` : "N/A",
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/15",
    },
    {
      title: "Categories",
      value: (stats.totalCategories ?? 0).toLocaleString(),
      icon: TrendingUp,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/15",
    },
  ];

  const actionBadge = (action: string) => {
    switch (action) {
      case "INSERT":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 text-xs">
            CREATE
          </Badge>
        );
      case "UPDATE":
        return (
          <Badge className="bg-blue-100 text-blue-800 text-xs">
            UPDATE
          </Badge>
        );
      case "DELETE":
        return (
          <Badge className="bg-red-100 text-red-800 text-xs">DELETE</Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {action}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
      {/* 8 KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <h3 className="text-2xl font-bold mt-2">{card.value}</h3>
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Charts */}
      {analytics && (
        <Suspense
          fallback={
            <LoadingState
              label="Loading charts..."
              minHeightClassName="min-h-80"
            />
          }
        >
          <AdminDashboardCharts analytics={analytics} />
        </Suspense>
      )}

      {/* Second Row: System Overview & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Admin Activity */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Admin Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {(stats.recentActions?.length ?? 0) === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No recent activity to show.
              </div>
            ) : (
              <div className="space-y-3">
                {(stats.recentActions ?? []).map((action, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {actionBadge(action.actionType)}
                      <span className="font-medium truncate">
                        {action.actorName}
                      </span>
                      <span className="text-muted-foreground truncate">
                        on {action.tableName}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatAdminActivityTimestamp(action.changedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Summary */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Platform Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total Posts
                </span>
                <span className="font-semibold">
                  {(stats.totalPosts ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Active Users
                </span>
                <span className="font-semibold">
                  {(stats.activeUsers ?? 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Conversion (Sold / Total)
                </span>
                <span className="font-semibold">
                  {(stats.totalPosts ?? 0) > 0
                    ? `${(((stats.soldPosts ?? 0) / (stats.totalPosts ?? 1)) * 100).toFixed(1)}%`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  User-to-Listing Ratio
                </span>
                <span className="font-semibold">
                  {(stats.activeListings ?? 0) > 0
                    ? `${((stats.totalUsers ?? 0) / (stats.activeListings ?? 1)).toFixed(1)}`
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
