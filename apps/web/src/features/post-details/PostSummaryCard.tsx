import { Clock, Eye, MapPin } from "lucide-react";
import { Badge } from "../../shared/ui/badge";
import { Card, CardContent } from "../../shared/ui/card";
import { Separator } from "../../shared/ui/separator";
import { cn } from "../../shared/ui/utils";
import type { Post } from "../../types";

interface PostSummaryCardProps {
  post: Post;
  isRTL: boolean;
  displayLocationLabel: string;
  postedAgoLabel: string;
  displayedViews: number;
  labels: {
    descriptionTitle: string;
    soldOut: string;
    views: string;
  };
}

export function PostSummaryCard({
  post,
  isRTL,
  displayLocationLabel,
  postedAgoLabel,
  displayedViews,
  labels,
}: PostSummaryCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Badge
                className="backdrop-blur-md px-3 py-1 font-semibold text-sm bg-primary/10 text-primary border-0"
              >
                {post.category}
              </Badge>

              {post.status === "SOLD" && (
                <Badge
                  className="backdrop-blur-md px-3 py-1 bg-muted text-muted-foreground border-0 font-semibold"
                >
                  {labels.soldOut}
                </Badge>
              )}
            </div>

            <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">
              {post.name}
            </h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 flex-wrap">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{displayLocationLabel}</span>
              </div>

              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{postedAgoLabel}</span>
              </div>

              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span className="font-medium">
                  {displayedViews} {labels.views}
                </span>
              </div>
            </div>
          </div>

          <div className={`${isRTL ? "text-left sm:text-left" : "text-left sm:text-right"}`}>
            <div>
              <span className="text-3xl font-semibold text-foreground">
                {post.price.toLocaleString()}
              </span>
              <span className={cn("text-lg text-muted-foreground", isRTL ? "mr-2" : "ml-2")}>JOD</span>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {post.description && (
          <>
            <div>
              <h3 className="mb-3 text-lg font-bold text-foreground">
                {labels.descriptionTitle}
              </h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap font-normal">
                {post.description}
              </p>
            </div>

            <Separator className="my-6" />
          </>
        )}
      </CardContent>
    </Card>
  );
}
