import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
  Users,
  Copy,
  DollarSign,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../shared/ui/button";
import { Badge } from "../../../shared/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { api } from "../../../services/api";
import type {
  FraudSignalsResult,
  FraudSignal,
} from "../../../services/api/admin";
import { logger } from "../../../shared/lib/logger";

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

export function FraudDetectionPanel() {
  const [result, setResult] = useState<FraudSignalsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
              Last checked: {new Date(result.checkedAt).toLocaleTimeString()}
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
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">
              {result.signals.some((s) => s.severity === "HIGH")
                ? "⚠️ High-severity fraud signals detected — immediate action recommended"
                : result.signals.some((s) => s.severity === "MEDIUM")
                  ? "⚡ Medium-severity signals detected — review recommended"
                  : "✅ All signals are within normal range"}
            </span>
          </div>
        </div>
      )}

      {/* Signal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {result?.signals.map((signal) => getSignalCard(signal))}
      </div>
    </div>
  );
}
