/* eslint-disable max-lines */
import { useEffect, useState, useCallback } from "react";
import {
  Flag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Search,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/ui/select";
import { api } from "../../../services/api";
import { AdminReportItem } from "../../../services/api/admin";
import { resolveUploadUrl } from "../../../services/api/utils";
import { formatCompactDateTime } from "../../../shared/lib/dateTime";
import { logger } from "../../../shared/lib/logger";
import { ReportActionDialog } from "./ReportActionDialog";

const STATUS_LABELS: Record<number, string> = {
  0: "Pending",
  1: "Under Review",
  2: "Resolved",
  3: "Dismissed",
};

const STATUS_COLORS: Record<number, string> = {
  0: "bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20",
  1: "bg-blue-500/10 text-blue-600 dark:text-blue-500 border border-blue-500/20",
  2: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20",
  3: "bg-muted text-muted-foreground border border-border",
};

const STATUS_ICONS: Record<number, typeof Clock> = {
  0: Clock,
  1: Eye,
  2: CheckCircle,
  3: XCircle,
};

const REPORT_TYPE_COLORS: Record<string, string> = {
  LISTING: "bg-secondary text-secondary-foreground border border-border",
  USER: "bg-secondary text-secondary-foreground border border-border",
  REVIEW: "bg-secondary text-secondary-foreground border border-border",
  COMMENT: "bg-secondary text-secondary-foreground border border-border",
};

function formatReportTargetLabel(report: AdminReportItem): string {
  const normalizedLabel = report.targetLabel?.trim();
  if (normalizedLabel) {
    return normalizedLabel;
  }

  switch (report.reportType) {
    case "LISTING":
      return `Listing #${report.targetID}`;
    case "USER":
      return `User #${report.targetID}`;
    case "REVIEW":
      return `Review #${report.targetID}`;
    case "COMMENT":
      return `Comment #${report.targetID}`;
    default:
      return `Target #${report.targetID}`;
  }
}

export function ReportsQueue() {
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Action dialog
  const [selectedReport, setSelectedReport] = useState<AdminReportItem | null>(
    null,
  );
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState(0);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Block user state
  const [selectedSuspensionHours, setSelectedSuspensionHours] =
    useState<string>("24");
  const [isSuspending, setIsSuspending] = useState(false);

  // Block post state
  const [isBlockingPost, setIsBlockingPost] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  const pageSize = 25;

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const statusParam =
        statusFilter === "all" ? undefined : Number(statusFilter);
      const typeParam = typeFilter === "all" ? undefined : typeFilter;
      const result = await api.admin.getReports(
        statusParam,
        typeParam,
        searchQuery || undefined,
        page,
        pageSize,
      );
      setReports(result.reports);
      setTotalCount(result.totalCount);
    } catch (error) {
      logger.warn("[ReportsQueue] Failed to fetch reports", error);
      toast.error("Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery, page]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  const openActionDialog = (report: AdminReportItem) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setResolutionNotes(report.resolutionNotes ?? "");
    setSelectedSuspensionHours("24");
    setActionDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport) return;
    try {
      await api.admin.updateReportStatus(
        selectedReport.reportID,
        newStatus,
        resolutionNotes || undefined,
      );
      toast.success("Report updated");
      setActionDialogOpen(false);
      await fetchReports();
    } catch (error) {
      logger.warn("[ReportsQueue] Update failed", error);
      toast.error("Failed to update report");
    }
  };

  const handleBlockUser = async () => {
    if (!selectedReport?.targetUserID) return;

    const durationHours =
      selectedSuspensionHours === "null"
        ? null
        : Number(selectedSuspensionHours);

    setIsSuspending(true);
    try {
      const result = await api.admin.suspendUser(
        selectedReport.targetUserID,
        durationHours,
      );

      if (result.success) {
        toast.success(result.message ?? "User blocked successfully");

        // Auto-resolve the report
        await api.admin.updateReportStatus(
          selectedReport.reportID,
          2, // Resolved
          `User #${selectedReport.targetUserID} ${durationHours === null ? "permanently banned" : `suspended for ${durationHours}h`} via report #${selectedReport.reportID}`,
        );

        setActionDialogOpen(false);
        await fetchReports();
      } else {
        toast.error(result.message ?? "Failed to block user");
      }
    } catch (error) {
      logger.warn("[ReportsQueue] Block user failed", error);
      toast.error("Failed to block user");
    } finally {
      setIsSuspending(false);
    }
  };

  const handleBlockPost = async () => {
    if (!selectedReport || selectedReport.reportType !== "LISTING") return;

    setIsBlockingPost(true);
    try {
      const success = await api.admin.updatePostStatus(
        selectedReport.targetID,
        1, // 1 = BLOCKED according to updatePostStatus comments
      );

      if (success) {
        toast.success("Post blocked successfully");

        // Auto-resolve the report
        await api.admin.updateReportStatus(
          selectedReport.reportID,
          2, // Resolved
          `Post blocked via report #${selectedReport.reportID}`,
        );

        setActionDialogOpen(false);
        await fetchReports();
      } else {
        toast.error("Failed to block post");
      }
    } catch (error) {
      logger.warn("[ReportsQueue] Block post failed", error);
      toast.error("Failed to block post");
    } finally {
      setIsBlockingPost(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!selectedReport || selectedReport.reportType !== "COMMENT") return;

    setIsDeletingComment(true);
    try {
      const result = await api.admin.deletePostComment(selectedReport.targetID);

      if (result.success) {
        toast.success(result.message || "Comment deleted successfully");

        await api.admin.updateReportStatus(
          selectedReport.reportID,
          2,
          `Comment deleted via report #${selectedReport.reportID}`,
        );

        setActionDialogOpen(false);
        await fetchReports();
      } else {
        toast.error(result.message || "Failed to delete comment");
      }
    } catch (error) {
      logger.warn("[ReportsQueue] Delete comment failed", error);
      toast.error("Failed to delete comment");
    } finally {
      setIsDeletingComment(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (isLoading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="flex items-center gap-3">
          <Flag className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Reports Queue</h1>
          <Badge variant="secondary">{totalCount} total</Badge>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="w-40">
          <Select
            name="reportStatusFilter"
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger
              id="report-status-filter"
              aria-label="Filter reports by status"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="0">Pending</SelectItem>
              <SelectItem value="1">Under Review</SelectItem>
              <SelectItem value="2">Resolved</SelectItem>
              <SelectItem value="3">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Select
            name="reportTypeFilter"
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger
              id="report-type-filter"
              aria-label="Filter reports by type"
            >
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="LISTING">Listing</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="REVIEW">Review</SelectItem>
              <SelectItem value="COMMENT">Comment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {reports.length === 0 ? (
        <Card className="border-none shadow-sm">
          <CardContent className="py-12 text-center text-muted-foreground">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            No reports found matching your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const StatusIcon = STATUS_ICONS[report.status] ?? Clock;
            return (
              <Card
                key={report.reportID}
                className="border-none shadow-sm hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${
                          REPORT_TYPE_COLORS[report.reportType] ??
                          "bg-secondary text-secondary-foreground border border-border"
                        }`}
                      >
                        {report.reportType}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${
                          STATUS_COLORS[report.status] ?? "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                        {STATUS_LABELS[report.status] ?? "Unknown"}
                      </span>
                      <CardTitle className="text-sm font-medium text-muted-foreground/70 ml-1">
                        #{report.reportID}
                      </CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openActionDialog(report)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> Review
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Reason:</span>{" "}
                      <span className="font-medium">{report.reason}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Target:</span>{" "}
                      <span className="font-medium">
                        {formatReportTargetLabel(report)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reporter:</span>{" "}
                      <span className="font-medium">{report.reporterName}</span>
                    </div>
                  </div>
                  {report.description && (
                    <p className="mt-2 text-sm text-muted-foreground border-l-2 border-border pl-3">
                      {report.description}
                    </p>
                  )}
                  {report.imageUrl && (
                    <a
                      href={resolveUploadUrl(report.imageUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block w-fit"
                      title="View evidence image"
                    >
                      <img
                        src={resolveUploadUrl(report.imageUrl)}
                        alt="Evidence"
                        className="h-20 w-32 object-cover rounded border border-border hover:opacity-80 transition-opacity"
                      />
                    </a>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Filed: {formatCompactDateTime(report.createdAt)}
                    </span>
                    {report.resolvedByName && (
                      <span>Resolved by: {report.resolvedByName}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <ReportActionDialog
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        report={selectedReport}
        newStatus={newStatus}
        onStatusChange={setNewStatus}
        resolutionNotes={resolutionNotes}
        onResolutionNotesChange={setResolutionNotes}
        onSave={handleUpdateStatus}
        isSuspending={isSuspending}
        selectedSuspensionHours={selectedSuspensionHours}
        onSuspensionHoursChange={setSelectedSuspensionHours}
        onBlockUser={handleBlockUser}
        isBlockingPost={isBlockingPost}
        onBlockPost={handleBlockPost}
        isDeletingComment={isDeletingComment}
        onDeleteComment={handleDeleteComment}
      />
    </div>
  );
}
