import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Send } from "lucide-react";
import { api } from "../../../services/api";
import { logger } from "../../../shared/lib/logger";
import { PostComment } from "../../../types";
import { Button } from "../../../shared/ui/button";
import { Textarea } from "../../../shared/ui/textarea";
import { Card, CardContent } from "../../../shared/ui/card";
import { cn } from "../../../shared/ui/utils";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { CommentItem } from "./CommentItem";

interface PostCommentsSectionProps {
  postId: string;
  language: "en" | "ar";
  labels: {
    commentsTitle: string;
    addComment: string;
    commentPlaceholder: string;
    submitComment: string;
    noComments: string;
    deleteComment: string;
    loadMoreComments: string;
    loginToComment: string;
    commentAdded: string;
    commentDeleted: string;
    reply: string;
    hideReplies: string;
    showReplies: string;
    editComment: string;
    cancelEdit: string;
    saveComment: string;
    commentUpdated: string;
    replies: string;
  };
  postOwnerId?: string;
  onRequireAuth?: () => void;
}

export function PostCommentsSection({
  postId,
  language,
  labels,
  postOwnerId,
  onRequireAuth,
}: PostCommentsSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());

  const isRTL = language === "ar";
  const requireAuthForComment = () => {
    onRequireAuth?.();
  };

  const fetchComments = useCallback(
    async (pageNum: number, append = false) => {
      try {
        const response = await api.comments.getComments(postId, pageNum);
        if (response.success && response.data) {
          const newComments = response.data.comments;
          const newTotalCount = response.data.totalCount;

          if (append) {
            setComments((prev) => [...prev, ...newComments]);
          } else {
            setComments(newComments);
          }
          setTotalCount(newTotalCount);
          setHasMore(
            newComments.length === 20 &&
              pageNum * 20 < newTotalCount
          );
        } else if (!response.success) {
          toast.error(response.error.message || "Failed to load comments");
        }
      } catch (error) {
        logger.error("Failed to fetch comments", error);
        toast.error("Failed to load comments");
      } finally {
        setLoading(false);
      }
    },
    [postId]
  );

  useEffect(() => {
    fetchComments(1);
    setNowTimestamp(Date.now());
  }, [fetchComments]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const handleAddComment = async (parentCommentId?: number) => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await api.comments.addComment(
        postId,
        newComment,
        parentCommentId
      );
      if (response.success && response.data) {
        toast.success(labels.commentAdded);
        setNewComment("");
        setPage(1);
        setComments((prev) => [response.data, ...prev]);
        setTotalCount((prev) => prev + 1);
      } else if (!response.success) {
        toast.error(response.error.message);
      }
    } catch (error) {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const response = await api.comments.deleteComment(postId, commentId);
      if (response.success) {
        toast.success(labels.commentDeleted);
        setComments((prev) => prev.filter((c) => c.commentId !== commentId));
        setTotalCount((prev) => prev - 1);
        return true;
      } else {
        toast.error(response.error.message);
        return false;
      }
    } catch (error) {
      toast.error("Failed to delete comment");
      return false;
    }
  };

  const handleUpdateComment = async (commentId: number, content: string) => {
    try {
      const response = await api.comments.updateComment(
        postId,
        commentId,
        content
      );
      if (response.success) {
        toast.success(labels.commentUpdated);
        setComments((prev) =>
          prev.map((c) =>
            c.commentId === commentId
              ? {
                  ...c,
                  content,
                  isEdited: true,
                  updatedAt: new Date().toISOString(),
                }
              : c
          )
        );
        return true;
      } else {
        toast.error(response.error.message);
        return false;
      }
    } catch (error) {
      toast.error("Failed to update comment");
      return false;
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchComments(nextPage, true);
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">
          {labels.commentsTitle} ({totalCount})
        </h2>
      </div>

      <Card className="mb-8 overflow-hidden rounded-2xl border-border/70 bg-card/95 shadow-sm">
        <CardContent className="p-4">
          <Textarea
            placeholder={labels.commentPlaceholder}
            className="mb-3 min-h-24 cursor-text border-border bg-background text-base focus-visible:ring-primary/30"
            value={newComment}
            onChange={(e) => {
              if (!isAuthenticated) {
                requireAuthForComment();
                return;
              }
              setNewComment(e.target.value);
            }}
            onClick={() => {
              if (!isAuthenticated) {
                requireAuthForComment();
              }
            }}
            readOnly={!isAuthenticated}
          />
          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (!isAuthenticated) {
                  requireAuthForComment();
                  return;
                }
                handleAddComment();
              }}
              disabled={submitting || (isAuthenticated && !newComment.trim())}
              className="font-semibold px-6 shadow-sm"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{labels.submitComment}</span>
                </div>
              ) : !isAuthenticated ? (
                <span>{labels.loginToComment}</span>
              ) : (
                <>
                  <Send className={cn("w-4 h-4", isRTL ? "ms-2" : "me-2")} />
                  {labels.submitComment}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading && page === 1 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full shrink-0" />
                <div className="flex-1 space-y-2 mt-1">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-16 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem
                key={comment.commentId}
                comment={comment}
                postId={postId}
                language={language}
                labels={labels}
                currentUser={user}
                postOwnerId={postOwnerId}
                onDelete={handleDeleteComment}
                onUpdate={handleUpdateComment}
                onRequireAuth={onRequireAuth}
                isRTL={isRTL}
                nowTimestamp={nowTimestamp}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              {labels.noComments}
            </p>
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              variant="ghost"
              onClick={loadMore}
              className="text-primary font-bold hover:bg-primary/5 px-8"
            >
              {labels.loadMoreComments}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
