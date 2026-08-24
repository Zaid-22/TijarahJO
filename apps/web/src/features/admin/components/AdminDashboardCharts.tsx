import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useId } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { usePrefersReducedMotion } from "../../../shared/hooks/usePrefersReducedMotion";
import { useAppSettings } from "../../../contexts/AppSettingsContext";

type AdminDashboardChartsProps = {
  analytics: {
    weeklyUsers: Record<string, unknown>[];
    categoryData: Record<string, unknown>[];
  };
};

export function AdminDashboardCharts({
  analytics,
}: AdminDashboardChartsProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { language } = useAppSettings();
  const isArabic = language === "ar";
  const signupsTitleId = useId();
  const signupsSummaryId = useId();
  const categoriesTitleId = useId();
  const categoriesSummaryId = useId();
  const signupsSummary = analytics.weeklyUsers.length
    ? `${isArabic ? "التسجيلات اليومية" : "Daily signups"}: ${analytics.weeklyUsers
        .map((entry) => `${String(entry.day ?? "Unknown")}: ${String(entry.count ?? 0)}`)
        .join(", ")}.`
    : isArabic
      ? "لا تتوفر بيانات تسجيل."
      : "No signup data is available.";
  const categoriesSummary = analytics.categoryData.length
    ? `${isArabic ? "الإعلانات النشطة حسب الفئة" : "Active listings by category"}: ${analytics.categoryData
        .map((entry) => `${String(entry.name ?? "Unknown")}: ${String(entry.count ?? 0)}`)
        .join(", ")}.`
    : isArabic
      ? "لا تتوفر بيانات للفئات."
      : "No category data is available.";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle id={signupsTitleId} className="text-base font-semibold">
            {isArabic ? "التسجيلات (آخر 7 أيام)" : "Signups (Last 7 Days)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p id={signupsSummaryId} className="sr-only">
            {signupsSummary}
          </p>
          <div
            className="h-[250px] w-full"
            role="group"
            aria-labelledby={signupsTitleId}
            aria-describedby={signupsSummaryId}
          >
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                accessibilityLayer
                data={analytics.weeklyUsers}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.3}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  tickMargin={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  cursor={{
                    stroke: "var(--muted-foreground)",
                    strokeWidth: 1,
                    strokeDasharray: "3 3",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name={isArabic ? "مستخدمون جدد" : "New Users"}
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "var(--primary)",
                    strokeWidth: 2,
                    stroke: "var(--background)",
                  }}
                  activeDot={{ r: 6 }}
                  animationDuration={prefersReducedMotion ? 0 : 1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle id={categoriesTitleId} className="text-base font-semibold">
            {isArabic ? "أبرز الفئات" : "Top Categories"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p id={categoriesSummaryId} className="sr-only">
            {categoriesSummary}
          </p>
          <div
            className="h-[250px] w-full"
            role="group"
            aria-labelledby={categoriesTitleId}
            aria-describedby={categoriesSummaryId}
          >
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                accessibilityLayer
                data={analytics.categoryData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.3}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                  tickMargin={10}
                  tickFormatter={(value: string) =>
                    value.length > 10 ? `${value.substring(0, 10)}...` : value
                  }
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  fontSize={12}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="count"
                  name={isArabic ? "الإعلانات النشطة" : "Active Listings"}
                  fill="var(--primary)"
                  radius={[4, 4, 0, 0]}
                  animationDuration={prefersReducedMotion ? 0 : 1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
