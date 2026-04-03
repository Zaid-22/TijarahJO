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
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge
              className="backdrop-blur-md rounded-full px-4 py-1.5 font-semibold text-sm bg-primary/10 text-primary border-0"
            >
              {post.category}
            </Badge>

            {post.status === "SOLD" && (
              <Badge
                className="backdrop-blur-md rounded-full px-4 py-1.5 bg-muted text-muted-foreground border-0 font-semibold"
              >
                {labels.soldOut}
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {post.name}
            </h1>

            <div className={cn("flex items-baseline gap-2", isRTL ? "sm:justify-start" : "sm:justify-start")}>
              <span className="text-3xl font-semibold text-foreground">
                {post.price.toLocaleString()}
              </span>
              <span className={cn("text-lg text-muted-foreground", "ms-1")}>JOD</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
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
