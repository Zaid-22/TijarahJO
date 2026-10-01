import { useEffect, useMemo, useState } from "react";
import { Clock, Eye, MapPin } from "lucide-react";
import { Badge } from "../../shared/ui/badge";
import { Button } from "../../shared/ui/button";
import { Card, CardContent } from "../../shared/ui/card";
import { Separator } from "../../shared/ui/separator";
import { cn } from "../../shared/ui/utils";
import type { Post } from "../../types";

const DESCRIPTION_PREVIEW_LENGTH = 420;
const DESCRIPTION_PREVIEW_LINES = 6;

interface PostSummaryCardProps {
  post: Post;
  isRTL: boolean;
  displayLocationLabel: string;
  postedAgoLabel: string;
  displayedViews: number;
  labels: {
    descriptionTitle: string;
    readMore: string;
    showLess: string;
    soldOut: string;
    views: string;
  };
}

function buildDescriptionPreview(description: string) {
  const lines = description.split(/\r?\n/);
  const isLong =
    description.length > DESCRIPTION_PREVIEW_LENGTH ||
    lines.length > DESCRIPTION_PREVIEW_LINES;

  if (!isLong) {
    return { isLong, preview: description };
  }

  const previewSource =
    lines.length > DESCRIPTION_PREVIEW_LINES
      ? lines.slice(0, DESCRIPTION_PREVIEW_LINES).join("\n")
      : description;

  const limitedPreview =
    previewSource.length > DESCRIPTION_PREVIEW_LENGTH
      ? previewSource.slice(0, DESCRIPTION_PREVIEW_LENGTH)
      : previewSource;

  const lastWhitespaceIndex = limitedPreview.search(/\s+\S*$/);
  const preview =
    lastWhitespaceIndex > Math.floor(DESCRIPTION_PREVIEW_LENGTH * 0.72)
      ? limitedPreview.slice(0, lastWhitespaceIndex).trimEnd()
      : limitedPreview.trimEnd();

  return { isLong, preview: `${preview}...` };
}

export function PostSummaryCard({
  post,
  isRTL,
  displayLocationLabel,
  postedAgoLabel,
  displayedViews,
  labels,
}: PostSummaryCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const descriptionState = useMemo(
    () =>
      post.description ? buildDescriptionPreview(post.description) : null,
    [post.description],
  );
  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [post.description]);

  const descriptionText =
    descriptionState?.isLong && !isDescriptionExpanded
      ? descriptionState.preview
      : post.description;

  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/95 shadow-sm">
      <CardContent className="pt-6">
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge
              className="max-w-full whitespace-normal rounded-full border-0 bg-primary/10 px-4 py-1.5 text-start text-sm font-semibold text-primary backdrop-blur-md wrap-anywhere"
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
            <h1
              className={cn(
                "text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl wrap-anywhere",
                isRTL ? "text-right" : "text-left",
              )}
              dir="auto"
            >
              {post.name}
            </h1>

            <div
              className={cn(
                "flex max-w-full items-baseline gap-2",
                isRTL ? "justify-end" : "justify-start",
              )}
              dir="ltr"
            >
              <span className="min-w-0 text-3xl font-bold tracking-tight text-foreground tabular-nums">
                {post.price.toLocaleString()}
              </span>
              <span className="text-lg font-semibold text-muted-foreground">
                JOD
              </span>
            </div>
          </div>

          <div
            className={cn(
              "mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground",
              isRTL ? "justify-end" : "justify-start",
            )}
          >
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
              <p className="whitespace-pre-wrap text-foreground font-normal leading-relaxed wrap-anywhere">
                {descriptionText}
              </p>
              {descriptionState?.isLong && (
                <Button
                  variant="link"
                  className="mt-3 h-auto p-0 text-sm font-semibold"
                  aria-expanded={isDescriptionExpanded}
                  onClick={() =>
                    setIsDescriptionExpanded((current) => !current)
                  }
                >
                  {isDescriptionExpanded ? labels.showLess : labels.readMore}
                </Button>
              )}
            </div>

            <Separator className="my-6" />
          </>
        )}
      </CardContent>
    </Card>
  );
}
