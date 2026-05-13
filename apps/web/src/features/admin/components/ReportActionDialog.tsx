import { ShieldBan, ExternalLink, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../../../shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/ui/select";
import { Textarea } from "../../../shared/ui/textarea";
import { AdminReportItem } from "../../../services/api/admin";

function formatReportTargetLabel(report: AdminReportItem): string {
  const normalizedLabel = report.targetLabel?.trim();
  if (normalizedLabel) return normalizedLabel;
  switch (report.reportType) {
    case "LISTING": return `Listing #${report.targetID}`;
    case "USER": return `User #${report.targetID}`;
    case "REVIEW": return `Review #${report.targetID}`;
    case "COMMENT": return `Comment #${report.targetID}`;
    default: return `Target #${report.targetID}`;
  }
}

const SUSPENSION_OPTIONS: { label: string; hours: number | null }[] = [
  { label: "1 Hour", hours: 1 },
  { label: "24 Hours", hours: 24 },
  { label: "7 Days", hours: 24 * 7 },
  { label: "30 Days", hours: 24 * 30 },
  { label: "Permanent Ban", hours: null },
];

interface ReportActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: AdminReportItem | null;
  newStatus: number;
  onStatusChange: (status: number) => void;
  resolutionNotes: string;
  onResolutionNotesChange: (notes: string) => void;
  onSave: () => void;
  isSuspending: boolean;
  selectedSuspensionHours: string;
  onSuspensionHoursChange: (hours: string) => void;
  onBlockUser: () => void;
  isBlockingPost?: boolean;
  onBlockPost?: () => void;
  isDeletingComment?: boolean;
  onDeleteComment?: () => void;
}

export function ReportActionDialog({
  open,
  onOpenChange,
  report,
  newStatus,
  onStatusChange,
  resolutionNotes,
  onResolutionNotesChange,
  onSave,
  isSuspending,
  selectedSuspensionHours,
  onSuspensionHoursChange,
  onBlockUser,
  isBlockingPost,
  onBlockPost,
  isDeletingComment,
  onDeleteComment,
}: ReportActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Report #{report?.reportID}</DialogTitle>
          <DialogDescription className="sr-only">
            Review report details, update moderation status, and apply related
            admin actions.
          </DialogDescription>
        </DialogHeader>
        {report && (
          <div className="space-y-6 py-4">
            {/* Report Details Block */}
            <div className="bg-muted/30 rounded-xl p-4 grid grid-cols-2 gap-y-5 gap-x-6">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Report Type
                </p>
                <p className="text-sm font-medium text-foreground">{report.reportType}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Target
                </p>
                <p className="text-sm font-medium text-foreground">{formatReportTargetLabel(report)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Reason
                </p>
                <p className="text-sm font-medium text-foreground">{report.reason}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Reporter
                </p>
                <div className="text-sm">
                  <p className="font-medium text-foreground">{report.reporterName}</p>
                  {report.reporterEmail && (
                    <p className="text-muted-foreground text-xs mt-0.5">{report.reporterEmail}</p>
                  )}
                </div>
              </div>
            </div>

            {report.description && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Description
                </p>
                <div className="bg-muted/20 border border-border/50 rounded-lg p-3 text-sm text-foreground leading-relaxed">
                  {report.description}
                </div>
              </div>
            )}

            {/* Moderation Actions Section */}
            {(report.targetUserID || report.reportType === "LISTING" || report.reportType === "COMMENT") && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
                  Moderation Actions
                </h4>

                {report.targetUserID && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 transition-colors hover:border-destructive/30">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <ShieldBan className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-semibold text-destructive">
                          Suspend User
                        </span>
                      </div>
                      <p className="text-xs text-destructive/80 max-w-[280px] leading-relaxed">
                        {report.targetUserName
                          ? `Invalidates ${report.targetUserName}'s active sessions. Auto-resolves report.`
                          : "Invalidates active sessions. Auto-resolves report."}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Select value={selectedSuspensionHours} onValueChange={onSuspensionHoursChange}>
                        <SelectTrigger className="w-[130px] h-9 text-xs" aria-label="Select suspension duration">
                          <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUSPENSION_OPTIONS.map((opt) => (
                            <SelectItem key={String(opt.hours)} value={String(opt.hours)} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={onBlockUser}
                        disabled={isSuspending}
                        className="h-9 px-4 shrink-0 shadow-sm"
                      >
                        {isSuspending ? (
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {report.reportType === "LISTING" && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldBan className="w-4 h-4 text-foreground/80" />
                          <span className="text-sm font-semibold text-foreground">Block Listing</span>
                        </div>
                        <Link
                          to={`/post/${report.targetID}`}
                          target="_blank"
                          className="text-xs text-primary hover:underline flex items-center gap-1 sm:hidden"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">
                        Hides the post from the marketplace and auto-resolves this report.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <Link
                        to={`/post/${report.targetID}`}
                        target="_blank"
                        className="text-xs text-primary hover:underline hidden sm:flex items-center gap-1"
                      >
                        View Post <ExternalLink className="w-3 h-3" />
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onBlockPost}
                        disabled={isBlockingPost}
                        className="w-full sm:w-auto h-9 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive shadow-sm"
                      >
                        {isBlockingPost ? (
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-destructive/30 border-t-destructive" />
                        ) : (
                          "Block Post"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {report.reportType === "COMMENT" && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-foreground/80" />
                        <span className="text-sm font-semibold text-foreground">Delete Comment</span>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-[280px] leading-relaxed">
                        Permanently hides the comment and auto-resolves this report.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onDeleteComment}
                      disabled={isDeletingComment}
                      className="w-full sm:w-auto h-9 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive shadow-sm"
                    >
                      {isDeletingComment ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-destructive/30 border-t-destructive" />
                      ) : (
                        "Delete Comment"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Resolution Form */}
            <div className="space-y-4 pt-2">
              <div className="grid gap-2">
                <div id="report-status-update-label" className="text-sm font-semibold text-foreground">
                  Update Status
                </div>
                <Select
                  name="reportStatusUpdate"
                  value={String(newStatus)}
                  onValueChange={(v) => onStatusChange(Number(v))}
                >
                  <SelectTrigger
                    id="report-status-update"
                    className="h-10 shadow-sm"
                    aria-labelledby="report-status-update-label"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Pending</SelectItem>
                    <SelectItem value="1">Under Review</SelectItem>
                    <SelectItem value="2">Resolved</SelectItem>
                    <SelectItem value="3">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label htmlFor="resolution-notes" className="text-sm font-semibold text-foreground">
                  Resolution Notes
                </label>
                <Textarea
                  id="resolution-notes"
                  className="resize-none min-h-24 shadow-sm"
                  placeholder="Add details about how this report was handled..."
                  value={resolutionNotes}
                  onChange={(e) => onResolutionNotesChange(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
