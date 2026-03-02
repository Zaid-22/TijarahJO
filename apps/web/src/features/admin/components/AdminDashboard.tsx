import { useEffect, useState } from "react";
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
import { AdminDashboardStats } from "../../../services/api/admin";
import { logger } from "../../../shared/lib/logger";
import { LoadingState } from "../../../shared/ui/loading-state";

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const data = await api.admin.getStats();
        setStats(data);
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
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/15",
    },
    {
      title: "New Users (7d)",
      value: stats.newUsersThisWeek.toLocaleString(),
      icon: UserPlus,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/15",
    },
    {
      title: "Active Listings",
      value: stats.activeListings.toLocaleString(),
      icon: ShoppingBag,
      color: "text-violet-500",
      bgColor: "bg-violet-500/15",
    },
    {
      title: "Items Sold",
      value: stats.soldPosts.toLocaleString(),
      icon: CheckCircle,
      color: "text-teal-500",
      bgColor: "bg-teal-500/15",
    },
    {
      title: "Blocked Listings",
      value: stats.blockedListings.toLocaleString(),
      icon: ShieldAlert,
      color: "text-red-500",
      bgColor: "bg-red-500/15",
    },
    {
      title: "Total Reviews",
      value: stats.totalReviews.toLocaleString(),
      icon: MessageSquare,
      color: "text-amber-500",
      bgColor: "bg-amber-500/15",
    },
    {
      title: "Avg Rating",
      value: stats.averageRating > 0 ? `${stats.averageRating} ★` : "N/A",
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/15",
    },
    {
      title: "Categories",
      value: stats.totalCategories.toLocaleString(),
      icon: TrendingUp,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/15",
    },
  ];

  const actionBadge = (action: string) => {
    switch (action) {
      case "INSERT":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
            CREATE
          </Badge>
        );
      case "UPDATE":
        return (
          <Badge className="bg-blue-100 text-blue-800 text-[10px]">
            UPDATE
          </Badge>
        );
      case "DELETE":
        return (
          <Badge className="bg-red-100 text-red-800 text-[10px]">DELETE</Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {action}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="border-none shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Admin Activity */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Admin Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActions.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No recent activity to show.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentActions.map((action, idx) => (
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
                      {new Date(action.changedAt).toLocaleString()}
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
                  {stats.totalPosts.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Active Users
                </span>
                <span className="font-semibold">
                  {stats.activeUsers.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Conversion (Sold / Total)
                </span>
                <span className="font-semibold">
                  {stats.totalPosts > 0
                    ? `${((stats.soldPosts / stats.totalPosts) * 100).toFixed(1)}%`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  User-to-Listing Ratio
                </span>
                <span className="font-semibold">
                  {stats.activeListings > 0
                    ? `${(stats.totalUsers / stats.activeListings).toFixed(1)}`
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
