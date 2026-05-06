import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MoreVertical, Reply, Trash2, Edit2, ChevronDown, ChevronUp, Flag } from "lucide-react";
import { api } from "../../../services/api";
import { logger } from "../../../shared/lib/logger";
import { PostComment, User } from "../../../types";
import { Button } from "../../../shared/ui/button";
import { Textarea } from "../../../shared/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../../../shared/ui/avatar";
import { resolveAvatarSrc, getAvatarInitial } from "../../../shared/lib/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../shared/ui/dropdown-menu";
import { cn } from "../../../shared/ui/utils";
import { toast } from "sonner";
import { formatPostedAgo } from "../postDetailsUtils";
import { ReportPostDialog } from "../../marketplace/components/ReportPostDialog";

interface CommentItemProps {
  comment: PostComment;
  postId: string;
  language: "en" | "ar";
  labels: Record<string, string>;
  currentUser: User | null;
  postOwnerId?: string;
  onDelete: (id: number) => Promise<boolean>;
  onUpdate: (id: number, content: string) => Promise<boolean>;
  onRequireAuth?: () => void;
  isRTL: boolean;
  nowTimestamp: number;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  postId,
  language,
  labels,
  currentUser,
  postOwnerId,
  onDelete,
  onUpdate,
  onRequireAuth,
  isRTL,
  nowTimestamp,
  isReply = false,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<PostComment[]>([]);
  const [replyCount, setReplyCount] = useState(comment.replyCount);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    setReplyCount(comment.replyCount);
  }, [comment.replyCount]);

  const canDelete = currentUser && (
    currentUser.id === comment.userId.toString() || 
    currentUser.id === postOwnerId || 
    currentUser.role === "admin"
  );
  const canEdit = currentUser && currentUser.id === comment.userId.toString();
  const canReport = !currentUser || currentUser.id !== comment.userId.toString();

  const handleToggleReplies = async () => {
    if (!showReplies && replies.length === 0 && replyCount > 0) {
      setLoadingReplies(true);
      try {
        const response = await api.comments.getReplies(postId, comment.commentId);
        if (response.success && response.data) {
          setReplies(response.data.comments);
        }
      } catch (error) {
        logger.error("Failed to fetch replies", error);
        toast.error("Failed to load replies");
      } finally {
        setLoadingReplies(false);
      }
    }
    setShowReplies(!showReplies);
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      const response = await api.comments.addComment(postId, replyContent, comment.commentId);
      if (response.success && response.data) {
        toast.success(labels.commentAdded);
        setReplyContent("");
        setShowReplyForm(false);
        setReplyCount((prev) => prev + 1);
        if (showReplies) {
          setReplies((prev) => [...prev, response.data]);
        } else if (replyCount === 0) {
          setReplies([response.data]);
          setShowReplies(true);
        }
      }
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    const success = await onDelete(replyId);
    if (!success) {
      return false;
    }

    setReplies((prev) => prev.filter((reply) => reply.commentId !== replyId));
    setReplyCount((prev) => Math.max(0, prev - 1));
    return true;
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    const success = await onUpdate(comment.commentId, editContent);
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <div className={cn("group animate-in fade-in slide-in-from-bottom-2 duration-300", isReply ? "ms-12 mt-4" : "")}>
      <div className="flex gap-3">
        <Link to={`/seller/${comment.userId}`} className="shrink-0 cursor-pointer">
          <Avatar className="w-10 h-10 border-2 border-background shadow-sm ring-1 ring-muted hover:ring-primary transition-all">
            <AvatarImage src={resolveAvatarSrc(comment.authorAvatar) || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {getAvatarInitial(comment.authorName)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/seller/${comment.userId}`} className="font-bold text-foreground hover:text-primary transition-colors text-sm sm:text-base">
                {comment.authorName}
              </Link>
              {comment.userId.toString() === postOwnerId && (
                <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-md font-bold border border-primary/20 uppercase tracking-tighter">
                  {isRTL ? "صاحب الإعلان" : "Seller"}
                </span>
              )}
              <span className="text-xs text-muted-foreground font-medium">
                {formatPostedAgo(comment.createdAt, nowTimestamp, language, "")}
              </span>
              {comment.isEdited && (
                <span className="text-xs text-muted-foreground/70 italic">({labels.editComment}ED)</span>
              )}
            </div>

            {(canEdit || canDelete || canReport) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={labels.options || "Options"} className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-full">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-32">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => { setIsEditing(true); setEditContent(comment.content); }} className="cursor-pointer">
                      <Edit2 className={cn("w-4 h-4", isRTL ? "ms-2" : "me-2")} />
                      {labels.editComment}
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem onClick={() => { void onDelete(comment.commentId); }} className="text-destructive focus:text-destructive cursor-pointer">
                      <Trash2 className={cn("w-4 h-4", isRTL ? "ms-2" : "me-2")} />
                      {labels.deleteComment}
                    </DropdownMenuItem>
                  )}
                  {canReport && (
                    <DropdownMenuItem
                      onClick={() => {
                        if (!currentUser) {
                          onRequireAuth?.();
                          return;
                        }
                        setIsReportOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <Flag className={cn("w-4 h-4", isRTL ? "ms-2" : "me-2")} />
                      {isRTL ? "إبلاغ" : "Report"}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                className="min-h-20 text-sm bg-muted/30 focus:bg-background transition-colors"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  {labels.cancelEdit}
                </Button>
                <Button size="sm" onClick={handleSaveEdit}>
                  {labels.saveComment}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm sm:text-base font-normal bg-muted/30 group-hover:bg-muted/50 p-3 rounded-2xl transition-colors">
              {comment.content}
            </p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-4 mt-2">
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full"
                  onClick={() => {
                    if (!currentUser) {
                      onRequireAuth?.();
                      return;
                    }
                    setShowReplyForm(!showReplyForm);
                  }}
                >
                  <Reply className={cn("w-3.5 h-3.5", isRTL ? "ms-1.5" : "me-1.5")} />
                  {labels.reply}
                </Button>
              )}

              {replyCount > 0 && !isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs font-bold text-primary hover:bg-primary/5 rounded-full"
                  onClick={handleToggleReplies}
                >
                  {showReplies ? <ChevronUp className={cn("w-3.5 h-3.5", isRTL ? "ms-1" : "me-1")} /> : <ChevronDown className={cn("w-3.5 h-3.5", isRTL ? "ms-1" : "me-1")} />}
                  {showReplies ? labels.hideReplies : `${labels.showReplies} (${replyCount})`}
                </Button>
              )}
            </div>
          )}

          {showReplyForm && (
            <div className="mt-4 p-4 bg-muted/40 rounded-xl border border-primary/20 animate-in slide-in-from-top-2">
              <Textarea
                placeholder={labels.commentPlaceholder}
                className="mb-3 min-h-20 text-sm"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(false)}>
                  {labels.cancelEdit}
                </Button>
                <Button size="sm" onClick={handleReplySubmit} disabled={!replyContent.trim() || submittingReply}>
                  {submittingReply ? labels.replies + '...' : labels.submitComment}
                </Button>
              </div>
            </div>
          )}

          {showReplies && (
            <div className="mt-2 space-y-4 border-s-2 border-primary/10 ps-2 ms-1">
              {loadingReplies ? (
                <div className="ps-12 py-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-12 bg-muted rounded w-full" />
                </div>
              ) : (
                replies.map((reply) => (
                  <CommentItem
                    key={reply.commentId}
                    comment={reply}
                    postId={postId}
                    language={language}
                    labels={labels}
                    currentUser={currentUser}
                    postOwnerId={postOwnerId}
                    onDelete={handleDeleteReply}
                    onUpdate={onUpdate}
                    onRequireAuth={onRequireAuth}
                    isRTL={isRTL}
                    nowTimestamp={nowTimestamp}
                    isReply={true}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <ReportPostDialog
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
        language={language}
        reportType="COMMENT"
        targetId={comment.commentId}
        targetTitle={comment.content.slice(0, 80)}
      />
    </div>
  );
}
