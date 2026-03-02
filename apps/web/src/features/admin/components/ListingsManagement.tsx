/* eslint-disable jsx-a11y/control-has-associated-label */
import { useEffect, useState } from "react";
import { Search, Eye, Ban, CheckCircle, Clock, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../shared/ui/button";
import { Input } from "../../../shared/ui/input";
import { api } from "../../../services/api";
import { AdminPostListResult } from "../../../services/api/admin";
import { ConfirmActionDialog } from "../../../shared/ui/confirm-action-dialog";
import { logger } from "../../../shared/lib/logger";
import { exportToCsv } from "../utils/exportCsv";

export function ListingsManagement() {
  const [postsResult, setPostsResult] = useState<AdminPostListResult>({
    posts: [],
    totalCount: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | undefined>(
    undefined,
  );
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [actionPost, setActionPost] = useState<{
    id: number;
    title: string;
    newStatus: number;
    label: string;
  } | null>(null);

  const fetchPosts = async (currentPage: number, currentStatus?: number) => {
    try {
      setIsLoading(true);
      const result = await api.admin.getPosts({
        page: currentPage,
        pageSize: 50,
        status: currentStatus,
      });
      setPostsResult(result);
    } catch (error) {
      logger.warn("[ListingsManagement] Failed to fetch posts", error);
      toast.error("Failed to fetch listings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPosts(page, statusFilter);
  }, [page, statusFilter]);

  const handleUpdateStatus = async () => {
    if (!actionPost) return;

    try {
      const success = await api.admin.updatePostStatus(
        actionPost.id,
        actionPost.newStatus,
      );
      if (success) {
        toast.success(
          `Post status updated to ${actionPost.label.toLowerCase()}`,
        );
        await fetchPosts(page, statusFilter);
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      logger.warn("[ListingsManagement] Failed to update post status", error);
      toast.error("Error updating status");
    } finally {
      setActionPost(null);
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" /> Active
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Ban className="w-3 h-3 mr-1" /> Blocked
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3 mr-1" /> Sold/Archived
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" /> Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  // Simple client-side search across current page items (Phase 1)
  const filteredPosts = postsResult.posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.sellerName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <h1 className="text-2xl font-bold text-foreground">
          Listings Management
        </h1>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const rows = filteredPosts.map((p) => ({
                ID: p.postId,
                Title: p.title,
                Price: p.price ?? "",
                Status: p.status,
                Category: p.categoryName,
                Seller: p.sellerName,
              }));
              exportToCsv("listings.csv", rows);
            }}
          >
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or seller..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter by Status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background md:w-[150px]"
            value={statusFilter === undefined ? "" : statusFilter.toString()}
            onChange={(e) => {
              setPage(1); // Reset page on filter change
              setStatusFilter(
                e.target.value === "" ? undefined : parseInt(e.target.value),
              );
            }}
          >
            <option value="">All Statuses</option>
            <option value="0">Active</option>
            <option value="1">Blocked</option>
            <option value="2">Sold/Archived</option>
            <option value="3">Suspended</option>
          </select>
        </div>
      </div>

      <div className="rounded-md border border-border">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted text-muted-foreground sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3">
                  ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Title
                </th>
                <th scope="col" className="px-6 py-3">
                  Seller
                </th>
                <th scope="col" className="px-6 py-3">
                  Category
                </th>
                <th scope="col" className="px-6 py-3">
                  Price
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
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
                    <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No listings found.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr
                    key={post.postId}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium">{post.postId}</td>
                    <td
                      className="px-6 py-4 font-medium text-foreground max-w-[200px] truncate"
                      title={post.title}
                    >
                      {post.title || "Untitled"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {post.sellerName}
                    </td>
                    <td className="px-6 py-4">{post.categoryName}</td>
                    <td className="px-6 py-4">{post.price ?? 0} JOD</td>
                    <td className="px-6 py-4">{getStatusBadge(post.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View Post"
                          aria-label={`View Post ${post.title}`}
                          onClick={() =>
                            window.open(`/post/${post.postId}`, "_blank")
                          }
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        {post.status === 0 ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Block Post"
                            aria-label={`Block Post ${post.title}`}
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              setActionPost({
                                id: post.postId,
                                title: post.title,
                                newStatus: 1,
                                label: "Blocked",
                              })
                            }
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Activate Post"
                            aria-label={`Activate Post ${post.title}`}
                            className="text-green-600 hover:bg-green-100"
                            onClick={() =>
                              setActionPost({
                                id: post.postId,
                                title: post.title,
                                newStatus: 0,
                                label: "Active",
                              })
                            }
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Total: {postsResult.totalCount} listings
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
              disabled={postsResult.posts.length < 50 || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <ConfirmActionDialog
        open={actionPost !== null}
        onOpenChange={(open) => {
          if (!open) setActionPost(null);
        }}
        title={`Change post status to ${actionPost?.label}?`}
        description={
          actionPost
            ? `Are you sure you want to change the status of "${actionPost.title || "Untitled"}" to ${actionPost.label}?`
            : ""
        }
        confirmLabel="Confirm"
        onConfirm={handleUpdateStatus}
      />
    </div>
  );
}
