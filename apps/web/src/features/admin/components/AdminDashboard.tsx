import { useEffect, useState } from "react";
import { Users, ShoppingBag, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/card";
import { api } from "../../../services/api";

interface DashboardStats {
  totalUsers: number;
  totalPosts: number;
  activeListings: number;
  totalRevenue?: number; // Mock data for now
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPosts: 0,
    activeListings: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const statsData = await api.admin.getStats();

        setStats({
          totalUsers: statsData.totalUsers,
          totalPosts: statsData.totalPosts,
          activeListings: statsData.activeListings,
          totalRevenue: statsData.totalRevenue,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
        setLoadError("Failed to load dashboard stats.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Posts",
      value: stats.totalPosts,
      icon: ShoppingBag,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Active Listings",
      value: stats.activeListings,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  if (isLoading) {
    return <div className="p-8 text-center">Loading stats...</div>;
  }

  if (loadError) {
    return (
      <div className="p-8 text-center text-red-600 dark:text-red-400">
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Dashboard Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="border-none shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500 text-center py-8">
              No recent activity to show.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
