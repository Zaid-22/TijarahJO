import { useState, useEffect, useCallback, useRef } from "react";
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const activePostIdRef = useRef(postId);
  const commentsRequestRunIdRef = useRef(0);
  const loadMoreInFlightRef = useRef(false);

  const isRTL = language === "ar";
  const requireAuthForComment = () => {
    onRequireAuth?.();
  };

  const fetchComments = useCallback(
    async (pageNum: number, append = false) => {
      const requestedPostId = postId;
      const runId = ++commentsRequestRunIdRef.current;
      const isCurrentRequest = () =>
        runId === commentsRequestRunIdRef.current &&
        activePostIdRef.current === requestedPostId;

      try {
        const response = await api.comments.getComments(requestedPostId, pageNum);
        if (!isCurrentRequest()) {
          return false;
        }
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
          return true;
        } else if (!response.success) {
          toast.error(response.error.message || "Failed to load comments");
        }
      } catch (error) {
        if (!isCurrentRequest()) {
          return false;
        }
        logger.error("Failed to fetch comments", error);
        toast.error("Failed to load comments");
      } finally {
        if (isCurrentRequest()) {
          setLoading(false);
        }
      }
      return false;
    },
    [postId]
  );

  useEffect(() => {
    activePostIdRef.current = postId;
    commentsRequestRunIdRef.current += 1;
    setComments([]);
    setTotalCount(0);
    setLoading(true);
    setSubmitting(false);
    setNewComment("");
    setPage(1);
    setHasMore(false);
    setLoadingMore(false);
    loadMoreInFlightRef.current = false;
    setNowTimestamp(Date.now());
    void fetchComments(1);

    return () => {
      commentsRequestRunIdRef.current += 1;
      activePostIdRef.current = "";
      loadMoreInFlightRef.current = false;
    };
  }, [fetchComments, postId]);

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

    const requestedPostId = postId;
    setSubmitting(true);
    try {
      const response = await api.comments.addComment(
        requestedPostId,
        newComment,
        parentCommentId
      );
      if (activePostIdRef.current !== requestedPostId) {
        return;
      }
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
      if (activePostIdRef.current === requestedPostId) {
        toast.error("Failed to post comment");
      }
    } finally {
      if (activePostIdRef.current === requestedPostId) {
        setSubmitting(false);
      }
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    const requestedPostId = postId;
    try {
      const response = await api.comments.deleteComment(requestedPostId, commentId);
      if (activePostIdRef.current !== requestedPostId) {
        return false;
      }
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
      if (activePostIdRef.current === requestedPostId) {
        toast.error("Failed to delete comment");
      }
      return false;
    }
  };

  const handleUpdateComment = async (commentId: number, content: string) => {
    const requestedPostId = postId;
    try {
      const response = await api.comments.updateComment(
        requestedPostId,
        commentId,
        content
      );
      if (activePostIdRef.current !== requestedPostId) {
        return false;
      }
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
      if (activePostIdRef.current === requestedPostId) {
        toast.error("Failed to update comment");
      }
      return false;
    }
  };

  const loadMore = async () => {
    if (loadMoreInFlightRef.current || !hasMore) {
      return;
    }

    loadMoreInFlightRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const loaded = await fetchComments(nextPage, true);
      if (loaded && activePostIdRef.current === postId) {
        setPage(nextPage);
      }
    } finally {
      if (activePostIdRef.current === postId) {
        loadMoreInFlightRef.current = false;
        setLoadingMore(false);
      }
    }
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
              onClick={() => void loadMore()}
              disabled={loadingMore}
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
