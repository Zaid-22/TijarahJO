import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Button } from "../../../shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/card";
import { Badge } from "../../../shared/ui/badge";
import { api } from "../../../services/api";
import { AdminUserDetails } from "../../../services/api/admin";
import { LoadingState } from "../../../shared/ui/loading-state";

export function UserDetailAdminPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState<AdminUserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setLoadError(null);
        const details = await api.admin.getUserDetails(parseInt(id, 10));

        if (details) {
          setUserDetails(details);
        } else {
          setLoadError("User not found.");
        }
      } catch (error) {
        setLoadError("Failed to fetch user details.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDetails();
  }, [id]);

  if (isLoading) {
    return (
      <LoadingState
        label="Loading user details..."
        minHeightClassName="min-h-screen"
      />
    );
  }

  if (loadError || !userDetails) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/users")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
        </Button>
        <div className="p-8 text-center text-destructive bg-destructive/10 rounded-lg">
          {loadError || "User details could not be loaded."}
        </div>
      </div>
    );
  }

  const { user, recentPosts, recentReviews } = userDetails;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Back to Users"
          onClick={() => navigate("/admin/users")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          User Details{" "}
          <span className="text-muted-foreground font-normal text-lg">
            #{String(user.id || (user as any).userID)}
          </span>
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="md:col-span-1 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
                {user.avatar ? (
                  <img
                    src={String(user.avatar)}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {String(user.firstName)} {String(user.lastName)}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="break-all">{String(user.email)}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{user.phone ? String(user.phone) : "No phone number"}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>
                  Location IDs: {user.cityID ? String(user.cityID) : "None"}, {user.areaID ? String(user.areaID) : "None"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  Joined{" "}
                  {new Date(
                    String(user.joinDate || user.joinedDate || new Date().toISOString())
                  ).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border mt-4 flex flex-wrap gap-2">
              <Badge variant={user.roleID === 1 ? "default" : "secondary"}>
                {user.roleID === 1 ? "Admin" : "User"}
              </Badge>
              <Badge
                variant={user.status === 1 ? "outline" : "destructive"}
                className={
                  user.status === 1 ? "border-primary/30 text-primary" : ""
                }
              >
                {user.status === 1 ? "Active" : "Banned"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Activity Cards */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex justify-between items-center">
                Recent Posts
                <span className="text-sm font-normal text-muted-foreground">
                  {recentPosts.length} items
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPosts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No recent posts found.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentPosts.map((post: any) => (
                    <div
                      key={post.postId}
                      className="py-3 flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {post.title || "Untitled"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {post.categoryName} • {post.price ?? 0} JOD •{" "}
                          {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {post.status === 0 ? "Active" : "Blocked"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex justify-between items-center">
                Recent Received Reviews
                <span className="text-sm font-normal text-muted-foreground">
                  {recentReviews.length} items
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentReviews.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No reviews received yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentReviews.map((review: any) => (
                    <div key={review.reviewID || review.id} className="py-3">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-1 text-yellow-500">
                          {"★".repeat(review.rating || 0)}
                          {"☆".repeat(Math.max(0, 5 - (review.rating || 0)))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt || new Date()).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm italic">
                        {review.comment || "No comment provided."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
