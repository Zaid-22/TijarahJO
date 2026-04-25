import { useEffect, useState } from "react";
import { Star, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { api } from "../../../services/api";
import {
  AdminReviewItem,
  AdminReviewListResult,
} from "../../../services/api/admin";
import { ConfirmActionDialog } from "../../../shared/ui/confirm-action-dialog";
import { formatCompactDate } from "../../../shared/lib/dateTime";
import { logger } from "../../../shared/lib/logger";

export function ReviewsModeration() {
  const [reviewsResult, setReviewsResult] = useState<AdminReviewListResult>({
    reviews: [],
    totalCount: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminReviewItem | null>(
    null,
  );

  const fetchReviews = async (currentPage: number) => {
    try {
      setIsLoading(true);
      const result = await api.admin.getReviews(currentPage, 50);
      setReviewsResult({
        reviews: Array.isArray(result?.reviews) ? result.reviews : [],
        totalCount: result?.totalCount ?? 0,
      });
    } catch (error) {
      logger.warn("[ReviewsModeration] Failed to fetch reviews", error);
      toast.error("Failed to fetch reviews");
      setReviewsResult({ reviews: [], totalCount: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchReviews(page);
  }, [page]);

  const handleDelete = async () => {
    if (!pendingDelete) return;

    try {
      const success = await api.admin.deleteReview(pendingDelete.reviewID);
      if (success) {
        toast.success("Review deleted successfully");
        await fetchReviews(page);
      } else {
        toast.error("Failed to delete review");
      }
    } catch (error) {
      logger.warn("[ReviewsModeration] Failed to delete review", error);
      toast.error("Error deleting review");
    } finally {
      setPendingDelete(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  const filteredReviews = (reviewsResult?.reviews || []).filter(
    (review) =>
      (review.reviewerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.reviewedUserName || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (review.comment || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <h1 className="text-2xl font-bold text-foreground">
          Reviews Moderation
        </h1>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by user or comment..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border border-border">
        <div className="overflow-x-auto min-h-96">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted text-muted-foreground sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3">
                  ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Reviewer
                </th>
                <th scope="col" className="px-6 py-3">
                  Reviewed User
                </th>
                <th scope="col" className="px-6 py-3">
                  Rating
                </th>
                <th scope="col" className="px-6 py-3">
                  Comment
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
                    colSpan={7}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" role="status" aria-label="Loading" /><span className="sr-only">Loading…</span>
                  </td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No reviews found.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr
                    key={review.reviewID}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">{review.reviewID}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {review.reviewerName}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {review.reviewedUserName}
                    </td>
                    <td className="px-6 py-4">{renderStars(review.rating)}</td>
                    <td
                      className="px-6 py-4 max-w-[250px] truncate"
                      title={review.comment}
                    >
                      {review.comment || "No comment"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {formatCompactDate(review.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Delete Review"
                        aria-label={`Delete review ${review.reviewID}`}
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setPendingDelete(review)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Total: {reviewsResult.totalCount} reviews
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm font-medium">
              Page {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={(reviewsResult?.reviews?.length ?? 0) < 50 || isLoading}
              onClick={() => setPage((p) => p + 1)}
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
        title="Delete this review?"
        description={
          pendingDelete
            ? `Are you sure you want to delete the review by "${pendingDelete.reviewerName}" for "${pendingDelete.reviewedUserName}"? This action is a soft-delete and can be reversed by a database administrator.`
            : ""
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
