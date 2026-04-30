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
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>{" "}
                <span className="font-medium">{report.reportType}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Target:</span>{" "}
                <span className="font-medium">{formatReportTargetLabel(report)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Reason:</span>{" "}
                <span className="font-medium">{report.reason}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Reporter:</span>{" "}
                <span className="font-medium">{report.reporterName}</span>
                {report.reporterEmail && (
                  <p className="text-xs text-muted-foreground mt-0.5">{report.reporterEmail}</p>
                )}
              </div>
            </div>

            {report.description && (
              <div className="text-sm">
                <span className="text-muted-foreground">Description:</span>
                <p className="mt-1 border-l-2 border-border pl-3">{report.description}</p>
              </div>
            )}

            {report.targetUserID && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldBan className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-semibold text-destructive">
                    Block Reported User
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {report.targetUserName
                    ? `This will immediately invalidate ${report.targetUserName}'s active sessions. The report will be auto-resolved.`
                    : "This will immediately invalidate the user's active sessions. The report will be auto-resolved."}
                </p>
                <div className="flex items-center gap-2">
                  <Select value={selectedSuspensionHours} onValueChange={onSuspensionHoursChange}>
                    <SelectTrigger id="suspension-duration" className="flex-1" aria-label="Select suspension duration">
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUSPENSION_OPTIONS.map((opt) => (
                        <SelectItem key={String(opt.hours)} value={String(opt.hours)}>
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
                    className="shrink-0"
                    aria-label="Block User"
                  >
                    {isSuspending ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <ShieldBan className="w-3.5 h-3.5 mr-1.5" />
                        Block User
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {report.reportType === "LISTING" && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldBan className="w-4 h-4 text-foreground" />
                    <span className="text-sm font-semibold text-foreground">Block Reported Post</span>
                  </div>
                  <Link
                    to={`/post/${report.targetID}`}
                    target="_blank"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    View Post <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">
                  This will hide the post from the marketplace. The report will be auto-resolved.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBlockPost}
                    disabled={isBlockingPost}
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    aria-label="Block Post"
                  >
                    {isBlockingPost ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <ShieldBan className="w-3.5 h-3.5 mr-1.5" />
                        Block Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {report.reportType === "COMMENT" && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-foreground" />
                  <span className="text-sm font-semibold text-foreground">
                    Delete Reported Comment
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  This will hide the comment from the listing. The report will be auto-resolved.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDeleteComment}
                  disabled={isDeletingComment}
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  aria-label="Delete Comment"
                >
                  {isDeletingComment ? (
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Delete Comment
                    </>
                  )}
                </Button>
              </div>
            )}

            <div>
              <div id="report-status-update-label" className="text-sm font-medium text-foreground mb-1.5">
                Update Status
              </div>
              <Select
                name="reportStatusUpdate"
                value={String(newStatus)}
                onValueChange={(v) => onStatusChange(Number(v))}
              >
                <SelectTrigger
                  id="report-status-update"
                  className="mt-1.5"
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

            <div>
              <label htmlFor="resolution-notes" className="text-sm font-medium text-foreground">
                Resolution Notes
              </label>
              <Textarea
                id="resolution-notes"
                className="mt-1.5"
                placeholder="Add notes about how this was resolved..."
                value={resolutionNotes}
                onChange={(e) => onResolutionNotesChange(e.target.value)}
                rows={3}
              />
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
