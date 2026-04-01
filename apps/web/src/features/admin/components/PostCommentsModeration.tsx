/* eslint-disable jsx-a11y/control-has-associated-label */
import { useDeferredValue, useEffect, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../../contexts/AuthContext";
import { userHasAdminPermission } from "../../../contexts/authUtils";
import { api } from "../../../services/api";
import type {
  AdminPostCommentItem,
  AdminPostCommentListResult,
} from "../../../services/api/admin";
import { logger } from "../../../shared/lib/logger";
import { Button } from "../../../shared/ui/button";
import { ConfirmActionDialog } from "../../../shared/ui/confirm-action-dialog";
import { Input } from "../../../shared/ui/input";
import { ADMIN_PERMISSIONS } from "../adminPermissions";

export function PostCommentsModeration() {
  const { user } = useAuth();
  const canModerate = userHasAdminPermission(
    user,
    ADMIN_PERMISSIONS.commentsModerate,
  );
  const [commentsResult, setCommentsResult] = useState<AdminPostCommentListResult>(
    {
      comments: [],
      totalCount: 0,
    },
  );
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDelete, setPendingDelete] =
    useState<AdminPostCommentItem | null>(null);

  const fetchComments = async (
    currentPage: number,
    currentSearchQuery: string,
  ) => {
    try {
      setIsLoading(true);
      const result = await api.admin.getPostComments(
        currentPage,
        50,
        currentSearchQuery,
      );
      setCommentsResult({
        comments: Array.isArray(result?.comments) ? result.comments : [],
        totalCount: result?.totalCount ?? 0,
      });
    } catch (error) {
      logger.warn("[PostCommentsModeration] Failed to fetch comments", error);
      toast.error("Failed to fetch post comments");
      setCommentsResult({ comments: [], totalCount: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchComments(page, deferredSearchQuery);
  }, [deferredSearchQuery, page]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const handleDelete = async () => {
    if (!pendingDelete || !canModerate) return;

    try {
      const success = await api.admin.deletePostComment(pendingDelete.commentID);
      if (success) {
        toast.success("Comment deleted successfully");
        await fetchComments(page, deferredSearchQuery);
      } else {
        toast.error("Failed to delete comment");
      }
    } catch (error) {
      logger.warn("[PostCommentsModeration] Failed to delete comment", error);
      toast.error("Error deleting comment");
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <h1 className="text-2xl font-bold text-foreground">
          Post Comments Moderation
        </h1>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by post, author, or comment..."
            className="pl-10"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border border-border">
        <div className="min-h-96 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th scope="col" className="px-6 py-3">
                  ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Post
                </th>
                <th scope="col" className="px-6 py-3">
                  Author
                </th>
                <th scope="col" className="px-6 py-3">
                  Type
                </th>
                <th scope="col" className="px-6 py-3">
                  Parent
                </th>
                <th scope="col" className="px-6 py-3">
                  Comment
                </th>
                <th scope="col" className="px-6 py-3">
                  Replies
                </th>
                <th scope="col" className="px-6 py-3">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </td>
                </tr>
              ) : commentsResult.comments.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No post comments found.
                  </td>
                </tr>
              ) : (
                commentsResult.comments.map((comment) => (
                  <tr
                    key={comment.commentID}
                    className="border-b border-border transition-colors hover:bg-muted/50"
                  >
                    <td className="px-6 py-4 font-medium">
                      {comment.commentID}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div
                        className="max-w-[220px] truncate"
                        title={comment.postTitle || `Post #${comment.postID}`}
                      >
                        {comment.postTitle || "Untitled post"}
                      </div>
                      <div className="text-xs text-muted-foreground/80">
                        Post #{comment.postID}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div>{comment.authorName || "Unknown user"}</div>
                      <div className="text-xs text-muted-foreground/80">
                        User #{comment.userID}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                        {comment.parentCommentID ? "Reply" : "Comment"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {comment.parentCommentID ? `#${comment.parentCommentID}` : "—"}
                    </td>
                    <td
                      className="max-w-[280px] px-6 py-4 truncate"
                      title={comment.content}
                    >
                      {comment.content}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {comment.replyCount}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canModerate ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete Comment"
                          aria-label={`Delete comment ${comment.commentID}`}
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setPendingDelete(comment)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          View only
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-border p-4">
          <span className="text-sm text-muted-foreground">
            Total: {commentsResult.totalCount} comments
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || isLoading}
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm font-medium">
              Page {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={commentsResult.comments.length < 50 || isLoading}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <ConfirmActionDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this comment?"
        description={
          pendingDelete
            ? `Are you sure you want to delete the ${pendingDelete.parentCommentID ? "reply" : "comment"} by "${pendingDelete.authorName}" on post "${pendingDelete.postTitle || `#${pendingDelete.postID}`}"? This action is a soft-delete and can be reversed by a database administrator.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
