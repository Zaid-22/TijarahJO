import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../shared/ui/dialog";
import { Badge } from "../../../shared/ui/badge";
import { Button } from "../../../shared/ui/button";
import { Ban, CheckCircle, Eye, ExternalLink, Trash2 } from "lucide-react";
import type { AdminPostItem } from "../../../services/api/admin.types";
import { formatCompactDate } from "../../../shared/lib/dateTime";
import { Link } from "react-router-dom";

type ListingDetailModalProps = {
  post: AdminPostItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlock: (postId: number) => void;
  onDelete: (postId: number) => void;
  onApprove: (postId: number) => void;
};

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: "Active", color: "bg-emerald-100 text-emerald-800" },
  1: { label: "Blocked", color: "bg-red-100 text-red-800" },
  3: { label: "Sold", color: "bg-blue-100 text-blue-800" },
};

export function ListingDetailModal({
  post,
  open,
  onOpenChange,
  onBlock,
  onDelete,
  onApprove,
}: ListingDetailModalProps) {
  if (!post) return null;

  const status = STATUS_MAP[post.status] ?? {
    label: "Unknown",
    color: "bg-gray-100 text-gray-800",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="truncate">{post.title}</span>
            <Badge className={status.color}>{status.label}</Badge>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Listing details, moderation status, seller information, and available
            admin actions for this post.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Post ID</span>
              <p className="font-medium">#{post.postID}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Price</span>
              <p className="font-medium">
                {post.price != null
                  ? `JOD ${post.price.toLocaleString()}`
                  : "N/A"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Category</span>
              <p className="font-medium">{post.categoryName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Views</span>
              <p className="font-medium flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {(post.views ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Seller</span>
              <p className="font-medium">
                <Link
                  to={`/admin/users/${post.userID}`}
                  className="text-primary hover:underline transition-colors"
                  onClick={() => onOpenChange(false)}
                >
                  {post.sellerName}
                </Link>
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Posted</span>
              <p className="font-medium">
                {formatCompactDate(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            {post.status === 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => {
                  onDelete(post.postID);
                  onOpenChange(false);
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
              </Button>
            )}
            {post.status !== 1 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onBlock(post.postID);
                  onOpenChange(false);
                }}
              >
                <Ban className="w-3.5 h-3.5 mr-1.5" /> Block
              </Button>
            )}
            {post.status !== 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  onApprove(post.postID);
                  onOpenChange(false);
                }}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Activate
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/post/${post.postID}`, "_blank")}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View Public
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
